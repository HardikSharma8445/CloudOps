"use client";

import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import StatCards, { StatCardsSkeleton } from "@/components/StatCards";
import ResourceTable, { ResourceTableSkeleton } from "@/components/ResourceTable";
import { SearchIcon } from "@/components/Icons";
import { 
  NameCell, 
  StatusCell, 
  TagsCell, 
  DateCell 
} from "@/components/cells";
import { 
  IamIcon, 
  UserIcon, 
  ShieldIcon, 
  AlertTriangleIcon,
  CheckCircleIcon
} from "@/components/Icons";
import type { 
  IamUser, 
  IamRole, 
  IamPolicy, 
  IamGroup, 
  IamSummary 
} from "@/data/iamData";
import type { Column, Stat } from "@/components/types";

export default function IamPage() {
  const [users, setUsers] = useState<IamUser[]>([]);
  const [roles, setRoles] = useState<IamRole[]>([]);
  const [summary, setSummary] = useState<IamSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchIamData = async (accountId: string = "all", forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        account: accountId,
        ...(forceRefresh && { refresh: "true" }),
      });

      const response = await fetch(`/api/iam?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch IAM data");
      }

      setUsers(data.users || []);
      setRoles(data.roles || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      console.error("Error fetching IAM data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIamData();
  }, []);

  // User columns
  const userColumns: Column<IamUser>[] = [
    {
      header: "User Name",
      render: (user) => (
        <NameCell
          name={user.userName}
          avatarText={user.userName.slice(0, 2).toUpperCase()}
          metadata={user.id}
        />
      ),
    },
    {
      header: "Status",
      render: (user) => (
        <StatusCell 
          status={user.status} 
          tone={user.status === "active" ? "ok" : "halt"} 
        />
      ),
    },
    {
      header: "Console Access",
      render: (user) => (
        <StatusCell 
          status={user.consoleAccess ? "Enabled" : "Disabled"} 
          tone={user.consoleAccess ? "ok" : "neutral"} 
        />
      ),
    },
    {
      header: "MFA",
      render: (user) => (
        <StatusCell 
          status={user.mfaEnabled ? "Enabled" : "Disabled"} 
          tone={user.mfaEnabled ? "ok" : "warn"} 
        />
      ),
    },
    {
      header: "Access Keys",
      render: (user) => (
        <span className="text-ink-base">
          {user.accessKeys.length} 
          {user.accessKeys.some(key => key.ageInDays > 90) && (
            <span className="ml-1 text-warn">⚠</span>
          )}
        </span>
      ),
    },
    {
      header: "Created",
      render: (user) => <DateCell date={user.createDate} />,
    },
    {
      header: "Tags",
      render: (user) => <TagsCell tags={user.tags} />,
    },
  ];

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const term = searchQuery.toLowerCase();
    return users.filter((user) =>
      user.userName.toLowerCase().includes(term) ||
      user.arn.toLowerCase().includes(term) ||
      Object.values(user.tags).some(tag => 
        String(tag).toLowerCase().includes(term)
      )
    );
  }, [users, searchQuery]);

  const stats: Stat[] = summary ? [
    {
      label: "Total Users",
      value: summary.users,
      Icon: UserIcon,
      tone: "info",
      fill: Math.min(summary.users / 50, 1),
      note: `${summary.usersWithConsoleAccess} with console access`,
    },
    {
      label: "Total Roles", 
      value: summary.roles,
      Icon: ShieldIcon,
      tone: "violet",
      fill: Math.min(summary.roles / 100, 1),
      note: "Service & cross-account roles",
    },
    {
      label: "MFA Enabled",
      value: `${summary.usersWithMfa}/${summary.users}`,
      Icon: CheckCircleIcon,
      tone: summary.usersWithMfa === summary.users ? "ok" : "warn",
      fill: summary.users > 0 ? summary.usersWithMfa / summary.users : 0,
      note: `${Math.round((summary.usersWithMfa / Math.max(summary.users, 1)) * 100)}% coverage`,
    },
    {
      label: "Old Access Keys",
      value: summary.oldAccessKeys,
      Icon: AlertTriangleIcon,
      tone: summary.oldAccessKeys > 0 ? "warn" : "ok",
      fill: Math.min(summary.oldAccessKeys / 10, 1),
      note: "Older than 90 days",
    },
  ] : [];

  const isFirstLoad = loading && !error;

  return (
    <>
      <Header title="IAM Management" />

      {/* Error Banner */}
      {error && (
        <div className="border-b border-halt/20 bg-halt-soft px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <IamIcon className="h-5 w-5 shrink-0 text-halt" />
              <p className="text-sm text-ink">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
            <button
              onClick={() => fetchIamData("all", true)}
              className="btn-secondary h-8 px-3 text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">IAM Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage identity and access management across your AWS accounts
          </p>
        </div>

        {/* Stats */}
        {isFirstLoad ? <StatCardsSkeleton count={4} /> : <StatCards stats={stats} />}

        {/* Table Section */}
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">Users</h2>
              <span className="rounded-full border border-line bg-surface-raised px-2.5 py-0.5 text-xs font-medium tabular-nums text-ink-muted">
                {filteredUsers.length}
                {filteredUsers.length !== users.length && (
                  <span className="text-ink-faint"> of {users.length}</span>
                )}
              </span>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink shadow-card transition-all placeholder:text-ink-faint focus:border-accent/60 focus:outline-none focus:ring-4 focus:ring-accent/15"
              />
            </div>
          </div>

          {isFirstLoad ? (
            <ResourceTableSkeleton columns={6} rows={5} />
          ) : (
            <ResourceTable
              rows={filteredUsers}
              columns={userColumns}
              getId={(user) => user.userName}
              rowLabel={(user) => user.userName}
              selectedId={null}
              onSelect={() => {}}
              emptyMessage={
                searchQuery 
                  ? "No matching users" 
                  : "No users found"
              }
              emptySubtitle={
                searchQuery
                  ? "Try adjusting your search terms"
                  : "Users will appear here once available"
              }
            />
          )}

          <p className="mt-3 text-xs text-ink-faint">
            IAM users from all configured AWS accounts. Search by name, ARN, or tags.
          </p>
        </section>
      </div>
    </>
  );
}