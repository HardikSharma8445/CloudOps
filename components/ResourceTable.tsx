"use client";

import { SearchIcon, ChevronRightIcon } from "./Icons";
import type { Column } from "./types";

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  selectedId: string | null;
  onSelect: (row: T) => void;
  rowLabel: (row: T) => string;
  minWidth?: number;
  /** Optional empty state message */
  emptyMessage?: string;
  /** Optional empty state subtitle */
  emptySubtitle?: string;
};

export default function ResourceTable<T>({
  rows,
  columns,
  getId,
  selectedId,
  onSelect,
  rowLabel,
  minWidth = 1040,
  emptyMessage = "No results found",
  emptySubtitle = "Try adjusting your search or filters",
}: Props<T>) {
  const hasSelection = selectedId !== null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-200 ${
        hasSelection ? "ring-2 ring-accent/20" : ""
      }`}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left text-sm"
          style={{ minWidth: `${minWidth}px` }}
        >
          <thead>
            <tr className="border-b border-line bg-surface-raised/50">
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-muted ${
                    column.align === "right" ? "text-right" : ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
              <th scope="col" className="w-12 px-5 py-3.5" />
            </tr>
          </thead>

          <tbody className="divide-y divide-line-soft">
            {rows.map((row) => {
              const id = getId(row);
              const isSelected = id === selectedId;

              return (
                <tr
                  key={id}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${rowLabel(row)}`}
                  onClick={() => onSelect(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(row);
                    }
                  }}
                  className={`group cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-inset ${
                    isSelected
                      ? "bg-accent-soft"
                      : "hover:bg-surface-raised/50"
                  }`}
                >
                  {columns.map((column, index) => (
                    <td
                      key={index}
                      className={`relative px-5 py-4 ${
                        column.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {/* Active indicator bar */}
                      {index === 0 && isSelected && (
                        <span className="absolute left-0 top-0 h-full w-1 bg-accent" />
                      )}
                      {column.render(row)}
                    </td>
                  ))}

                  <td className="px-5 py-4 text-right">
                    <ChevronRightIcon
                      className={`ml-auto h-4 w-4 transition-all duration-200 ${
                        isSelected
                          ? "translate-x-0 text-accent opacity-100"
                          : "text-ink-faint opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100"
                      }`}
                    />
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-16">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-raised text-ink-faint">
                      <SearchIcon className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {emptyMessage}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {emptySubtitle}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Skeleton loader for table rows */
export function ResourceTableSkeleton({
  columns = 6,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  // Deterministic widths to avoid hydration mismatch (no Math.random())
  const widthPattern = [75, 85, 65, 90, 70, 80, 95, 60];
  
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-raised/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-5 py-3.5">
                <div className="skeleton h-4 w-20" />
              </th>
            ))}
            <th className="w-12 px-5 py-3.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-5 py-4">
                  <div
                    className="skeleton h-5"
                    style={{ width: `${widthPattern[(rowIndex * columns + colIndex) % widthPattern.length]}%` }}
                  />
                </td>
              ))}
              <td className="px-5 py-4" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
