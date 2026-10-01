import { barTone, tileTone, type Stat } from "./types";

type Props = {
  stats: Stat[];
  /** Compact mode for smaller cards */
  compact?: boolean;
};

export default function StatCards({ stats, compact = false }: Props) {
  return (
    <div
      className={`grid gap-4 ${
        compact
          ? "grid-cols-2 lg:grid-cols-4"
          : `grid-cols-1 sm:grid-cols-2 ${
              stats.length >= 4 ? "xl:grid-cols-4" : "lg:grid-cols-3"
            }`
      }`}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`rise-enter group rounded-2xl border border-line bg-surface shadow-card transition-all duration-300 hover:border-accent/20 hover:shadow-lg ${
            compact ? "p-4" : "p-5"
          }`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                className={`font-medium text-ink-muted ${
                  compact ? "text-xs" : "text-xs"
                }`}
              >
                {stat.label}
              </p>
              <p
                className={`mt-1 font-semibold tracking-tight tabular-nums text-ink ${
                  compact ? "text-2xl" : "text-3xl"
                }`}
              >
                {stat.value}
              </p>
            </div>

            <span
              className={`flex shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 ${
                tileTone[stat.tone]
              } ${compact ? "h-9 w-9" : "h-11 w-11"}`}
            >
              <stat.Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </span>
          </div>

          <div className={compact ? "mt-3" : "mt-4"}>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  barTone[stat.tone]
                }`}
                style={{ width: `${Math.min(100, Math.max(0, stat.fill))}%` }}
              />
            </div>
            <p
              className={`mt-2 text-ink-faint ${compact ? "text-[10px]" : "text-xs"}`}
            >
              {stat.note}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton loader for stat cards */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-surface p-5 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton mt-2 h-8 w-16" />
            </div>
            <div className="skeleton h-11 w-11 rounded-xl" />
          </div>
          <div className="mt-4">
            <div className="skeleton h-1.5 w-full rounded-full" />
            <div className="skeleton mt-2 h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
