export type IamUserStatus = "active" | "inactive";

export type AttachedPolicy = {
  policyName: string;
  policyArn: string;
  policyType: "AWS" | "Customer" | "Inline";
};

export type AccessKeyInfo = {
  accessKeyId: string;
  status: "Active" | "Inactive";
  createDate: string;
  lastUsedDate?: string;
  lastUsedService?: string;
  lastUsedRegion?: string;
  ageInDays: number;
};

export type IamUser = {
  id: string; // UserId
  userName: string;
  arn: string;
  status: IamUserStatus;
  createDate: string;
  passwordLastUsed?: string;
  mfaEnabled: boolean;
  consoleAccess: boolean;
  accessKeys: AccessKeyInfo[];
  attachedPolicies: AttachedPolicy[];
  groupMemberships: string[];
  tags: Record<string, string>;
  /** Owning AWS account ID, attached by /api/iam so the UI can filter per account. */
  accountId?: string;
};

export type AssumeRolePolicyDocument = {
  version: string;
  statement: any[];
};

export type IamRole = {
  id: string; // RoleId
  roleName: string;
  arn: string;
  description?: string;
  createDate: string;
  lastActivityDate?: string;
  maxSessionDuration: number;
  assumeRolePolicyDocument: AssumeRolePolicyDocument;
  attachedPolicies: AttachedPolicy[];
  tags: Record<string, string>;
  /** Owning AWS account ID, attached by /api/iam so the UI can filter per account. */
  accountId?: string;
};

export type IamPolicy = {
  policyName: string;
  policyId: string;
  arn: string;
  description?: string;
  createDate: string;
  updateDate: string;
  policyVersionList: string[];
  defaultVersionId: string;
  attachmentCount: number;
  permissionsBoundaryUsageCount: number;
  isAttachable: boolean;
  tags: Record<string, string>;
  /** Owning AWS account ID, attached by /api/iam so the UI can filter per account. */
  accountId?: string;
};

export type IamGroup = {
  groupName: string;
  groupId: string;
  arn: string;
  createDate: string;
  attachedPolicies: AttachedPolicy[];
  memberCount: number;
  members: string[]; // UserNames
  /** Owning AWS account ID, attached by /api/iam so the UI can filter per account. */
  accountId?: string;
};

export type IamSummary = {
  users: number;
  roles: number;
  policies: number;
  groups: number;
  usersWithMfa: number;
  usersWithConsoleAccess: number;
  activeAccessKeys: number;
  oldAccessKeys: number; // older than 90 days
  accountId?: string;
};

// Empty arrays for mock data - will be populated by API
export const iamUsers: IamUser[] = [];
export const iamRoles: IamRole[] = [];
export const iamPolicies: IamPolicy[] = [];
export const iamGroups: IamGroup[] = [];