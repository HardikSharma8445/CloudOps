import { badgeTone, dotTone, type Tone } from "./types";

type Props = {
  label: string;
  tone: Tone;
  /** Show pulsing indicator for active states */
  pulse?: boolean;
  /** Badge size variant */
  size?: "xs" | "sm" | "md";
  /** Show status dot */
  showDot?: boolean;
};

export default function StatusBadge({
  label,
  tone,
  pulse = false,
  size = "sm",
  showDot = true,
}: Props) {
  const sizeClasses = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3 py-1.5 text-xs",
  };

  const dotSizes = {
    xs: "h-1 w-1",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold capitalize transition-all duration-200 ${sizeClasses[size]} ${badgeTone[tone]}`}
    >
      {showDot && (
        <span className={`relative flex ${dotSizes[size]}`}>
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotTone[tone]}`}
              style={{
                animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          )}
          <span
            className={`relative inline-flex rounded-full ${dotSizes[size]} ${dotTone[tone]}`}
          />
        </span>
      )}
      {label}
    </span>
  );
}

/** Simple status pill without dot */
export function StatusPill({
  label,
  tone,
  size = "sm",
}: {
  label: string;
  tone: Tone;
  size?: "xs" | "sm" | "md";
}) {
  return <StatusBadge label={label} tone={tone} size={size} showDot={false} />;
}

/** Health indicator with percentage */
export function HealthBadge({
  healthy,
  total,
  label,
}: {
  healthy: number;
  total: number;
  label?: string;
}) {
  const percentage = total > 0 ? Math.round((healthy / total) * 100) : 0;
  const tone: Tone =
    percentage === 100 ? "ok" : percentage >= 80 ? "warn" : "halt";

  return (
    <StatusBadge
      label={label || `${healthy}/${total} healthy`}
      tone={tone}
      pulse={percentage === 100}
    />
  );
}
