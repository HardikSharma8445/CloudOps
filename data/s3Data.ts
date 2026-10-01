export type PublicAccess = "Blocked" | "Partially blocked" | "Unknown";

export type BucketPolicy = "Present" | "None" | "Unknown";

export type S3Bucket = {
  id: string;
  name: string;
  publicAccess: PublicAccess;
  region: string;
  regionName: string;
  objectCount: string;
  size: string;
  storageClass: string;
  versioning: string;
  encryption: string;
  lifecycleRules: string;
  replication: string;
  environment: string;
  createdAt: string;
  /** Owning AWS account ID */
  accountId?: string;
  
  // Enhanced fields
  /** Public access block configuration details */
  publicAccessBlock: {
    blockPublicAcls: boolean;
    ignorePublicAcls: boolean;
    blockPublicPolicy: boolean;
    restrictPublicBuckets: boolean;
  } | null;
  /** Whether bucket has a bucket policy */
  bucketPolicy: BucketPolicy;
  /** Logging configuration */
  loggingEnabled: boolean;
  /** All tags as key-value pairs */
  tags: Record<string, string>;
};

/** Empty array for static imports (live data comes from API) */
export const s3Buckets: S3Bucket[] = [];
