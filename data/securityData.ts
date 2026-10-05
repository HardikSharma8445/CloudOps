export type SecuritySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type SecurityStatus = "REVIEW_REQUIRED" | "HEALTHY" | "NOT_CONFIGURED" | "UNKNOWN" | "DETECTED";

export type SecurityFinding = {
  id: string;
  severity: SecuritySeverity;
  title: string;
  service: string;
  resourceId: string;
  resourceName?: string;
  accountId: string;
  accountName: string;
  region: string;
  status: SecurityStatus;
  description: string;
  recommendation?: string;
  detectedAt: string;
  evidence?: Record<string, any>;
};

export type SecurityGroupFinding = SecurityFinding & {
  service: "EC2";
  securityGroupId: string;
  port?: number;
  protocol?: string;
  source?: string;
  instanceIds?: string[];
};

export type S3SecurityFinding = SecurityFinding & {
  service: "S3";
  bucketName: string;
  publicAccessBlock?: boolean;
  encryption?: string;
  versioning?: string;
};

export type PublicResourceFinding = SecurityFinding & {
  service: "EC2" | "RDS" | "S3";
  publicIp?: string;
  publiclyAccessible?: boolean;
};

export type IamAccessKeyFinding = SecurityFinding & {
  service: "IAM";
  userName: string;
  accessKeyId: string; // Masked
  keyAge: number;
  lastUsed?: string;
  keyStatus: "Active" | "Inactive";
};

export type GuardDutyFinding = SecurityFinding & {
  service: "GuardDuty";
  type: string;
  confidence?: number;
  updatedAt?: string;
};

export type SecurityHubFinding = SecurityFinding & {
  service: "SecurityHub";
  complianceStatus?: string;
  workflowState?: string;
  recordState?: string;
};

export type SecurityOverview = {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  reviewRequired: number;
  healthy: number;
  notConfigured: number;
  unknown: number;
  byService: Record<string, number>;
  byAccount: Record<string, number>;
  lastUpdated: string;
};

export type SecuritySummary = {
  overview: SecurityOverview;
  securityGroups: {
    total: number;
    openToPublic: number;
    findings: number;
  };
  s3Security: {
    total: number;
    encrypted: number;
    publicAccessBlocked: number;
    findings: number;
  };
  publicResources: {
    total: number;
    ec2Public: number;
    rdsPublic: number;
    s3Public: number;
  };
  iamSecurity: {
    totalUsers: number;
    oldAccessKeys: number;
    mfaEnabled: number;
    findings: number;
  };
  guardDuty: {
    enabled: boolean;
    findings: number;
    highSeverity: number;
  };
  securityHub: {
    enabled: boolean;
    findings: number;
    failedControls: number;
  };
  accountId?: string;
};

// Configuration
export const IAM_ACCESS_KEY_AGE_THRESHOLD = 90; // days
export const SECURITY_FINDINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes