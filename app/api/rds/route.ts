import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RDSClient, DescribeDBInstancesCommand, type DescribeDBInstancesCommandOutput } from "@aws-sdk/client-rds";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import type { RdsInstance } from "@/data/rdsData";
import { getAllAwsAccounts, type AwsCredentials } from "@/lib/awsCredentials";

// Disable Next.js default caching for this dynamic route
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CLIENT_TIMEOUTS = {
  maxAttempts: 2,
  requestHandler: {
    connectionTimeout: 3000,
    requestTimeout: 10000,
  },
};

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
};

// Reusable clients
const rdsClients = new Map<string, RDSClient>();
const stsClients = new Map<number, STSClient>();
const accountIdCache = new Map<number, string>();

// Response cache
interface CacheEntry {
  data: RdsInstance[];
  timestamp: number;
  accountIds: string[];
}
const rdsCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

function getRdsClient(
  accountNumber: number,
  credentials: AwsCredentials,
  region: string
): RDSClient {
  const key = `${accountNumber}:${region}`;
  let client = rdsClients.get(key);
  if (!client) {
    client = new RDSClient({
      region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      ...CLIENT_TIMEOUTS,
    });
    rdsClients.set(key, client);
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
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function mapStatus(status: string | undefined): "available" | "stopped" | "modifying" {
  if (!status) return "stopped";
  const s = status.toLowerCase();
  if (s === "available") return "available";
  if (s === "stopped" || s === "stopping") return "stopped";
  return "modifying"; // starting, backing-up, maintenance, etc.
}

function getTagValue(tags: any[] | undefined, key: string): string {
  if (!tags) return "N/A";
  const tag = tags.find((t) => t.Key === key);
  return tag?.Value || "N/A";
}

async function fetchRdsInstancesForAccount(
  credentials: AwsCredentials,
  accountNumber: number,
  accountId: string
): Promise<RdsInstance[]> {
  const client = getRdsClient(accountNumber, credentials, credentials.region);

  const instances: RdsInstance[] = [];
  let marker: string | undefined = undefined;

  do {
    const command: DescribeDBInstancesCommand = new DescribeDBInstancesCommand({
      Marker: marker,
    });

    const response: DescribeDBInstancesCommandOutput = await client.send(command);

    if (response.DBInstances) {
      for (const db of response.DBInstances) {
        const region = credentials.region;
        const regionName = REGION_NAMES[region] || region;

        const rdsInstance: RdsInstance = {
          id: db.DbiResourceId || db.DBInstanceIdentifier || "N/A",
          name: db.DBInstanceIdentifier || "N/A",
          status: mapStatus(db.DBInstanceStatus),
          engine: db.Engine || "N/A",
          engineVersion: db.EngineVersion || "N/A",
          instanceClass: db.DBInstanceClass || "N/A",
          region,
          regionName,
          availabilityZone: db.AvailabilityZone || "N/A",
          multiAz: db.MultiAZ ? "Yes" : "No",
          storage: db.AllocatedStorage ? `${db.AllocatedStorage} GB` : "N/A",
          storageType: db.StorageType || "N/A",
          endpoint: db.Endpoint?.Address || "N/A",
          port: db.Endpoint?.Port || 0,
          vpcId: db.DBSubnetGroup?.VpcId || "N/A",
          subnetGroup: db.DBSubnetGroup?.DBSubnetGroupName || "N/A",
          backupRetention: db.BackupRetentionPeriod 
            ? `${db.BackupRetentionPeriod} day${db.BackupRetentionPeriod > 1 ? "s" : ""}` 
            : "Disabled",
          environment: getTagValue(db.TagList, "Environment"),
          createdAt: formatDate(db.InstanceCreateTime),
          // Additional fields for filtering
          accountId,
        };

        instances.push(rdsInstance);
      }
    }

    marker = response.Marker;
  } while (marker);

  return instances;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountFilter = searchParams.get("account") || "all";
    const forceRefresh = searchParams.get("refresh") === "true";

    // Check cache first
    if (!forceRefresh && rdsCache.has(accountFilter)) {
      const cached = rdsCache.get(accountFilter)!;
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

    // Fetch RDS instances from all accounts in parallel
    const accountPromises = accountConfigs.map(async (config) => {
      try {
        const accountId = await getAccountId(
          config.accountNumber,
          config.credentials
        );

        if (accountFilter !== "all" && accountFilter !== accountId) {
          return { accountId, instances: [] };
        }

        const instances = await fetchRdsInstancesForAccount(
          config.credentials,
          config.accountNumber,
          accountId
        );

        return { accountId, instances };
      } catch (error: any) {
        console.error(
          `Failed to fetch RDS for account ${config.accountNumber}:`,
          error.message
        );
        return { accountId: "error", instances: [] };
      }
    });

    const results = await Promise.all(accountPromises);
    const allInstances = results.flatMap((r) => r.instances);
    const accountIds = results
      .map((r) => r.accountId)
      .filter((id) => id !== "error");

    // Cache results
    rdsCache.set(accountFilter, {
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
    console.error("AWS RDS API Error:", error);

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

    if (error.name === "AccessDeniedException" || error.Code === "AccessDenied") {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied",
          message:
            "Your AWS credentials do not have permission to describe RDS instances.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch RDS instances",
        message: error.message || "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
