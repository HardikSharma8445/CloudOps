"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { type Ec2Instance } from "@/data/ec2Data";
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
} from "@/components/cells";
import {
  MapPinIcon,
  NetworkIcon,
  PowerOffIcon,
  PulseIcon,
  ServerIcon,
  StackIcon,
  TagIcon,
  ShieldIcon,
  DriveIcon,
  GearIcon,
} from "@/components/Icons";
import {
  getAccounts,
  getEc2Instances,
  getAccountsAndEc2,
  invalidateEc2,
  type AwsAccountInfo,
} from "@/lib/dashboardApi";
import { nextRequestId } from "@/lib/dataCache";
import type { Column, DrawerContent, Stat } from "@/components/types";
import { useFilters } from "@/components/FilterContext";

const statusTone = (status: Ec2Instance["status"]) =>
  status === "running" ? ("ok" as const) : ("halt" as const);

const columns: Column<Ec2Instance>[] = [
  {
    header: "Status",
    render: (row) => (
      <StatusBadge
        label={row.status}
        tone={statusTone(row.status)}
        pulse={row.status === "running"}
      />
    ),
  },
  {
    header: "Name",
    render: (row) => <NameCell name={row.name} tone={statusTone(row.status)} />,
  },
  {
    header: "Instance ID",
    render: (row) => <CopyCell value={row.id} label="instance ID" />,
  },
  {
    header: "Type",
    render: (row) => <ChipCell value={row.instanceType} />,
  },
  {
    header: "Region",
    render: (row) => <RegionCell region={row.region} regionName={row.regionName} />,
  },
  {
    header: "Private IP",
    render: (row) => <CopyCell value={row.privateIp} label="private IP" />,
  },
  {
    header: "Environment",
    render: (row) => <EnvCell value={row.environment} />,
  },
];

const getRowId = (row: Ec2Instance) => row.id;
const getRowLabel = (row: Ec2Instance) => row.name;
const getSearchFields = (row: Ec2Instance) => [
  row.name,
  row.id,
  row.privateIp,
  row.instanceType,
  row.publicIp,
  row.amiId,
  row.iamRole,
  ...row.securityGroups.map((sg) => sg.name),
  ...row.securityGroups.map((sg) => sg.id),
  ...Object.values(row.tags),
];

const toDrawer = (row: Ec2Instance): DrawerContent => {
  // Format security groups for display
  const sgDisplay =
    row.securityGroups.length > 0
      ? row.securityGroups.map((sg) => `${sg.name} (${sg.id})`).join(", ")
      : "None";

  // Format EBS volumes for display
  const volumeCount = row.ebsVolumes.length;
  const volumeDisplay =
    volumeCount > 0
      ? `${volumeCount} volume${volumeCount > 1 ? "s" : ""} attached`
      : "No volumes";

  // Format tags for display (exclude Name and Environment which are shown elsewhere)
  const otherTags = Object.entries(row.tags)
    .filter(([key]) => key !== "Name" && key !== "Environment")
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ") || "None";

  return {
    heading: row.name,
    status: {
      label: row.status,
      tone: statusTone(row.status),
      pulse: row.status === "running",
    },
    chips: [row.instanceType, row.regionName, row.platform],
    sections: [
      {
        title: "Instance",
        Icon: ServerIcon,
        fields: [
          { label: "Instance ID", value: row.id, mono: true },
          { label: "Instance Type", value: row.instanceType },
          { label: "AMI ID", value: row.amiId, mono: true },
          { label: "Platform", value: row.platform },
          { label: "Architecture", value: row.architecture },
          ...(row.coreCount ? [{ label: "CPU Cores", value: String(row.coreCount) }] : []),
        ],
      },
      {
        title: "Placement",
        Icon: MapPinIcon,
        fields: [
          { label: "Region", value: `${row.region} (${row.regionName})` },
          { label: "Availability Zone", value: row.availabilityZone, mono: true },
        ],
      },
      {
        title: "Network",
        Icon: NetworkIcon,
        fields: [
          { label: "Private IP", value: row.privateIp, mono: true },
          {
            label: "Public IP",
            value: row.publicIp ?? "None",
            mono: true,
            copyable: Boolean(row.publicIp),
          },
          { label: "VPC", value: row.vpcId, mono: true },
          { label: "Subnet", value: row.subnetId, mono: true },
        ],
      },
      {
        title: "Security",
        Icon: ShieldIcon,
        fields: [
          { label: "Security Groups", value: sgDisplay, mono: false },
          { label: "IAM Role", value: row.iamRole ?? "None", mono: row.iamRole !== null },
          { label: "Key Pair", value: row.keyName ?? "None" },
        ],
      },
      {
        title: "Storage",
        Icon: DriveIcon,
        fields: [
          { label: "EBS Volumes", value: volumeDisplay },
          ...(row.ebsVolumes.length > 0
            ? row.ebsVolumes.slice(0, 3).map((vol, idx) => ({
                label: `Volume ${idx + 1}`,
                value: `${vol.volumeId} (${vol.deviceName})`,
                mono: true,
              }))
            : []),
        ],
      },
      {
        title: "Configuration",
        Icon: GearIcon,
        fields: [
          { label: "Monitoring", value: row.monitoring === "enabled" ? "Detailed" : "Basic" },
          { label: "Launch Time", value: row.launchTime },
        ],
      },
      {
        title: "Tags",
        Icon: TagIcon,
        fields: [
          { label: "Environment", value: row.environment },
          { label: "Other Tags", value: otherTags },
        ],
      },
    ],
  };
};

