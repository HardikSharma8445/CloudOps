"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import AwsIcon from "@/components/AwsIcon";
import {
  AlertIcon,
  BucketIcon,
  ChevronRightIcon,
  CubeIcon,
  DatabaseIcon,
  GlobeIcon,
  MapPinIcon,
  PulseIcon,
  RefreshIcon,
  ServerIcon,
  BalancerIcon,
  ShieldIcon,
  ClockIcon,
} from "@/components/Icons";
import {
  getAccounts,
  getEc2Instances,
  getS3Buckets,
  getRdsInstances,
  type AwsAccountInfo,
} from "@/lib/dashboardApi";
import type { Ec2Instance } from "@/data/ec2Data";
import type { S3Bucket } from "@/data/s3Data";
import type { RdsInstance } from "@/data/rdsData";
import { useFilters } from "@/components/FilterContext";

// ============================================================================
// Types
// ============================================================================

type ServiceStatus = "loading" | "success" | "error" | "empty";

type ServiceData<T> = {
  status: ServiceStatus;
  data: T[];
  error?: string;
  lastUpdated?: Date;
};

type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

type AttentionItem = {
  id: string;
  type: "warning" | "info" | "critical";
  message: string;
  href: string;
  service: string;
};

// ============================================================================
// Skeleton Components
// ============================================================================

function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton mt-2 h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div>
            <div className="skeleton h-4 w-16" />
            <div className="skeleton mt-1 h-3 w-32" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="skeleton h-8 w-12" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="skeleton mt-3 h-1 w-full rounded-full" />
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="skeleton mx-auto h-3 w-12" />
            <div className="skeleton mx-auto mt-1 h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthItemSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface-raised/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-5 w-5" />
        <div>
          <div className="skeleton h-4 w-16" />
          <div className="skeleton mt-1 h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="skeleton h-2 w-2 rounded-full" />
        <div className="skeleton h-3 w-16" />
      </div>
    </div>
  );
}

function AccountCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
      <div>
        <div className="skeleton h-4 w-24" />
        <div className="skeleton mt-1 h-3 w-28" />
      </div>
      <div className="skeleton h-2 w-2 rounded-full" />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function LiveIndicator({
  label,
  value,
  status = "ok",
  pulse = false,
}: {
  label: string;
  value: string | number;
  status?: "ok" | "warn" | "error";
  pulse?: boolean;
}) {
  const statusColors = {
    ok: "bg-ok",
    warn: "bg-warn",
    error: "bg-halt",
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusColors[status]}`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${statusColors[status]}`}
        />
      </span>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <span className="text-xs font-semibold text-ink">{value}</span>
    </div>
  );
}

