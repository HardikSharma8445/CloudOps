"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { type RdsInstance } from "@/data/rdsData";
import Header from "@/components/Header";
import StatCards, { StatCardsSkeleton } from "@/components/StatCards";
import ResourceTable, { ResourceTableSkeleton } from "@/components/ResourceTable";
import DetailsDrawer from "@/components/DetailsDrawer";
import StatusBadge from "@/components/StatusBadge";
import { SearchIcon } from "@/components/Icons";
import {
  ChipCell,
  CopyCell,
  EnvCell,
  NameCell,
  RegionCell,
  StackCell,
} from "@/components/cells";
import {
  DatabaseIcon,
  DriveIcon,
  GlobeIcon,
  MapPinIcon,
  PowerOffIcon,
  PulseIcon,
  ShieldIcon,
  TagIcon,
} from "@/components/Icons";
import {
  getAccounts,
  getRdsInstances,
  getAccountsAndRds,
  invalidateRds,
  type AwsAccountInfo,
} from "@/lib/dashboardApi";
import { nextRequestId } from "@/lib/dataCache";
import type { Column, DrawerContent, Stat, Tone } from "@/components/types";
import { useFilters } from "@/components/FilterContext";

const statusTone = (status: RdsInstance["status"]): Tone =>
  status === "available" ? "ok" : status === "modifying" ? "warn" : "halt";

const columns: Column<RdsInstance>[] = [
  {
    header: "Status",
    render: (row) => (
      <StatusBadge
        label={row.status}
        tone={statusTone(row.status)}
        pulse={row.status === "available"}
      />
    ),
  },
  {
    header: "DB Identifier",
    render: (row) => <NameCell name={row.name} tone={statusTone(row.status)} />,
  },
  {
    header: "Engine",
    render: (row) => (
      <StackCell primary={row.engine} secondary={`v${row.engineVersion}`} />
    ),
  },
  { header: "Class", render: (row) => <ChipCell value={row.instanceClass} /> },
  {
    header: "Region",
    render: (row) => (
      <RegionCell region={row.region} regionName={row.regionName} />
    ),
  },
  {
    header: "Endpoint",
    render: (row) => (
      <CopyCell value={row.endpoint} label="endpoint" truncate={18} />
    ),
  },
  { header: "Environment", render: (row) => <EnvCell value={row.environment} /> },
];

const getRowId = (row: RdsInstance) => row.id;
const getRowLabel = (row: RdsInstance) => row.name;
const getSearchFields = (row: RdsInstance) => [row.name, row.id, row.engine, row.endpoint];