export default function Ec2Page() {
  // Use global filter context for account and region
  const { selectedAccountId, setSelectedAccountId, selectedRegion, setSelectedRegion } = useFilters();
  
  const [ec2Instances, setEc2Instances] = useState<Ec2Instance[]>([]);
  const [accounts, setAccounts] = useState<AwsAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Ec2Instance | null>(null);

  const latestRequest = useRef(0);

  const loadEc2 = useCallback(
    async (accountId: string | "all", forceRefresh = false) => {
      const requestId = nextRequestId();
      latestRequest.current = requestId;

      setLoading(true);
      setError(null);

      try {
        const data = await getEc2Instances(accountId, forceRefresh);

        if (latestRequest.current !== requestId) return;

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch EC2 instances");
        }

        setEc2Instances(data.instances);
        setLastUpdate(new Date());
      } catch (err: any) {
        if (latestRequest.current !== requestId) return;
        console.error("Error fetching EC2 data:", err);
        setError(err.message);
      } finally {
        if (latestRequest.current === requestId) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Load accounts and EC2 data in parallel on initial mount
  useEffect(() => {
    let active = true;

    // Use parallel loader for faster initial load
    getAccountsAndEc2(selectedAccountId)
      .then(({ accounts, ec2 }) => {
        if (!active) return;

        // Set accounts
        if (accounts.success && accounts.accounts) {
          setAccounts(accounts.accounts);
        }

        // Set EC2 data
        if (ec2.success) {
          setEc2Instances(ec2.instances);
          setLastUpdate(new Date());
        } else {
          setError(ec2.message || "Failed to fetch EC2 instances");
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

  // Reload only EC2 data when account filter changes
  useEffect(() => {
    // Skip initial mount (already loaded above)
    if (accountsLoading) return;

    loadEc2(selectedAccountId);
  }, [selectedAccountId, loadEc2, accountsLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadEc2(selectedAccountId, true);
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedAccountId, loadEc2]);

  // Filter instances by region first, then by search query
  const regionFilteredInstances = useMemo(() => {
    if (selectedRegion === "all") return ec2Instances;
    return ec2Instances.filter((instance) => instance.region === selectedRegion);
  }, [ec2Instances, selectedRegion]);

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
    for (const instance of ec2Instances) {
      counts[instance.region] = (counts[instance.region] || 0) + 1;
    }
    return counts;
  }, [ec2Instances]);

  // Available regions (only show regions that have instances)
  const availableRegions = useMemo(() => {
    return Object.keys(regionCounts);
  }, [regionCounts]);

  // Stats based on region-filtered instances (but before search filter)
  const total = regionFilteredInstances.length;
  const running = regionFilteredInstances.filter((i) => i.status === "running").length;
  const stopped = total - running;
  const regions = new Set(regionFilteredInstances.map((i) => i.region)).size;
  const pct = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

  const stats: Stat[] = [
    {
      label: "Total Instances",
      value: total,
      Icon: StackIcon,
      tone: "info",
      fill: 100,
      note: selectedRegion === "all" 
        ? `Across ${regions} region${regions !== 1 ? "s" : ""}` 
        : `In ${selectedRegion}`,
    },
    {
      label: "Running",
      value: running,
      Icon: PulseIcon,
      tone: "ok",
      fill: pct(running),
      note: `${pct(running)}% of fleet`,
    },
    {
      label: "Stopped",
      value: stopped,
      Icon: PowerOffIcon,
      tone: "halt",
      fill: pct(stopped),
      note: `${pct(stopped)}% of fleet`,
    },
  ];

  const isFirstLoad = loading && ec2Instances.length === 0 && !error;

  return (
    <>
      <Header
        title="EC2 Instances"
        subtitle="Compute infrastructure"
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
        searchPlaceholder="Search by name, ID, IP, type, AMI, security group..."
        showRefresh
        onRefresh={() => {
          invalidateEc2();
          loadEc2(selectedAccountId, true);
        }}
        isRefreshing={loading}
        lastUpdated={lastUpdate}
      />

      {/* Error Banner */}
      {error && (
        <div className="border-b border-halt/20 bg-halt-soft px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ServerIcon className="h-5 w-5 shrink-0 text-halt" />
              <p className="text-sm text-ink">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
            <button
              onClick={() => loadEc2(selectedAccountId, true)}
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
            EC2 Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Monitor and manage your EC2 instances across all regions
          </p>
        </div>

        {/* Stats */}
        {isFirstLoad ? <StatCardsSkeleton count={3} /> : <StatCards stats={stats} />}

        {/* Table Section */}
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">Instances</h2>
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
                placeholder="Search instances..."
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
                searchQuery ? "No matching instances" : selectedRegion !== "all" ? "No instances in this region" : "No EC2 instances found"
              }
              emptySubtitle={
                searchQuery
                  ? "Try adjusting your search terms"
                  : selectedRegion !== "all"
                  ? "Try selecting a different region"
                  : "Instances will appear here once available"
              }
            />
          )}

          <p className="mt-3 text-xs text-ink-faint">
            Click on a row to view instance details. Search by name, instance ID, IP
            address, type, AMI, or security group.
          </p>
        </section>
      </div>

      <DetailsDrawer
        title="EC2 Instance Details"
        content={selected ? toDrawer(selected) : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
