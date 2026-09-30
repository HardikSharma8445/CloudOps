"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import StatCards from "@/components/StatCards";
import AwsIcon from "@/components/AwsIcon";
import {
  BalancerIcon,
  BucketIcon,
  ChevronRightIcon,
  CubeIcon,
  DatabaseIcon,
  GlobeIcon,
  MapPinIcon,
  PulseIcon,
  ServerIcon,
  StackIcon,
  TagIcon,
} from "@/components/Icons";
import {
  badgeTone,
  barTone,
  envTone,
  tileTone,
  type Stat,
  type Tone,
} from "@/components/types";
import { getEc2Instances, getS3Buckets } from "@/lib/dashboardApi";
import type { Ec2Instance } from "@/data/ec2Data";
import type { S3Bucket } from "@/data/s3Data";

export default function OverviewPage() {
  const [ec2Instances, setEc2Instances] = useState<Ec2Instance[]>([]);
  const [s3Buckets, setS3Buckets] = useState<S3Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchData = async (force = false) => {
      try {
        // Fetch EC2 and S3 in parallel
        const [ec2Data, s3Data] = await Promise.all([
          getEc2Instances("all", force),
          getS3Buckets("all", force),
        ]);

        if (!active) return;

        if (ec2Data.success) {
          setEc2Instances(ec2Data.instances || []);
        }
        if (s3Data.success) {
          setS3Buckets(s3Data.buckets || []);
        }
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchData(true);
    }, 2 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Empty arrays for services not yet implemented with live data
  const rdsInstances: any[] = [];
  const eksClusters: any[] = [];
  const loadBalancers: any[] = [];

  const ec2Running = ec2Instances.filter((i) => i.status === "running").length;
  const rdsAvailable = rdsInstances.filter((r) => r.status === "available").length;
  const eksActive = eksClusters.filter((c) => c.status === "active").length;
  const albActive = loadBalancers.filter((lb) => lb.status === "active").length;
  const s3Blocked = s3Buckets.filter((b) => b.publicAccess === "Blocked").length;

const totalResources =
  ec2Instances.length +
  rdsInstances.length +
  eksClusters.length +
  loadBalancers.length +
  s3Buckets.length;

const healthyResources =
  ec2Running + rdsAvailable + eksActive + albActive + s3Blocked;

const allRegions = new Set([
  ...ec2Instances.map((i) => i.region),
  ...rdsInstances.map((r) => r.region),
  ...eksClusters.map((c) => c.region),
  ...loadBalancers.map((lb) => lb.region),
  ...s3Buckets.map((b) => b.region),
]);

const allEnvironments = [
  ...new Set([
    ...ec2Instances.map((i) => i.environment),
    ...rdsInstances.map((r) => r.environment),
    ...eksClusters.map((c) => c.environment),
    ...loadBalancers.map((lb) => lb.environment),
    ...s3Buckets.map((b) => b.environment),
  ]),
];

const envCounts = allEnvironments
  .map((env) => ({
    env,
    count: [
      ...ec2Instances,
      ...rdsInstances,
      ...eksClusters,
      ...loadBalancers,
      ...s3Buckets,
    ].filter((r) => r.environment === env).length,
  }))
  .sort((a, b) => b.count - a.count);

// Guard every ratio below: with no resources yet these were 0/0 -> NaN, which
// React renders as a broken/invalid bar width.
const safePct = (value: number, of: number) =>
  of === 0 ? 0 : Math.round((value / of) * 100);

const healthPct = safePct(healthyResources, totalResources);

const stats: Stat[] = [
  {
    label: "Total Resources",
    value: totalResources,
    Icon: StackIcon,
    tone: "info",
    fill: 100,
    note: "Across 5 services",
  },
  {
    label: "Healthy",
    value: healthyResources,
    Icon: PulseIcon,
    tone: "ok",
    fill: healthPct,
    note: `${healthPct}% in a good state`,
  },
  {
    label: "Regions",
    value: allRegions.size,
    Icon: MapPinIcon,
    tone: "violet",
    fill: 100,
    note: [...allRegions].join(", "),
  },
  {
    label: "Environments",
    value: allEnvironments.length,
    Icon: TagIcon,
    tone: "warn",
    fill: 100,
    note: allEnvironments.join(", "),
  },
];

type ServiceCard = {
  label: string;
  fullName: string;
  href: string;
  awsIcon?: "ec2" | "rds" | "eks" | "elb" | "s3";
  Icon?: (props: { className?: string }) => React.ReactNode;
  count: number;
  tone: Tone;
  healthy: number;
  healthyLabel: string;
  lines: { label: string; value: string }[];
};

const services: ServiceCard[] = [
  {
    label: "EC2",
    fullName: "Elastic Compute Cloud",
    href: "/",
    awsIcon: "ec2",
    count: ec2Instances.length,
    tone: "info",
    healthy: ec2Running,
    healthyLabel: "running",
    lines: [
      { label: "Running", value: String(ec2Running) },
      { label: "Stopped", value: String(ec2Instances.length - ec2Running) },
      {
        label: "Types",
        value: String(new Set(ec2Instances.map((i) => i.instanceType)).size),
      },
    ],
  },
  {
    label: "RDS",
    fullName: "Relational Database Service",
    href: "/rds",
    awsIcon: "rds",
    count: rdsInstances.length,
    tone: "violet",
    healthy: rdsAvailable,
    healthyLabel: "available",
    lines: [
      { label: "Available", value: String(rdsAvailable) },
      {
        label: "Multi-AZ",
        value: String(rdsInstances.filter((r) => r.multiAz === "Yes").length),
      },
      {
        label: "Engines",
        value: String(new Set(rdsInstances.map((r) => r.engine)).size),
      },
    ],
  },
  {
    label: "EKS",
    fullName: "Elastic Kubernetes Service",
    href: "/eks",
    awsIcon: "eks",
    count: eksClusters.length,
    tone: "ok",
    healthy: eksActive,
    healthyLabel: "active",
    lines: [
      { label: "Active", value: String(eksActive) },
      {
        label: "Worker nodes",
        value: String(eksClusters.reduce((s, c) => s + c.nodeCount, 0)),
      },
      {
        label: "Node groups",
        value: String(eksClusters.reduce((s, c) => s + c.nodeGroups, 0)),
      },
    ],
  },
  {
    label: "ALB",
    fullName: "Elastic Load Balancing",
    href: "/alb",
    awsIcon: "elb",
    count: loadBalancers.length,
    tone: "warn",
    healthy: albActive,
    healthyLabel: "active",
    lines: [
      { label: "Active", value: String(albActive) },
      {
        label: "Healthy targets",
        value: `${loadBalancers.reduce(
          (s, lb) => s + lb.healthyTargets,
          0
        )}/${loadBalancers.reduce((s, lb) => s + lb.totalTargets, 0)}`,
      },
      {
        label: "Internet-facing",
        value: String(
          loadBalancers.filter((lb) => lb.scheme === "internet-facing").length
        ),
      },
    ],
  },
  {
    label: "S3",
    fullName: "Simple Storage Service",
    href: "/s3",
    awsIcon: "s3",
    count: s3Buckets.length,
    tone: "info",
    healthy: s3Blocked,
    healthyLabel: "access blocked",
    lines: [
      { label: "Public access blocked", value: `${s3Blocked}/${s3Buckets.length}` },
      {
        label: "Versioned",
        value: String(s3Buckets.filter((b) => b.versioning === "Enabled").length),
      },
      {
        label: "KMS encrypted",
        value: String(s3Buckets.filter((b) => b.encryption === "SSE-KMS").length),
      },
    ],
  },
];

  if (loading) {
    return (
      <>
        <Header title="Overview" />
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-ink-muted">Loading overview data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Overview" />

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-7">
          <h2 className="text-[26px] font-semibold tracking-tight">
            Infrastructure Overview
          </h2>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">
            Live AWS infrastructure overview. Pick a service to drill into its resources.
          </p>
        </div>

        <StatCards stats={stats} />

        <section className="mt-8">
          <h3 className="mb-4 text-[17px] font-semibold tracking-tight">
            Services
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => (
              <Link
                key={service.label}
                href={service.href}
                className="rise-enter group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:scale-[1.02] hover:border-accent/40 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${
                        tileTone[service.tone]
                      }`}
                    >
                      {service.awsIcon ? (
                        <AwsIcon service={service.awsIcon} className="h-6 w-6" />
                      ) : service.Icon ? (
                        <service.Icon className="h-5 w-5" />
                      ) : null}
                    </span>
                    <div className="leading-tight">
                      <p className="text-[15px] font-semibold tracking-tight">
                        {service.label}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {service.fullName}
                      </p>
                    </div>
                  </div>

                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent" />
                </div>

                <div className="mt-5 flex items-end justify-between gap-3">
                  <p className="text-[32px] font-semibold leading-none tracking-tight tabular-nums">
                    {service.count}
                  </p>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      badgeTone[
                        service.healthy === service.count ? "ok" : "warn"
                      ]
                    }`}
                  >
                    {service.healthy} {service.healthyLabel}
                  </span>
                </div>

                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      barTone[service.healthy === service.count ? "ok" : "warn"]
                    }`}
                    style={{
                      width: `${safePct(service.healthy, service.count)}%`,
                    }}
                  />
                </div>

                <dl className="mt-4 flex flex-col gap-1.5 border-t border-line-soft pt-4">
                  {service.lines.map((line) => (
                    <div
                      key={line.label}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <dt className="text-ink-muted">{line.label}</dt>
                      <dd className="font-semibold tabular-nums text-ink">
                        {line.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rise-enter rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:shadow-lg"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-ink-faint" />
              <h3 className="text-[14px] font-semibold tracking-tight">
                Resources by environment
              </h3>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {envCounts.map(({ env, count }) => (
                <div key={env}>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                        badgeTone[envTone[env] ?? "neutral"]
                      }`}
                    >
                      {env}
                    </span>
                    <span className="font-semibold tabular-nums text-ink-muted">
                      {count} of {totalResources}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        barTone[envTone[env] ?? "neutral"]
                      }`}
                      style={{
                        width: `${safePct(count, totalResources)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rise-enter rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:shadow-lg"
            style={{ animationDelay: "240ms" }}
          >
            <div className="flex items-center gap-2">
              <GlobeIcon className="h-4 w-4 text-ink-faint" />
              <h3 className="text-[14px] font-semibold tracking-tight">
                Regions in use
              </h3>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {[...allRegions].map((region) => {
                const label =
                  [
                    ...ec2Instances,
                    ...rdsInstances,
                    ...eksClusters,
                    ...loadBalancers,
                    ...s3Buckets,
                  ].find((r) => r.region === region)?.regionName ?? region;

                const count = [
                  ...ec2Instances,
                  ...rdsInstances,
                  ...eksClusters,
                  ...loadBalancers,
                  ...s3Buckets,
                ].filter((r) => r.region === region).length;

                return (
                  <div
                    key={region}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface-raised px-4 py-3 transition-all duration-200 hover:scale-[1.01] hover:border-accent/30 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                        <MapPinIcon className="h-4 w-4" />
                      </span>
                      <div className="leading-tight">
                        <p className="text-[13px] font-semibold">{label}</p>
                        <p className="font-mono text-[10.5px] text-ink-faint">
                          {region}
                        </p>
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold tabular-nums text-ink-muted">
                      {count} resources
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
              Showing live data from your AWS accounts. EC2 data is real-time,
              other services coming soon.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
