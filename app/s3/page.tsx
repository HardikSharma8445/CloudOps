"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { type S3Bucket } from "@/data/s3Data";
import Header from "@/components/Header";
import StatCards, { StatCardsSkeleton } from "@/components/StatCards";
import ResourceTable, { ResourceTableSkeleton } from "@/components/ResourceTable";
import DetailsDrawer from "@/components/DetailsDrawer";
import StatusBadge from "@/components/StatusBadge";
import { SearchIcon } from "@/components/Icons";
import { ChipCell, RegionCell, NameCell } from "@/components/cells";
import {
  BucketIcon,
  DriveIcon,
  GearIcon,
  ListIcon,
  MapPinIcon,
  ShieldIcon,
  StackIcon,
  TagIcon,
} from "@/components/Icons";
import {
  getAccounts,
  getS3Buckets,
  getAccountsAndS3,
  invalidateS3,
  type AwsAccountInfo,
} from "@/lib/dashboardApi";
import { nextRequestId } from "@/lib/dataCache";
import type { Column, DrawerContent, Stat, Tone } from "@/components/types";
import { useFilters } from "@/components/FilterContext";

const accessTone = (access: S3Bucket["publicAccess"]): Tone =>
  access === "Blocked" ? "ok" : access === "Partially blocked" ? "warn" : "neutral";

const columns: Column<S3Bucket>[] = [
  {
    header: "Access",
    render: (row) => (
      <StatusBadge
        label={row.publicAccess}
        tone={accessTone(row.publicAccess)}
        pulse={row.publicAccess === "Blocked"}
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
    render: (row) => <RegionCell region={row.region} regionName={row.regionName} />,
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
    render: (row) => <span className="text-xs text-ink-muted">{row.createdAt}</span>,
  },
];

const getRowId = (row: S3Bucket) => row.id;
const getRowLabel = (row: S3Bucket) => row.name;
const getSearchFields = (row: S3Bucket) => [
  row.name,
  row.storageClass,
  row.encryption,
  row.region,
  row.versioning,
  row.publicAccess,
  ...Object.keys(row.tags),
  ...Object.values(row.tags),
];

const toDrawer = (row: S3Bucket): DrawerContent => {
  const publicAccessDetails: string[] = [];
  if (row.publicAccessBlock) {
    if (row.publicAccessBlock.blockPublicAcls) publicAccessDetails.push("Block public ACLs");
    if (row.publicAccessBlock.ignorePublicAcls) publicAccessDetails.push("Ignore public ACLs");
    if (row.publicAccessBlock.blockPublicPolicy) publicAccessDetails.push("Block public policy");
    if (row.publicAccessBlock.restrictPublicBuckets) publicAccessDetails.push("Restrict public buckets");
  }
  const publicAccessDisplay = publicAccessDetails.length > 0 ? publicAccessDetails.join(", ") : "None configured";

  const tagDisplay = Object.entries(row.tags)
    .filter(([key]) => key !== "Environment")
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ") || "None";

  return {
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
          { label: "Created", value: row.createdAt },
        ],
      },
      {
        title: "Security",
        Icon: ShieldIcon,
        fields: [
          { label: "Public Access", value: row.publicAccess },
          { label: "Access Block Settings", value: publicAccessDisplay },
          { label: "Bucket Policy", value: row.bucketPolicy },
          { label: "Encryption", value: row.encryption },
        ],
      },
      {
        title: "Configuration",
        Icon: GearIcon,
        fields: [
          { label: "Versioning", value: row.versioning },
          { label: "Logging", value: row.loggingEnabled ? "Enabled" : "Disabled" },
          { label: "Storage Class", value: row.storageClass },
        ],
      },
      {
        title: "Contents",
        Icon: DriveIcon,
        fields: [
          { label: "Objects", value: row.objectCount },
          { label: "Total Size", value: row.size },
        ],
      },
      {
        title: "Management",
        Icon: ListIcon,
        fields: [
          { label: "Lifecycle Rules", value: row.lifecycleRules },
          { label: "Replication", value: row.replication },
        ],
      },
      {
        title: "Placement",
        Icon: MapPinIcon,
        fields: [{ label: "Region", value: `${row.region} (${row.regionName})` }],
      },
      {
        title: "Tags",
        Icon: TagIcon,
        fields: [
          { label: "Environment", value: row.environment },
          { label: "Other Tags", value: tagDisplay },
        ],
      },
    ],
  };
};

