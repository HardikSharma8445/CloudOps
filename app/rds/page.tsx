"use client";

import { rdsInstances, type RdsInstance } from "@/data/rdsData";
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
  DatabaseIcon,
  DriveIcon,
  GlobeIcon,
  MapPinIcon,
  PowerOffIcon,
  PulseIcon,
  ShieldIcon,
  TagIcon,
} from "@/components/Icons";
import type { Column, DrawerContent, Stat, Tone } from "@/components/types";

const statusTone = (status: RdsInstance["status"]): Tone =>
  status === "available" ? "ok" : status === "modifying" ? "warn" : "halt";

const total = rdsInstances.length;
const available = rdsInstances.filter((r) => r.status === "available").length;
const stopped = rdsInstances.filter((r) => r.status === "stopped").length;
const multiAz = rdsInstances.filter((r) => r.multiAz === "Yes").length;
const pct = (value: number) => Math.round((value / total) * 100);

const stats: Stat[] = [
  {
    label: "Total Databases",
    value: total,
    Icon: DatabaseIcon,
    tone: "info",
    fill: 100,
    note: `${new Set(rdsInstances.map((r) => r.engine)).size} engine types`,
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
  return (
    <ServiceDashboard
      pageTitle="RDS Dashboard"
      heading="Relational Database Service"
      subtitle="Mock inventory of managed database instances. Select a row to inspect one."
      stats={stats}
      tableTitle="RDS Instances"
      rows={rdsInstances}
      columns={columns}
      getId={(row) => row.id}
      rowLabel={(row) => row.name}
      searchPlaceholder="Search databases..."
      searchFields={(row) => [row.name, row.id, row.engine, row.endpoint]}
      searchHint="Searchable by DB identifier, resource ID, engine, and endpoint."
      drawerTitle="RDS Instance Details"
      toDrawer={toDrawer}
    />
  );
}
