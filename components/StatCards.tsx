import { barTone, tileTone, type Stat } from "./types";

export default function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
        stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      }`}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="rise-enter rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:scale-[1.01] hover:border-accent/20 hover:shadow-lg"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {stat.label}
              </p>
              <p className="mt-2.5 truncate text-[32px] font-semibold leading-none tracking-tight tabular-nums">
                {stat.value}
              </p>
            </div>

            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                tileTone[stat.tone]
              }`}
            >
              <stat.Icon className="h-[18px] w-[18px]" />
            </span>
          </div>

          <div className="mt-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  barTone[stat.tone]
                }`}
                style={{ width: `${Math.min(100, Math.max(0, stat.fill))}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-medium text-ink-faint">
              {stat.note}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
