import { NextResponse } from "next/server";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { getAllAwsAccounts } from "@/lib/awsCredentials";

// Disable Next.js default caching for this dynamic route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache account information to avoid repeated STS calls
let accountsCache: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Account identity is stable, so let the browser hold onto it too.
const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
};

/** Reused across requests - see the EC2 route for why. */
const stsClients = new Map<number, STSClient>();

function getStsClient(
  accountNumber: number,
  credentials: { accessKeyId: string; secretAccessKey: string; region: string }
): STSClient {
  let client = stsClients.get(accountNumber);
  if (!client) {
    client = new STSClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      maxAttempts: 2,
      requestHandler: {
        connectionTimeout: 3000,
        requestTimeout: 8000,
      },
    });
    stsClients.set(accountNumber, client);
  }
  return client;
}

export async function GET() {
  try {
    // Return cached accounts if still valid
    const now = Date.now();
    if (accountsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(
        {
          success: true,
          accounts: accountsCache,
          cached: true,
        },
        { headers: CACHE_HEADERS }
      );
    }

    const accountConfigs = getAllAwsAccounts();

    if (accountConfigs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "AWS credentials not configured",
          message:
            "Please configure at least one AWS account in .env.local file (AWS_ACCOUNT_1_ACCESS_KEY_ID, etc.).",
        },
        { status: 500 }
      );
    }

    // Fetch account information for all accounts in parallel
    const accountPromises = accountConfigs.map(async (config) => {
      try {
        const stsClient = getStsClient(config.accountNumber, config.credentials);

        const command = new GetCallerIdentityCommand({});
        const response = await stsClient.send(command);

        const accountId = response.Account || "unknown";
        
        // Use the name from env var (AWS_ACCOUNT_N_NAME), with accountId as fallback
        const accountName = config.name || `Account ${accountId}`;

        return {
          id: accountId,
          name: accountName,
          arn: response.Arn,
          userId: response.UserId,
          isActive: true,
          accountNumber: config.accountNumber,
          region: config.credentials.region,
        };
      } catch (error: any) {
        console.error(`Failed to fetch account ${config.accountNumber} (${config.name}):`, error.message);
        // Return error state for this account instead of null
        return {
          id: `error-${config.accountNumber}`,
          name: config.name,
          arn: null,
          userId: null,
          isActive: false,
          accountNumber: config.accountNumber,
          region: config.credentials.region,
          error: error.message || "Authentication failed",
        };
      }
    });

    const results = await Promise.all(accountPromises);
    
    // Separate working accounts from failed ones
    const workingAccounts = results.filter(acc => acc.isActive);
    const failedAccounts = results.filter(acc => !acc.isActive);

    if (workingAccounts.length === 0 && failedAccounts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to authenticate with any AWS account",
          message: "All configured AWS accounts failed authentication.",
          failedAccounts: failedAccounts.map(a => ({ name: a.name, error: a.error })),
        },
        { status: 500 }
      );
    }

    // Include all accounts (working + failed with error state)
    const allAccounts = results;

    // Update cache with working accounts only
    accountsCache = workingAccounts;
    cacheTimestamp = now;

    return NextResponse.json(
      {
        success: true,
        accounts: allAccounts,
        workingCount: workingAccounts.length,
        failedCount: failedAccounts.length,
        cached: false,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("AWS Accounts API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch account information",
        message: error.message || "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
