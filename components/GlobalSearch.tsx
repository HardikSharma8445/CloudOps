"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, CloseIcon, CommandIcon, ServerIcon, BucketIcon } from "./Icons";
import type { Ec2Instance } from "@/data/ec2Data";
import type { S3Bucket } from "@/data/s3Data";
import { getEc2Instances, getS3Buckets } from "@/lib/dashboardApi";

// ============================================================================
// Types
// ============================================================================

type SearchResultType = "ec2" | "s3";

type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  status?: string;
  statusTone?: "ok" | "halt" | "warn" | "neutral";
  icon: "ec2" | "s3";
  data: Ec2Instance | S3Bucket;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// ============================================================================
// Helper Functions
// ============================================================================

function getEc2SearchFields(instance: Ec2Instance): string[] {
  return [
    instance.name,
    instance.id,
    instance.privateIp,
    instance.publicIp,
    instance.instanceType,
    instance.amiId,
    instance.iamRole,
    instance.region,
    instance.regionName,
    instance.vpcId,
    instance.subnetId,
    ...instance.securityGroups.map((sg) => sg.name),
    ...instance.securityGroups.map((sg) => sg.id),
    ...Object.keys(instance.tags),
    ...Object.values(instance.tags),
  ].filter(Boolean) as string[];
}

function getS3SearchFields(bucket: S3Bucket): string[] {
  return [
    bucket.name,
    bucket.region,
    bucket.regionName,
    bucket.encryption,
    bucket.versioning,
    bucket.publicAccess,
    ...Object.keys(bucket.tags),
    ...Object.values(bucket.tags),
  ].filter(Boolean) as string[];
}

function ec2ToSearchResult(instance: Ec2Instance): SearchResult {
  return {
    id: `ec2-${instance.id}`,
    type: "ec2",
    title: instance.name || instance.id,
    subtitle: `${instance.instanceType} · ${instance.regionName}`,
    description: `${instance.privateIp}${instance.publicIp ? ` · ${instance.publicIp}` : ""}`,
    href: "/",
    status: instance.status,
    statusTone: instance.status === "running" ? "ok" : "halt",
    icon: "ec2",
    data: instance,
  };
}

function s3ToSearchResult(bucket: S3Bucket): SearchResult {
  return {
    id: `s3-${bucket.id}`,
    type: "s3",
    title: bucket.name,
    subtitle: `S3 Bucket · ${bucket.regionName}`,
    description: `${bucket.publicAccess} · ${bucket.encryption}`,
    href: "/s3",
    status: bucket.publicAccess,
    statusTone: bucket.publicAccess === "Blocked" ? "ok" : "warn",
    icon: "s3",
    data: bucket,
  };
}

// ============================================================================
// Components
// ============================================================================

function SearchResultItem({
  result,
  isSelected,
  onClick,
}: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusTones: Record<string, string> = {
    ok: "bg-ok text-white",
    halt: "bg-halt text-white",
    warn: "bg-warn text-white",
    neutral: "bg-ink-faint text-white",
  };

  const iconComponents = {
    ec2: ServerIcon,
    s3: BucketIcon,
  };

  const Icon = iconComponents[result.icon];

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all ${
        isSelected
          ? "bg-accent-soft ring-2 ring-accent/30"
          : "hover:bg-surface-raised"
      }`}
    >
      {/* Icon */}
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
          isSelected
            ? "border-accent/30 bg-accent/10"
            : "border-line bg-surface-raised"
        }`}
      >
        <Icon className="h-5 w-5 text-ink-muted" />
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{result.title}</p>
          {result.status && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                statusTones[result.statusTone || "neutral"]
              }`}
            >
              {result.status}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-ink-muted">{result.subtitle}</p>
        <p className="truncate text-[10px] text-ink-faint">{result.description}</p>
      </div>

      {/* Type Badge */}
      <span className="shrink-0 rounded-lg border border-line bg-surface-raised px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-ink-faint">
        {result.type}
      </span>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-ink-muted">Loading resources...</p>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center py-12">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-raised">
        <SearchIcon className="h-6 w-6 text-ink-faint" />
      </span>
      <p className="mt-4 text-sm font-medium text-ink">No results found</p>
      <p className="mt-1 text-xs text-ink-muted">
        No resources match &quot;{query}&quot;
      </p>
    </div>
  );
}

function InitialState() {
  return (
    <div className="py-8">
      <p className="text-center text-sm text-ink-muted">
        Start typing to search across all resources
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {[
          "Instance ID (i-xxx)",
          "Bucket name",
          "IP address",
          "Security group",
          "Region",
          "Tags",
        ].map((hint) => (
          <span
            key={hint}
            className="rounded-lg border border-line bg-surface-raised px-2.5 py-1 text-xs text-ink-faint"
          >
            {hint}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function GlobalSearch({ isOpen, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ec2Data, setEc2Data] = useState<Ec2Instance[]>([]);
  const [s3Data, setS3Data] = useState<S3Bucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data when opening
  useEffect(() => {
    if (isOpen && !dataLoaded) {
      setLoading(true);
      Promise.all([getEc2Instances("all"), getS3Buckets("all")])
        .then(([ec2Response, s3Response]) => {
          if (ec2Response.success) setEc2Data(ec2Response.instances);
          if (s3Response.success) setS3Data(s3Response.buckets);
          setDataLoaded(true);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, dataLoaded]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search results
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const term = query.toLowerCase();
    const matches: SearchResult[] = [];

    // Search EC2 instances
    for (const instance of ec2Data) {
      const fields = getEc2SearchFields(instance);
      if (fields.some((field) => field.toLowerCase().includes(term))) {
        matches.push(ec2ToSearchResult(instance));
      }
    }

    // Search S3 buckets
    for (const bucket of s3Data) {
      const fields = getS3SearchFields(bucket);
      if (fields.some((field) => field.toLowerCase().includes(term))) {
        matches.push(s3ToSearchResult(bucket));
      }
    }

    // Sort by relevance (title match first)
    matches.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(term);
      const bTitle = b.title.toLowerCase().includes(term);
      if (aTitle && !bTitle) return -1;
      if (bTitle && !aTitle) return 1;
      return a.title.localeCompare(b.title);
    });

    return matches.slice(0, 20); // Limit to 20 results
  }, [query, ec2Data, s3Data]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedIndex, onClose]
  );

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      // Navigate to the page and store selected item in sessionStorage for highlighting
      sessionStorage.setItem(
        "globalSearch:selected",
        JSON.stringify({
          type: result.type,
          id: result.type === "ec2" ? (result.data as Ec2Instance).id : (result.data as S3Bucket).id,
        })
      );
      router.push(result.href);
      onClose();
    },
    [router, onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-xl md:inset-x-auto">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-4">
          <SearchIcon className="h-5 w-5 shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search resources by name, ID, IP, tags..."
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden rounded border border-line bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium text-ink-faint sm:inline">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-raised hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading ? (
            <LoadingState />
          ) : !query.trim() ? (
            <InitialState />
          ) : results.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((result, index) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  isSelected={index === selectedIndex}
                  onClick={() => handleSelect(result)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line bg-surface-raised px-4 py-2">
          <div className="flex items-center gap-4 text-[10px] text-ink-faint">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1 py-0.5 font-mono">↑</kbd>
              <kbd className="rounded border border-line bg-surface px-1 py-0.5 font-mono">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono">↵</kbd>
              Select
            </span>
          </div>
          <p className="text-[10px] text-ink-faint">
            {results.length > 0 && `${results.length} result${results.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Provider Component (wraps app to handle keyboard shortcut)
// ============================================================================

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {children}
      <GlobalSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
