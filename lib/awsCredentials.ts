// Server-side only - AWS credential management for multiple accounts
// DO NOT import this file in client components

export type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export type AwsAccountConfig = {
  accountNumber: number;
  name: string; // From AWS_ACCOUNT_N_NAME env var
  credentials: AwsCredentials;
};

/**
 * Get all configured AWS accounts from environment variables
 * Pattern: 
 *   AWS_ACCOUNT_N_NAME (optional, defaults to "Account N")
 *   AWS_ACCOUNT_N_ACCESS_KEY_ID (required)
 *   AWS_ACCOUNT_N_SECRET_ACCESS_KEY (required)
 *   AWS_ACCOUNT_N_REGION (optional, defaults to "ap-south-1")
 */
export function getAllAwsAccounts(): AwsAccountConfig[] {
  const accounts: AwsAccountConfig[] = [];
  
  // Check for accounts from 1 to 10 (can be extended)
  for (let i = 1; i <= 10; i++) {
    const accessKeyId = process.env[`AWS_ACCOUNT_${i}_ACCESS_KEY_ID`];
    const secretAccessKey = process.env[`AWS_ACCOUNT_${i}_SECRET_ACCESS_KEY`];
    const region = process.env[`AWS_ACCOUNT_${i}_REGION`] || "ap-south-1";
    const name = process.env[`AWS_ACCOUNT_${i}_NAME`] || `Account ${i}`;

    if (accessKeyId && secretAccessKey) {
      accounts.push({
        accountNumber: i,
        name,
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
 * Get credentials for a specific AWS account by name
 */
export function getCredentialsByName(accountName: string): AwsAccountConfig | null {
  const accounts = getAllAwsAccounts();
  return accounts.find(acc => acc.name === accountName) || null;
}

/**
 * Get credentials by account number (1-based index)
 */
export function getCredentialsByAccountNumber(accountNumber: number): AwsAccountConfig | null {
  const name = process.env[`AWS_ACCOUNT_${accountNumber}_NAME`] || `Account ${accountNumber}`;
  const accessKeyId = process.env[`AWS_ACCOUNT_${accountNumber}_ACCESS_KEY_ID`];
  const secretAccessKey = process.env[`AWS_ACCOUNT_${accountNumber}_SECRET_ACCESS_KEY`];
  const region = process.env[`AWS_ACCOUNT_${accountNumber}_REGION`] || "ap-south-1";

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    accountNumber,
    name,
    credentials: {
      accessKeyId,
      secretAccessKey,
      region,
    },
  };
}
