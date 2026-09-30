"use client";

import CopyButton from "./CopyButton";
import { badgeTone, envTone, initials, type Tone } from "./types";

/**
 * Avatar + resource name. Pass `avatarText` when every name in the table
 * shares a prefix, so the initials stay distinguishable.
 */
export function NameCell({
  name,
  tone,
  avatarText,
}: {
  name: string;
  tone: Tone;
  avatarText?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold tracking-wide ${badgeTone[tone]}`}
      >
        {initials(avatarText ?? name)}
      </span>
      <span className="font-semibold text-ink">{name}</span>
    </div>
  );
}

/** Monospace value with a copy button that appears on row hover. */
export function CopyCell({
  value,
  label,
  truncate,
}: {
  value: string;
  label: string;
  truncate?: number;
}) {
  const shown =
    truncate && value.length > truncate ? `${value.slice(0, truncate)}…` : value;

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="font-mono text-[12px] text-ink-muted" title={value}>
        {shown}
      </span>
      <CopyButton value={value} label={`${label} ${value}`} subtle />
    </div>
  );
}

/** Bordered pill used for instance types, engine versions, etc. */
export function ChipCell({ value }: { value: string }) {
  return (
    <span className="whitespace-nowrap rounded-md border border-line bg-surface-raised px-2 py-0.5 font-mono text-[11.5px] text-ink-muted">
      {value}
    </span>
  );
}

/** Region name with the region code underneath. */
export function RegionCell({
  region,
  regionName,
}: {
  region: string;
  regionName: string;
}) {
  return (
    <div className="flex flex-col whitespace-nowrap leading-tight">
      <span className="font-medium text-ink">{regionName}</span>
      <span className="font-mono text-[10.5px] text-ink-faint">{region}</span>
    </div>
  );
}

/** Environment tag, coloured per tier. */
export function EnvCell({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
        badgeTone[envTone[value] ?? "neutral"]
      }`}
    >
      {value}
    </span>
  );
}

/** Two-line stacked cell: bold primary value, muted secondary. */
export function StackCell({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <div className="flex flex-col whitespace-nowrap leading-tight">
      <span className="font-medium text-ink">{primary}</span>
      <span className="text-[10.5px] text-ink-faint">{secondary}</span>
    </div>
  );
}
