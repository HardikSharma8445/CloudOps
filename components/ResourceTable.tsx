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
};

export default function ResourceTable<T>({
  rows,
  columns,
  getId,
  selectedId,
  onSelect,
  rowLabel,
  minWidth = 1040,
}: Props<T>) {
  const selected = selectedId !== null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-200 ${
        selected ? "ring-2 ring-accent/30" : ""
      }`}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left text-sm"
          style={{ minWidth: `${minWidth}px` }}
        >
          <thead>
            <tr className="border-b border-line bg-surface-raised">
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-5 py-3.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-muted ${
                    column.align === "right" ? "text-right" : ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
              <th scope="col" className="px-5 py-3.5" />
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const id = getId(row);
              const selected = id === selectedId;

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
                  className={`group cursor-pointer border-b border-line-soft transition-colors duration-150 last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset ${
                    selected ? "bg-accent/10" : "hover:bg-surface-raised"
                  }`}
                >
                  {columns.map((column, index) => (
                    <td
                      key={index}
                      className={`relative px-5 py-4 ${
                        column.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {index === 0 && selected && (
                        <span className="absolute left-0 top-0 h-full w-[3px] bg-accent" />
                      )}
                      {column.render(row)}
                    </td>
                  ))}

                  <td className="px-5 py-4 text-right">
                    <ChevronRightIcon
                      className={`ml-auto h-4 w-4 transition-all ${
                        selected
                          ? "text-accent opacity-100"
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
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-raised text-ink-faint">
                      <SearchIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        No results found
                      </p>
                      <p className="mt-1 text-[12.5px] text-ink-muted">
                        Try a different search term.
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
