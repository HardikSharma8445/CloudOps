export type AwsAccount = {
  id: string;
  name: string;
  alias?: string;
  isActive: boolean;
  accountNumber?: number; // Maps to AWS_ACCOUNT_N in env vars
};

// This will be populated dynamically from AWS STS GetCallerIdentity
export const awsAccounts: AwsAccount[] = [];

// Account display names (can be customized)
// Add your account names here as they are discovered
export const accountNames: Record<string, string> = {
  "116981797310": "HardikTest / Current Account",
  // Add more account names here as you add accounts:
  // "222222222222": "Production Account",
  // "333333333333": "Development Account",
};

export function getAccountName(accountId: string): string {
  return accountNames[accountId] || `Account ${accountId}`;
}
