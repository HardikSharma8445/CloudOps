"use client";

import { useState, useMemo } from "react";
import { loadBalancers, type LoadBalancer } from "@/data/albData";
import Header from "@/components/Header";
import StatCards from "@/components/StatCards";
import ResourceTable from "@/components/ResourceTable";
import DetailsDrawer from "@/components/DetailsDrawer";
import StatusBadge from "@/components/StatusBadge";
import { SearchIcon } from "@/components/Icons";
import {
  CopyCell,
  EnvCell,
  NameCell,
  RegionCell,
  StackCell,
} from "@/components/cells";
import {
  BalancerIcon,
  GearIcon,
  GlobeIcon,
  HeartbeatIcon,
  ListIcon,
  MapPinIcon,
  PulseIcon,
  TagIcon,
} from "@/components/Icons";
import type { Column, DrawerContent, Stat, Tone } from "@/components/types";

const statusTone = (status: LoadBalancer["status"]): Tone =>
  status === "active" ? "ok" : "warn";

const healthTone = (row: LoadBalancer): Tone => {
  if (row.healthyTargets === 0) return "halt";
  if (row.healthyTargets < row.totalTargets) return "warn";
  return "ok";
};

const columns: Column<LoadBalancer>[] = [
  {
    header: "Status",
    render: (row) => (
      <StatusBadge
        label={row.status}
        tone={statusTone(row.status)}
        pulse={row.status === "active"}
      />
    ),
  },
  {
    header: "Name",
    render: (row) => <NameCell name={row.name} tone={statusTone(row.status)} />,
  },
  {
    header: "Type",
    render: (row) => <StackCell primary={row.type} secondary={row.scheme} />,
  },
  {
    header: "Targets",
    render: (row) => (
      <StatusBadge
        label={`${row.healthyTargets}/${row.totalTargets} healthy`}
        tone={healthTone(row)}
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
    header: "DNS Name",
    render: (row) => (
      <CopyCell value={row.dnsName} label="DNS name" truncate={18} />
    ),
  },
  { header: "Environment", render: (row) => <EnvCell value={row.environment} /> },
];

const getRowId = (row: LoadBalancer) => row.id;
const getRowLabel = (row: LoadBalancer) => row.name;
const getSearchFields = (row: LoadBalancer) => [row.name, row.dnsName, row.type, row.scheme];

const toDrawer = (row: LoadBalancer): DrawerContent => ({
  heading: row.name,
  status: {
    label: row.status,
    tone: statusTone(row.status),
    pulse: row.status === "active",
  },
  chips: [row.type, row.scheme, row.regionName],
  sections: [
    {
      title: "Load Balancer",
      Icon: BalancerIcon,
      fields: [
        { label: "Name", value: row.name },
        { label: "Type", value: row.type },
        { label: "Scheme", value: row.scheme },
      ],
    },
    {
      title: "Listeners & Targets",
      Icon: ListIcon,
      fields: [
        { label: "Listeners", value: row.listeners },
        { label: "Target Groups", value: String(row.targetGroups) },
        {
          label: "Healthy Targets",
          value: `${row.healthyTargets} of ${row.totalTargets}`,
        },
      ],
    },
    {
      title: "Networking",
      Icon: GlobeIcon,
      fields: [
        { label: "DNS Name", value: row.dnsName, mono: true },
        { label: "VPC", value: row.vpcId, mono: true },
        { label: "Security Group", value: row.securityGroup, mono: true },
      ],
    },
    {
      title: "Placement",
      Icon: MapPinIcon,
      fields: [
        { label: "Region", value: `${row.region} (${row.regionName})` },
        { label: "Availability Zones", value: row.availabilityZones },
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

export default function AlbPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<LoadBalancer | null>(null);

  const filteredBalancers = useMemo(() => {
    if (!searchQuery.trim()) return loadBalancers;
    const term = searchQuery.toLowerCase();
    return loadBalancers.filter((lb) =>
      getSearchFields(lb).some((field) =>
        String(field).toLowerCase().includes(term)
      )
    );
  }, [searchQuery]);

  const total = loadBalancers.length;
  const active = loadBalancers.filter((lb) => lb.status === "active").length;
  const internetFacing = loadBalancers.filter(
    (lb) => lb.scheme === "internet-facing"
  ).length;
  const healthy = loadBalancers.reduce((sum, lb) => sum + lb.healthyTargets, 0);
  const targets = loadBalancers.reduce((sum, lb) => sum + lb.totalTargets, 0);
  const pct = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

  const stats: Stat[] = [
    {
      label: "Load Balancers",
      value: total,
      Icon: BalancerIcon,
      tone: "info",
      fill: 100,
      note: `${internetFacing} internet-facing`,
    },
    {
      label: "Active",
      value: active,
      Icon: PulseIcon,
      tone: "ok",
      fill: pct(active),
      note: `${pct(active)}% serving traffic`,
    },
    {
      label: "Provisioning",
      value: total - active,
      Icon: GearIcon,
      tone: "warn",
      fill: pct(total - active),
      note: `${pct(total - active)}% coming online`,
    },
    {
      label: "Healthy Targets",
      value: targets > 0 ? `${healthy}/${targets}` : "0",
      Icon: HeartbeatIcon,
      tone: healthy === targets && targets > 0 ? "ok" : "warn",
      fill: targets > 0 ? Math.round((healthy / targets) * 100) : 0,
      note: targets > 0 ? `${Math.round((healthy / targets) * 100)}% passing health checks` : "No targets",
    },
  ];

  return (
    <>
      <Header
        title="Load Balancers"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, DNS, type, scheme..."
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            ALB Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your application and network load balancers (mock data)
          </p>
        </div>

        {/* Stats */}
        <StatCards stats={stats} />

        {/* Table Section */}
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">Load Balancers</h2>
              <span className="rounded-full border border-line bg-surface-raised px-2.5 py-0.5 text-xs font-medium tabular-nums text-ink-muted">
                {filteredBalancers.length}
                {filteredBalancers.length !== loadBalancers.length && (
                  <span className="text-ink-faint"> of {loadBalancers.length}</span>
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
                placeholder="Search load balancers..."
                className="input pl-10"
              />
            </div>
          </div>

          <ResourceTable
            rows={filteredBalancers}
            columns={columns}
            getId={getRowId}
            rowLabel={getRowLabel}
            selectedId={selected ? getRowId(selected) : null}
            onSelect={setSelected}
            emptyMessage={searchQuery ? "No matching load balancers" : "No load balancers found"}
            emptySubtitle={
              searchQuery
                ? "Try adjusting your search terms"
                : "Load balancers will appear here once available"
            }
          />

          <p className="mt-3 text-xs text-ink-faint">
            Click on a row to view load balancer details. Search by name, DNS name, type, or scheme.
          </p>
        </section>
      </div>

      <DetailsDrawer
        title="Load Balancer Details"
        content={selected ? toDrawer(selected) : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
