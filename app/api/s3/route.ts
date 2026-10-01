import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  S3Client,
  ListBucketsCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
  GetBucketLoggingCommand,
  GetBucketTaggingCommand,
} from "@aws-sdk/client-s3";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import type { S3Bucket, PublicAccess, BucketPolicy } from "@/data/s3Data";
import { getAllAwsAccounts, type AwsCredentials } from "@/lib/awsCredentials";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CLIENT_TIMEOUTS = {
  maxAttempts: 2,
  requestHandler: {
    connectionTimeout: 3000,
    requestTimeout: 8000,
  },
};

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
};

// Reusable clients
const s3Clients = new Map<string, S3Client>(); // keyed by accountNumber:region
const stsClients = new Map<number, STSClient>();
const accountIdCache = new Map<number, string>();

// Bucket region cache - regions never change, so cache permanently
const bucketRegionCache = new Map<string, string>();

// Response cache
interface CacheEntry {
  data: S3Bucket[];
  timestamp: number;
  accountIds: string[];
}
const s3Cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 2 * 60 * 1000;

function getS3Client(
  accountNumber: number,
  credentials: AwsCredentials,
  region: string
): S3Client {
  const key = `${accountNumber}:${region}`;
  let client = s3Clients.get(key);
  if (!client) {
    client = new S3Client({
      region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      ...CLIENT_TIMEOUTS,
    });
    s3Clients.set(key, client);
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

async function getAccountId(
  accountNumber: number,
  credentials: AwsCredentials
): Promise<string> {
  if (accountIdCache.has(accountNumber)) {
    return accountIdCache.get(accountNumber)!;
  }
  try {
    const stsClient = getStsClient(accountNumber, credentials);
    const response = await stsClient.send(new GetCallerIdentityCommand({}));
    const accountId = response.Account || "unknown";
    accountIdCache.set(accountNumber, accountId);
    return accountId;
  } catch (error) {
    console.error(`Failed to get account ID for account ${accountNumber}:`, error);
    return "unknown";
  }
}

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

function formatDate(date: Date | undefined): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

async function getBucketRegion(
  bucketName: string,
  credentials: AwsCredentials,
  accountNumber: number
): Promise<string> {
  // Check cache first - bucket regions never change
  const cached = bucketRegionCache.get(bucketName);
  if (cached) {
    return cached;
  }

  try {
    // GetBucketLocation must be called from us-east-1 or the bucket's region
    const client = getS3Client(accountNumber, credentials, "us-east-1");
    const response = await client.send(
      new GetBucketLocationCommand({ Bucket: bucketName })
    );
    // LocationConstraint is null/undefined for us-east-1
    const region = response.LocationConstraint || "us-east-1";

    // Cache permanently
    bucketRegionCache.set(bucketName, region);
    return region;
  } catch (error) {
    console.error(`Failed to get region for bucket ${bucketName}:`, error);
    return credentials.region; // fallback to account default
  }
}

async function getBucketDetails(
  bucketName: string,
  bucketRegion: string,
  credentials: AwsCredentials,
  accountNumber: number
): Promise<{
  versioning: string;
  encryption: string;
  publicAccess: PublicAccess;
  publicAccessBlock: S3Bucket["publicAccessBlock"];
  bucketPolicy: BucketPolicy;
  loggingEnabled: boolean;
  tags: Record<string, string>;
}> {
  const client = getS3Client(accountNumber, credentials, bucketRegion);

  // Fetch all properties in parallel
  const [
    versioningResult,
    encryptionResult,
    publicAccessResult,
    policyResult,
    loggingResult,
    tagsResult,
  ] = await Promise.allSettled([
    client.send(new GetBucketVersioningCommand({ Bucket: bucketName })),
    client.send(new GetBucketEncryptionCommand({ Bucket: bucketName })),
    client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName })),
    client.send(new GetBucketPolicyCommand({ Bucket: bucketName })),
    client.send(new GetBucketLoggingCommand({ Bucket: bucketName })),
    client.send(new GetBucketTaggingCommand({ Bucket: bucketName })),
  ]);

  // Process versioning
  let versioning = "Disabled";
  if (versioningResult.status === "fulfilled") {
    versioning = versioningResult.value.Status || "Disabled";
  }

  // Process encryption
  let encryption = "None";
  if (encryptionResult.status === "fulfilled") {
    const rule =
      encryptionResult.value.ServerSideEncryptionConfiguration?.Rules?.[0];
    if (rule?.ApplyServerSideEncryptionByDefault) {
      const algo = rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm;
      encryption =
        algo === "aws:kms"
          ? "SSE-KMS"
          : algo === "AES256"
            ? "SSE-S3"
            : algo || "None";
    }
  }

  // Process public access block
  let publicAccess: PublicAccess = "Unknown";
  let publicAccessBlock: S3Bucket["publicAccessBlock"] = null;

  if (publicAccessResult.status === "fulfilled") {
    const config = publicAccessResult.value.PublicAccessBlockConfiguration;
    if (config) {
      publicAccessBlock = {
        blockPublicAcls: config.BlockPublicAcls ?? false,
        ignorePublicAcls: config.IgnorePublicAcls ?? false,
        blockPublicPolicy: config.BlockPublicPolicy ?? false,
        restrictPublicBuckets: config.RestrictPublicBuckets ?? false,
      };

      const allBlocked =
        publicAccessBlock.blockPublicAcls &&
        publicAccessBlock.ignorePublicAcls &&
        publicAccessBlock.blockPublicPolicy &&
        publicAccessBlock.restrictPublicBuckets;

      publicAccess = allBlocked ? "Blocked" : "Partially blocked";
    }
  } else if (
    publicAccessResult.status === "rejected" &&
    (publicAccessResult.reason as any)?.name ===
      "NoSuchPublicAccessBlockConfiguration"
  ) {
    publicAccess = "Partially blocked";
  }

  // Process bucket policy
  let bucketPolicy: BucketPolicy = "Unknown";
  if (policyResult.status === "fulfilled" && policyResult.value.Policy) {
    bucketPolicy = "Present";
  } else if (
    policyResult.status === "rejected" &&
    (policyResult.reason as any)?.name === "NoSuchBucketPolicy"
  ) {
    bucketPolicy = "None";
  }

  // Process logging
  let loggingEnabled = false;
  if (loggingResult.status === "fulfilled") {
    loggingEnabled = !!loggingResult.value.LoggingEnabled?.TargetBucket;
  }

  // Process tags
  let tags: Record<string, string> = {};
  if (tagsResult.status === "fulfilled" && tagsResult.value.TagSet) {
    for (const tag of tagsResult.value.TagSet) {
      if (tag.Key && tag.Value) {
        tags[tag.Key] = tag.Value;
      }
    }
  }

  return {
    versioning,
    encryption,
    publicAccess,
    publicAccessBlock,
    bucketPolicy,
    loggingEnabled,
    tags,
  };
}

