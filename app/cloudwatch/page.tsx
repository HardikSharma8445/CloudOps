"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import {
  HeartbeatIcon,
  ServerIcon,
  BucketIcon,
  DatabaseIcon,
  CubeIcon,
  BalancerIcon,
  PulseIcon,
  ClockIcon,
  ChevronRightIcon,
} from "@/components/Icons";
import { getEc2Instances, getS3Buckets, getAccounts, type AwsAccountInfo } from "@/lib/dashboardApi";
import { dotTone, type Tone } from "@/components/types";
import type { Ec2Instance } from "@/data/ec2Data";
import type { S3Bucket } from "@/data/s3Data";

type ServiceHealth = {
  name: string;
  icon: "ec2" | "s3" | "rds" | "eks" | "elb";
  status: "healthy" | "warning" | "critical" | "unknown";
  healthy: number;
  total: number;
  lastChecked: Date | null;
};

const statusTone: Record<string, Tone> = {
  healthy: "ok",
  warning: "warn",
  critical: "halt",
  unknown: "neutral",
};

const statusLabel: Record<string, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
  unknown: "Unknown",
};

export default function CloudWatchPage() {
  const [ec2Instances, setEc2Instances] = useState<Ec2Instance[]>([]);
  const [s3Buckets, setS3Buckets] = useState<S3Bucket[]>([]);
  const [accounts, setAccounts] = useState<AwsAccountInfo[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | "all">("all");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (accountId: string | "all", force = false) => {
    try {
      const [ec2Data, s3Data] = await Promise.all([
        getEc2Instances(accountId, force),
        getS3Buckets(accountId, force),
      ]);

      if (ec2Data.success) setEc2Instances(ec2Data.instances || []);
      if (s3Data.success) setS3Buckets(s3Data.buckets || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getAccounts()
      .then((data) => {
        if (data.success && data.accounts) setAccounts(data.accounts);
      })
      .catch(console.error);

    fetchData(selectedAccountId);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData(selectedAccountId, true);
      }
    }, 60 * 1000); // Refresh every minute for monitoring

    return () => clearInterval(interval);
  }, [selectedAccountId, fetchData]);

  // Calculate service health
  const ec2Running = ec2Instances.filter((i) => i.status === "running").length;
  const s3Secured = s3Buckets.filter((b) => b.publicAccess === "Blocked").length;

  const getEc2Status = (): "healthy" | "warning" | "critical" | "unknown" => {
    if (ec2Instances.length === 0) return "unknown";
    const runningPct = (ec2Running / ec2Instances.length) * 100;
    if (runningPct >= 80) return "healthy";
    if (runningPct >= 50) return "warning";
    return "critical";
  };

  const getS3Status = (): "healthy" | "warning" | "critical" | "unknown" => {
    if (s3Buckets.length === 0) return "unknown";
    const securedPct = (s3Secured / s3Buckets.length) * 100;
    if (securedPct === 100) return "healthy";
    if (securedPct >= 80) return "warning";
    return "critical";
  };

  const services: ServiceHealth[] = [
    {
      name: "EC2 Instances",
      icon: "ec2",
      status: getEc2Status(),
      healthy: ec2Running,
      total: ec2Instances.length,
      lastChecked: lastUpdated,
    },
    {
      name: "S3 Buckets",
      icon: "s3",
      status: getS3Status(),
      healthy: s3Secured,
      total: s3Buckets.length,
      lastChecked: lastUpdated,
    },
    {
      name: "RDS Databases",
      icon: "rds",
      status: "unknown",
      healthy: 0,
      total: 0,
      lastChecked: null,
    },
    {
      name: "EKS Clusters",
      icon: "eks",
      status: "unknown",
      healthy: 0,
      total: 0,
      lastChecked: null,
    },
    {
      name: "Load Balancers",
      icon: "elb",
      status: "unknown",
      healthy: 0,
      total: 0,
      lastChecked: null,
    },
  ];

  const overallHealth = services.some((s) => s.status === "critical")
    ? "critical"
    : services.some((s) => s.status === "warning")
    ? "warning"
    : services.every((s) => s.status === "unknown")
    ? "unknown"
    : "healthy";

  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
    ec2: ServerIcon,
    s3: BucketIcon,
    rds: DatabaseIcon,
    eks: CubeIcon,
    elb: BalancerIcon,
  };

  return (
    <>
      <Header
        title="CloudWatch"
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        showRefresh
        onRefresh={() => fetchData(selectedAccountId, true)}
        isRefreshing={loading}
        lastUpdated={lastUpdated}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            CloudWatch Monitoring
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Monitor the health and status of your AWS infrastructure
          </p>
        </div>

        {/* Overall Health Card */}
        <div className="rise-enter mb-6 rounded-2xl border border-line bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                  overallHealth === "healthy"
                    ? "border-ok/20 bg-ok-soft"
                    : overallHealth === "warning"
                    ? "border-warn/20 bg-warn-soft"
                    : overallHealth === "critical"
                    ? "border-halt/20 bg-halt-soft"
                    : "border-line bg-surface-raised"
                }`}
              >
                <HeartbeatIcon
                  className={`h-7 w-7 ${
                    overallHealth === "healthy"
                      ? "text-ok"
                      : overallHealth === "warning"
                      ? "text-warn"
                      : overallHealth === "critical"
                      ? "text-halt"
                      : "text-ink-faint"
                  }`}
                />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">Overall System Health</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {overallHealth === "healthy"
                    ? "All systems operational"
                    : overallHealth === "warning"
                    ? "Some services need attention"
                    : overallHealth === "critical"
                    ? "Critical issues detected"
                    : "Checking service status..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${dotTone[statusTone[overallHealth]]}`} />
              <span className="text-sm font-semibold text-ink">
                {statusLabel[overallHealth]}
              </span>
            </div>
          </div>
        </div>

        {/* Service Health Grid */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">Service Health</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const IconComponent = iconComponents[service.icon];
              return (
                <div
                  key={service.name}
                  className="rise-enter rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-200 hover:border-accent/20 hover:shadow-lg"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                          service.status === "healthy"
                            ? "border-ok/20 bg-ok-soft text-ok"
                            : service.status === "warning"
                            ? "border-warn/20 bg-warn-soft text-warn"
                            : service.status === "critical"
                            ? "border-halt/20 bg-halt-soft text-halt"
                            : "border-line bg-surface-raised text-ink-faint"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{service.name}</p>
                        <p className="text-xs text-ink-faint">
                          {service.total > 0
                            ? `${service.healthy} of ${service.total} healthy`
                            : "No resources"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${dotTone[statusTone[service.status]]}`} />
                      <span className="text-xs font-medium text-ink-muted">
                        {statusLabel[service.status]}
                      </span>
                    </div>
                  </div>

                  {service.total > 0 && (
                    <div className="mt-4">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            service.status === "healthy"
                              ? "bg-ok"
                              : service.status === "warning"
                              ? "bg-warn"
                              : "bg-halt"
                          }`}
                          style={{
                            width: `${Math.round((service.healthy / service.total) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[10px] text-ink-faint">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      Last checked: {formatTime(service.lastChecked)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity (placeholder) */}
        <div className="rise-enter rounded-2xl border border-line bg-surface p-6 shadow-card" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">Recent Activity</h3>
            <span className="text-xs text-ink-faint">Last 24 hours</span>
          </div>

          <div className="mt-4 space-y-3">
            {ec2Instances.length > 0 || s3Buckets.length > 0 ? (
              <>
                {ec2Running > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-line-soft bg-surface-raised/50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ok-soft text-ok">
                        <PulseIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">EC2 Instances Running</p>
                        <p className="text-xs text-ink-faint">{ec2Running} instances are currently active</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
                  </div>
                )}
                {s3Secured < s3Buckets.length && s3Buckets.length > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-warn/20 bg-warn-soft/50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warn-soft text-warn">
                        <BucketIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">S3 Security Review</p>
                        <p className="text-xs text-ink-faint">
                          {s3Buckets.length - s3Secured} buckets need access review
                        </p>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center">
                <HeartbeatIcon className="mx-auto h-10 w-10 text-ink-faint" />
                <p className="mt-3 text-sm text-ink-muted">No recent activity</p>
                <p className="text-xs text-ink-faint">Activity will appear here as events occur</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