export default function S3Page() {
  // Use global filter context for account and region
  const { selectedAccountId, setSelectedAccountId, selectedRegion, setSelectedRegion } = useFilters();
  
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [accounts, setAccounts] = useState<AwsAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<S3Bucket | null>(null);

  const latestRequest = useRef(0);

  const loadS3 = useCallback(
    async (accountId: string | "all", forceRefresh = false) => {
      const requestId = nextRequestId();
      latestRequest.current = requestId;

      setLoading(true);
      setError(null);

      try {
        const data = await getS3Buckets(accountId, forceRefresh);

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
    },
    []
  );

  // Load accounts and S3 data in parallel on initial mount
  useEffect(() => {
    let active = true;

    // Use parallel loader for faster initial load
    getAccountsAndS3(selectedAccountId)
      .then(({ accounts, s3 }) => {
        if (!active) return;

        // Set accounts
        if (accounts.success && accounts.accounts) {
          setAccounts(accounts.accounts);
        }

        // Set S3 data
        if (s3.success) {
          setBuckets(s3.buckets);
          setLastUpdate(new Date());
        } else {
          setError(s3.message || "Failed to fetch S3 buckets");
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Error fetching initial data:", err);
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setAccountsLoading(false);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []); // Only run on mount

  // Reload only S3 data when account filter changes
  useEffect(() => {
    // Skip initial mount (already loaded above)
    if (accountsLoading) return;

    loadS3(selectedAccountId);
  }, [selectedAccountId, loadS3, accountsLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadS3(selectedAccountId, true);
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedAccountId, loadS3]);

  // Filter buckets by region first, then by search query
  const regionFilteredBuckets = useMemo(() => {
    if (selectedRegion === "all") return buckets;
    return buckets.filter((bucket) => bucket.region === selectedRegion);
  }, [buckets, selectedRegion]);

  const filteredBuckets = useMemo(() => {
    if (!searchQuery.trim()) return regionFilteredBuckets;
    const term = searchQuery.toLowerCase();
    return regionFilteredBuckets.filter((bucket) =>
      getSearchFields(bucket).some(
        (field) => field && String(field).toLowerCase().includes(term)
      )
    );
  }, [regionFilteredBuckets, searchQuery]);

  // Calculate region counts for the filter dropdown (before region filtering)
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const bucket of buckets) {
      counts[bucket.region] = (counts[bucket.region] || 0) + 1;
    }
    return counts;
  }, [buckets]);

  // Available regions (only show regions that have buckets)
  const availableRegions = useMemo(() => {
    return Object.keys(regionCounts);
  }, [regionCounts]);

  // Stats based on region-filtered buckets (but before search filter)
  const total = regionFilteredBuckets.length;
  const blocked = regionFilteredBuckets.filter((b) => b.publicAccess === "Blocked").length;
  const versioned = regionFilteredBuckets.filter((b) => b.versioning === "Enabled").length;
  const encrypted = regionFilteredBuckets.filter(
    (b) => b.encryption !== "None" && b.encryption !== "Unknown"
  ).length;
  const safePct = (value: number, of: number) =>
    of === 0 ? 0 : Math.round((value / of) * 100);

  const regionCount = new Set(regionFilteredBuckets.map((b) => b.region)).size;

  const stats: Stat[] = [
    {
      label: "Total Buckets",
      value: total,
      Icon: BucketIcon,
      tone: "info",
      fill: 100,
      note: selectedRegion === "all" 
        ? `${regionCount} region${regionCount !== 1 ? "s" : ""}` 
        : `In ${selectedRegion}`,
    },
    {
      label: "Access Blocked",
      value: blocked,
      Icon: ShieldIcon,
      tone: blocked === total && total > 0 ? "ok" : "warn",
      fill: safePct(blocked, total),
      note: `${safePct(blocked, total)}% fully secured`,
    },
    {
      label: "Versioning",
      value: versioned,
      Icon: StackIcon,
      tone: "violet",
      fill: safePct(versioned, total),
      note: `${safePct(versioned, total)}% enabled`,
    },
    {
      label: "Encrypted",
      value: encrypted,
      Icon: GearIcon,
      tone: "ok",
      fill: safePct(encrypted, total),
      note: total - encrypted > 0 ? `${total - encrypted} unencrypted` : "All encrypted",
    },
  ];

  const isFirstLoad = loading && buckets.length === 0 && !error;

  return (
    <>
      <Header
        title="S3 Buckets"
        subtitle="Object storage"
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        accountsLoading={accountsLoading}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        regionCounts={regionCounts}
        availableRegions={availableRegions}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, region, encryption, tags..."
        showRefresh
        onRefresh={() => {
          invalidateS3();
          loadS3(selectedAccountId, true);
        }}
        isRefreshing={loading}
        lastUpdated={lastUpdate}
      />

      {/* Error Banner */}
      {error && (
        <div className="border-b border-halt/20 bg-halt-soft px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BucketIcon className="h-5 w-5 shrink-0 text-halt" />
              <p className="text-sm text-ink">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
            <button
              onClick={() => loadS3(selectedAccountId, true)}
              className="btn-secondary h-8 px-3 text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">S3 Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">
            View and manage your S3 buckets and their security settings
          </p>
        </div>

        {/* Stats */}
        {isFirstLoad ? <StatCardsSkeleton count={4} /> : <StatCards stats={stats} />}

        {/* Table Section */}
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">Buckets</h2>
              <span className="rounded-full border border-line bg-surface-raised px-2.5 py-0.5 text-xs font-medium tabular-nums text-ink-muted">
                {filteredBuckets.length}
                {filteredBuckets.length !== regionFilteredBuckets.length && (
                  <span className="text-ink-faint"> of {regionFilteredBuckets.length}</span>
                )}
              </span>
            </div>

            {/* Mobile Search */}
            <div className="relative w-full sm:hidden">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buckets..."
                className="input pl-10"
              />
            </div>
          </div>

          {isFirstLoad ? (
            <ResourceTableSkeleton columns={6} rows={5} />
          ) : (
            <ResourceTable
              rows={filteredBuckets}
              columns={columns}
              getId={getRowId}
              rowLabel={getRowLabel}
              selectedId={selected ? getRowId(selected) : null}
              onSelect={setSelected}
              emptyMessage={
                searchQuery 
                  ? "No matching buckets" 
                  : selectedRegion !== "all" 
                  ? "No buckets in this region" 
                  : "No S3 buckets found"
              }
              emptySubtitle={
                searchQuery
                  ? "Try adjusting your search terms"
                  : selectedRegion !== "all"
                  ? "Try selecting a different region"
                  : "Buckets will appear here once available"
              }
            />
          )}

          <p className="mt-3 text-xs text-ink-faint">
            Click on a row to view bucket details. Search by name, region, encryption, or
            tags.
          </p>
        </section>
      </div>

      <DetailsDrawer
        title="S3 Bucket Details"
        content={selected ? toDrawer(selected) : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