function NetworkNode({
  className,
  size = "md",
  delay = 0,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  delay?: number;
}) {
  const sizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  };

  return (
    <span
      className={`absolute rounded-full bg-accent/40 ${sizes[size]} ${className}`}
      style={{
        animation: `pulse 3s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

function ServiceCard({
  label,
  fullName,
  href,
  awsIcon,
  Icon,
  data,
  getHealthyCount,
  healthyLabel,
  getStats,
}: {
  label: string;
  fullName: string;
  href: string;
  awsIcon?: "ec2" | "rds" | "eks" | "elb" | "s3";
  Icon?: React.ComponentType<{ className?: string }>;
  data: ServiceData<any>;
  getHealthyCount: (items: any[]) => number;
  healthyLabel: string;
  getStats: (items: any[]) => { label: string; value: string }[];
}) {
  const count = data.data.length;
  const healthy = getHealthyCount(data.data);
  const stats = getStats(data.data);
  const pct = count === 0 ? 0 : Math.round((healthy / count) * 100);

  const toneMap = {
    loading: "info",
    success: healthy === count && count > 0 ? "ok" : count > 0 ? "warn" : "neutral",
    error: "halt",
    empty: "neutral",
  } as const;

  const tone = toneMap[data.status];

  const tileTone: Record<string, string> = {
    ok: "border-ok/15 bg-ok-soft text-ok",
    halt: "border-halt/15 bg-halt-soft text-halt",
    warn: "border-warn/15 bg-warn-soft text-warn",
    info: "border-accent/15 bg-accent-soft text-accent",
    neutral: "border-line bg-surface-raised text-ink-muted",
  };

  const badgeTone: Record<string, string> = {
    ok: "border-ok/20 bg-ok-soft text-ok",
    warn: "border-warn/20 bg-warn-soft text-warn",
    halt: "border-halt/20 bg-halt-soft text-halt",
    info: "border-accent/20 bg-accent-soft text-accent",
    neutral: "border-line bg-surface-raised text-ink-muted",
  };

  const barTone: Record<string, string> = {
    ok: "bg-ok",
    halt: "bg-halt",
    warn: "bg-warn",
    info: "bg-accent",
    neutral: "bg-ink-faint",
  };

  if (data.status === "loading") {
    return <ServiceCardSkeleton />;
  }

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:border-accent/20 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${tileTone[tone]}`}
          >
            {awsIcon ? (
              <AwsIcon service={awsIcon} className="h-5 w-5" />
            ) : Icon ? (
              <Icon className="h-5 w-5" />
            ) : null}
          </span>
          <div>
            <p className="font-semibold text-ink">{label}</p>
            <p className="text-[10px] text-ink-faint">{fullName}</p>
          </div>
        </div>
        <ChevronRightIcon className="h-4 w-4 text-ink-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-semibold tabular-nums text-ink">
          {data.status === "error" ? "—" : count}
        </p>
        {data.status === "error" ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeTone.halt}`}>
            Error
          </span>
        ) : count > 0 ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeTone[tone]}`}>
            {healthy} {healthyLabel}
          </span>
        ) : null}
      </div>

      {data.status !== "error" && count > 0 && (
        <>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barTone[tone]}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-[9px] uppercase tracking-wider text-ink-faint">
                  {stat.label}
                </dt>
                <dd className="mt-0.5 text-xs font-semibold tabular-nums text-ink-muted">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {data.status === "error" && (
        <p className="mt-3 text-xs text-halt">{data.error || "Failed to load"}</p>
      )}
    </Link>
  );
}

