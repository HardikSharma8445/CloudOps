"use client";

import CopyButton from "./CopyButton";
import { badgeTone, envTone, initials, type Tone } from "./types";

/**
 * Avatar + resource name. Pass `avatarText` when every name in the table
 * shares a prefix, so the initials stay distinguishable.
 */
export function NameCell({
  name,
  tone = "neutral",
  avatarText,
  metadata,
}: {
  name: string;
  tone?: Tone;
  avatarText?: string;
  metadata?: string;
}) {
  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold tracking-wide ${badgeTone[tone]}`}
      >
        {initials(avatarText ?? name)}
      </span>
      <div className="flex flex-col">
        <span className="font-medium text-ink">{name}</span>
        {metadata && (
          <span className="text-[10px] text-ink-faint font-mono">{metadata}</span>
        )}
      </div>
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
      <span className="font-mono text-xs text-ink-muted" title={value}>
        {shown}
      </span>
      <CopyButton value={value} label={`${label} ${value}`} subtle />
    </div>
  );
}

/** Bordered pill used for instance types, engine versions, etc. */
export function ChipCell({ value }: { value: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-lg border border-line bg-surface-raised px-2.5 py-1 font-mono text-[11px] font-medium text-ink-muted">
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
      <span className="text-sm font-medium text-ink">{regionName}</span>
      <span className="font-mono text-[10px] text-ink-faint">{region}</span>
    </div>
  );
}

/** Environment tag, coloured per tier. */
export function EnvCell({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
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
      <span className="text-sm font-medium text-ink">{primary}</span>
      <span className="text-[10px] text-ink-faint">{secondary}</span>
    </div>
  );
}

/** Simple text cell with optional muted styling */
export function TextCell({
  value,
  muted = false,
}: {
  value: string;
  muted?: boolean;
}) {
  return (
    <span className={`text-sm ${muted ? "text-ink-muted" : "text-ink"}`}>
      {value}
    </span>
  );
}

/** Number cell with tabular numerals */
export function NumberCell({
  value,
  suffix,
}: {
  value: number | string;
  suffix?: string;
}) {
  return (
    <span className="font-medium tabular-nums text-ink">
      {value}
      {suffix && <span className="ml-1 text-ink-faint">{suffix}</span>}
    </span>
  );
}

/** Status cell with colored pill */
export function StatusCell({
  status,
  tone,
  pulse = false,
}: {
  status: string;
  tone: Tone;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${badgeTone[tone]} ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      {status}
    </span>
  );
}

/** ARN cell with copy functionality */
export function ArnCell({ arn }: { arn: string }) {
  return <CopyCell value={arn} label="ARN" truncate={40} />;
}

/** Tags cell showing count with tooltip */
export function TagsCell({ tags }: { tags: Record<string, string> }) {
  const tagCount = Object.keys(tags).length;
  
  if (tagCount === 0) {
    return <span className="text-ink-faint text-xs">No tags</span>;
  }

  const tagText = Object.entries(tags)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  
  const moreCount = tagCount - 3;
  const displayText = moreCount > 0 ? `${tagText} +${moreCount} more` : tagText;

  return (
    <span 
      className="text-xs text-ink-muted cursor-help" 
      title={displayText}
    >
      {tagCount} tag{tagCount !== 1 ? 's' : ''}
    </span>
  );
}

/** Date cell with consistent formatting */
export function DateCell({ date }: { date: string }) {
  return <span className="text-xs text-ink-muted">{date}</span>;
}
