import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { 
  IAMClient, 
  ListUsersCommand, 
  ListRolesCommand, 
  ListPoliciesCommand,
  ListGroupsCommand,
  GetUserCommand,
  ListAccessKeysCommand,
  GetAccessKeyLastUsedCommand,
  ListAttachedUserPoliciesCommand,
  ListUserPoliciesCommand,
  ListGroupsForUserCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  ListAttachedGroupPoliciesCommand,
  ListGroupPoliciesCommand,
  GetGroupCommand,
  ListUserTagsCommand,
  ListRoleTagsCommand,
  ListPolicyTagsCommand
} from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import type { 
  IamUser, 
  IamRole, 
  IamPolicy, 
  IamGroup, 
  IamSummary,
  AttachedPolicy,
  AccessKeyInfo
} from "@/data/iamData";
import { getAllAwsAccounts, type AwsCredentials } from "@/lib/awsCredentials";

// Disable Next.js default caching for this dynamic route
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Fail fast instead of letting the UI hang. The SDK default is 3 attempts with
 * no request timeout, so one unreachable endpoint could stall a response for
 * tens of seconds.
 */
const CLIENT_TIMEOUTS = {
  maxAttempts: 2,
  requestHandler: {
    connectionTimeout: 3000,
    requestTimeout: 8000,
  },
};

/**
 * Clients are reused across requests. Constructing them per request re-resolves
 * credentials/config and opens a new TLS connection every time, which added
 * hundreds of ms to each call.
 */
const iamClients = new Map<number, IAMClient>();
const stsClients = new Map<number, STSClient>();

function getIamClient(accountNumber: number, credentials: AwsCredentials): IAMClient {
  let client = iamClients.get(accountNumber);
  if (!client) {
    client = new IAMClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      ...CLIENT_TIMEOUTS,
    });
    iamClients.set(accountNumber, client);
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

// Cache account IDs to avoid repeated STS calls
const accountIdCache = new Map<number, string>();

// Cache IAM data to avoid repeated AWS API calls
interface CacheEntry {
  data: {
    users: IamUser[];
    roles: IamRole[];
    policies: IamPolicy[];
    groups: IamGroup[];
    summary: IamSummary;
  };
  timestamp: number;
  accountIds: string[];
}

const iamCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache (IAM changes less frequently)

/**
 * Lets the browser reuse the response for 30s and serve a stale copy for
 * another 2 min while revalidating, so back/forward and repeat navigation do
 * not wait on the server at all.
 */
const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
};

async function getAccountId(
  accountNumber: number,
  credentials: AwsCredentials
): Promise<string> {
  // Return cached value if available
  if (accountIdCache.has(accountNumber)) {
    return accountIdCache.get(accountNumber)!;
  }

  // Fetch from STS and cache
  try {
    const stsClient = getStsClient(accountNumber, credentials);
    const identityCommand = new GetCallerIdentityCommand({});
    const identityResponse = await stsClient.send(identityCommand);
    const accountId = identityResponse.Account || "unknown";

    accountIdCache.set(accountNumber, accountId);
    return accountId;
  } catch (error) {
    console.error(`Failed to get account ID for account ${accountNumber}:`, error);
    return "unknown";
  }
}

function formatDate(date: Date | undefined): string {
  if (!date) return "N/A";
  
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  
  return new Intl.DateTimeFormat("en-GB", options).format(new Date(date));
}

