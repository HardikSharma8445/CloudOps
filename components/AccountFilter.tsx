"use client";

import { useState } from "react";
import { GlobeIcon, CheckIcon } from "./Icons";
import type { AwsAccountInfo } from "@/lib/dashboardApi";

export type { AwsAccountInfo };

type Props = {
  selectedAccountId: string | "all";
  onAccountChange: (accountId: string | "all") => void;
  /** Map of accountId -> instance count. */
  accountInstanceCounts?: Record<string, number>;
  /**
   * Accounts are supplied by the parent page, which fetches them in parallel
   * with the resource data. Fetching here instead would create a waterfall:
   * the filter only mounts after the page's own fetch resolves.
   */
  accounts?: AwsAccountInfo[];
  loading?: boolean;
};

export default function AccountFilter({
  selectedAccountId,
  onAccountChange,
  accountInstanceCounts = {},
  accounts = [],
  loading = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
        <GlobeIcon className="h-4 w-4 text-ink-faint" />
        <span className="text-sm text-ink-muted">Loading accounts...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return null;
  }

  const selectedAccount =
    selectedAccountId === "all"
      ? null
      : accounts.find((acc) => acc.id === selectedAccountId);

  const displayName = selectedAccountId === "all" ? "All Accounts" : selectedAccount?.name || "Select Account";

  const allCount = Object.values(accountInstanceCounts).reduce((sum, count) => sum + count, 0);
  const selectedCount = selectedAccountId === "all" ? allCount : (accountInstanceCounts[selectedAccountId] || 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink shadow-card transition-all hover:border-accent/40 hover:bg-surface-raised hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <GlobeIcon className="h-4 w-4 text-ink-faint" />
        <span className="truncate max-w-[200px]">{displayName}</span>
        {selectedAccountId !== "all" && selectedCount > 0 && (
          <span className="ml-1 rounded-md bg-surface-raised px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-faint">
            {selectedCount}
          </span>
        )}
        <svg
          className={`h-4 w-4 text-ink-faint transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
            <div className="border-b border-line bg-surface-raised px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
                AWS Accounts
              </h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {/* All Accounts Option */}
              <button
                onClick={() => {
                  onAccountChange("all");
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors hover:bg-surface-raised ${
                  selectedAccountId === "all" ? "bg-accent/10" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">All Accounts</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    View all resources across accounts
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-surface-raised px-2 py-1 text-[10px] font-semibold tabular-nums text-ink-muted">
                    {allCount}
                  </span>
                  {selectedAccountId === "all" && (
                    <CheckIcon className="h-4 w-4 text-accent" />
                  )}
                </div>
              </button>

              {/* Individual Accounts */}
              {accounts.map((account) => {
                const instanceCount = accountInstanceCounts[account.id] || 0;
                
                return (
                  <button
                    key={account.id}
                    onClick={() => {
                      onAccountChange(account.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-raised ${
                      selectedAccountId === account.id ? "bg-accent/10" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">
                        {account.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-ink-faint">
                        {account.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-surface-raised px-2 py-1 text-[10px] font-semibold tabular-nums text-ink-muted">
                        {instanceCount}
                      </span>
                      {selectedAccountId === account.id && (
                        <CheckIcon className="h-4 w-4 text-accent" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
