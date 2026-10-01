import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { 
  EC2Client, 
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand 
} from "@aws-sdk/client-ec2";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { GuardDutyClient, ListDetectorsCommand, ListFindingsCommand, GetFindingsCommand } from "@aws-sdk/client-guardduty";
import { SecurityHubClient, DescribeHubCommand, GetFindingsCommand as GetSecurityHubFindingsCommand } from "@aws-sdk/client-securityhub";
import type {
  SecurityFinding,
  SecurityGroupFinding,
  S3SecurityFinding,
  PublicResourceFinding,
  IamAccessKeyFinding,
  GuardDutyFinding,
  SecurityHubFinding,
  SecurityOverview,
  SecuritySummary,
  SecuritySeverity,
  SecurityStatus
} from "@/data/securityData";
import { IAM_ACCESS_KEY_AGE_THRESHOLD } from "@/data/securityData";
import { getAllAwsAccounts, type AwsCredentials } from "@/lib/awsCredentials";

// Disable Next.js caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Client timeouts to prevent hanging
const CLIENT_TIMEOUTS = {
  maxAttempts: 2,
  requestHandler: {
    connectionTimeout: 3000,
    requestTimeout: 8000,
  },
};

// Client caches (reuse across requests)
const ec2Clients = new Map<string, EC2Client>();
const stsClients = new Map<number, STSClient>();
const guardDutyClients = new Map<string, GuardDutyClient>();
const securityHubClients = new Map<string, SecurityHubClient>();

// Response caching
interface CacheEntry {
  data: {
    overview: SecurityOverview;
    findings: SecurityFinding[];
    summary: SecuritySummary;
  };
  timestamp: number;
  accountIds: string[];
}

const securityCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
};

// Account ID cache to avoid repeated STS calls
const accountIdCache = new Map<number, string>();

function getEc2Client(accountNumber: number, credentials: AwsCredentials): EC2Client {
  const key = `ec2:${accountNumber}`;
  let client = ec2Clients.get(key);
  if (!client) {
    client = new EC2Client({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      ...CLIENT_TIMEOUTS,
    });
    ec2Clients.set(key, client);
  }
  return client;
}

function getStsClient(accountNumber: number, credentials: AwsCredentials): STSClient {
  let client = stsClients.get(accountNumber);
  if (!client) {
    client = new STSClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      ...CLIENT_TIMEOUTS,
    });
    stsClients.set(accountNumber, client);
  }
  return client;
}

function getGuardDutyClient(accountNumber: number, credentials: AwsCredentials): GuardDutyClient {
  const key = `guardduty:${accountNumber}`;
  let client = guardDutyClients.get(key);
  if (!client) {
    client = new GuardDutyClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      ...CLIENT_TIMEOUTS,
    });
    guardDutyClients.set(key, client);
  }
  return client;
}

function getSecurityHubClient(accountNumber: number, credentials: AwsCredentials): SecurityHubClient {
  const key = `securityhub:${accountNumber}`;
  let client = securityHubClients.get(key);
  if (!client) {
    client = new SecurityHubClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      ...CLIENT_TIMEOUTS,
    });
    securityHubClients.set(key, client);
  }
  return client;
}

async function getAccountId(
  accountNumber: number,
  credentials: AwsCredentials
): Promise<string> {
  if (accountIdCache.has(accountNumber)) {
    return accountIdCache.get(accountNumber)!;
  }

  try {
    const stsClient = getStsClient(accountNumber, credentials);
    const identityCommand = new GetCallerIdentityCommand({});
    const identityResponse = await stsClient.send(identityCommand);
    const accountId = identityResponse.Account || "unknown";

    accountIdCache.set(accountNumber, accountId);
    return accountId;
  } catch (error: any) {
    console.error(`Failed to get account ID for account ${accountNumber}:`, error.message);
    
    // Re-throw authentication errors so they can be handled upstream
    if (error.name === "CredentialsProviderError" || 
        error.name === "InvalidUserID.NotFound" ||
        error.name === "SignatureDoesNotMatch" ||
        error.name === "InvalidAccessKeyId" ||
        error.message?.includes("InvalidAccessKeyId") ||
        error.message?.includes("SignatureDoesNotMatch") ||
        error.message?.includes("InvalidUserID") ||
        error.message?.includes("The AWS Access Key Id you provided does not exist")) {
      throw error;
    }
    
    return "unknown";
  }
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  return date.toISOString();
}

