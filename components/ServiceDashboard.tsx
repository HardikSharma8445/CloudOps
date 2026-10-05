"use client";

import { useMemo, useState } from "react";
import Header from "./Header";
import StatCards from "./StatCards";
import ResourceTable from "./ResourceTable";
import DetailsDrawer from "./DetailsDrawer";
import { SearchIcon } from "./Icons";
import type { Column, DrawerContent, Stat } from "./types";

type Props<T> = {
  /** Breadcrumb label in the header, e.g. "EC2 Dashboard". */
  pageTitle: string;
  heading: string;
  subtitle: string;
  stats: Stat[];
  tableTitle: string;
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  rowLabel: (row: T) => string;
  searchPlaceholder: string;
  searchFields: (row: T) => string[];
  searchHint: string;
  drawerTitle: string;
  toDrawer: (row: T) => DrawerContent;
  minWidth?: number;
};

export default function ServiceDashboard<T>({
  pageTitle,
  heading,
  subtitle,
  stats,
  tableTitle,
  rows,
  columns,
  getId,
  rowLabel,
  searchPlaceholder,
  searchFields,
  searchHint,
  drawerTitle,
  toDrawer,
  minWidth,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<T | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) =>
      searchFields(row).some((field) =>
        String(field).toLowerCase().includes(term)
      )
    );
  }, [query, rows, searchFields]);

  return (
    <>
      <Header title={pageTitle} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-7">
          <h2 className="text-[26px] font-semibold tracking-tight">
            {heading}
          </h2>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">{subtitle}</p>
        </div>

        <StatCards stats={stats} />

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="text-[17px] font-semibold tracking-tight">
                {tableTitle}
              </h3>
              <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted tabular-nums">
                {filtered.length} of {rows.length}
              </span>
            </div>

            <div className="relative w-full sm:w-80">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink shadow-card transition-all placeholder:text-ink-faint focus:border-accent/60 focus:outline-none focus:ring-4 focus:ring-accent/15"
              />
            </div>
          </div>

          <ResourceTable
            rows={filtered}
            columns={columns}
            getId={getId}
            rowLabel={rowLabel}
            selectedId={selected ? getId(selected) : null}
            onSelect={setSelected}
            minWidth={minWidth}
          />

          <p className="mt-3 text-[11.5px] text-ink-faint">{searchHint}</p>
        </section>
      </div>

      <DetailsDrawer
        title={drawerTitle}
        content={selected ? toDrawer(selected) : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
