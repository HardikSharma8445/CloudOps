"use client";

import { loadBalancers, type LoadBalancer } from "@/data/albData";
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

const total = loadBalancers.length;
const active = loadBalancers.filter((lb) => lb.status === "active").length;
const internetFacing = loadBalancers.filter(
  (lb) => lb.scheme === "internet-facing"
).length;
const healthy = loadBalancers.reduce((sum, lb) => sum + lb.healthyTargets, 0);
const targets = loadBalancers.reduce((sum, lb) => sum + lb.totalTargets, 0);
const pct = (value: number) => Math.round((value / total) * 100);

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
    value: `${healthy}/${targets}`,
    Icon: HeartbeatIcon,
    tone: healthy === targets ? "ok" : "warn",
    fill: Math.round((healthy / targets) * 100),
    note: `${Math.round((healthy / targets) * 100)}% passing health checks`,
  },
];

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
  return (
    <ServiceDashboard
      pageTitle="ALB Dashboard"
      heading="Elastic Load Balancing"
      subtitle="Mock inventory of application and network load balancers. Select a row to inspect one."
      stats={stats}
      tableTitle="Load Balancers"
      rows={loadBalancers}
      columns={columns}
      getId={(row) => row.id}
      rowLabel={(row) => row.name}
      searchPlaceholder="Search load balancers..."
      searchFields={(row) => [row.name, row.dnsName, row.type, row.scheme]}
      searchHint="Searchable by name, DNS name, type, and scheme."
      drawerTitle="Load Balancer Details"
      toDrawer={toDrawer}
    />
  );
}