// Security Group Analysis
async function analyzeSecurityGroups(
  accountConfig: any,
  accountId: string,
  accountName: string
): Promise<SecurityGroupFinding[]> {
  const findings: SecurityGroupFinding[] = [];
  
  try {
    const ec2Client = getEc2Client(accountConfig.accountNumber, accountConfig.credentials);
    
    // Get all security groups
    const sgCommand = new DescribeSecurityGroupsCommand({});
    const sgResponse = await ec2Client.send(sgCommand);

    if (!sgResponse.SecurityGroups) return findings;

    for (const sg of sgResponse.SecurityGroups) {
      if (!sg.IpPermissions) continue;

      for (const rule of sg.IpPermissions) {
        // Check for rules open to 0.0.0.0/0
        const hasPublicAccess = rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0");
        
        if (hasPublicAccess && rule.FromPort) {
          let severity: SecuritySeverity = "LOW";
          let title = `Port ${rule.FromPort} publicly accessible`;
          
          // Critical ports
          if (rule.FromPort === 22) {
            severity = "CRITICAL";
            title = "SSH publicly accessible";
          } else if (rule.FromPort === 3389) {
            severity = "CRITICAL";
            title = "RDP publicly accessible";  
          } else if ([80, 443].includes(rule.FromPort)) {
            severity = "LOW"; // Web ports are often intentionally public
            title = `HTTP${rule.FromPort === 443 ? 'S' : ''} publicly accessible`;
          } else if ([21, 23, 135, 139, 445, 1433, 1521, 3306, 5432, 5984, 6379, 27017].includes(rule.FromPort)) {
            severity = "HIGH";
          } else {
            severity = "MEDIUM";
          }

          const finding: SecurityGroupFinding = {
            id: `sg-${sg.GroupId}-${rule.FromPort}-${rule.IpProtocol}`,
            severity,
            title,
            service: "EC2",
            resourceId: sg.GroupId || "unknown",
            resourceName: sg.GroupName,
            accountId,
            accountName,
            region: accountConfig.credentials.region,
            status: severity === "LOW" ? "DETECTED" : "REVIEW_REQUIRED",
            description: `Security group ${sg.GroupName} (${sg.GroupId}) allows inbound access from 0.0.0.0/0 on port ${rule.FromPort}/${rule.IpProtocol}`,
            recommendation: severity === "CRITICAL" || severity === "HIGH" 
              ? `Restrict source to specific IP ranges or security groups. Avoid using 0.0.0.0/0 for ${rule.FromPort === 22 ? 'SSH' : rule.FromPort === 3389 ? 'RDP' : 'sensitive'} access.`
              : "Review if public access is required for this port.",
            detectedAt: formatDate(new Date()),
            securityGroupId: sg.GroupId || "unknown",
            port: rule.FromPort,
            protocol: rule.IpProtocol,
            source: "0.0.0.0/0",
            evidence: {
              groupDescription: sg.Description,
              vpcId: sg.VpcId,
              rule: {
                fromPort: rule.FromPort,
                toPort: rule.ToPort,
                protocol: rule.IpProtocol,
                ipRanges: rule.IpRanges?.map(r => r.CidrIp)
              }
            }
          };

          findings.push(finding);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to analyze security groups for account ${accountName}:`, error);
  }

  return findings;
}

// Fetch existing S3 data and analyze security
async function analyzeS3Security(
  accountId: string,
  accountName: string
): Promise<S3SecurityFinding[]> {
  const findings: S3SecurityFinding[] = [];
  
  try {
    // Reuse existing S3 API 
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/s3?account=${accountId}`);
    const data = await response.json();
    
    if (!data.success || !data.buckets) return findings;

    for (const bucket of data.buckets) {
      // Check public access configuration
      if (bucket.publicAccess !== "Blocked") {
        const severity: SecuritySeverity = bucket.publicAccess === "Publicly accessible" ? "HIGH" : "MEDIUM";
        
        findings.push({
          id: `s3-public-${bucket.name}`,
          severity,
          title: `S3 bucket public access not blocked`,
          service: "S3",
          resourceId: bucket.name,
          resourceName: bucket.name,
          accountId,
          accountName,
          region: bucket.region,
          status: "REVIEW_REQUIRED",
          description: `S3 bucket ${bucket.name} has public access configuration: ${bucket.publicAccess}`,
          recommendation: "Enable public access block settings for this bucket unless public access is specifically required.",
          detectedAt: formatDate(new Date()),
          bucketName: bucket.name,
          publicAccessBlock: bucket.publicAccess === "Blocked",
          encryption: bucket.encryption,
          versioning: bucket.versioning
        });
      }

      // Check encryption
      if (!bucket.encryption || bucket.encryption === "None" || bucket.encryption === "Unknown") {
        findings.push({
          id: `s3-encryption-${bucket.name}`,
          severity: "MEDIUM",
          title: `S3 bucket not encrypted`,
          service: "S3", 
          resourceId: bucket.name,
          resourceName: bucket.name,
          accountId,
          accountName,
          region: bucket.region,
          status: "REVIEW_REQUIRED",
          description: `S3 bucket ${bucket.name} does not have encryption enabled`,
          recommendation: "Enable server-side encryption (SSE-S3 or SSE-KMS) for data at rest protection.",
          detectedAt: formatDate(new Date()),
          bucketName: bucket.name,
          encryption: bucket.encryption || "None"
        });
      }
    }
  } catch (error) {
    console.error(`Failed to analyze S3 security for account ${accountName}:`, error);
  }

  return findings;
}

// Analyze IAM access keys using existing IAM API
async function analyzeIamAccessKeys(
  accountId: string,
  accountName: string
): Promise<IamAccessKeyFinding[]> {
  const findings: IamAccessKeyFinding[] = [];
  
  try {
    // Use existing IAM API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/iam?account=${accountId}&type=users`);
    const data = await response.json();
    
    if (!data.success || !data.users) return findings;

    for (const user of data.users) {
      for (const accessKey of user.accessKeys || []) {
        if (accessKey.ageInDays > IAM_ACCESS_KEY_AGE_THRESHOLD) {
          const severity: SecuritySeverity = accessKey.ageInDays > 365 ? "HIGH" : "MEDIUM";
          
          findings.push({
            id: `iam-key-age-${user.userName}-${accessKey.accessKeyId}`,
            severity,
            title: `IAM access key exceeds age threshold`,
            service: "IAM",
            resourceId: accessKey.accessKeyId,
            resourceName: user.userName,
            accountId,
            accountName,
            region: "global",
            status: "REVIEW_REQUIRED",
            description: `Access key for user ${user.userName} is ${accessKey.ageInDays} days old`,
            recommendation: `Consider rotating this access key. Keys older than ${IAM_ACCESS_KEY_AGE_THRESHOLD} days should be rotated regularly.`,
            detectedAt: formatDate(new Date()),
            userName: user.userName,
            accessKeyId: accessKey.accessKeyId.replace(/(.{4}).*(.{4})/, '$1****$2'), // Mask middle part
            keyAge: accessKey.ageInDays,
            lastUsed: accessKey.lastUsedDate,
            keyStatus: accessKey.status
          });
        }
      }
    }
  } catch (error) {
    console.error(`Failed to analyze IAM access keys for account ${accountName}:`, error);
  }

  return findings;
}

// Check GuardDuty status and findings
async function analyzeGuardDuty(
  accountConfig: any,
  accountId: string,
  accountName: string
): Promise<GuardDutyFinding[]> {
  const findings: GuardDutyFinding[] = [];
  
  try {
    const guardDutyClient = getGuardDutyClient(accountConfig.accountNumber, accountConfig.credentials);
    
    // Check if GuardDuty is enabled
    const detectorsCommand = new ListDetectorsCommand({});
    const detectorsResponse = await guardDutyClient.send(detectorsCommand);
    
    if (!detectorsResponse.DetectorIds || detectorsResponse.DetectorIds.length === 0) {
      // GuardDuty not enabled
      findings.push({
        id: `guardduty-disabled-${accountId}`,
        severity: "MEDIUM",
        title: "GuardDuty not enabled",
        service: "GuardDuty",
        resourceId: accountId,
        resourceName: accountName,
        accountId,
        accountName,
        region: accountConfig.credentials.region,
        status: "NOT_CONFIGURED",
        description: `GuardDuty is not enabled in region ${accountConfig.credentials.region}`,
        recommendation: "Enable GuardDuty for threat detection and continuous monitoring.",
        detectedAt: formatDate(new Date()),
        type: "SERVICE_NOT_ENABLED"
      });
      return findings;
    }

    // Get findings for enabled detectors
    for (const detectorId of detectorsResponse.DetectorIds) {
      try {
        const findingsCommand = new ListFindingsCommand({ DetectorId: detectorId });
        const findingsResponse = await guardDutyClient.send(findingsCommand);
        
        if (findingsResponse.FindingIds && findingsResponse.FindingIds.length > 0) {
          // Get detailed findings (limit to recent ones)
          const detailedCommand = new GetFindingsCommand({
            DetectorId: detectorId,
            FindingIds: findingsResponse.FindingIds.slice(0, 50) // Limit for performance
          });
          const detailedResponse = await guardDutyClient.send(detailedCommand);
          
          if (detailedResponse.Findings) {
            for (const finding of detailedResponse.Findings) {
              let severity: SecuritySeverity = "LOW";
              if (finding.Severity && finding.Severity >= 7.0) severity = "HIGH";
              else if (finding.Severity && finding.Severity >= 4.0) severity = "MEDIUM";
              
              findings.push({
                id: `guardduty-${finding.Id}`,
                severity,
                title: finding.Title || "GuardDuty finding",
                service: "GuardDuty",
                resourceId: finding.Id || "unknown",
                resourceName: finding.Resource?.InstanceDetails?.InstanceId,
                accountId,
                accountName,
                region: finding.Region || accountConfig.credentials.region,
                status: "REVIEW_REQUIRED",
                description: finding.Description || "GuardDuty detected suspicious activity",
                recommendation: "Review this GuardDuty finding and take appropriate action based on the finding type.",
                detectedAt: formatDate(finding.CreatedAt),
                type: finding.Type || "Unknown",
                confidence: finding.Confidence,
                updatedAt: formatDate(finding.UpdatedAt),
                evidence: {
                  service: finding.Service,
                  resource: finding.Resource,
                  partition: finding.Partition
                }
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not fetch GuardDuty findings for detector ${detectorId}:`, error);
      }
    }
  } catch (error) {
    console.error(`Failed to analyze GuardDuty for account ${accountName}:`, error);
    // If we can't access GuardDuty, assume it's not configured
    findings.push({
      id: `guardduty-error-${accountId}`,
      severity: "LOW",
      title: "GuardDuty status unknown",
      service: "GuardDuty", 
      resourceId: accountId,
      resourceName: accountName,
      accountId,
      accountName,
      region: accountConfig.credentials.region,
      status: "UNKNOWN",
      description: "Unable to determine GuardDuty status",
      recommendation: "Verify GuardDuty permissions and configuration.",
      detectedAt: formatDate(new Date()),
      type: "ACCESS_ERROR"
    });
  }

  return findings;
}

// Check Security Hub status and findings  
async function analyzeSecurityHub(
  accountConfig: any,
  accountId: string,
  accountName: string
): Promise<SecurityHubFinding[]> {
  const findings: SecurityHubFinding[] = [];
  
  try {
    const securityHubClient = getSecurityHubClient(accountConfig.accountNumber, accountConfig.credentials);
    
    // Check if Security Hub is enabled
    try {
      const describeCommand = new DescribeHubCommand({});
      await securityHubClient.send(describeCommand);
      
      // If we get here, Security Hub is enabled - get findings
      const findingsCommand = new GetSecurityHubFindingsCommand({
        MaxResults: 50,
        Filters: {
          RecordState: [{ Value: "ACTIVE", Comparison: "EQUALS" }]
        }
      });
      const findingsResponse = await securityHubClient.send(findingsCommand);
      
      if (findingsResponse.Findings) {
        for (const finding of findingsResponse.Findings) {
          let severity: SecuritySeverity = "LOW";
          if (finding.Severity?.Label === "CRITICAL") severity = "CRITICAL";
          else if (finding.Severity?.Label === "HIGH") severity = "HIGH";  
          else if (finding.Severity?.Label === "MEDIUM") severity = "MEDIUM";
          
          findings.push({
            id: `securityhub-${finding.Id}`,
            severity,
            title: finding.Title || "Security Hub finding",
            service: "SecurityHub",
            resourceId: finding.Id || "unknown",
            resourceName: finding.Resources?.[0]?.Id,
            accountId,
            accountName,
            region: finding.Region || accountConfig.credentials.region,
            status: "REVIEW_REQUIRED",
            description: finding.Description || "Security Hub compliance finding",
            recommendation: finding.Remediation?.Recommendation?.Text || "Review Security Hub recommendation for remediation steps.",
            detectedAt: formatDate(finding.CreatedAt),
            complianceStatus: finding.Compliance?.Status,
            workflowState: finding.Workflow?.Status,
            recordState: finding.RecordState,
            evidence: {
              generatorId: finding.GeneratorId,
              resources: finding.Resources,
              compliance: finding.Compliance,
              types: finding.Types
            }
          });
        }
      }
    } catch (error: any) {
      // Security Hub not enabled or access denied
      findings.push({
        id: `securityhub-disabled-${accountId}`,
        severity: "LOW", 
        title: "Security Hub not enabled",
        service: "SecurityHub",
        resourceId: accountId,
        resourceName: accountName,
        accountId,
        accountName,
        region: accountConfig.credentials.region,
        status: "NOT_CONFIGURED",
        description: `Security Hub is not enabled in region ${accountConfig.credentials.region}`,
        recommendation: "Enable Security Hub for centralized security posture management and compliance monitoring.",
        detectedAt: formatDate(new Date()),
        complianceStatus: "NOT_AVAILABLE"
      });
    }
  } catch (error) {
    console.error(`Failed to analyze Security Hub for account ${accountName}:`, error);
  }

  return findings;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountFilter = searchParams.get("account") || "all";
    const forceRefresh = searchParams.get("refresh") === "true";
    const analysisType = searchParams.get("analysis") || "all"; // all, sg, s3, iam, guardduty, securityhub

    // Check cache first
    if (!forceRefresh && securityCache.has(accountFilter)) {
      const cached = securityCache.get(accountFilter)!;
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_DURATION) {
        return NextResponse.json(
          {
            success: true,
            accountIds: cached.accountIds,
            accountId: accountFilter,
            cached: true,
            cacheAge: Math.round(age / 1000),
            ...cached.data
          },
          { headers: CACHE_HEADERS }
        );
      }
    }

    const accountConfigs = getAllAwsAccounts();
    if (accountConfigs.length === 0) {
      return NextResponse.json({
        success: false,
        error: "AWS credentials not configured",
        message: "Please configure at least one AWS account in .env.local file.",
      }, { status: 500 });
    }

    // Analyze security for each account in parallel
    const analysisPromises = accountConfigs.map(async (config) => {
      try {
        const accountId = await getAccountId(config.accountNumber, config.credentials);
        
        // Skip if filtering by specific account
        if (accountFilter !== "all" && accountFilter !== accountId) {
          return { accountId, accountName: config.name, findings: [] };
        }

        const findings: SecurityFinding[] = [];

        // Run analyses in parallel where possible
        const analysisPromises = [];
        
        if (analysisType === "all" || analysisType === "sg") {
          analysisPromises.push(analyzeSecurityGroups(config, accountId, config.name));
        }
        if (analysisType === "all" || analysisType === "s3") {
          analysisPromises.push(analyzeS3Security(accountId, config.name));
        }
        if (analysisType === "all" || analysisType === "iam") {
          analysisPromises.push(analyzeIamAccessKeys(accountId, config.name));
        }
        if (analysisType === "all" || analysisType === "guardduty") {
          analysisPromises.push(analyzeGuardDuty(config, accountId, config.name));
        }
        if (analysisType === "all" || analysisType === "securityhub") {
          analysisPromises.push(analyzeSecurityHub(config, accountId, config.name));
        }

        const results = await Promise.all(analysisPromises);
        findings.push(...results.flat());

        return {
          accountId,
          accountName: config.name,
          findings
        };
      } catch (error: any) {
        console.error(`Failed to analyze security for account ${config.name}:`, error);
        
        // Check if this is an authentication error
        if (error.name === "CredentialsProviderError" || 
            error.name === "InvalidUserID.NotFound" ||
            error.name === "SignatureDoesNotMatch" ||
            error.name === "InvalidAccessKeyId" ||
            error.message?.includes("InvalidAccessKeyId") ||
            error.message?.includes("SignatureDoesNotMatch") ||
            error.message?.includes("InvalidUserID") ||
            error.message?.includes("The AWS Access Key Id you provided does not exist")) {
          console.warn(`Authentication failed for account ${config.name} (${config.accountNumber}):`, error.message);
          return null; // Exclude this account entirely
        }
        
        return { 
          accountId: "error",
          accountName: config.name, 
          findings: [] as SecurityFinding[]
        };
      }
    });

    const results = await Promise.all(analysisPromises);
    // Filter out null results (failed authentication)
    const validResults = results.filter(r => r !== null);
    const allFindings = validResults.flatMap(r => r.findings);
    const accountIds = validResults.map(r => r.accountId).filter(id => id !== "error");

    // Build overview
    const overview: SecurityOverview = {
      totalFindings: allFindings.length,
      critical: allFindings.filter(f => f.severity === "CRITICAL").length,
      high: allFindings.filter(f => f.severity === "HIGH").length,
      medium: allFindings.filter(f => f.severity === "MEDIUM").length,
      low: allFindings.filter(f => f.severity === "LOW").length,
      reviewRequired: allFindings.filter(f => f.status === "REVIEW_REQUIRED").length,
      healthy: allFindings.filter(f => f.status === "HEALTHY").length,
      notConfigured: allFindings.filter(f => f.status === "NOT_CONFIGURED").length,
      unknown: allFindings.filter(f => f.status === "UNKNOWN").length,
      byService: allFindings.reduce((acc, f) => {
        acc[f.service] = (acc[f.service] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byAccount: allFindings.reduce((acc, f) => {
        acc[f.accountName] = (acc[f.accountName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lastUpdated: new Date().toISOString()
    };

    // Build summary (simplified for now)
    const summary: SecuritySummary = {
      overview,
      securityGroups: {
        total: 0, // Would need to count all SGs
        openToPublic: allFindings.filter(f => f.service === "EC2").length,
        findings: allFindings.filter(f => f.service === "EC2").length
      },
      s3Security: {
        total: 0, // Would need to count all buckets
        encrypted: 0, // Would need to analyze all buckets
        publicAccessBlocked: 0,
        findings: allFindings.filter(f => f.service === "S3").length
      },
      publicResources: {
        total: 0,
        ec2Public: 0,
        rdsPublic: 0,
        s3Public: 0
      },
      iamSecurity: {
        totalUsers: 0,
        oldAccessKeys: allFindings.filter(f => f.service === "IAM").length,
        mfaEnabled: 0,
        findings: allFindings.filter(f => f.service === "IAM").length
      },
      guardDuty: {
        enabled: !allFindings.some(f => f.service === "GuardDuty" && f.status === "NOT_CONFIGURED"),
        findings: allFindings.filter(f => f.service === "GuardDuty" && f.status === "REVIEW_REQUIRED").length,
        highSeverity: allFindings.filter(f => f.service === "GuardDuty" && f.severity === "HIGH").length
      },
      securityHub: {
        enabled: !allFindings.some(f => f.service === "SecurityHub" && f.status === "NOT_CONFIGURED"),
        findings: allFindings.filter(f => f.service === "SecurityHub" && f.status === "REVIEW_REQUIRED").length,
        failedControls: allFindings.filter(f => f.service === "SecurityHub" && f.status === "REVIEW_REQUIRED").length
      }
    };

    const responseData = {
      overview,
      findings: allFindings,
      summary
    };

    // Cache results
    securityCache.set(accountFilter, {
      data: responseData,
      timestamp: Date.now(),
      accountIds
    });

    return NextResponse.json({
      success: true,
      accountIds,
      accountId: accountFilter,
      cached: false,
      ...responseData
    }, { headers: CACHE_HEADERS });

  } catch (error: any) {
    console.error("Security analysis error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to analyze security posture",
      message: error.message || "An unknown error occurred",
    }, { status: 500 });
  }
}