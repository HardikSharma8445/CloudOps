"use client";

import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import StatCards, { StatCardsSkeleton } from "@/components/StatCards";
import ResourceTable, { ResourceTableSkeleton } from "@/components/ResourceTable";
import DetailsDrawer from "@/components/DetailsDrawer";
import { SearchIcon } from "@/components/Icons";
import { 
  NameCell, 
  StatusCell, 
  DateCell 
} from "@/components/cells";
import { 
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  GearIcon
} from "@/components/Icons";
import type {
  SecurityFinding,
  SecurityOverview,
  SecuritySummary,
  SecuritySeverity,
  SecurityStatus
} from "@/data/securityData";
import type { Column, Stat, DrawerContent, Tone } from "@/components/types";
import { useFilters } from "@/components/FilterContext";
import { getAccounts, type AwsAccountInfo } from "@/lib/dashboardApi";

const severityTone = (severity: SecuritySeverity): Tone => {
  switch (severity) {
    case "CRITICAL": return "halt";
    case "HIGH": return "warn";
    case "MEDIUM": return "violet";
    case "LOW": return "info";
    default: return "neutral";
  }
};

const statusTone = (status: SecurityStatus): Tone => {
  switch (status) {
    case "REVIEW_REQUIRED": return "warn";
    case "HEALTHY": return "ok";
    case "NOT_CONFIGURED": return "neutral";
    case "DETECTED": return "info";
    case "UNKNOWN": return "neutral";
    default: return "neutral";
  }
};

