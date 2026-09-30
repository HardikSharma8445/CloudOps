import type { Ec2Instance } from "@/data/ec2Data";
import type { S3Bucket } from "@/data/s3Data";
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
    // Account identity effectively never changes while the app is open.
    ttl: 10 * 60 * 1000,
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

/** Clear every cached EC2 payload, e.g. after an explicit refresh. */
export function invalidateEc2(): void {
  invalidate();
}

/** Clear every cached S3 payload. */
export function invalidateS3(): void {
  invalidate();
}
