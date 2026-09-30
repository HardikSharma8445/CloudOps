"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { type Ec2Instance } from "@/data/ec2Data";
import ServiceDashboard from "@/components/ServiceDashboard";
import StatusBadge from "@/components/StatusBadge";
import AccountFilter from "@/components/AccountFilter";
import {
  getAccounts,
  getEc2Instances,
  invalidateEc2,
  type AwsAccountInfo,
} from "@/lib/dashboardApi";
import { nextRequestId } from "@/lib/dataCache";
import {
  ChipCell,
  CopyCell,
  EnvCell,
  NameCell,
  RegionCell,
} from "@/components/cells";
import {
  ClockIcon,
  MapPinIcon,
  NetworkIcon,
  PowerOffIcon,
  PulseIcon,
  RefreshIcon,
  ServerIcon,
  StackIcon,
  TagIcon,
} from "@/components/Icons";
import type { Column, DrawerContent, Stat } from "@/components/types";

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
  { header: "Instance Type", render: (row) => <ChipCell value={row.instanceType} /> },
  {
    header: "Region",
    render: (row) => (
      <RegionCell region={row.region} regionName={row.regionName} />
    ),
  },
  {
    header: "Private IP",
    render: (row) => <CopyCell value={row.privateIp} label="private IP" />,
  },
  { header: "Environment", render: (row) => <EnvCell value={row.environment} /> },
];

// Defined at module scope so their identity is stable across renders. As inline
// arrow props they changed every render, which invalidated the search useMemo
// inside ServiceDashboard and re-filtered the table on each keystroke/render.
const getRowId = (row: Ec2Instance) => row.id;
const getRowLabel = (row: Ec2Instance) => row.name;
const getSearchFields = (row: Ec2Instance) => [row.name, row.id, row.privateIp];

const toDrawer = (row: Ec2Instance): DrawerContent => ({
  heading: row.name,
  status: {
    label: row.status,
    tone: statusTone(row.status),
    pulse: row.status === "running",
  },
  chips: [row.instanceType, row.regionName],
  sections: [
    {
      title: "Identity",
      Icon: ServerIcon,
      fields: [
        { label: "Instance ID", value: row.id, mono: true },
        { label: "Instance Type", value: row.instanceType },
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
          value: row.publicIp ?? "—",
          mono: true,
          copyable: Boolean(row.publicIp),
        },
        { label: "VPC", value: row.vpcId, mono: true },
        { label: "Subnet", value: row.subnetId, mono: true },
      ],
    },
    {
      title: "Metadata",
      Icon: TagIcon,
      fields: [
        { label: "Environment", value: row.environment },
        { label: "Launch Time", value: row.launchTime },
      ],
    },
  ],
});

export default function Ec2Page() {
  const [ec2Instances, setEc2Instances] = useState<Ec2Instance[]>([]);
  const [accounts, setAccounts] = useState<AwsAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | "all">("all");
  const [accountInstanceCounts, setAccountInstanceCounts] = useState<Record<string, number>>({});

  /**
   * Tracks the most recent request. A slower earlier response must not
   * overwrite a newer one, which previously made the filter show the wrong
   * account's data after a quick second click.
   */
  const latestRequest = useRef(0);

  const loadEc2 = useCallback(
    async (accountId: string | "all", forceRefresh = false) => {
      const requestId = nextRequestId();
      latestRequest.current = requestId;

      setLoading(true);
      setError(null);

      try {
        const data = await getEc2Instances(accountId, forceRefresh);

        // A newer request has been issued since this one started - discard.
        if (latestRequest.current !== requestId) return;

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch EC2 instances");
        }

        setEc2Instances(data.instances);

        if (accountId === "all") {
          const counts: Record<string, number> = {};
          for (const instance of data.instances) {
            const accId = instance.accountId || "unknown";
            counts[accId] = (counts[accId] || 0) + 1;
          }
          setAccountInstanceCounts(counts);
        }

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

  // Accounts and instances are requested together rather than one after the
  // other, so first paint waits on a single round trip instead of two.
  useEffect(() => {
    let active = true;

    getAccounts()
      .then((data) => {
        if (!active) return;
        if (data.success && data.accounts) setAccounts(data.accounts);
      })
      .catch((err) => console.error("Error fetching accounts:", err))
      .finally(() => {
        if (active) setAccountsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadEc2(selectedAccountId);
  }, [selectedAccountId, loadEc2]);

  // Background refresh. Forces past the cache so the data actually changes,
  // but never shows a loading state that would interrupt what you are reading.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadEc2(selectedAccountId, true);
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedAccountId, loadEc2]);

  const total = ec2Instances.length;
  const running = ec2Instances.filter((i) => i.status === "running").length;
  const stopped = total - running;
  const regions = new Set(ec2Instances.map((i) => i.region)).size;
  // Guard against 0/0 - it previously produced NaN widths on the stat bars.
  const pct = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

  const stats: Stat[] = [
    {
      label: "Total Instances",
      value: total,
      Icon: StackIcon,
      tone: "info",
      fill: 100,
      note: `Across ${regions} regions`,
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
      <div className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">EC2 Dashboard</h1>
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
        <div className="flex items-center gap-3">
          <AccountFilter
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
            accountInstanceCounts={accountInstanceCounts}
            accounts={accounts}
            loading={accountsLoading}
          />
          <button
            onClick={() => {
              invalidateEc2();
              loadEc2(selectedAccountId, true);
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/40 hover:bg-accent/10 disabled:opacity-50"
          >
            <RefreshIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="border-b border-halt/30 bg-halt/10 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <ServerIcon className="h-4 w-4 shrink-0 text-halt" />
              <p className="text-[13px] text-ink">
                Could not load EC2 instances: {error}
              </p>
            </div>
            <button
              onClick={() => loadEc2(selectedAccountId, true)}
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
            <p className="mt-4 text-sm text-ink-muted">Loading EC2 instances...</p>
          </div>
        </div>
      )}

      {!isFirstLoad && (
        <ServiceDashboard
          pageTitle="EC2 Dashboard"
          heading="AWS Infrastructure Dashboard"
          subtitle="Real-time EC2 fleet inventory from ap-south-1. Select a row to inspect an instance."
          stats={stats}
          tableTitle="EC2 Instances"
          rows={ec2Instances}
          columns={columns}
          getId={getRowId}
          rowLabel={getRowLabel}
          searchPlaceholder="Search instances..."
          searchFields={getSearchFields}
          searchHint="Searchable by instance name, instance ID, and private IP. Hover a row to copy its ID or IP."
          drawerTitle="EC2 Instance Details"
          toDrawer={toDrawer}
        />
      )}
    </>
  );
}
