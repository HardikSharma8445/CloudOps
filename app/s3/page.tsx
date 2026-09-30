"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { type S3Bucket } from "@/data/s3Data";
import ServiceDashboard from "@/components/ServiceDashboard";
import StatusBadge from "@/components/StatusBadge";
import {
  ChipCell,
  CopyCell,
  EnvCell,
  NameCell,
  RegionCell,
  StackCell,
} from "@/components/cells";
import {
  BucketIcon,
  DriveIcon,
  GearIcon,
  ListIcon,
  MapPinIcon,
  RefreshIcon,
  ShieldIcon,
  StackIcon,
  TagIcon,
} from "@/components/Icons";
import { getS3Buckets, invalidateS3 } from "@/lib/dashboardApi";
import { nextRequestId } from "@/lib/dataCache";
import type { Column, DrawerContent, Stat, Tone } from "@/components/types";

const accessTone = (access: S3Bucket["publicAccess"]): Tone =>
  access === "Blocked" ? "ok" : "warn";

// Stable function references for ServiceDashboard
const getRowId = (row: S3Bucket) => row.id;
const getRowLabel = (row: S3Bucket) => row.name;
const getSearchFields = (row: S3Bucket) => [
  row.name,
  row.storageClass,
  row.encryption,
  row.region,
];

const toDrawer = (row: S3Bucket): DrawerContent => ({
  heading: row.name,
  status: {
    label: `Public access: ${row.publicAccess}`,
    tone: accessTone(row.publicAccess),
  },
  chips: [row.storageClass, row.regionName],
  sections: [
    {
      title: "Bucket",
      Icon: BucketIcon,
      fields: [
        { label: "Bucket Name", value: row.name, mono: true },
        { label: "ARN", value: `arn:aws:s3:::${row.name}`, mono: true },
      ],
    },
    {
      title: "Contents",
      Icon: DriveIcon,
      fields: [
        { label: "Objects", value: row.objectCount },
        { label: "Total Size", value: row.size },
        { label: "Storage Class", value: row.storageClass },
      ],
    },
    {
      title: "Protection",
      Icon: ShieldIcon,
      fields: [
        { label: "Public Access", value: row.publicAccess },
        { label: "Encryption", value: row.encryption },
        { label: "Versioning", value: row.versioning },
        { label: "Replication", value: row.replication },
      ],
    },
    {
      title: "Management",
      Icon: ListIcon,
      fields: [{ label: "Lifecycle Rules", value: row.lifecycleRules }],
    },
    {
      title: "Placement",
      Icon: MapPinIcon,
      fields: [{ label: "Region", value: `${row.region} (${row.regionName})` }],
    },
    {
      title: "Metadata",
      Icon: TagIcon,
      fields: [
        { label: "Environment", value: row.environment },
        { label: "Created", value: row.createdAt },
      ],
    },
  ],
});

const columns: Column<S3Bucket>[] = [
  {
    header: "Public Access",
    render: (row) => (
      <StatusBadge
        label={row.publicAccess}
        tone={accessTone(row.publicAccess)}
      />
    ),
  },
  {
    header: "Bucket Name",
    render: (row) => (
      <NameCell
        name={row.name}
        tone={accessTone(row.publicAccess)}
        avatarText={row.name.slice(0, 2).toUpperCase()}
      />
    ),
  },
  {
    header: "Region",
    render: (row) => (
      <RegionCell region={row.region} regionName={row.regionName} />
    ),
  },
  {
    header: "Versioning",
    render: (row) => <ChipCell value={row.versioning} />,
  },
  {
    header: "Encryption",
    render: (row) => <ChipCell value={row.encryption} />,
  },
  {
    header: "Created",
    render: (row) => (
      <span className="text-xs text-ink-muted">{row.createdAt}</span>
    ),
  },
];

export default function S3Page() {
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const latestRequest = useRef(0);

  const loadS3 = useCallback(async (forceRefresh = false) => {
    const requestId = nextRequestId();
    latestRequest.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const data = await getS3Buckets("all", forceRefresh);

      if (latestRequest.current !== requestId) return;

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch S3 buckets");
      }

      setBuckets(data.buckets);
      setLastUpdate(new Date());
    } catch (err: any) {
      if (latestRequest.current !== requestId) return;
      console.error("Error fetching S3 data:", err);
      setError(err.message);
    } finally {
      if (latestRequest.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadS3();
  }, [loadS3]);

  // Background refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadS3(true);
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadS3]);

  const total = buckets.length;
  const blocked = buckets.filter((b) => b.publicAccess === "Blocked").length;
  const versioned = buckets.filter((b) => b.versioning === "Enabled").length;
  const encrypted = buckets.filter(
    (b) => b.encryption !== "None" && b.encryption !== "Unknown"
  ).length;
  const safePct = (value: number, of: number) =>
    of === 0 ? 0 : Math.round((value / of) * 100);

  const stats: Stat[] = [
    {
      label: "Total Buckets",
      value: total,
      Icon: BucketIcon,
      tone: "info",
      fill: 100,
      note: `${new Set(buckets.map((b) => b.region)).size} regions`,
    },
    {
      label: "Public Access Blocked",
      value: blocked,
      Icon: ShieldIcon,
      tone: blocked === total && total > 0 ? "ok" : "warn",
      fill: safePct(blocked, total),
      note: `${safePct(blocked, total)}% fully blocked`,
    },
    {
      label: "Versioning Enabled",
      value: versioned,
      Icon: StackIcon,
      tone: "violet",
      fill: safePct(versioned, total),
      note: `${safePct(versioned, total)}% of buckets`,
    },
    {
      label: "Encrypted",
      value: encrypted,
      Icon: GearIcon,
      tone: "ok",
      fill: safePct(encrypted, total),
      note: `${total - encrypted} unencrypted`,
    },
  ];

  const isFirstLoad = loading && buckets.length === 0 && !error;

  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">S3 Dashboard</h1>
          {loading ? (
            <span className="text-xs text-ink-faint">Refreshing…</span>
          ) : (
            lastUpdate && (
              <span className="text-xs text-ink-faint">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )
          )}
        </div>
        <button
          onClick={() => {
            invalidateS3();
            loadS3(true);
          }}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/40 hover:bg-accent/10 disabled:opacity-50"
        >
          <RefreshIcon
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="border-b border-halt/30 bg-halt/10 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <BucketIcon className="h-4 w-4 shrink-0 text-halt" />
              <p className="text-[13px] text-ink">
                Could not load S3 buckets: {error}
              </p>
            </div>
            <button
              onClick={() => loadS3(true)}
              className="shrink-0 rounded-lg border border-accent bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {isFirstLoad && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
            <p className="mt-4 text-sm text-ink-muted">Loading S3 buckets...</p>
          </div>
        </div>
      )}

      {!isFirstLoad && (
        <ServiceDashboard
          pageTitle="S3 Dashboard"
          heading="Simple Storage Service"
          subtitle="Live S3 bucket inventory. Select a row to inspect bucket details."
          stats={stats}
          tableTitle="S3 Buckets"
          rows={buckets}
          columns={columns}
          getId={getRowId}
          rowLabel={getRowLabel}
          searchPlaceholder="Search buckets..."
          searchFields={getSearchFields}
          searchHint="Searchable by bucket name, storage class, encryption type, and region."
          drawerTitle="S3 Bucket Details"
          toDrawer={toDrawer}
        />
      )}
    </>
  );
}
