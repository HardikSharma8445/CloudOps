"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRightIcon, RefreshIcon, SearchIcon, CheckIcon, GlobeIcon, CommandIcon, MapPinIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";
import { AWS_REGIONS, getGroupedRegions } from "@/lib/regions";
import type { AwsAccountInfo } from "@/lib/dashboardApi";
import type { RegionSelection } from "./RegionFilter";

type Props = {
  title: string;
  subtitle?: string;
  /** AWS accounts for the selector dropdown */
  accounts?: AwsAccountInfo[];
  /** Currently selected account ID or "all" */
  selectedAccountId?: string | "all";
  /** Callback when account selection changes */
  onAccountChange?: (accountId: string | "all") => void;
  /** Show loading state in accounts dropdown */
  accountsLoading?: boolean;
  /** Currently selected region or "all" */
  selectedRegion?: RegionSelection;
  /** Callback when region selection changes */
  onRegionChange?: (region: RegionSelection) => void;
  /** Map of regionCode -> resource count */
  regionCounts?: Record<string, number>;
  /** Available regions (filters the dropdown) */
  availableRegions?: string[];
  /** Search query value */
  searchQuery?: string;
  /** Callback when search query changes */
  onSearchChange?: (query: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Callback when refresh is clicked */
  onRefresh?: () => void;
  /** Is data currently refreshing */
  isRefreshing?: boolean;
  /** Last updated timestamp */
  lastUpdated?: Date | null;
};

// Helper to trigger global search
function openGlobalSearch() {
  // Dispatch Ctrl+K event to open global search
  const event = new KeyboardEvent("keydown", {
    key: "k",
    ctrlKey: true,
    metaKey: true,
    bubbles: true,
  });
  document.dispatchEvent(event);
}

export default function Header({
  title,
  subtitle,
  accounts = [],
  selectedAccountId = "all",
  onAccountChange,
  accountsLoading = false,
  selectedRegion = "all",
  onRegionChange,
  regionCounts = {},
  availableRegions,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showRefresh = false,
  onRefresh,
  isRefreshing = false,
  lastUpdated,
}: Props) {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const regionDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setRegionDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
  const displayAccountName =
    selectedAccountId === "all"
      ? "All Accounts"
      : selectedAccount?.name || "Select Account";

  // Region display
  const selectedRegionInfo = selectedRegion === "all" 
    ? null 
    : AWS_REGIONS.find((r) => r.code === selectedRegion);
  const displayRegionName = selectedRegion === "all" 
    ? "All Regions" 
    : selectedRegionInfo?.shortName || selectedRegion;

  // Grouped regions for dropdown
  const groupedRegions = (() => {
    const groups = getGroupedRegions();
    if (!availableRegions || availableRegions.length === 0) {
      return groups;
    }
    const availableSet = new Set(availableRegions);
    return groups
      .map((group) => ({
        ...group,
        regions: group.regions.filter((r) => availableSet.has(r.code)),
      }))
      .filter((group) => group.regions.length > 0);
  })();

  const allRegionCount = Object.values(regionCounts).reduce((sum, count) => sum + count, 0);

  const formatLastUpdated = (date: Date | null | undefined) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 10) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Left: Breadcrumb and Title */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-2 text-xs text-ink-faint">
              {/* The "CloudOps" crumb is redundant on phones and forces a wrap */}
              <span className="hidden sm:inline">CloudOps</span>
              <ChevronRightIcon className="hidden h-3 w-3 shrink-0 sm:block" />
              <span className="truncate font-medium text-ink-muted">{title}</span>
            </div>
            {subtitle && (
              <p className="mt-0.5 hidden truncate text-sm text-ink-muted sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Search (when provided) OR Global Search Button */}
        {onSearchChange ? (
          <div className="hidden w-full max-w-md lg:block">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="input pl-10 pr-4"
              />
            </div>
          </div>
        ) : (
          <button
            onClick={openGlobalSearch}
            className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink-muted transition-all hover:border-accent/30 hover:bg-surface-raised lg:flex"
          >
            <SearchIcon className="h-4 w-4" />
            <span>Search resources...</span>
            <kbd className="ml-4 rounded border border-line bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Global Search Button (compact) - only when page has its own search */}
          {onSearchChange && (
            <button
              onClick={openGlobalSearch}
              className="btn-secondary hidden h-9 w-9 p-0 lg:flex"
              aria-label="Global search"
              title="Global search (⌘K)"
            >
              <CommandIcon className="h-4 w-4" />
            </button>
          )}

          {/* Region Selector */}
          {onRegionChange && (
            <div className="relative" ref={regionDropdownRef}>
              <button
                onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                className="btn-secondary h-9 px-3 text-sm"
                aria-label="Select region"
                title={selectedRegion === "all" ? "All Regions" : selectedRegionInfo?.name || selectedRegion}
              >
                <MapPinIcon className="h-4 w-4 text-ink-faint" />
                <span className="hidden max-w-[100px] truncate sm:inline">
                  {displayRegionName}
                </span>
                <svg
                  className={`h-4 w-4 text-ink-faint transition-transform duration-200 ${
                    regionDropdownOpen ? "rotate-180" : ""
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

              {/* Region Dropdown */}
              {regionDropdownOpen && (
                <div className="slide-down-enter absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-dropdown">
                  <div className="border-b border-line bg-surface-raised px-4 py-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      AWS Regions
                    </h3>
                  </div>

                  <div className="max-h-96 overflow-y-auto p-2">
                    {/* All Regions Option */}
                    <button
                      onClick={() => {
                        onRegionChange("all");
                        setRegionDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selectedRegion === "all"
                          ? "bg-accent-soft text-accent"
                          : "hover:bg-surface-raised"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">All Regions</p>
                        <p className="text-xs text-ink-faint">
                          View resources across all regions
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {allRegionCount > 0 && (
                          <span className="rounded-md bg-surface-raised px-2 py-1 text-[10px] font-semibold tabular-nums text-ink-muted">
                            {allRegionCount}
                          </span>
                        )}
                        {selectedRegion === "all" && (
                          <CheckIcon className="h-4 w-4 shrink-0 text-accent" />
                        )}
                      </div>
                    </button>

                    {/* Grouped Regions */}
                    {groupedRegions.map((group) => (
                      <div key={group.group}>
                        <div className="mt-3 mb-1.5 px-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                            {group.group}
                          </p>
                        </div>

                        {group.regions.map((region) => {
                          const count = regionCounts[region.code] || 0;
                          const isSelected = selectedRegion === region.code;

                          return (
                            <button
                              key={region.code}
                              onClick={() => {
                                onRegionChange(region.code);
                                setRegionDropdownOpen(false);
                              }}
                              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                                isSelected
                                  ? "bg-accent-soft text-accent"
                                  : "hover:bg-surface-raised"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{region.shortName}</p>
                                <p className="font-mono text-[10px] text-ink-faint">
                                  {region.code}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {count > 0 && (
                                  <span className="rounded-md bg-surface-raised px-2 py-1 text-[10px] font-semibold tabular-nums text-ink-muted">
                                    {count}
                                  </span>
                                )}
                                {isSelected && (
                                  <CheckIcon className="h-4 w-4 shrink-0 text-accent" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Selector */}
          {onAccountChange && (
            <div className="relative" ref={accountDropdownRef}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                disabled={accountsLoading}
                className="btn-secondary h-9 px-3 text-sm"
              >
                <GlobeIcon className="h-4 w-4 text-ink-faint" />
                <span className="hidden max-w-[140px] truncate sm:inline">
                  {accountsLoading ? "Loading..." : displayAccountName}
                </span>
                <svg
                  className={`h-4 w-4 text-ink-faint transition-transform duration-200 ${
                    accountDropdownOpen ? "rotate-180" : ""
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

              {/* Account Dropdown */}
              {accountDropdownOpen && (
                <div className="slide-down-enter absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-dropdown">
                  <div className="border-b border-line bg-surface-raised px-4 py-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      AWS Accounts
                    </h3>
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {/* All Accounts Option */}
                    <button
                      onClick={() => {
                        onAccountChange("all");
                        setAccountDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selectedAccountId === "all"
                          ? "bg-accent-soft text-accent"
                          : "hover:bg-surface-raised"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">All Accounts</p>
                        <p className="text-xs text-ink-faint">
                          View resources across all accounts
                        </p>
                      </div>
                      {selectedAccountId === "all" && (
                        <CheckIcon className="h-4 w-4 shrink-0 text-accent" />
                      )}
                    </button>

                    {/* Divider */}
                    {accounts.length > 0 && (
                      <div className="my-2 border-t border-line-soft" />
                    )}

                    {/* Working Accounts */}
                    {accounts.filter(account => account.isActive !== false).map((account) => (
                      <button
                        key={account.id}
                        onClick={() => {
                          onAccountChange(account.id);
                          setAccountDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          selectedAccountId === account.id
                            ? "bg-accent-soft text-accent"
                            : "hover:bg-surface-raised"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{account.name}</p>
                          <p className="font-mono text-xs text-ink-faint">
                            {account.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-ok" />
                          {selectedAccountId === account.id && (
                            <CheckIcon className="h-4 w-4 shrink-0 text-accent" />
                          )}
                        </div>
                      </button>
                    ))}

                    {/* Failed Accounts Section */}
                    {accounts.some(account => account.isActive === false) && (
                      <>
                        <div className="my-2 border-t border-line-soft" />
                        <div className="px-3 py-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-halt">
                            Authentication Failed
                          </p>
                        </div>
                        {accounts.filter(account => account.isActive === false).map((account) => (
                          <div
                            key={account.id}
                            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 opacity-60"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-halt">{account.name}</p>
                              <p className="text-xs text-halt">
                                {(account as any).error || 'Connection failed'}
                              </p>
                            </div>
                            <span className="flex h-2 w-2 rounded-full bg-halt" />
                          </div>
                        ))}
                      </>
                    )}

                    {accounts.length === 0 && !accountsLoading && (
                      <p className="px-3 py-4 text-center text-sm text-ink-faint">
                        No accounts configured
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Updated */}
          {lastUpdated !== undefined && (
            <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-2 text-xs lg:flex">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isRefreshing ? "animate-ping bg-accent" : "bg-ok"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isRefreshing ? "bg-accent" : "bg-ok"
                  }`}
                />
              </span>
              <span className="text-ink-muted">
                {isRefreshing ? "Refreshing..." : formatLastUpdated(lastUpdated)}
              </span>
            </div>
          )}

          {/* Refresh Button */}
          {showRefresh && onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn-secondary h-9 w-9 shrink-0 p-0"
              aria-label="Refresh data"
            >
              <RefreshIcon
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          )}

          {/* Theme toggle - the sidebar one is hidden on phones, so surface it here */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>

          {/* User Avatar */}
          <button className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet text-xs font-bold text-white shadow-sm transition-transform duration-200 hover:scale-105 sm:flex">
            CO
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {onSearchChange && (
        <div className="border-t border-line-soft px-4 py-2 lg:hidden">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="input pl-10 pr-4"
            />
          </div>
        </div>
      )}
    </header>
  );
}
