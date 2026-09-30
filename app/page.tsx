"use client";

import { ec2Instances, type Ec2Instance } from "@/data/ec2Data";
import ServiceDashboard from "@/components/ServiceDashboard";
import StatusBadge from "@/components/StatusBadge";
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
  ServerIcon,
  StackIcon,
  TagIcon,
} from "@/components/Icons";
import type { Column, DrawerContent, Stat } from "@/components/types";

const statusTone = (status: Ec2Instance["status"]) =>
  status === "running" ? ("ok" as const) : ("halt" as const);

const total = ec2Instances.length;
const running = ec2Instances.filter((i) => i.status === "running").length;
const stopped = total - running;
const regions = new Set(ec2Instances.map((i) => i.region)).size;
const pct = (value: number) => Math.round((value / total) * 100);

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
  return (
    <ServiceDashboard
      pageTitle="EC2 Dashboard"
      heading="AWS Infrastructure Dashboard"
      subtitle="Mock inventory across your EC2 fleet. Select a row to inspect an instance."
      stats={stats}
      tableTitle="EC2 Instances"
      rows={ec2Instances}
      columns={columns}
      getId={(row) => row.id}
      rowLabel={(row) => row.name}
      searchPlaceholder="Search instances..."
      searchFields={(row) => [row.name, row.id, row.privateIp]}
      searchHint="Searchable by instance name, instance ID, and private IP. Hover a row to copy its ID or IP."
      drawerTitle="EC2 Instance Details"
      toDrawer={toDrawer}
    />
  );
}
