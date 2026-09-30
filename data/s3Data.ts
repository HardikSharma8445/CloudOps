export type PublicAccess = "Blocked" | "Partially blocked";

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
};

export const s3Buckets: S3Bucket[] = [
  {
    id: "appsquadz-prod-assets",
    name: "appsquadz-prod-assets",
    publicAccess: "Blocked",
    region: "ap-south-1",
    regionName: "Mumbai",
    objectCount: "1,284,902",
    size: "842.6 GB",
    storageClass: "Standard",
    versioning: "Enabled",
    encryption: "SSE-KMS",
    lifecycleRules: "2 rules",
    replication: "Enabled — ap-southeast-1",
    environment: "Production",
    createdAt: "12 Nov 2025, 04:15 PM",
  },
  {
    id: "appsquadz-prod-backups",
    name: "appsquadz-prod-backups",
    publicAccess: "Blocked",
    region: "ap-south-1",
    regionName: "Mumbai",
    objectCount: "48,317",
    size: "2.4 TB",
    storageClass: "Standard-IA",
    versioning: "Enabled",
    encryption: "SSE-KMS",
    lifecycleRules: "3 rules",
    replication: "Disabled",
    environment: "Production",
    createdAt: "12 Nov 2025, 04:22 PM",
  },
  {
    id: "appsquadz-logs-archive",
    name: "appsquadz-logs-archive",
    publicAccess: "Blocked",
    region: "ap-south-1",
    regionName: "Mumbai",
    objectCount: "9,642,105",
    size: "6.1 TB",
    storageClass: "Glacier Deep Archive",
    versioning: "Disabled",
    encryption: "SSE-S3",
    lifecycleRules: "1 rule",
    replication: "Disabled",
    environment: "Production",
    createdAt: "03 Dec 2025, 09:30 AM",
  },
  {
    id: "appsquadz-terraform-state",
    name: "appsquadz-terraform-state",
    publicAccess: "Blocked",
    region: "ap-south-1",
    regionName: "Mumbai",
    objectCount: "1,204",
    size: "312.8 MB",
    storageClass: "Standard",
    versioning: "Enabled",
    encryption: "SSE-KMS",
    lifecycleRules: "None",
    replication: "Disabled",
    environment: "Shared",
    createdAt: "28 Oct 2025, 02:07 PM",
  },
  {
    id: "appsquadz-qa-uploads",
    name: "appsquadz-qa-uploads",
    publicAccess: "Blocked",
    region: "ap-south-1",
    regionName: "Mumbai",
    objectCount: "72,540",
    size: "58.3 GB",
    storageClass: "Standard",
    versioning: "Disabled",
    encryption: "SSE-S3",
    lifecycleRules: "1 rule",
    replication: "Disabled",
    environment: "QA",
    createdAt: "16 May 2026, 10:41 AM",
  },
  {
    id: "appsquadz-dev-sandbox",
    name: "appsquadz-dev-sandbox",
    publicAccess: "Partially blocked",
    region: "ap-south-2",
    regionName: "Hyderabad",
    objectCount: "3,881",
    size: "4.7 GB",
    storageClass: "Standard",
    versioning: "Disabled",
    encryption: "SSE-S3",
    lifecycleRules: "None",
    replication: "Disabled",
    environment: "Development",
    createdAt: "09 Sep 2026, 03:52 PM",
  },
];