const toDrawer = (row: RdsInstance): DrawerContent => ({
  heading: row.name,
  status: {
    label: row.status,
    tone: statusTone(row.status),
    pulse: row.status === "available",
  },
  chips: [`${row.engine} ${row.engineVersion}`, row.instanceClass, row.regionName],
  sections: [
    {
      title: "Identity",
      Icon: DatabaseIcon,
      fields: [
        { label: "DB Instance ID", value: row.id, mono: true },
        { label: "Engine", value: `${row.engine} ${row.engineVersion}` },
        { label: "Instance Class", value: row.instanceClass },
      ],
    },
    {
      title: "Placement",
      Icon: MapPinIcon,
      fields: [
        { label: "Region", value: `${row.region} (${row.regionName})` },
        { label: "Availability Zone", value: row.availabilityZone, mono: true },
        { label: "Multi-AZ", value: row.multiAz },
      ],
    },
    {
      title: "Connectivity",
      Icon: GlobeIcon,
      fields: [
        { label: "Endpoint", value: row.endpoint, mono: true },
        { label: "Port", value: String(row.port), mono: true },
        { label: "VPC", value: row.vpcId, mono: true },
        { label: "Subnet Group", value: row.subnetGroup, mono: true },
      ],
    },
    {
      title: "Storage & Backup",
      Icon: DriveIcon,
      fields: [
        { label: "Allocated Storage", value: row.storage },
        { label: "Storage Type", value: row.storageType },
        { label: "Backup Retention", value: row.backupRetention },
      ],
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

export default function RdsPage() {
  // Use global filter context for account and region
  const { selectedAccountId, setSelectedAccountId, selectedRegion, setSelectedRegion } = useFilters();

  const [instances, setInstances] = useState<RdsInstance[]>([]);
  const [accounts, setAccounts] = useState<AwsAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<RdsInstance | null>(null);

  const latestRequest = useRef(0);

  const loadRds = useCallback(
    async (accountId: string | "all", forceRefresh = false) => {
      const requestId = nextRequestId();
      latestRequest.current = requestId;

      setLoading(true);
      setError(null);

      try {
        const data = await getRdsInstances(accountId, forceRefresh);

        if (latestRequest.current !== requestId) return;

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch RDS instances");
        }

        setInstances(data.instances);
        setLastUpdate(new Date());
      } catch (err: any) {
        if (latestRequest.current !== requestId) return;
        console.error("Error fetching RDS data:", err);
        setError(err.message);
      } finally {
        if (latestRequest.current === requestId) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Load accounts and RDS data in parallel on initial mount
  useEffect(() => {
    let active = true;

    // Use parallel loader for faster initial load
    getAccountsAndRds(selectedAccountId)
      .then(({ accounts, rds }) => {
        if (!active) return;

        // Set accounts
        if (accounts.success && accounts.accounts) {
          setAccounts(accounts.accounts);
        }

        // Set RDS data
        if (rds.success) {
          setInstances(rds.instances);
          setLastUpdate(new Date());
        } else {
          setError(rds.message || "Failed to fetch RDS instances");
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

  // Reload only RDS data when account filter changes
  useEffect(() => {
    // Skip initial mount (already loaded above)
    if (accountsLoading) return;

    loadRds(selectedAccountId);
  }, [selectedAccountId, loadRds, accountsLoading]);

  // Auto-refresh every 2 minutes when visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadRds(selectedAccountId, true);
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedAccountId, loadRds]);

  // Filter instances by region first, then by search query
  const regionFilteredInstances = useMemo(() => {
    if (selectedRegion === "all") return instances;
    return instances.filter((instance) => instance.region === selectedRegion);
  }, [instances, selectedRegion]);

  const filteredInstances = useMemo(() => {
    if (!searchQuery.trim()) return regionFilteredInstances;
    const term = searchQuery.toLowerCase();
    return regionFilteredInstances.filter((instance) =>
      getSearchFields(instance).some(
        (field) => field && String(field).toLowerCase().includes(term)
      )
    );
  }, [regionFilteredInstances, searchQuery]);

  // Calculate region counts for the filter dropdown (before region filtering)
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const instance of instances) {
      counts[instance.region] = (counts[instance.region] || 0) + 1;
    }
    return counts;
  }, [instances]);

  // Available regions (only show regions that have instances)
  const availableRegions = useMemo(() => {
    return Object.keys(regionCounts);
  }, [regionCounts]);

  // Stats based on region-filtered instances (but before search filter)
  const total = regionFilteredInstances.length;
  const available = regionFilteredInstances.filter((r) => r.status === "available").length;
  const stopped = regionFilteredInstances.filter((r) => r.status === "stopped").length;
  const multiAz = regionFilteredInstances.filter((r) => r.multiAz === "Yes").length;
  const pct = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

  const stats: Stat[] = [
    {
      label: "Total Databases",
      value: total,
      Icon: DatabaseIcon,
      tone: "info",
      fill: 100,
      note: selectedRegion === "all"
        ? `${new Set(regionFilteredInstances.map((r) => r.engine)).size} engine types`
        : `In ${selectedRegion}`,
    },
    {
      label: "Available",
      value: available,
      Icon: PulseIcon,
      tone: "ok",
      fill: pct(available),
      note: `${pct(available)}% of databases`,
    },
    {
      label: "Stopped",
      value: stopped,
      Icon: PowerOffIcon,
      tone: "halt",
      fill: pct(stopped),
      note: `${pct(stopped)}% of databases`,
    },
    {
      label: "Multi-AZ",
      value: multiAz,
      Icon: ShieldIcon,
      tone: "violet",
      fill: pct(multiAz),
      note: `${pct(multiAz)}% highly available`,
    },
  ];

  const isFirstLoad = loading && instances.length === 0 && !error;

  return (
    <>
      <Header
        title="RDS Instances"
        subtitle="Relational databases"
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
        searchPlaceholder="Search databases by name, ID, engine..."
        showRefresh
        onRefresh={() => {
          invalidateRds();
          loadRds(selectedAccountId, true);
        }}
        isRefreshing={loading}
        lastUpdated={lastUpdate}
      />

      {/* Error Banner */}
      {error && (
        <div className="border-b border-halt/20 bg-halt-soft px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DatabaseIcon className="h-5 w-5 shrink-0 text-halt" />
              <p className="text-sm text-ink">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
            <button
              onClick={() => loadRds(selectedAccountId, true)}
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
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            RDS Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            View and manage your relational database instances
          </p>
        </div>

        {/* Stats */}
        {isFirstLoad ? <StatCardsSkeleton count={4} /> : <StatCards stats={stats} />}

        {/* Table Section */}
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">Databases</h2>
              <span className="rounded-full border border-line bg-surface-raised px-2.5 py-0.5 text-xs font-medium tabular-nums text-ink-muted">
                {filteredInstances.length}
                {filteredInstances.length !== regionFilteredInstances.length && (
                  <span className="text-ink-faint"> of {regionFilteredInstances.length}</span>
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
                placeholder="Search databases..."
                className="input pl-10"
              />
            </div>
          </div>

          {isFirstLoad ? (
            <ResourceTableSkeleton columns={7} rows={5} />
          ) : (
            <ResourceTable
              rows={filteredInstances}
              columns={columns}
              getId={getRowId}
              rowLabel={getRowLabel}
              selectedId={selected ? getRowId(selected) : null}
              onSelect={setSelected}
              emptyMessage={
                searchQuery
                  ? "No matching databases"
                  : selectedRegion !== "all"
                  ? "No databases in this region"
                  : "No RDS instances found"
              }
              emptySubtitle={
                searchQuery
                  ? "Try adjusting your search terms"
                  : selectedRegion !== "all"
                  ? "Try selecting a different region"
                  : "Databases will appear here once available"
              }
            />
          )}

          <p className="mt-3 text-xs text-ink-faint">
            Click on a row to view database details. Search by identifier, resource ID, engine, or endpoint.
          </p>
        </section>
      </div>

      <DetailsDrawer
        title="RDS Instance Details"
        content={selected ? toDrawer(selected) : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
