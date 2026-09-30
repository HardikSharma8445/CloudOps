export type PublicAccess = "Blocked" | "Partially blocked" | "Unknown";

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
};

/** Empty array for static imports (live data comes from API) */
export const s3Buckets: S3Bucket[] = [];
