"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { navSections, mobileNavItems } from "./nav";
import AwsIcon from "./AwsIcon";
import ThemeToggle from "./ThemeToggle";
import { ChevronRightIcon } from "./Icons";

const awsIconMap: Record<string, "ec2" | "rds" | "eks" | "elb" | "s3"> = {
  "EC2 Instances": "ec2",
  "RDS Databases": "rds",
  "EKS Clusters": "eks",
  "Load Balancers": "elb",
  "S3 Storage": "s3",
};

type CollapsedState = Record<string, boolean>;

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<CollapsedState>(() => {
    // Initialize with default collapsed states
    const initial: CollapsedState = {};
    navSections.forEach((section) => {
      if (section.collapsible && section.defaultCollapsed) {
        initial[section.id] = true;
      }
    });
    return initial;
  });

  // Load saved collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed-sections");
      if (saved) {
        setCollapsedSections(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem("sidebar-collapsed-sections", JSON.stringify(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface transition-all duration-300 md:static ${
          isCollapsed ? "w-[72px]" : "w-64"
        } hidden md:flex`}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center border-b border-line px-4">
          <Link
            href="/overview"
            className={`flex items-center gap-3 transition-all duration-200 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet text-base font-bold text-white shadow-sm">
              C
            </span>
            {!isCollapsed && (
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight text-ink">
                  CloudOps
                </span>
                <span className="text-[10px] font-medium text-ink-faint">
                  Operations Platform
                </span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            {navSections.map((section) => {
              const isSectionCollapsed = collapsedSections[section.id];
              const hasActiveItem = section.items.some(
                (item) => pathname === item.href
              );

              return (
                <div key={section.id} className="mb-2">
                  {/* Section Header */}
                  {!isCollapsed ? (
                    section.collapsible ? (
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="group mb-1 flex w-full items-center justify-between px-3 py-1.5 text-left"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                          {section.title}
                        </span>
                        <ChevronRightIcon
                          className={`h-3 w-3 text-ink-faint transition-transform duration-200 ${
                            isSectionCollapsed ? "" : "rotate-90"
                          }`}
                        />
                      </button>
                    ) : (
                      <p className="mb-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                        {section.title}
                      </p>
                    )
                  ) : (
                    <div className="my-2 border-t border-line-soft" />
                  )}

                  {/* Section Items */}
                  {(!section.collapsible || !isSectionCollapsed || isCollapsed) && (
                    <div className="flex flex-col gap-0.5">
                      {section.items.map((item) => {
                        const active = pathname === item.href;
                        const awsIcon = awsIconMap[item.label];

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            title={isCollapsed ? item.label : undefined}
                            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                              isCollapsed ? "justify-center" : ""
                            } ${
                              active
                                ? "bg-accent-soft text-accent shadow-xs"
                                : "text-ink-muted hover:bg-surface-raised hover:text-ink"
                            }`}
                          >
                            {/* Active indicator */}
                            {active && (
                              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                            )}

                            {/* Icon */}
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                                active
                                  ? "bg-accent/10"
                                  : "bg-transparent group-hover:bg-surface-sunken"
                              }`}
                            >
                              {awsIcon ? (
                                <AwsIcon
                                  service={awsIcon}
                                  className={`h-[18px] w-[18px] transition-transform duration-200 ${
                                    active ? "" : "group-hover:scale-110"
                                  }`}
                                />
                              ) : (
                                <item.Icon
                                  className={`h-[18px] w-[18px] transition-transform duration-200 ${
                                    active ? "" : "group-hover:scale-110"
                                  }`}
                                />
                              )}
                            </span>

                            {/* Label */}
                            {!isCollapsed && (
                              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                <span className="truncate">{item.label}</span>
                                {item.placeholder && (
                                  <span className="shrink-0 rounded bg-surface-sunken px-1.5 py-0.5 text-[9px] font-medium text-ink-faint">
                                    Soon
                                  </span>
                                )}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Collapsed section indicator */}
                  {section.collapsible && isSectionCollapsed && !isCollapsed && hasActiveItem && (
                    <div className="ml-3 mt-1 flex items-center gap-2 text-[10px] text-accent">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>Active item in section</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-line p-3">
          {/* Theme toggle and collapse button */}
          <div
            className={`flex items-center gap-2 ${
              isCollapsed ? "flex-col" : "justify-between"
            }`}
          >
            <ThemeToggle />
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-all duration-200 hover:bg-surface-raised hover:text-ink"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 transition-transform duration-300 ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>

          {/* Status card - only when expanded */}
          {!isCollapsed && (
            <div className="mt-3 rounded-xl border border-line bg-surface-raised p-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
                </span>
                <p className="text-xs font-medium text-ink-muted">
                  System Healthy
                </p>
              </div>
              <p className="mt-1.5 text-[10px] text-ink-faint">
                All AWS services operational
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="nav-safe fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line bg-surface/95 backdrop-blur-lg md:hidden">
        {mobileNavItems.map((item) => {
          const active = pathname === item.href;
          const awsIcon = awsIconMap[item.label];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2.5 ${
                active ? "text-accent" : "text-ink-muted"
              }`}
            >
              {awsIcon ? (
                <AwsIcon service={awsIcon} className="h-5 w-5 shrink-0" />
              ) : (
                <item.Icon className="h-5 w-5 shrink-0" />
              )}
              <span className="w-full truncate text-center text-[10px] font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
