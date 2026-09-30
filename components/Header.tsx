import { ChevronRightIcon, RefreshIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";

export default function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line-soft bg-canvas/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="font-medium text-ink-muted">AWS Infrastructure</span>
          <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
          <span className="truncate font-semibold tracking-tight text-ink">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[11px] font-medium text-ink-muted sm:inline-flex">
            <RefreshIcon className="h-3.5 w-3.5 text-ink-faint" />
            Last updated: Just now
          </span>
          <ThemeToggle />
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-violet text-[11px] font-bold text-white">
            HK
          </span>
        </div>
      </div>
    </header>
  );
}
