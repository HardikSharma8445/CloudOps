import type { ReactNode } from "react";

export type Tone = "ok" | "halt" | "warn" | "info" | "violet" | "neutral";

export type IconComponent = (props: { className?: string }) => ReactNode;

/** One column of a resource table. */
export type Column<T> = {
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
};

/** A single label/value line inside the details drawer. */
export type Field = {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
};

export type Section = {
  title: string;
  Icon: IconComponent;
  fields: Field[];
};

export type DrawerContent = {
  heading: string;
  status: { label: string; tone: Tone; pulse?: boolean };
  chips: string[];
  sections: Section[];
};

export type Stat = {
  label: string;
  value: number | string;
  Icon: IconComponent;
  tone: Tone;
  fill: number;
  note: string;
};

/** Badge tone styles - premium, subtle appearance */
export const badgeTone: Record<Tone, string> = {
  ok: "border-ok/20 bg-ok-soft text-ok",
  halt: "border-halt/20 bg-halt-soft text-halt",
  warn: "border-warn/20 bg-warn-soft text-warn",
  info: "border-accent/20 bg-accent-soft text-accent",
  violet: "border-violet/20 bg-violet-soft text-violet",
  neutral: "border-line bg-surface-raised text-ink-muted",
};

/** Tile/icon container tone styles */
export const tileTone: Record<Tone, string> = {
  ok: "border-ok/15 bg-ok-soft text-ok",
  halt: "border-halt/15 bg-halt-soft text-halt",
  warn: "border-warn/15 bg-warn-soft text-warn",
  info: "border-accent/15 bg-accent-soft text-accent",
  violet: "border-violet/15 bg-violet-soft text-violet",
  neutral: "border-line bg-surface-raised text-ink-muted",
};

/** Progress bar tone styles */
export const barTone: Record<Tone, string> = {
  ok: "bg-ok",
  halt: "bg-halt",
  warn: "bg-warn",
  info: "bg-accent",
  violet: "bg-violet",
  neutral: "bg-ink-faint",
};

/** Status dot tone styles */
export const dotTone: Record<Tone, string> = {
  ok: "bg-ok",
  halt: "bg-halt",
  warn: "bg-warn",
  info: "bg-accent",
  violet: "bg-violet",
  neutral: "bg-ink-faint",
};

/** Environment tag colours shared by every service table. */
export const envTone: Record<string, Tone> = {
  Production: "halt",
  Staging: "warn",
  QA: "violet",
  Development: "info",
  Shared: "neutral",
};

/**
 * Decorative two-letter avatar text from the first two words:
 * "prod-api-01" -> "PA", "qa-server-01" -> "QS". Callers with a shared name
 * prefix (S3 buckets) should strip it first via NameCell's avatarText.
 */
export function initials(name: string) {
  const words = name.split(/[-_.\s]+/).filter((w) => /[a-z]/i.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