export default function SecurityPage() {
  const { selectedAccountId, setSelectedAccountId } = useFilters();
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [accounts, setAccounts] = useState<AwsAccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SecuritySeverity | "ALL">("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<SecurityStatus | "ALL">("ALL");

  const fetchSecurityData = async (accountId: string = "all", forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        account: accountId,
        ...(forceRefresh && { refresh: "true" }),
      });

      const response = await fetch(`/api/security?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch security data");
      }

      setFindings(data.findings || []);
      setOverview(data.overview || null);
    } catch (err: any) {
      console.error("Error fetching security data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await getAccounts();
      if (data.success && data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!accountsLoading) {
      fetchSecurityData(selectedAccountId);
    }
  }, [selectedAccountId, accountsLoading]);

  // Filter findings
  const filteredFindings = useMemo(() => {
    let filtered = findings;

    // Apply filters
    if (severityFilter !== "ALL") {
      filtered = filtered.filter(f => f.severity === severityFilter);
    }
    if (serviceFilter !== "ALL") {
      filtered = filtered.filter(f => f.service === serviceFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(finding =>
        finding.title.toLowerCase().includes(term) ||
        finding.resourceName?.toLowerCase().includes(term) ||
        finding.resourceId.toLowerCase().includes(term) ||
        finding.accountName.toLowerCase().includes(term) ||
        finding.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [findings, severityFilter, serviceFilter, statusFilter, searchQuery]);

  const findingColumns: Column<SecurityFinding>[] = [
    {
      header: "Severity",
      render: (finding) => (
        <StatusCell 
          status={finding.severity} 
          tone={severityTone(finding.severity)} 
        />
      ),
    },
    {
      header: "Finding",
      render: (finding) => (
        <NameCell
          name={finding.title}
          metadata={finding.resourceId}
          tone={severityTone(finding.severity)}
        />
      ),
    },
    {
      header: "Service",
      render: (finding) => (
        <span className="text-ink-base font-medium">{finding.service}</span>
      ),
    },
    {
      header: "Resource",
      render: (finding) => (
        <div className="flex flex-col">
          <span className="text-ink-base">{finding.resourceName || finding.resourceId}</span>
          <span className="text-xs text-ink-faint font-mono">{finding.resourceId}</span>
        </div>
      ),
    },
    {
      header: "Account",
      render: (finding) => (
        <div className="flex flex-col">
          <span className="text-ink-base">{finding.accountName}</span>
          <span className="text-xs text-ink-faint">{finding.region}</span>
        </div>
      ),
    },
    {
      header: "Status",
      render: (finding) => (
        <StatusCell 
          status={finding.status.replace(/_/g, ' ')} 
          tone={statusTone(finding.status)} 
        />
      ),
    },
    {
      header: "Detected",
      render: (finding) => <DateCell date={new Date(finding.detectedAt).toLocaleDateString()} />,
    },
  ];

  // Stats from overview
  const stats: Stat[] = overview ? [
    {
      label: "Critical",
      value: overview.critical,
      Icon: AlertTriangleIcon,
      tone: "halt",
      fill: overview.totalFindings > 0 ? overview.critical / overview.totalFindings : 0,
      note: "Require immediate attention",
    },
    {
      label: "High Priority",
      value: overview.high,
      Icon: AlertTriangleIcon,
      tone: "warn",
      fill: overview.totalFindings > 0 ? overview.high / overview.totalFindings : 0,
      note: "Should be reviewed soon",
    },
    {
      label: "Review Required",
      value: overview.reviewRequired,
      Icon: ClockIcon,
      tone: "violet",
      fill: overview.totalFindings > 0 ? overview.reviewRequired / overview.totalFindings : 0,
      note: "Need attention",
    },
    {
      label: "Healthy",
      value: overview.healthy,
      Icon: CheckCircleIcon,
      tone: "ok",
      fill: 1,
      note: "No issues detected",
    },
  ] : [];

  // Get unique services for filter
  const availableServices = useMemo(() => {
    const services = new Set(findings.map(f => f.service));
    return Array.from(services).sort();
  }, [findings]);

  const toDrawer = (finding: SecurityFinding): DrawerContent => {
    return {
      heading: finding.title,
      status: { 
        label: finding.status.replace(/_/g, ' '),
        tone: statusTone(finding.status)
      },
      chips: [finding.severity, finding.service],
      sections: [
        {
          title: "Finding Details",
          Icon: ShieldIcon,
          fields: [
            { label: "Severity", value: finding.severity },
            { label: "Service", value: finding.service },
            { label: "Status", value: finding.status.replace(/_/g, ' ') },
            { label: "Description", value: finding.description },
          ],
        },
        {
          title: "Resource",
          Icon: GearIcon,
          fields: [
            { label: "Resource ID", value: finding.resourceId, mono: true },
            { label: "Resource Name", value: finding.resourceName || "N/A" },
            { label: "Account", value: finding.accountName },
            { label: "Region", value: finding.region },
          ],
        },
        {
          title: "Recommendation",
          Icon: CheckCircleIcon,
          fields: [
            { label: "Recommended Action", value: finding.recommendation || "Review this finding and take appropriate action." },
            { label: "Detected At", value: new Date(finding.detectedAt).toLocaleString() },
          ],
        },
      ],
    };
  };

  const isFirstLoad = loading && findings.length === 0 && !error;

  return (
    <>
      <Header
        title="Security Center"
        subtitle="Centralized security monitoring"
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        accountsLoading={accountsLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search security findings..."
        showRefresh
        onRefresh={() => fetchSecurityData(selectedAccountId, true)}
        isRefreshing={loading}
      />

      {/* Error Banner */}
      {error && (
        <div className="border-b border-halt/20 bg-halt-soft px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldIcon className="h-5 w-5 shrink-0 text-halt" />
              <p className="text-sm text-ink">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
            <button
              onClick={() => fetchSecurityData(selectedAccountId, true)}
              className="btn-secondary h-8 px-3 text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Security Center</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Centralized security posture monitoring across your AWS infrastructure
          </p>
        </div>

        {/* Stats */}
        {isFirstLoad ? <StatCardsSkeleton count={4} /> : <StatCards stats={stats} />}

        {/* Filters */}
        <div className="mt-8 mb-4 flex flex-wrap gap-3">
          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SecuritySeverity | "ALL")}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="ALL">All Services</option>
            {availableServices.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SecurityStatus | "ALL")}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="HEALTHY">Healthy</option>
            <option value="NOT_CONFIGURED">Not Configured</option>
            <option value="DETECTED">Detected</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>

        {/* Table Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">Security Findings</h2>
              <span className="rounded-full border border-line bg-surface-raised px-2.5 py-0.5 text-xs font-medium tabular-nums text-ink-muted">
                {filteredFindings.length}
                {filteredFindings.length !== findings.length && (
                  <span className="text-ink-faint"> of {findings.length}</span>
                )}
              </span>
            </div>
          </div>

          {isFirstLoad ? (
            <ResourceTableSkeleton columns={7} rows={5} />
          ) : (
            <ResourceTable
              rows={filteredFindings}
              columns={findingColumns}
              getId={(finding) => finding.id}
              rowLabel={(finding) => finding.title}
              selectedId={selectedFinding?.id || null}
              onSelect={setSelectedFinding}
              emptyMessage={
                searchQuery || severityFilter !== "ALL" || serviceFilter !== "ALL" || statusFilter !== "ALL"
                  ? "No findings match your criteria"
                  : "No security findings detected"
              }
              emptySubtitle={
                searchQuery || severityFilter !== "ALL" || serviceFilter !== "ALL" || statusFilter !== "ALL"
                  ? "Try adjusting your filters or search terms"
                  : "Your security posture looks good!"
              }
            />
          )}

          <p className="mt-3 text-xs text-ink-faint">
            Click on a finding to view details and recommendations. Data refreshes every 5 minutes.
          </p>
        </section>
      </div>

      <DetailsDrawer
        title="Security Finding Details"
        content={selectedFinding ? toDrawer(selectedFinding) : null}
        onClose={() => setSelectedFinding(null)}
      />
    </>
  );
}