function HealthCard({
  label,
  awsIcon,
  count,
  total,
  status,
  tone,
  loading,
}: {
  label: string;
  awsIcon: "ec2" | "rds" | "eks" | "elb" | "s3";
  count: number;
  total: number;
  status: string;
  tone: HealthStatus;
  loading?: boolean;
}) {
  if (loading) {
    return <HealthItemSkeleton />;
  }

  const dotTone: Record<HealthStatus, string> = {
    healthy: "bg-ok",
    warning: "bg-warn",
    critical: "bg-halt",
    unknown: "bg-ink-faint",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface-raised/50 px-4 py-3 transition-colors hover:bg-surface-raised">
      <div className="flex items-center gap-3">
        <AwsIcon service={awsIcon} className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium text-ink">{label}</p>
          <p className="text-[10px] text-ink-faint">
            {total > 0 ? `${count} of ${total}` : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotTone[tone]}`} />
        <span className="text-xs font-medium text-ink-muted">{status}</span>
      </div>
    </div>
  );
}

function AttentionCard({ item }: { item: AttentionItem }) {
  const typeStyles = {
    critical: "border-halt/30 bg-halt-soft hover:border-halt/50",
    warning: "border-warn/30 bg-warn-soft hover:border-warn/50",
    info: "border-accent/30 bg-accent-soft hover:border-accent/50",
  };

  const iconStyles = {
    critical: "bg-halt/20 text-halt",
    warning: "bg-warn/20 text-warn",
    info: "bg-accent/20 text-accent",
  };

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${typeStyles[item.type]}`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconStyles[item.type]}`}>
        <AlertIcon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium text-ink">{item.message}</span>
      <ChevronRightIcon className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SecurityOverviewCard({ accountId }: { accountId: string }) {
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchSecurityOverview = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/security/overview?account=${accountId}`);
        const data = await response.json();
        
        if (active) {
          setSecurityData(data.success ? data : null);
        }
      } catch (error) {
        console.error('Failed to fetch security overview:', error);
        if (active) {
          setSecurityData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSecurityOverview();

    return () => {
      active = false;
    };
  }, [accountId]);

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
          <ShieldIcon className="h-5 w-5 text-accent" />
          Security Overview
        </h2>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="skeleton h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton mt-2 h-3 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!securityData || securityData.total === 0) {
    return (
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
          <ShieldIcon className="h-5 w-5 text-accent" />
          Security Overview
        </h2>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-ok/20 bg-ok-soft text-ok">
              <ShieldIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Security posture looks good!</p>
              <p className="text-xs text-ink-muted">No critical findings detected</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasCriticalIssues = securityData.critical > 0 || securityData.high > 0;

  return (
    <div className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
        <ShieldIcon className="h-5 w-5 text-accent" />
        Security Overview
      </h2>
      <Link 
        href={`/security${hasCriticalIssues ? '?severity=CRITICAL,HIGH' : ''}`}
        className="block rounded-2xl border border-line bg-surface p-5 shadow-card transition-all hover:border-accent/20 hover:shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
              hasCriticalIssues 
                ? 'border-halt/20 bg-halt-soft text-halt' 
                : 'border-warn/20 bg-warn-soft text-warn'
            }`}>
              {hasCriticalIssues ? (
                <AlertIcon className="h-6 w-6" />
              ) : (
                <ShieldIcon className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                {hasCriticalIssues 
                  ? `${securityData.critical + securityData.high} security issues found`
                  : `${securityData.total} security findings`
                }
              </p>
              <p className="text-xs text-ink-muted">
                {hasCriticalIssues 
                  ? `${securityData.critical} critical, ${securityData.high} high priority`
                  : 'Click to view security posture details'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {securityData.critical > 0 && (
              <span className="rounded-full border border-halt/20 bg-halt-soft px-2 py-1 text-xs font-semibold text-halt">
                {securityData.critical} Critical
              </span>
            )}
            {securityData.high > 0 && (
              <span className="rounded-full border border-warn/20 bg-warn-soft px-2 py-1 text-xs font-semibold text-warn">
                {securityData.high} High
              </span>
            )}
            <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
          </div>
        </div>
      </Link>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function OverviewPage() {
  // Service data states - each loads independently
  const [ec2Data, setEc2Data] = useState<ServiceData<Ec2Instance>>({
    status: "loading",
    data: [],
  });
  const [s3Data, setS3Data] = useState<ServiceData<S3Bucket>>({
    status: "loading",
    data: [],
  });
  const [rdsData, setRdsData] = useState<ServiceData<RdsInstance>>({
    status: "loading", 
    data: [],
  });
  const [accounts, setAccounts] = useState<AwsAccountInfo[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // Use global filter context for account and region
  const { selectedAccountId, setSelectedAccountId, selectedRegion, setSelectedRegion } = useFilters();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastGlobalRefresh, setLastGlobalRefresh] = useState<Date | null>(null);

  // Load accounts
  useEffect(() => {
    let active = true;

    getAccounts()
      .then((data) => {
        if (!active) return;
        if (data.success && data.accounts) {
          setAccounts(data.accounts);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (active) setAccountsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Load EC2 data independently
  const loadEc2 = useCallback(
    async (accountId: string | "all", force = false) => {
      setEc2Data((prev) => ({ ...prev, status: "loading" }));

      try {
        const data = await getEc2Instances(accountId, force);
        if (data.success) {
          setEc2Data({
            status: data.instances.length > 0 ? "success" : "empty",
            data: data.instances,
            lastUpdated: new Date(),
          });
        } else {
          setEc2Data({
            status: "error",
            data: [],
            error: data.message || "Failed to load EC2 instances",
          });
        }
      } catch (err: any) {
        setEc2Data({
          status: "error",
          data: [],
          error: err.message || "Failed to load EC2 instances",
        });
      }
    },
    []
  );

  // Load S3 data independently
  const loadS3 = useCallback(
    async (accountId: string | "all", force = false) => {
      setS3Data((prev) => ({ ...prev, status: "loading" }));

      try {
        const data = await getS3Buckets(accountId, force);
        if (data.success) {
          setS3Data({
            status: data.buckets.length > 0 ? "success" : "empty",
            data: data.buckets,
            lastUpdated: new Date(),
          });
        } else {
          setS3Data({
            status: "error",
            data: [],
            error: data.message || "Failed to load S3 buckets",
          });
        }
      } catch (err: any) {
        setS3Data({
          status: "error",
          data: [],
          error: err.message || "Failed to load S3 buckets",
        });
      }
    },
    []
  );

  // Load RDS data independently
  const loadRds = useCallback(
    async (accountId: string | "all", force = false) => {
      setRdsData((prev) => ({ ...prev, status: "loading" }));

      try {
        const data = await getRdsInstances(accountId, force);
        if (data.success) {
          setRdsData({
            status: data.instances.length > 0 ? "success" : "empty",
            data: data.instances,
            lastUpdated: new Date(),
          });
        } else {
          setRdsData({
            status: "error",
            data: [],
            error: data.message || "Failed to load RDS instances",
          });
        }
      } catch (err: any) {
        setRdsData({
          status: "error",
          data: [],
          error: err.message || "Failed to load RDS instances",
        });
      }
    },
    []
  );

  // Load all data in parallel (independently)
  const loadAllData = useCallback(
    (accountId: string | "all", force = false) => {
      // Fire all requests in parallel - each updates its own state
      loadEc2(accountId, force);
      loadS3(accountId, force);
      loadRds(accountId, force);
    },
    [loadEc2, loadS3, loadRds]
  );

  // Initial load
  useEffect(() => {
    loadAllData(selectedAccountId);
  }, [selectedAccountId, loadAllData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadAllData(selectedAccountId, true);
        setLastGlobalRefresh(new Date());
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedAccountId, loadAllData]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAllData(selectedAccountId, true);
    setLastGlobalRefresh(new Date());

    // Clear refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [selectedAccountId, loadAllData]);

  // Computed values - with region filtering
  const ec2Instances = useMemo(() => {
    if (selectedRegion === "all") return ec2Data.data;
    return ec2Data.data.filter((i) => i.region === selectedRegion);
  }, [ec2Data.data, selectedRegion]);

  const s3Buckets = useMemo(() => {
    if (selectedRegion === "all") return s3Data.data;
    return s3Data.data.filter((b) => b.region === selectedRegion);
  }, [s3Data.data, selectedRegion]);

  const rdsInstances = useMemo(() => {
    if (selectedRegion === "all") return rdsData.data;
    return rdsData.data.filter((r) => r.region === selectedRegion);
  }, [rdsData.data, selectedRegion]);

  const ec2Running = useMemo(
    () => ec2Instances.filter((i) => i.status === "running").length,
    [ec2Instances]
  );
  const ec2Stopped = useMemo(
    () => ec2Instances.filter((i) => i.status === "stopped").length,
    [ec2Instances]
  );
  const s3Blocked = useMemo(
    () => s3Buckets.filter((b) => b.publicAccess === "Blocked").length,
    [s3Buckets]
  );

  const rdsAvailable = useMemo(
    () => rdsInstances.filter((r) => r.status === "available").length,
    [rdsInstances]
  );

  const totalResources = ec2Instances.length + s3Buckets.length + rdsInstances.length;

  const allRegions = useMemo(() => {
    const regions = new Set<string>();
    ec2Data.data.forEach((i) => regions.add(i.region));
    s3Data.data.forEach((b) => regions.add(b.region));
    rdsData.data.forEach((r) => regions.add(r.region));
    return regions;
  }, [ec2Data.data, s3Data.data, rdsData.data]);

  // Region counts for the filter dropdown (before region filtering)
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ec2Data.data.forEach((i) => {
      counts[i.region] = (counts[i.region] || 0) + 1;
    });
    s3Data.data.forEach((b) => {
      counts[b.region] = (counts[b.region] || 0) + 1;
    });
    rdsData.data.forEach((r) => {
      counts[r.region] = (counts[r.region] || 0) + 1;
    });
    return counts;
  }, [ec2Data.data, s3Data.data, rdsData.data]);

  // Available regions
  const availableRegions = useMemo(() => Object.keys(regionCounts), [regionCounts]);

  const activeServices = [
    ec2Data.status === "success" || ec2Data.status === "empty",
    s3Data.status === "success" || s3Data.status === "empty",
    rdsData.status === "success" || rdsData.status === "empty",
  ].filter(Boolean).length;

  // Connection status
  const isConnected =
    ec2Data.status !== "error" || s3Data.status !== "error" || rdsData.status !== "error";

  // Determine last updated time
  const lastUpdated = useMemo(() => {
    const times = [ec2Data.lastUpdated, s3Data.lastUpdated, rdsData.lastUpdated].filter(Boolean) as Date[];
    if (times.length === 0) return lastGlobalRefresh;
    return new Date(Math.max(...times.map((t) => t.getTime())));
  }, [ec2Data.lastUpdated, s3Data.lastUpdated, rdsData.lastUpdated, lastGlobalRefresh]);

  // Attention items - only from real data
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    // S3 buckets without public access block
    const s3Public = s3Buckets.filter((b) => b.publicAccess !== "Blocked");
    if (s3Public.length > 0) {
      items.push({
        id: "s3-public",
        type: "warning",
        message: `${s3Public.length} S3 bucket${s3Public.length > 1 ? "s" : ""} without public access block`,
        href: "/s3",
        service: "S3",
      });
    }

    // Stopped EC2 instances
    if (ec2Stopped > 0) {
      items.push({
        id: "ec2-stopped",
        type: "info",
        message: `${ec2Stopped} EC2 instance${ec2Stopped > 1 ? "s are" : " is"} stopped`,
        href: "/",
        service: "EC2",
      });
    }

    // S3 buckets without encryption
    const s3Unencrypted = s3Buckets.filter(
      (b) => b.encryption === "None" || b.encryption === "Unknown"
    );
    if (s3Unencrypted.length > 0) {
      items.push({
        id: "s3-unencrypted",
        type: "warning",
        message: `${s3Unencrypted.length} S3 bucket${s3Unencrypted.length > 1 ? "s" : ""} without encryption`,
        href: "/s3",
        service: "S3",
      });
    }

    return items;
  }, [s3Buckets, ec2Stopped]);

  // Health items
  const healthItems = useMemo(
    () => [
      {
        label: "EC2",
        awsIcon: "ec2" as const,
        count: ec2Running,
        total: ec2Instances.length,
        status:
          ec2Data.status === "loading"
            ? "Loading..."
            : ec2Data.status === "error"
            ? "Error"
            : ec2Running > 0
            ? "Healthy"
            : ec2Instances.length > 0
            ? "Stopped"
            : "No instances",
        tone:
          ec2Data.status === "loading"
            ? "unknown"
            : ec2Data.status === "error"
            ? "critical"
            : ec2Running > 0
            ? "healthy"
            : ec2Instances.length > 0
            ? "warning"
            : ("unknown" as HealthStatus),
        loading: ec2Data.status === "loading",
      },
      {
        label: "S3",
        awsIcon: "s3" as const,
        count: s3Blocked,
        total: s3Buckets.length,
        status:
          s3Data.status === "loading"
            ? "Loading..."
            : s3Data.status === "error"
            ? "Error"
            : s3Blocked === s3Buckets.length && s3Buckets.length > 0
            ? "Secured"
            : s3Buckets.length > 0
            ? "Review access"
            : "No buckets",
        tone:
          s3Data.status === "loading"
            ? "unknown"
            : s3Data.status === "error"
            ? "critical"
            : s3Blocked === s3Buckets.length && s3Buckets.length > 0
            ? "healthy"
            : s3Buckets.length > 0
            ? "warning"
            : ("unknown" as HealthStatus),
        loading: s3Data.status === "loading",
      },
      {
        label: "RDS",
        awsIcon: "rds" as const,
        count: rdsAvailable,
        total: rdsInstances.length,
        status:
          rdsData.status === "loading"
            ? "Loading..."
            : rdsData.status === "error"
            ? "Error"
            : rdsAvailable > 0
            ? "Available"
            : rdsInstances.length > 0
            ? "Stopped"
            : "No databases",
        tone:
          rdsData.status === "loading"
            ? "unknown"
            : rdsData.status === "error"
            ? "critical"
            : rdsAvailable > 0
            ? "healthy"
            : rdsInstances.length > 0
            ? "warning"
            : ("unknown" as HealthStatus),
        loading: rdsData.status === "loading",
      },
      {
        label: "EKS",
        awsIcon: "eks" as const,
        count: 0,
        total: 0,
        status: "Not configured",
        tone: "unknown" as HealthStatus,
        loading: false,
      },
      {
        label: "ALB",
        awsIcon: "elb" as const,
        count: 0,
        total: 0,
        status: "Not configured",
        tone: "unknown" as HealthStatus,
        loading: false,
      },
    ],
    [ec2Data, s3Data, rdsData, ec2Running, ec2Instances.length, s3Blocked, s3Buckets.length, rdsAvailable, rdsInstances.length]
  );

  // Resources by region
  const regionData = useMemo(() => {
    const regionMap = new Map<string, { region: string; regionName: string; count: number }>();

    ec2Instances.forEach((i) => {
      const existing = regionMap.get(i.region);
      if (existing) {
        existing.count++;
      } else {
        regionMap.set(i.region, { region: i.region, regionName: i.regionName, count: 1 });
      }
    });

    s3Buckets.forEach((b) => {
      const existing = regionMap.get(b.region);
      if (existing) {
        existing.count++;
      } else {
        regionMap.set(b.region, { region: b.region, regionName: b.regionName, count: 1 });
      }
    });

    rdsInstances.forEach((r) => {
      const existing = regionMap.get(r.region);
      if (existing) {
        existing.count++;
      } else {
        regionMap.set(r.region, { region: r.region, regionName: r.regionName, count: 1 });
      }
    });

    return Array.from(regionMap.values()).sort((a, b) => b.count - a.count);
  }, [ec2Instances, s3Buckets, rdsInstances]);

  const maxRegionCount = useMemo(
    () => Math.max(...regionData.map((r) => r.count), 1),
    [regionData]
  );

  // Format last updated time
  const formatLastUpdated = useCallback(() => {
    if (!lastUpdated) return "Never";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    if (diff < 10) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [lastUpdated]);

  // Any loading state
  const anyLoading = ec2Data.status === "loading" || s3Data.status === "loading" || rdsData.status === "loading";

  return (
    <>
      <Header
        title="Command Center"
        subtitle="CloudOps Overview"
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        accountsLoading={accountsLoading}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        regionCounts={regionCounts}
        availableRegions={availableRegions}
        showRefresh
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing || anyLoading}
        lastUpdated={lastUpdated}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-line">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-surface via-accent-soft/30 to-violet-soft/20" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "url(/cloud-network.svg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 overflow-hidden">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <NetworkNode
                key={i}
                className={`top-[${10 + (i % 3) * 30}%] left-[${10 + i * 10}%]`}
                size={["sm", "md", "lg"][i % 3] as "sm" | "md" | "lg"}
                delay={i * 200}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-surface/40" />
        </div>

        {/* Hero Content */}
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            {/* Left - Title */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet shadow-lg shadow-accent/25">
                  <GlobeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-ink lg:text-4xl">
                    Cloud Infrastructure
                  </h1>
                  <p className="mt-1 text-base text-ink-muted">
                    Real-time operations command center
                  </p>
                </div>
              </div>

              {/* Live status indicators */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <LiveIndicator
                  label="Status"
                  value={isConnected ? "Connected" : "Disconnected"}
                  status={isConnected ? "ok" : "error"}
                  pulse={isConnected}
                />
                <LiveIndicator label="Updated" value={formatLastUpdated()} status="ok" />
                <LiveIndicator
                  label="Accounts"
                  value={accountsLoading ? "..." : accounts.length}
                  status="ok"
                />
                <LiveIndicator
                  label="Services"
                  value={`${activeServices} active`}
                  status={activeServices > 0 ? "ok" : "warn"}
                />
              </div>
            </div>

            {/* Right - Quick stats */}
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums text-ink lg:text-4xl">
                  {anyLoading ? "—" : totalResources}
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Resources
                </p>
              </div>
              <div className="h-12 w-px bg-line" />
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums text-ink lg:text-4xl">
                  {anyLoading ? "—" : allRegions.size}
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Regions
                </p>
              </div>
              <div className="h-12 w-px bg-line" />
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums text-ok lg:text-4xl">
                  {ec2Data.status === "loading" ? "—" : ec2Running}
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Running
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Attention Required */}
        {attentionItems.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
              <AlertIcon className="h-5 w-5 text-warn" />
              Attention Required
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {attentionItems.map((item) => (
                <AttentionCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Security Overview */}
        <SecurityOverviewCard accountId={selectedAccountId} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {/* Left Column - AWS Services */}
          <div className="xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <ServerIcon className="h-5 w-5 text-ink-faint" />
                AWS Services
              </h2>
              <span className="text-xs font-medium text-ink-faint">
                {activeServices} connected
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* EC2 */}
              <ServiceCard
                label="EC2"
                fullName="Elastic Compute Cloud"
                href="/"
                awsIcon="ec2"
                data={ec2Data}
                getHealthyCount={(items) => items.filter((i: Ec2Instance) => i.status === "running").length}
                healthyLabel="running"
                getStats={(items: Ec2Instance[]) => [
                  { label: "Running", value: String(items.filter((i) => i.status === "running").length) },
                  { label: "Stopped", value: String(items.filter((i) => i.status === "stopped").length) },
                  { label: "Types", value: String(new Set(items.map((i) => i.instanceType)).size) },
                ]}
              />

              {/* S3 */}
              <ServiceCard
                label="S3"
                fullName="Simple Storage Service"
                href="/s3"
                awsIcon="s3"
                data={s3Data}
                getHealthyCount={(items) => items.filter((b: S3Bucket) => b.publicAccess === "Blocked").length}
                healthyLabel="secured"
                getStats={(items: S3Bucket[]) => [
                  {
                    label: "Blocked",
                    value: `${items.filter((b) => b.publicAccess === "Blocked").length}/${items.length}`,
                  },
                  { label: "Versioned", value: String(items.filter((b) => b.versioning === "Enabled").length) },
                  {
                    label: "Encrypted",
                    value: String(items.filter((b) => b.encryption !== "None" && b.encryption !== "Unknown").length),
                  },
                ]}
              />

              {/* RDS */}
              <ServiceCard
                label="RDS"
                fullName="Relational Database Service"
                href="/rds"
                awsIcon="rds"
                data={rdsData}
                getHealthyCount={(items) => items.filter((r: RdsInstance) => r.status === "available").length}
                healthyLabel="available"
                getStats={(items: RdsInstance[]) => [
                  { label: "Engines", value: String(new Set(items.map((r) => r.engine)).size) },
                  { label: "Multi-AZ", value: String(items.filter((r) => r.multiAz === "Yes").length) },
                  { label: "Regions", value: String(new Set(items.map((r) => r.region)).size) },
                ]}
              />

              {/* EKS - Not configured */}
              <Link
                href="/eks"
                className="group rounded-2xl border border-dashed border-line bg-surface/50 p-5 transition-all hover:border-accent/30 hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-raised">
                    <AwsIcon service="eks" className="h-5 w-5 opacity-50" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-muted">EKS</p>
                    <p className="text-[10px] text-ink-faint">Kubernetes Service</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-ink-faint">Not configured</p>
                <p className="mt-1 text-xs text-ink-faint">Connect to view clusters</p>
              </Link>

              {/* ALB - Not configured */}
              <Link
                href="/alb"
                className="group rounded-2xl border border-dashed border-line bg-surface/50 p-5 transition-all hover:border-accent/30 hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-raised">
                    <AwsIcon service="elb" className="h-5 w-5 opacity-50" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-muted">ALB/NLB</p>
                    <p className="text-[10px] text-ink-faint">Load Balancers</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-ink-faint">Not configured</p>
                <p className="mt-1 text-xs text-ink-faint">Connect to view load balancers</p>
              </Link>
            </div>
          </div>

          {/* Right Column - Health & Info */}
          <div className="space-y-6">
            {/* Infrastructure Health */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <PulseIcon className="h-4 w-4 text-ink-faint" />
                <h3 className="font-semibold text-ink">Infrastructure Health</h3>
              </div>

              <div className="mt-4 space-y-3">
                {healthItems.map((item) => (
                  <HealthCard key={item.label} {...item} />
                ))}
              </div>
            </div>

            {/* AWS Accounts */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <GlobeIcon className="h-4 w-4 text-ink-faint" />
                <h3 className="font-semibold text-ink">AWS Accounts</h3>
              </div>

              <div className="mt-4 space-y-2">
                {accountsLoading ? (
                  <>
                    <AccountCardSkeleton />
                    <AccountCardSkeleton />
                  </>
                ) : accounts.length > 0 ? (
                  <>
                    {accounts.slice(0, 4).map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between rounded-lg border border-line px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">{account.name}</p>
                          <p className="font-mono text-[10px] text-ink-faint">{account.id}</p>
                        </div>
                        <span className="flex h-2 w-2 rounded-full bg-ok" />
                      </div>
                    ))}
                    {accounts.length > 4 && (
                      <p className="pt-1 text-center text-[10px] text-ink-faint">
                        +{accounts.length - 4} more accounts
                      </p>
                    )}
                  </>
                ) : (
                  <p className="py-4 text-center text-sm text-ink-faint">
                    No accounts configured
                  </p>
                )}
              </div>
            </div>

            {/* Resources by Region */}
            {regionData.length > 0 && (
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-ink-faint" />
                  <h3 className="font-semibold text-ink">Resources by Region</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {regionData.slice(0, 5).map((item) => (
                    <div key={item.region}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{item.regionName}</span>
                          <span className="font-mono text-[10px] text-ink-faint">{item.region}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-ink-muted">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${(item.count / maxRegionCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {regionData.length > 5 && (
                    <p className="pt-1 text-center text-[10px] text-ink-faint">
                      +{regionData.length - 5} more regions
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2">
                <RefreshIcon className="h-4 w-4 text-ink-faint" />
                <h3 className="font-semibold text-ink">Quick Actions</h3>
              </div>

              <div className="mt-4 space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:bg-surface-raised"
                >
                  <ServerIcon className="h-4 w-4 text-ink-faint" />
                  <span className="text-sm font-medium text-ink">View EC2 Instances</span>
                  <ChevronRightIcon className="ml-auto h-4 w-4 text-ink-faint" />
                </Link>
                <Link
                  href="/s3"
                  className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:bg-surface-raised"
                >
                  <BucketIcon className="h-4 w-4 text-ink-faint" />
                  <span className="text-sm font-medium text-ink">View S3 Buckets</span>
                  <ChevronRightIcon className="ml-auto h-4 w-4 text-ink-faint" />
                </Link>
                <Link
                  href="/security"
                  className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:bg-surface-raised"
                >
                  <ShieldIcon className="h-4 w-4 text-ink-faint" />
                  <span className="text-sm font-medium text-ink">Security Center</span>
                  <ChevronRightIcon className="ml-auto h-4 w-4 text-ink-faint" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
