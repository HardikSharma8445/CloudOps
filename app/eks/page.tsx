"use client";

import { useState, useMemo } from "react";
import { eksClusters, type EksCluster } from "@/data/eksData";
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
  CubeIcon,
  GearIcon,
  GlobeIcon,
  MapPinIcon,
  PulseIcon,
  ServerIcon,
  StackIcon,
  TagIcon,
} from "@/components/Icons";
import type { Column, DrawerContent, Stat, Tone } from "@/components/types";

const statusTone = (status: EksCluster["status"]): Tone =>
  status === "active" ? "ok" : "warn";

const columns: Column<EksCluster>[] = [
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
    header: "Cluster Name",
    render: (row) => <NameCell name={row.name} tone={statusTone(row.status)} />,
  },
  {
    header: "Version",
    render: (row) => (
      <StackCell primary={`v${row.version}`} secondary={row.platformVersion} />
    ),
  },
  {
    header: "Nodes",
    render: (row) => (
      <StackCell
        primary={`${row.nodeCount} / ${row.desiredNodes}`}
        secondary={`${row.nodeGroups} node group${row.nodeGroups === 1 ? "" : "s"}`}
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
    header: "API Endpoint",
    render: (row) => (
      <CopyCell value={row.endpoint} label="endpoint" truncate={18} />
    ),
  },
  { header: "Environment", render: (row) => <EnvCell value={row.environment} /> },
];

const getRowId = (row: EksCluster) => row.id;
const getRowLabel = (row: EksCluster) => row.name;
const getSearchFields = (row: EksCluster) => [row.name, row.version, row.endpoint];

const toDrawer = (row: EksCluster): DrawerContent => ({
  heading: row.name,
  status: {
    label: row.status,
    tone: statusTone(row.status),
    pulse: row.status === "active",
  },
  chips: [`Kubernetes ${row.version}`, row.nodeInstanceType, row.regionName],
  sections: [
    {
      title: "Cluster",
      Icon: CubeIcon,
      fields: [
        { label: "Cluster Name", value: row.name },
        { label: "Kubernetes Version", value: row.version },
        { label: "Platform Version", value: row.platformVersion, mono: true },
      ],
    },
    {
      title: "Compute",
      Icon: StackIcon,
      fields: [
        { label: "Node Groups", value: String(row.nodeGroups) },
        {
          label: "Nodes",
          value: `${row.nodeCount} running / ${row.desiredNodes} desired`,
        },
        { label: "Node Instance Type", value: row.nodeInstanceType },
      ],
    },
    {
      title: "Networking",
      Icon: GlobeIcon,
      fields: [
        { label: "API Endpoint", value: row.endpoint, mono: true },
        { label: "VPC", value: row.vpcId, mono: true },
      ],
    },
    {
      title: "Placement",
      Icon: MapPinIcon,
      fields: [
        { label: "Region", value: `${row.region} (${row.regionName})` },
      ],
    },
    {
      title: "Metadata",
      Icon: TagIcon,
      fields: [
        { label: "Service Role", value: row.serviceRole, mono: true },
        { label: "Control Plane Logging", value: row.logging },
        { label: "Environment", value: row.environment },
        { label: "Created", value: row.createdAt },
      ],
    },
  ],
});

export default function EksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<EksCluster | null>(null);

  const filteredClusters = useMemo(() => {
    if (!searchQuery.trim()) return eksClusters;
    const term = searchQuery.toLowerCase();
    return eksClusters.filter((cluster) =>
      getSearchFields(cluster).some((field) =>
        String(field).toLowerCase().includes(term)
      )
    );
  }, [searchQuery]);

  const total = eksClusters.length;
  const active = eksClusters.filter((c) => c.status === "active").length;
  const updating = total - active;
  const nodes = eksClusters.reduce((sum, c) => sum + c.nodeCount, 0);
  const pct = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

  const stats: Stat[] = [
    {
      label: "Total Clusters",
      value: total,
      Icon: CubeIcon,
      tone: "info",
      fill: 100,
      note: `${new Set(eksClusters.map((c) => c.region)).size} region${new Set(eksClusters.map((c) => c.region)).size !== 1 ? "s" : ""}`,
    },
    {
      label: "Active",
      value: active,
      Icon: PulseIcon,
      tone: "ok",
      fill: pct(active),
      note: `${pct(active)}% of clusters`,
    },
    {
      label: "Updating",
      value: updating,
      Icon: GearIcon,
      tone: "warn",
      fill: pct(updating),
      note: `${pct(updating)}% mid-upgrade`,
    },
    {
      label: "Worker Nodes",
      value: nodes,
      Icon: ServerIcon,
      tone: "violet",
      fill: 100,
      note: `${eksClusters.reduce((s, c) => s + c.nodeGroups, 0)} node groups`,
    },
  ];

  return (
    <>
      <Header
        title="EKS Clusters"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search clusters by name, version, endpoint..."
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            EKS Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your Kubernetes clusters (mock data)
          </p>
        </div>

        {/* Stats */}
        <StatCards stats={stats} />

        {/* Table Section */}
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">Clusters</h2>
              <span className="rounded-full border border-line bg-surface-raised px-2.5 py-0.5 text-xs font-medium tabular-nums text-ink-muted">
                {filteredClusters.length}
                {filteredClusters.length !== eksClusters.length && (
                  <span className="text-ink-faint"> of {eksClusters.length}</span>
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
                placeholder="Search clusters..."
                className="input pl-10"
              />
            </div>
          </div>

          <ResourceTable
            rows={filteredClusters}
            columns={columns}
            getId={getRowId}
            rowLabel={getRowLabel}
            selectedId={selected ? getRowId(selected) : null}
            onSelect={setSelected}
            emptyMessage={searchQuery ? "No matching clusters" : "No EKS clusters found"}
            emptySubtitle={
              searchQuery
                ? "Try adjusting your search terms"
                : "Clusters will appear here once available"
            }
          />

          <p className="mt-3 text-xs text-ink-faint">
            Click on a row to view cluster details. Search by name, Kubernetes version, or API endpoint.
          </p>
        </section>
      </div>

      <DetailsDrawer
        title="EKS Cluster Details"
        content={selected ? toDrawer(selected) : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