async function fetchS3BucketsForAccount(
  credentials: AwsCredentials,
  accountNumber: number,
  accountId: string
): Promise<S3Bucket[]> {
  // ListBuckets is a global operation, region doesn't matter
  const client = getS3Client(accountNumber, credentials, credentials.region);

  const listResponse = await client.send(new ListBucketsCommand({}));
  const buckets = listResponse.Buckets || [];

  // Fetch details for each bucket in parallel (with concurrency limit)
  const results: S3Bucket[] = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < buckets.length; i += CONCURRENCY) {
    const batch = buckets.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (bucket) => {
        const name = bucket.Name || "unknown";
        try {
          const region = await getBucketRegion(name, credentials, accountNumber);
          const details = await getBucketDetails(
            name,
            region,
            credentials,
            accountNumber
          );

          // Get environment from tags if available
          const environment = details.tags["Environment"] || "N/A";

          const s3Bucket: S3Bucket = {
            id: `${accountId}-${name}`,
            name,
            publicAccess: details.publicAccess,
            region,
            regionName: REGION_NAMES[region] || region,
            objectCount: "—", // Would require ListObjectsV2 which can be slow
            size: "—", // Would require S3 Storage Lens or iterating all objects
            storageClass: "Standard", // Default, would need per-object check
            versioning: details.versioning,
            encryption: details.encryption,
            lifecycleRules: "—", // Would require GetBucketLifecycleConfiguration
            replication: "—", // Would require GetBucketReplication
            environment,
            createdAt: formatDate(bucket.CreationDate),
            accountId,
            // Enhanced fields
            publicAccessBlock: details.publicAccessBlock,
            bucketPolicy: details.bucketPolicy,
            loggingEnabled: details.loggingEnabled,
            tags: details.tags,
          };
          return s3Bucket;
        } catch (error) {
          console.error(`Failed to get details for bucket ${name}:`, error);
          // Return bucket with minimal info rather than skipping
          return {
            id: `${accountId}-${name}`,
            name,
            publicAccess: "Unknown" as PublicAccess,
            region: credentials.region,
            regionName: REGION_NAMES[credentials.region] || credentials.region,
            objectCount: "—",
            size: "—",
            storageClass: "Standard",
            versioning: "Unknown",
            encryption: "Unknown",
            lifecycleRules: "—",
            replication: "—",
            environment: "N/A",
            createdAt: formatDate(bucket.CreationDate),
            accountId,
            publicAccessBlock: null,
            bucketPolicy: "Unknown" as BucketPolicy,
            loggingEnabled: false,
            tags: {},
          };
        }
      })
    );
    results.push(...batchResults);
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountFilter = searchParams.get("account") || "all";
    const forceRefresh = searchParams.get("refresh") === "true";

    // Check cache first
    if (!forceRefresh && s3Cache.has(accountFilter)) {
      const cached = s3Cache.get(accountFilter)!;
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_DURATION) {
        return NextResponse.json(
          {
            success: true,
            count: cached.data.length,
            accountIds: cached.accountIds,
            accountId: accountFilter,
            buckets: cached.data,
            cached: true,
            cacheAge: Math.round(age / 1000),
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

    // Fetch S3 buckets from all accounts in parallel
    const accountPromises = accountConfigs.map(async (config) => {
      try {
        const accountId = await getAccountId(
          config.accountNumber,
          config.credentials
        );

        if (accountFilter !== "all" && accountFilter !== accountId) {
          return { accountId, buckets: [] };
        }

        const buckets = await fetchS3BucketsForAccount(
          config.credentials,
          config.accountNumber,
          accountId
        );

        return { accountId, buckets };
      } catch (error) {
        console.error(
          `Failed to fetch S3 for account ${config.accountNumber}:`,
          error
        );
        return { accountId: "error", buckets: [] };
      }
    });

    const results = await Promise.all(accountPromises);
    const allBuckets = results.flatMap((r) => r.buckets);
    const accountIds = results
      .map((r) => r.accountId)
      .filter((id) => id !== "error");

    // Cache results
    s3Cache.set(accountFilter, {
      data: allBuckets,
      timestamp: Date.now(),
      accountIds,
    });

    return NextResponse.json(
      {
        success: true,
        count: allBuckets.length,
        accountIds,
        accountId: accountFilter,
        buckets: allBuckets,
        cached: false,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("AWS S3 API Error:", error);

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

    if (error.name === "AccessDenied" || error.Code === "AccessDenied") {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied",
          message:
            "Your AWS credentials do not have permission to list S3 buckets. Ensure AmazonS3ReadOnlyAccess is attached.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch S3 buckets",
        message: error.message || "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