function calculateDaysAgo(date: Date | undefined): number {
  if (!date) return 0;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getAllTags(tags: any[] | undefined): Record<string, string> {
  if (!tags) return {};
  const result: Record<string, string> = {};
  for (const tag of tags) {
    if (tag.Key && tag.Value) {
      result[tag.Key] = tag.Value;
    }
  }
  return result;
}

async function getAttachedPolicies(
  iamClient: IAMClient,
  resourceName: string,
  resourceType: 'user' | 'role' | 'group'
): Promise<AttachedPolicy[]> {
  const policies: AttachedPolicy[] = [];

  try {
    // Get attached managed policies
    if (resourceType === 'user') {
      const attachedCommand = new ListAttachedUserPoliciesCommand({ UserName: resourceName });
      const attachedResponse = await iamClient.send(attachedCommand);
      if (attachedResponse.AttachedPolicies) {
        for (const policy of attachedResponse.AttachedPolicies) {
          policies.push({
            policyName: policy.PolicyName || "unknown",
            policyArn: policy.PolicyArn || "unknown",
            policyType: policy.PolicyArn?.includes(":aws:iam::aws:") ? "AWS" : "Customer"
          });
        }
      }
    } else if (resourceType === 'role') {
      const attachedCommand = new ListAttachedRolePoliciesCommand({ RoleName: resourceName });
      const attachedResponse = await iamClient.send(attachedCommand);
      if (attachedResponse.AttachedPolicies) {
        for (const policy of attachedResponse.AttachedPolicies) {
          policies.push({
            policyName: policy.PolicyName || "unknown",
            policyArn: policy.PolicyArn || "unknown",
            policyType: policy.PolicyArn?.includes(":aws:iam::aws:") ? "AWS" : "Customer"
          });
        }
      }
    } else {
      const attachedCommand = new ListAttachedGroupPoliciesCommand({ GroupName: resourceName });
      const attachedResponse = await iamClient.send(attachedCommand);
      if (attachedResponse.AttachedPolicies) {
        for (const policy of attachedResponse.AttachedPolicies) {
          policies.push({
            policyName: policy.PolicyName || "unknown",
            policyArn: policy.PolicyArn || "unknown",
            policyType: policy.PolicyArn?.includes(":aws:iam::aws:") ? "AWS" : "Customer"
          });
        }
      }
    }

    // Get inline policies
    if (resourceType === 'user') {
      const inlineCommand = new ListUserPoliciesCommand({ UserName: resourceName });
      const inlineResponse = await iamClient.send(inlineCommand);
      if (inlineResponse.PolicyNames) {
        for (const policyName of inlineResponse.PolicyNames) {
          policies.push({
            policyName,
            policyArn: `inline:${resourceName}:${policyName}`,
            policyType: "Inline"
          });
        }
      }
    } else if (resourceType === 'role') {
      const inlineCommand = new ListRolePoliciesCommand({ RoleName: resourceName });
      const inlineResponse = await iamClient.send(inlineCommand);
      if (inlineResponse.PolicyNames) {
        for (const policyName of inlineResponse.PolicyNames) {
          policies.push({
            policyName,
            policyArn: `inline:${resourceName}:${policyName}`,
            policyType: "Inline"
          });
        }
      }
    } else {
      const inlineCommand = new ListGroupPoliciesCommand({ GroupName: resourceName });
      const inlineResponse = await iamClient.send(inlineCommand);
      if (inlineResponse.PolicyNames) {
        for (const policyName of inlineResponse.PolicyNames) {
          policies.push({
            policyName,
            policyArn: `inline:${resourceName}:${policyName}`,
            policyType: "Inline"
          });
        }
      }
    }
  } catch (error) {
    console.error(`Failed to get policies for ${resourceType} ${resourceName}:`, error);
  }

  return policies;
}

async function getUserAccessKeys(
  iamClient: IAMClient,
  userName: string
): Promise<AccessKeyInfo[]> {
  const accessKeys: AccessKeyInfo[] = [];

  try {
    const command = new ListAccessKeysCommand({ UserName: userName });
    const response = await iamClient.send(command);

    if (response.AccessKeyMetadata) {
      for (const keyMeta of response.AccessKeyMetadata) {
        const accessKeyInfo: AccessKeyInfo = {
          accessKeyId: keyMeta.AccessKeyId || "unknown",
          status: (keyMeta.Status === "Active" || keyMeta.Status === "Inactive") ? keyMeta.Status : "Inactive",
          createDate: formatDate(keyMeta.CreateDate),
          ageInDays: calculateDaysAgo(keyMeta.CreateDate),
        };

        // Get last used information
        try {
          const lastUsedCommand = new GetAccessKeyLastUsedCommand({
            AccessKeyId: keyMeta.AccessKeyId
          });
          const lastUsedResponse = await iamClient.send(lastUsedCommand);
          
          if (lastUsedResponse.AccessKeyLastUsed?.LastUsedDate) {
            accessKeyInfo.lastUsedDate = formatDate(lastUsedResponse.AccessKeyLastUsed.LastUsedDate);
            accessKeyInfo.lastUsedService = lastUsedResponse.AccessKeyLastUsed.ServiceName || "unknown";
            accessKeyInfo.lastUsedRegion = lastUsedResponse.AccessKeyLastUsed.Region || "unknown";
          }
        } catch (error) {
          // Last used info might not be available for all keys
          console.warn(`Could not get last used info for access key ${keyMeta.AccessKeyId}`);
        }

        accessKeys.push(accessKeyInfo);
      }
    }
  } catch (error) {
    console.error(`Failed to get access keys for user ${userName}:`, error);
  }

  return accessKeys;
}

async function fetchIamDataForAccount(
  credentials: AwsCredentials,
  accountNumber: number
): Promise<{
  users: IamUser[];
  roles: IamRole[];
  policies: IamPolicy[];
  groups: IamGroup[];
  summary: IamSummary;
}> {
  const iamClient = getIamClient(accountNumber, credentials);
  
  const users: IamUser[] = [];
  const roles: IamRole[] = [];
  const policies: IamPolicy[] = [];
  const groups: IamGroup[] = [];

  // Fetch Users
  try {
    let userMarker: string | undefined;
    do {
      const usersCommand = new ListUsersCommand({ Marker: userMarker });
      const usersResponse = await iamClient.send(usersCommand);

      if (usersResponse.Users) {
        for (const user of usersResponse.Users) {
          // Get detailed user info
          const getUserCommand = new GetUserCommand({ UserName: user.UserName });
          const userDetails = await iamClient.send(getUserCommand);
          
          // Get user groups
          const groupsCommand = new ListGroupsForUserCommand({ UserName: user.UserName });
          const groupsResponse = await iamClient.send(groupsCommand);
          
          // Get user tags
          const tagsCommand = new ListUserTagsCommand({ UserName: user.UserName });
          const tagsResponse = await iamClient.send(tagsCommand);

          const accessKeys = await getUserAccessKeys(iamClient, user.UserName || "");
          const attachedPolicies = await getAttachedPolicies(iamClient, user.UserName || "", 'user');

          const iamUser: IamUser = {
            id: user.UserId || "unknown",
            userName: user.UserName || "unknown",
            arn: user.Arn || "unknown",
            status: "active", // IAM users don't have a status field, assume active if they exist
            createDate: formatDate(user.CreateDate),
            passwordLastUsed: user.PasswordLastUsed ? formatDate(user.PasswordLastUsed) : undefined,
            mfaEnabled: false, // Would need additional API call to check MFA devices
            consoleAccess: !!user.PasswordLastUsed, // Approximate based on password last used
            accessKeys,
            attachedPolicies,
            groupMemberships: groupsResponse.Groups?.map(g => g.GroupName || "") || [],
            tags: getAllTags(tagsResponse.Tags),
          };

          users.push(iamUser);
        }
      }

      userMarker = usersResponse.Marker;
    } while (userMarker);
  } catch (error) {
    console.error("Failed to fetch IAM users:", error);
  }

  // Fetch Roles
  try {
    let roleMarker: string | undefined;
    do {
      const rolesCommand = new ListRolesCommand({ Marker: roleMarker });
      const rolesResponse = await iamClient.send(rolesCommand);

      if (rolesResponse.Roles) {
        for (const role of rolesResponse.Roles) {
          // Get role tags
          const tagsCommand = new ListRoleTagsCommand({ RoleName: role.RoleName });
          const tagsResponse = await iamClient.send(tagsCommand);

          const attachedPolicies = await getAttachedPolicies(iamClient, role.RoleName || "", 'role');

          const iamRole: IamRole = {
            id: role.RoleId || "unknown",
            roleName: role.RoleName || "unknown",
            arn: role.Arn || "unknown",
            description: role.Description,
            createDate: formatDate(role.CreateDate),
            maxSessionDuration: role.MaxSessionDuration || 3600,
            assumeRolePolicyDocument: {
              version: "2012-10-17",
              statement: role.AssumeRolePolicyDocument ? 
                JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument)).Statement : []
            },
            attachedPolicies,
            tags: getAllTags(tagsResponse.Tags),
          };

          roles.push(iamRole);
        }
      }

      roleMarker = rolesResponse.Marker;
    } while (roleMarker);
  } catch (error) {
    console.error("Failed to fetch IAM roles:", error);
  }

  // Fetch Customer Managed Policies (not AWS managed)
  try {
    let policyMarker: string | undefined;
    do {
      const policiesCommand = new ListPoliciesCommand({ 
        Marker: policyMarker,
        OnlyAttached: false,
        Scope: "Local" // Only customer managed policies
      });
      const policiesResponse = await iamClient.send(policiesCommand);

      if (policiesResponse.Policies) {
        for (const policy of policiesResponse.Policies) {
          // Get policy tags
          const tagsCommand = new ListPolicyTagsCommand({ PolicyArn: policy.Arn });
          const tagsResponse = await iamClient.send(tagsCommand);

          const iamPolicy: IamPolicy = {
            policyName: policy.PolicyName || "unknown",
            policyId: policy.PolicyId || "unknown",
            arn: policy.Arn || "unknown",
            description: policy.Description,
            createDate: formatDate(policy.CreateDate),
            updateDate: formatDate(policy.UpdateDate),
            policyVersionList: [], // Would need additional API call
            defaultVersionId: policy.DefaultVersionId || "v1",
            attachmentCount: policy.AttachmentCount || 0,
            permissionsBoundaryUsageCount: policy.PermissionsBoundaryUsageCount || 0,
            isAttachable: policy.IsAttachable || false,
            tags: getAllTags(tagsResponse.Tags),
          };

          policies.push(iamPolicy);
        }
      }

      policyMarker = policiesResponse.Marker;
    } while (policyMarker);
  } catch (error) {
    console.error("Failed to fetch IAM policies:", error);
  }

  // Fetch Groups
  try {
    let groupMarker: string | undefined;
    do {
      const groupsCommand = new ListGroupsCommand({ Marker: groupMarker });
      const groupsResponse = await iamClient.send(groupsCommand);

      if (groupsResponse.Groups) {
        for (const group of groupsResponse.Groups) {
          // Get group details including members
          const getGroupCommand = new GetGroupCommand({ GroupName: group.GroupName });
          const groupDetails = await iamClient.send(getGroupCommand);

          const attachedPolicies = await getAttachedPolicies(iamClient, group.GroupName || "", 'group');

          const iamGroup: IamGroup = {
            groupName: group.GroupName || "unknown",
            groupId: group.GroupId || "unknown",
            arn: group.Arn || "unknown",
            createDate: formatDate(group.CreateDate),
            attachedPolicies,
            memberCount: groupDetails.Users?.length || 0,
            members: groupDetails.Users?.map(u => u.UserName || "") || [],
          };

          groups.push(iamGroup);
        }
      }

      groupMarker = groupsResponse.Marker;
    } while (groupMarker);
  } catch (error) {
    console.error("Failed to fetch IAM groups:", error);
  }

  // Calculate summary
  const usersWithMfa = users.filter(u => u.mfaEnabled).length;
  const usersWithConsoleAccess = users.filter(u => u.consoleAccess).length;
  const activeAccessKeys = users.reduce((acc, user) => 
    acc + user.accessKeys.filter(key => key.status === "Active").length, 0
  );
  const oldAccessKeys = users.reduce((acc, user) => 
    acc + user.accessKeys.filter(key => key.ageInDays > 90).length, 0
  );

  const summary: IamSummary = {
    users: users.length,
    roles: roles.length,
    policies: policies.length,
    groups: groups.length,
    usersWithMfa,
    usersWithConsoleAccess,
    activeAccessKeys,
    oldAccessKeys,
  };

  return { users, roles, policies, groups, summary };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountFilter = searchParams.get("account") || "all";
    const resourceType = searchParams.get("type") || "all"; // users, roles, policies, groups, summary
    const forceRefresh = searchParams.get("refresh") === "true";

    // Check cache first (unless force refresh)
    if (!forceRefresh && iamCache.has(accountFilter)) {
      const cached = iamCache.get(accountFilter)!;
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_DURATION) {
        const response: any = {
          success: true,
          accountIds: cached.accountIds,
          accountId: accountFilter,
          cached: true,
          cacheAge: Math.round(age / 1000), // seconds
        };

        // Return specific resource type or all
        if (resourceType === "users") {
          response.count = cached.data.users.length;
          response.users = cached.data.users;
        } else if (resourceType === "roles") {
          response.count = cached.data.roles.length;
          response.roles = cached.data.roles;
        } else if (resourceType === "policies") {
          response.count = cached.data.policies.length;
          response.policies = cached.data.policies;
        } else if (resourceType === "groups") {
          response.count = cached.data.groups.length;
          response.groups = cached.data.groups;
        } else if (resourceType === "summary") {
          response.summary = cached.data.summary;
        } else {
          response.count = cached.data.users.length + cached.data.roles.length + cached.data.policies.length + cached.data.groups.length;
          response.users = cached.data.users;
          response.roles = cached.data.roles;
          response.policies = cached.data.policies;
          response.groups = cached.data.groups;
          response.summary = cached.data.summary;
        }

        return NextResponse.json(response, { headers: CACHE_HEADERS });
      }
    }

    const accountConfigs = getAllAwsAccounts();

    if (accountConfigs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "AWS credentials not configured",
          message: "Please configure at least one AWS account in .env.local file.",
        },
        { status: 500 }
      );
    }

    // Fetch account IDs and IAM data in parallel for all accounts
    const accountPromises = accountConfigs.map(async (config) => {
      try {
        // Get account ID (uses cache to avoid repeated STS calls)
        const accountId = await getAccountId(config.accountNumber, config.credentials);

        // Skip this account if filtering by specific account
        if (accountFilter !== "all" && accountFilter !== accountId) {
          return { 
            accountId, 
            data: { 
              users: [], 
              roles: [], 
              policies: [], 
              groups: [], 
              summary: {
                users: 0, roles: 0, policies: 0, groups: 0,
                usersWithMfa: 0, usersWithConsoleAccess: 0,
                activeAccessKeys: 0, oldAccessKeys: 0
              } as IamSummary
            } 
          };
        }

        // Fetch IAM data for this account
        const iamData = await fetchIamDataForAccount(config.credentials, config.accountNumber);

        // Add accountId to each resource for filtering
        const usersWithAccountId = iamData.users.map(user => ({ ...user, accountId }));
        const rolesWithAccountId = iamData.roles.map(role => ({ ...role, accountId }));
        const policiesWithAccountId = iamData.policies.map(policy => ({ ...policy, accountId }));
        const groupsWithAccountId = iamData.groups.map(group => ({ ...group, accountId }));
        const summaryWithAccountId = { ...iamData.summary, accountId };

        return { 
          accountId, 
          data: {
            users: usersWithAccountId,
            roles: rolesWithAccountId,
            policies: policiesWithAccountId,
            groups: groupsWithAccountId,
            summary: summaryWithAccountId
          }
        };
      } catch (error) {
        console.error(`Failed to fetch IAM for account ${config.accountNumber}:`, error);
        return { 
          accountId: "error", 
          data: { 
            users: [], 
            roles: [], 
            policies: [], 
            groups: [], 
            summary: {
              users: 0, roles: 0, policies: 0, groups: 0,
              usersWithMfa: 0, usersWithConsoleAccess: 0,
              activeAccessKeys: 0, oldAccessKeys: 0
            } as IamSummary
          } 
        };
      }
    });

    // Wait for all accounts in parallel
    const results = await Promise.all(accountPromises);

    const allUsers = results.flatMap(r => r.data.users);
    const allRoles = results.flatMap(r => r.data.roles);
    const allPolicies = results.flatMap(r => r.data.policies);
    const allGroups = results.flatMap(r => r.data.groups);
    const accountIds = results.map(r => r.accountId).filter(id => id !== "error");

    // Aggregate summary
    const aggregatedSummary: IamSummary = {
      users: allUsers.length,
      roles: allRoles.length,
      policies: allPolicies.length,
      groups: allGroups.length,
      usersWithMfa: allUsers.filter(u => u.mfaEnabled).length,
      usersWithConsoleAccess: allUsers.filter(u => u.consoleAccess).length,
      activeAccessKeys: allUsers.reduce((acc, user) => 
        acc + user.accessKeys.filter(key => key.status === "Active").length, 0
      ),
      oldAccessKeys: allUsers.reduce((acc, user) => 
        acc + user.accessKeys.filter(key => key.ageInDays > 90).length, 0
      ),
    };

    // Cache the results
    iamCache.set(accountFilter, {
      data: {
        users: allUsers,
        roles: allRoles,
        policies: allPolicies,
        groups: allGroups,
        summary: aggregatedSummary
      },
      timestamp: Date.now(),
      accountIds,
    });

    const response: any = {
      success: true,
      accountIds,
      accountId: accountFilter,
      cached: false,
    };

    // Return specific resource type or all
    if (resourceType === "users") {
      response.count = allUsers.length;
      response.users = allUsers;
    } else if (resourceType === "roles") {
      response.count = allRoles.length;
      response.roles = allRoles;
    } else if (resourceType === "policies") {
      response.count = allPolicies.length;
      response.policies = allPolicies;
    } else if (resourceType === "groups") {
      response.count = allGroups.length;
      response.groups = allGroups;
    } else if (resourceType === "summary") {
      response.summary = aggregatedSummary;
    } else {
      response.count = allUsers.length + allRoles.length + allPolicies.length + allGroups.length;
      response.users = allUsers;
      response.roles = allRoles;
      response.policies = allPolicies;
      response.groups = allGroups;
      response.summary = aggregatedSummary;
    }

    return NextResponse.json(response, { headers: CACHE_HEADERS });
  } catch (error: any) {
    console.error("AWS IAM API Error:", error);

    // Handle specific AWS errors
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

    if (error.name === "UnauthorizedOperation" || error.name === "AccessDenied") {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied",
          message: "Your AWS credentials do not have permission to access IAM resources.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch IAM data",
        message: error.message || "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}