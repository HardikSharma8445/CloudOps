// Server-side only - AWS credential management for multiple accounts
// DO NOT import this file in client components

export type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export type AwsAccountConfig = {
  accountNumber: number;
  credentials: AwsCredentials;
};

/**
 * Get all configured AWS accounts from environment variables
 * Pattern: AWS_ACCOUNT_N_ACCESS_KEY_ID, AWS_ACCOUNT_N_SECRET_ACCESS_KEY, AWS_ACCOUNT_N_REGION
 */
export function getAllAwsAccounts(): AwsAccountConfig[] {
  const accounts: AwsAccountConfig[] = [];
  
  // Check for accounts from 1 to 10 (can be extended)
  for (let i = 1; i <= 10; i++) {
    const accessKeyId = process.env[`AWS_ACCOUNT_${i}_ACCESS_KEY_ID`];
    const secretAccessKey = process.env[`AWS_ACCOUNT_${i}_SECRET_ACCESS_KEY`];
    const region = process.env[`AWS_ACCOUNT_${i}_REGION`] || "ap-south-1";

    if (accessKeyId && secretAccessKey) {
      accounts.push({
        accountNumber: i,
        credentials: {
          accessKeyId,
          secretAccessKey,
          region,
        },
      });
    }
  }

  return accounts;
}

/**
 * Get credentials for a specific AWS account ID
 * First fetches all accounts, identifies which one matches the account ID
 * Returns null if account not found
 */
export function getCredentialsForAccount(accountId: string): AwsCredentials | null {
  // This is a placeholder - in practice, you'd need to cache the account ID mappings
  // For now, we'll return the first account's credentials
  const accounts = getAllAwsAccounts();
  
  if (accounts.length === 0) {
    return null;
  }

  // For the initial implementation, we need to map account IDs to credential indices
  // This will be populated dynamically by the /api/accounts endpoint
  return accounts[0]?.credentials || null;
}

/**
 * Get credentials by account number (1-based index)
 */
export function getCredentialsByAccountNumber(accountNumber: number): AwsCredentials | null {
  const accessKeyId = process.env[`AWS_ACCOUNT_${accountNumber}_ACCESS_KEY_ID`];
  const secretAccessKey = process.env[`AWS_ACCOUNT_${accountNumber}_SECRET_ACCESS_KEY`];
  const region = process.env[`AWS_ACCOUNT_${accountNumber}_REGION`] || "ap-south-1";

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    region,
  };
}
