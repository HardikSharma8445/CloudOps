"use client";

import { eksClusters, type EksCluster } from "@/data/eksData";
import ServiceDashboard from "@/components/ServiceDashboard";
import StatusBadge from "@/components/StatusBadge";
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

const total = eksClusters.length;
const active = eksClusters.filter((c) => c.status === "active").length;
const updating = total - active;
const nodes = eksClusters.reduce((sum, c) => sum + c.nodeCount, 0);
const pct = (value: number) => Math.round((value / total) * 100);

const stats: Stat[] = [
  {
    label: "Total Clusters",
    value: total,
    Icon: CubeIcon,
    tone: "info",
    fill: 100,
    note: `${new Set(eksClusters.map((c) => c.region)).size} regions`,
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
  return (
    <ServiceDashboard
      pageTitle="EKS Dashboard"
      heading="Elastic Kubernetes Service"
      subtitle="Mock inventory of Kubernetes clusters. Select a row to inspect one."
      stats={stats}
      tableTitle="EKS Clusters"
      rows={eksClusters}
      columns={columns}
      getId={(row) => row.id}
      rowLabel={(row) => row.name}
      searchPlaceholder="Search clusters..."
      searchFields={(row) => [row.name, row.version, row.endpoint]}
      searchHint="Searchable by cluster name, Kubernetes version, and API endpoint."
      drawerTitle="EKS Cluster Details"
      toDrawer={toDrawer}
    />
  );
}
