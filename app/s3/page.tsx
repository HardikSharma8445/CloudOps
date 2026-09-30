"use client";

import { s3Buckets, type S3Bucket } from "@/data/s3Data";
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
  BucketIcon,
  DriveIcon,
  GearIcon,
  ListIcon,
  MapPinIcon,
  ShieldIcon,
  StackIcon,
  TagIcon,
} from "@/components/Icons";
import type { Column, DrawerContent, Stat, Tone } from "@/components/types";

const accessTone = (access: S3Bucket["publicAccess"]): Tone =>
  access === "Blocked" ? "ok" : "warn";

const total = s3Buckets.length;
const blocked = s3Buckets.filter((b) => b.publicAccess === "Blocked").length;
const versioned = s3Buckets.filter((b) => b.versioning === "Enabled").length;
const kms = s3Buckets.filter((b) => b.encryption === "SSE-KMS").length;
const pct = (value: number) => Math.round((value / total) * 100);

const stats: Stat[] = [
  {
    label: "Total Buckets",
    value: total,
    Icon: BucketIcon,
    tone: "info",
    fill: 100,
    note: `${new Set(s3Buckets.map((b) => b.region)).size} regions`,
  },
  {
    label: "Public Access Blocked",
    value: blocked,
    Icon: ShieldIcon,
    tone: blocked === total ? "ok" : "warn",
    fill: pct(blocked),
    note: `${pct(blocked)}% fully blocked`,
  },
  {
    label: "Versioning Enabled",
    value: versioned,
    Icon: StackIcon,
    tone: "violet",
    fill: pct(versioned),
    note: `${pct(versioned)}% of buckets`,
  },
  {
    label: "KMS Encrypted",
    value: kms,
    Icon: GearIcon,
    tone: "ok",
    fill: pct(kms),
    note: `${total - kms} using SSE-S3`,
  },
];

const columns: Column<S3Bucket>[] = [
  {
    header: "Public Access",
    render: (row) => (
      <StatusBadge
        label={row.publicAccess}
        tone={accessTone(row.publicAccess)}
      />
    ),
  },
  {
    header: "Bucket Name",
    render: (row) => (
      <NameCell
        name={row.name}
        tone={accessTone(row.publicAccess)}
        avatarText={row.name.replace(/^appsquadz-/, "")}
      />
    ),
  },
  {
    header: "Size",
    render: (row) => (
      <StackCell primary={row.size} secondary={`${row.objectCount} objects`} />
    ),
  },
  {
    header: "Storage Class",
    render: (row) => <ChipCell value={row.storageClass} />,
  },
  {
    header: "Region",
    render: (row) => (
      <RegionCell region={row.region} regionName={row.regionName} />
    ),
  },
  {
    header: "Encryption",
    render: (row) => <CopyCell value={row.encryption} label="encryption" />,
  },
  { header: "Environment", render: (row) => <EnvCell value={row.environment} /> },
];

const toDrawer = (row: S3Bucket): DrawerContent => ({
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
      ],
    },
    {
      title: "Contents",
      Icon: DriveIcon,
      fields: [
        { label: "Objects", value: row.objectCount },
        { label: "Total Size", value: row.size },
        { label: "Storage Class", value: row.storageClass },
      ],
    },
    {
      title: "Protection",
      Icon: ShieldIcon,
      fields: [
        { label: "Public Access", value: row.publicAccess },
        { label: "Encryption", value: row.encryption },
        { label: "Versioning", value: row.versioning },
        { label: "Replication", value: row.replication },
      ],
    },
    {
      title: "Management",
      Icon: ListIcon,
      fields: [{ label: "Lifecycle Rules", value: row.lifecycleRules }],
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
        { label: "Environment", value: row.environment },
        { label: "Created", value: row.createdAt },
      ],
    },
  ],
});

export default function S3Page() {
  return (
    <ServiceDashboard
      pageTitle="S3 Dashboard"
      heading="Simple Storage Service"
      subtitle="Mock inventory of S3 buckets. Select a row to inspect one."
      stats={stats}
      tableTitle="S3 Buckets"
      rows={s3Buckets}
      columns={columns}
      getId={(row) => row.id}
      rowLabel={(row) => row.name}
      searchPlaceholder="Search buckets..."
      searchFields={(row) => [row.name, row.storageClass, row.encryption]}
      searchHint="Searchable by bucket name, storage class, and encryption type."
      drawerTitle="S3 Bucket Details"
      toDrawer={toDrawer}
    />
  );
}
