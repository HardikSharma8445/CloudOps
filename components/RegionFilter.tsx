"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MapPinIcon, CheckIcon } from "./Icons";
import { AWS_REGIONS, getGroupedRegions, type AwsRegion } from "@/lib/regions";

export type RegionSelection = string | "all";

type Props = {
  /** Currently selected region code or "all" */
  selectedRegion: RegionSelection;
  /** Callback when region selection changes */
  onRegionChange: (region: RegionSelection) => void;
  /** Map of regionCode -> resource count */
  regionCounts?: Record<string, number>;
  /** Available regions (if provided, only these are shown; otherwise all AWS regions) */
  availableRegions?: string[];
  /** Show loading state */
  loading?: boolean;
  /** Compact mode (icon only on small screens) */
  compact?: boolean;
};

export default function RegionFilter({
  selectedRegion,
  onRegionChange,
  regionCounts = {},
  availableRegions,
  loading = false,
  compact = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get grouped regions, filtering by available regions if provided
  const groupedRegions = useMemo(() => {
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
  }, [availableRegions]);

  // Find selected region info
  const selectedRegionInfo = useMemo(() => {
    if (selectedRegion === "all") return null;
    return AWS_REGIONS.find((r) => r.code === selectedRegion);
  }, [selectedRegion]);

  // Calculate totals
  const allCount = useMemo(() => {
    return Object.values(regionCounts).reduce((sum, count) => sum + count, 0);
  }, [regionCounts]);

  const selectedCount = selectedRegion === "all" 
    ? allCount 
    : (regionCounts[selectedRegion] || 0);

  const displayName = selectedRegion === "all" 
    ? "All Regions" 
    : selectedRegionInfo?.shortName || selectedRegion;

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
        <MapPinIcon className="h-4 w-4 text-ink-faint" />
        <span className="text-sm text-ink-muted">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary h-9 px-3 text-sm"
        aria-label="Select region"
        title={selectedRegion === "all" ? "All Regions" : `${selectedRegionInfo?.name || selectedRegion}`}
      >
        <MapPinIcon className="h-4 w-4 text-ink-faint" />
        {!compact && (
          <span className="hidden max-w-[120px] truncate sm:inline">
            {displayName}
          </span>
        )}
        {selectedCount > 0 && !compact && (
          <span className="hidden rounded-md bg-surface-raised px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-faint sm:inline">
            {selectedCount}
          </span>
        )}
        <svg
          className={`h-4 w-4 text-ink-faint transition-transform duration-200 ${
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

      {/* Dropdown */}
      {isOpen && (
        <div className="slide-down-enter absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-dropdown">
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
                setIsOpen(false);
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
                {allCount > 0 && (
                  <span className="rounded-md bg-surface-raised px-2 py-1 text-[10px] font-semibold tabular-nums text-ink-muted">
                    {allCount}
                  </span>
                )}
                {selectedRegion === "all" && (
                  <CheckIcon className="h-4 w-4 shrink-0 text-accent" />
                )}
              </div>
            </button>

            {/* Grouped Regions */}
            {groupedRegions.map((group, groupIndex) => (
              <div key={group.group}>
                {/* Group Header */}
                <div className="mt-3 mb-1.5 px-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    {group.group}
                  </p>
                </div>

                {/* Region Items */}
                {group.regions.map((region) => {
                  const count = regionCounts[region.code] || 0;
                  const isSelected = selectedRegion === region.code;

                  return (
                    <button
                      key={region.code}
                      onClick={() => {
                        onRegionChange(region.code);
                        setIsOpen(false);
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
  );
}
