import type { Ec2Instance } from "@/data/ec2Data";
import type { S3Bucket } from "@/data/s3Data";
import type { RdsInstance } from "@/data/rdsData";
import { fetchJson, invalidate } from "./dataCache";

export type AwsAccountInfo = {
  id: string;
  name: string;
  arn?: string;
  userId?: string;
  isActive: boolean;
  accountNumber?: number;
};

export type Ec2Response = {
  success: boolean;
  count: number;
  accountIds: string[];
  accountId: string;
  instances: Ec2Instance[];
  cached?: boolean;
  message?: string;
};

export type S3Response = {
  success: boolean;
  count: number;
  accountIds: string[];
  accountId: string;
  buckets: S3Bucket[];
  cached?: boolean;
  message?: string;
};

export type RdsResponse = {
  success: boolean;
  count: number;
  accountIds: string[];
  accountId: string;
  instances: RdsInstance[];
  cached?: boolean;
  message?: string;
};

export type AccountsResponse = {
  success: boolean;
  accounts: AwsAccountInfo[];
  cached?: boolean;
  message?: string;
};

/**
 * All pages request the account list through this one function, so the shared
 * cache key means it is fetched once per session rather than once per component
 * mount.
 */
export function getAccounts(force = false): Promise<AccountsResponse> {
  return fetchJson<AccountsResponse>("accounts", "/api/accounts", {
    force,
    // Reduced TTL to pick up new accounts faster
    ttl: 2 * 60 * 1000, // 2 minutes
  });
}

export function getEc2Instances(
  accountId: string | "all" = "all",
  force = false
): Promise<Ec2Response> {
  const url = `/api/ec2?account=${encodeURIComponent(accountId)}${
    force ? "&refresh=true" : ""
  }`;

  return fetchJson<Ec2Response>(`ec2:${accountId}`, url, { force });
}

export function getS3Buckets(
  accountId: string | "all" = "all",
  force = false
): Promise<S3Response> {
  const url = `/api/s3?account=${encodeURIComponent(accountId)}${
    force ? "&refresh=true" : ""
  }`;

  return fetchJson<S3Response>(`s3:${accountId}`, url, { force });
}

export function getRdsInstances(
  accountId: string | "all" = "all",
  force = false
): Promise<RdsResponse> {
  const url = `/api/rds?account=${encodeURIComponent(accountId)}${
    force ? "&refresh=true" : ""
  }`;

  return fetchJson<RdsResponse>(`rds:${accountId}`, url, { force });
}

/** Clear every cached EC2 payload, e.g. after an explicit refresh. */
export function invalidateEc2(): void {
  invalidate();
}

/** Clear every cached S3 payload. */
export function invalidateS3(): void {
  invalidate();
}

/** Clear every cached RDS payload. */
export function invalidateRds(): void {
  invalidate();
}

/**
 * Load accounts and EC2 data in parallel for faster initial page loads.
 */
export async function getAccountsAndEc2(
  accountId: string | "all" = "all",
  force = false
): Promise<{ accounts: AccountsResponse; ec2: Ec2Response }> {
  const [accounts, ec2] = await Promise.all([
    getAccounts(force),
    getEc2Instances(accountId, force),
  ]);
  
  return { accounts, ec2 };
}

/**
 * Load accounts and S3 data in parallel for faster initial page loads.
 */
export async function getAccountsAndS3(
  accountId: string | "all" = "all",
  force = false
): Promise<{ accounts: AccountsResponse; s3: S3Response }> {
  const [accounts, s3] = await Promise.all([
    getAccounts(force),
    getS3Buckets(accountId, force),
  ]);
  
  return { accounts, s3 };
}

/**
 * Load accounts and RDS data in parallel for faster initial page loads.
 */
export async function getAccountsAndRds(
  accountId: string | "all" = "all",
  force = false
): Promise<{ accounts: AccountsResponse; rds: RdsResponse }> {
  const [accounts, rds] = await Promise.all([
    getAccounts(force),
    getRdsInstances(accountId, force),
  ]);
  
  return { accounts, rds };
}
