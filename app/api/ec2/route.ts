import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import type { Ec2Instance, SecurityGroupInfo, EbsVolumeInfo } from "@/data/ec2Data";
import { getAllAwsAccounts, type AwsCredentials } from "@/lib/awsCredentials";

// Disable Next.js default caching for this dynamic route
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Fail fast instead of letting the UI hang. The SDK default is 3 attempts with
 * no request timeout, so one unreachable endpoint could stall a response for
 * tens of seconds.
 */
const CLIENT_TIMEOUTS = {
  maxAttempts: 2,
  requestHandler: {
    connectionTimeout: 3000,
    requestTimeout: 8000,
  },
};

/**
 * Clients are reused across requests. Constructing them per request re-resolves
 * credentials/config and opens a new TLS connection every time, which added
 * hundreds of ms to each call.
 */
const ec2Clients = new Map<number, EC2Client>();
const stsClients = new Map<number, STSClient>();

function getEc2Client(accountNumber: number, credentials: AwsCredentials): EC2Client {
  let client = ec2Clients.get(accountNumber);
  if (!client) {
    client = new EC2Client({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      ...CLIENT_TIMEOUTS,
    });
    ec2Clients.set(accountNumber, client);
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

// Cache account IDs to avoid repeated STS calls
const accountIdCache = new Map<number, string>();

// Cache EC2 instances to avoid repeated AWS API calls
interface CacheEntry {
  data: Ec2Instance[];
  timestamp: number;
  accountIds: string[];
}

const ec2Cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

/**
 * Lets the browser reuse the response for 30s and serve a stale copy for
 * another 2 min while revalidating, so back/forward and repeat navigation do
 * not wait on the server at all.
 */
const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
};

// Region name mapping
const REGION_NAMES: Record<string, string> = {
  "us-east-1": "N. Virginia",
  "us-east-2": "Ohio",
  "us-west-1": "N. California",
  "us-west-2": "Oregon",
  "ap-south-1": "Mumbai",
  "ap-northeast-1": "Tokyo",
  "ap-northeast-2": "Seoul",
  "ap-northeast-3": "Osaka",
  "ap-southeast-1": "Singapore",
  "ap-southeast-2": "Sydney",
  "eu-west-1": "Ireland",
  "eu-west-2": "London",
  "eu-west-3": "Paris",
  "eu-central-1": "Frankfurt",
  "eu-north-1": "Stockholm",
  "sa-east-1": "São Paulo",
  "ca-central-1": "Canada",
  "me-south-1": "Bahrain",
  "af-south-1": "Cape Town",
};

async function getAccountId(
  accountNumber: number,
  credentials: AwsCredentials
): Promise<string> {
  // Return cached value if available
  if (accountIdCache.has(accountNumber)) {
    return accountIdCache.get(accountNumber)!;
  }

  // Fetch from STS and cache
  try {
    const stsClient = getStsClient(accountNumber, credentials);

    const identityCommand = new GetCallerIdentityCommand({});
    const identityResponse = await stsClient.send(identityCommand);
    const accountId = identityResponse.Account || "unknown";

    accountIdCache.set(accountNumber, accountId);
    return accountId;
  } catch (error: any) {
    console.error(`Failed to get account ID for account ${accountNumber}:`, error);
    
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

function getTagValue(tags: any[] | undefined, key: string): string {
  if (!tags) return "N/A";
  const tag = tags.find((t) => t.Key === key);
  return tag?.Value || "N/A";
}

function getAllTags(tags: any[] | undefined): Record<string, string> {
  if (!tags) return {};
  const result: Record<string, string> = {};
  for (const tag of tags) {
    if (tag.Key && tag.Value) {
      result[tag.Key] = tag.Value;
    }
  }
  return result;
}

function mapStatus(state: string | undefined): "running" | "stopped" {
  return state === "running" ? "running" : "stopped";
}

function formatLaunchTime(date: Date | undefined): string {
  if (!date) return "N/A";

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  return new Intl.DateTimeFormat("en-GB", options).format(new Date(date));
}

function extractSecurityGroups(groups: any[] | undefined): SecurityGroupInfo[] {
  if (!groups) return [];
  return groups.map((sg) => ({
    id: sg.GroupId || "unknown",
    name: sg.GroupName || "unknown",
  }));
}

function extractEbsVolumes(blockDeviceMappings: any[] | undefined): EbsVolumeInfo[] {
  if (!blockDeviceMappings) return [];
  return blockDeviceMappings
    .filter((bdm) => bdm.Ebs)
    .map((bdm) => ({
      volumeId: bdm.Ebs?.VolumeId || "unknown",
      deviceName: bdm.DeviceName || "unknown",
      size: 0, // Size requires additional DescribeVolumes call, leaving as 0 for performance
      volumeType: "unknown", // Would need DescribeVolumes
      encrypted: false, // Would need DescribeVolumes
      deleteOnTermination: bdm.Ebs?.DeleteOnTermination ?? false,
    }));
}

async function fetchEc2InstancesForAccount(
  credentials: AwsCredentials,
  accountNumber: number
): Promise<Ec2Instance[]> {
  const ec2Client = getEc2Client(accountNumber, credentials);

  const instances: Ec2Instance[] = [];
  let nextToken: string | undefined = undefined;

  do {
    const command: DescribeInstancesCommand = new DescribeInstancesCommand({
      NextToken: nextToken,
    });

    const response = await ec2Client.send(command);

    if (response.Reservations) {
      for (const reservation of response.Reservations) {
        if (reservation.Instances) {
          for (const instance of reservation.Instances) {
            if (instance.State?.Name === "terminated") {
              continue;
            }

            const region = credentials.region;
            const regionName = REGION_NAMES[region] || region;

            const ec2Instance: Ec2Instance = {
              id: instance.InstanceId || "N/A",
              name: getTagValue(instance.Tags, "Name"),
              status: mapStatus(instance.State?.Name),
              instanceType: instance.InstanceType || "N/A",
              region,
              regionName,
              privateIp: instance.PrivateIpAddress || "N/A",
              publicIp: instance.PublicIpAddress || null,
              environment: getTagValue(instance.Tags, "Environment"),
              availabilityZone: instance.Placement?.AvailabilityZone || "N/A",
              vpcId: instance.VpcId || "N/A",
              subnetId: instance.SubnetId || "N/A",
              launchTime: formatLaunchTime(instance.LaunchTime),
              
              // Enhanced fields
              amiId: instance.ImageId || "N/A",
              iamRole: instance.IamInstanceProfile?.Arn?.split("/").pop() || null,
              securityGroups: extractSecurityGroups(instance.SecurityGroups),
              ebsVolumes: extractEbsVolumes(instance.BlockDeviceMappings),
              platform: instance.Platform || "Linux/UNIX",
              architecture: instance.Architecture || "N/A",
              coreCount: instance.CpuOptions?.CoreCount || null,
              keyName: instance.KeyName || null,
              monitoring: instance.Monitoring?.State || "disabled",
              tags: getAllTags(instance.Tags),
            };

            instances.push(ec2Instance);
          }
        }
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return instances;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountFilter = searchParams.get("account") || "all";
    const forceRefresh = searchParams.get("refresh") === "true";

    // Check cache first (unless force refresh)
    if (!forceRefresh && ec2Cache.has(accountFilter)) {
      const cached = ec2Cache.get(accountFilter)!;
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_DURATION) {
        return NextResponse.json(
          {
            success: true,
            count: cached.data.length,
            accountIds: cached.accountIds,
            accountId: accountFilter,
            instances: cached.data,
            cached: true,
            cacheAge: Math.round(age / 1000), // seconds
          },
          { headers: CACHE_HEADERS }
        );
      }
    }

    const accountConfigs = getAllAwsAccounts();

    if (accountConfigs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "AWS credentials not configured",
          message:
            "Please configure at least one AWS account in .env.local file.",
        },
        { status: 500 }
      );
    }

    // Fetch account IDs and EC2 instances in parallel for all accounts
    const accountPromises = accountConfigs.map(async (config) => {
      try {
        // Get account ID (uses cache to avoid repeated STS calls)
        const accountId = await getAccountId(config.accountNumber, config.credentials);

        // Skip this account if filtering by specific account
        if (accountFilter !== "all" && accountFilter !== accountId) {
          return { accountId, instances: [] };
        }

        // Fetch EC2 instances for this account
        const instances = await fetchEc2InstancesForAccount(
          config.credentials,
          config.accountNumber
        );

        // Add accountId to each instance for filtering
        const instancesWithAccountId = instances.map((inst) => ({
          ...inst,
          accountId,
        }));

        return { accountId, instances: instancesWithAccountId };
      } catch (error: any) {
        console.error(
          `Failed to fetch EC2 for account ${config.accountNumber}:`,
          error
        );
        
        // Check if this is an authentication error
        if (error.name === "CredentialsProviderError" || 
            error.name === "InvalidUserID.NotFound" ||
            error.name === "SignatureDoesNotMatch" ||
            error.name === "InvalidAccessKeyId" ||
            error.message?.includes("InvalidAccessKeyId") ||
            error.message?.includes("SignatureDoesNotMatch") ||
            error.message?.includes("InvalidUserID") ||
            error.message?.includes("The AWS Access Key Id you provided does not exist")) {
          console.warn(`Authentication failed for account ${config.accountNumber}:`, error.message);
          return null; // Exclude this account entirely
        }
        
        return { accountId: "error", instances: [] };
      }
    });

    // Wait for all accounts in parallel
    const results = await Promise.all(accountPromises);
    // Filter out null results (failed authentication)
    const validResults = results.filter(r => r !== null);

    const allInstances = validResults.flatMap((r) => r.instances);
    const accountIds = validResults.map((r) => r.accountId).filter((id) => id !== "error");

    // Cache the results
    ec2Cache.set(accountFilter, {
      data: allInstances,
      timestamp: Date.now(),
      accountIds,
    });

    return NextResponse.json(
      {
        success: true,
        count: allInstances.length,
        accountIds,
        accountId: accountFilter,
        instances: allInstances,
        cached: false,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("AWS EC2 API Error:", error);

    // Handle specific AWS errors
    if (error.name === "CredentialsProviderError") {
      return NextResponse.json(
        {
          success: false,
          error: "AWS credentials not found",
          message: "Please configure your AWS credentials in .env.local file.",
        },
        { status: 401 }
      );
    }

    if (error.name === "UnauthorizedOperation") {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied",
          message:
            "Your AWS credentials do not have permission to describe EC2 instances.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch EC2 instances",
        message: error.message || "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
