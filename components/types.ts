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

export const badgeTone: Record<Tone, string> = {
  ok: "border-ok/30 bg-ok/10 text-ok",
  halt: "border-halt/30 bg-halt/10 text-halt",
  warn: "border-warn/30 bg-warn/10 text-warn",
  info: "border-accent/30 bg-accent/10 text-accent",
  violet: "border-violet/30 bg-violet/10 text-violet",
  neutral: "border-line bg-surface-raised text-ink-muted",
};

export const tileTone: Record<Tone, string> = {
  ok: "border-ok/20 bg-ok/10 text-ok",
  halt: "border-halt/20 bg-halt/10 text-halt",
  warn: "border-warn/20 bg-warn/10 text-warn",
  info: "border-accent/20 bg-accent/10 text-accent",
  violet: "border-violet/20 bg-violet/10 text-violet",
  neutral: "border-line bg-surface-raised text-ink-muted",
};

export const barTone: Record<Tone, string> = {
  ok: "bg-ok",
  halt: "bg-halt",
  warn: "bg-warn",
  info: "bg-accent",
  violet: "bg-violet",
  neutral: "bg-ink-faint",
};

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
