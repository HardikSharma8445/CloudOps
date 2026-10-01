"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import {
  GearIcon,
  GlobeIcon,
  ShieldIcon,
  ServerIcon,
  ClockIcon,
  CheckIcon,
} from "@/components/Icons";
import { getAccounts, type AwsAccountInfo } from "@/lib/dashboardApi";

type SettingSection = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const sections: SettingSection[] = [
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize the look and feel of the dashboard",
    icon: GearIcon,
  },
  {
    id: "accounts",
    title: "AWS Accounts",
    description: "View connected AWS accounts",
    icon: GlobeIcon,
  },
  {
    id: "refresh",
    title: "Data Refresh",
    description: "Configure automatic data refresh intervals",
    icon: ClockIcon,
  },
  {
    id: "security",
    title: "Security",
    description: "Security settings and permissions",
    icon: ShieldIcon,
  },
];

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<AwsAccountInfo[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("120");

  useEffect(() => {
    getAccounts()
      .then((data) => {
        if (data.success && data.accounts) setAccounts(data.accounts);
      })
      .catch(console.error)
      .finally(() => setAccountsLoading(false));
  }, []);

  return (
    <>
      <Header title="Settings" />

      <div className="mx-auto max-w-4xl px-6 py-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Settings
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Configure your AWS Infrastructure Dashboard preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Appearance Section */}
          <section className="rise-enter rounded-2xl border border-line bg-surface p-6 shadow-card">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-accent">
                <GearIcon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-ink">Appearance</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Customize the look and feel of the dashboard
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-line-soft pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">Theme</p>
                  <p className="text-sm text-ink-muted">
                    Choose between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </section>

          {/* AWS Accounts Section */}
          <section className="rise-enter rounded-2xl border border-line bg-surface p-6 shadow-card" style={{ animationDelay: "50ms" }}>
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet/20 bg-violet-soft text-violet">
                <GlobeIcon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-ink">AWS Accounts</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Connected AWS accounts for this dashboard
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-line-soft pt-6">
              {accountsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 rounded-xl border border-line bg-surface-raised p-4">
                      <div className="skeleton h-10 w-10 rounded-xl" />
                      <div className="flex-1">
                        <div className="skeleton h-4 w-32" />
                        <div className="skeleton mt-2 h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : accounts.length > 0 ? (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-xl border border-line bg-surface-raised p-4 transition-colors hover:border-accent/20"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet text-sm font-bold text-white">
                          {account.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{account.name}</p>
                          <p className="font-mono text-xs text-ink-faint">{account.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-full border border-ok/20 bg-ok-soft px-2.5 py-1 text-xs font-medium text-ok">
                          <CheckIcon className="h-3 w-3" />
                          Connected
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-line bg-surface-raised p-6 text-center">
                  <ServerIcon className="mx-auto h-10 w-10 text-ink-faint" />
                  <p className="mt-3 text-sm font-medium text-ink">No accounts configured</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Add AWS credentials in your .env.local file
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Data Refresh Section */}
          <section className="rise-enter rounded-2xl border border-line bg-surface p-6 shadow-card" style={{ animationDelay: "100ms" }}>
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-warn/20 bg-warn-soft text-warn">
                <ClockIcon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-ink">Data Refresh</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Configure how often data is automatically refreshed
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-line-soft pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">Auto-refresh Interval</p>
                  <p className="text-sm text-ink-muted">
                    How often to fetch new data from AWS
                  </p>
                </div>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  className="rounded-xl border border-line bg-surface-raised px-4 py-2 text-sm font-medium text-ink focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10"
                >
                  <option value="60">1 minute</option>
                  <option value="120">2 minutes</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                </select>
              </div>

              <div className="mt-4 rounded-xl border border-line-soft bg-surface-raised/50 p-4">
                <p className="text-xs text-ink-faint">
                  <strong className="text-ink-muted">Note:</strong> Data is cached locally to reduce API calls. 
                  You can manually refresh at any time using the refresh button in the header.
                </p>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="rise-enter rounded-2xl border border-line bg-surface p-6 shadow-card" style={{ animationDelay: "150ms" }}>
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ok/20 bg-ok-soft text-ok">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-ink">Security</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Security information and best practices
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-line-soft pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-raised/50 p-4">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                  <div>
                    <p className="text-sm font-medium text-ink">Server-side API calls</p>
                    <p className="text-xs text-ink-faint">
                      AWS credentials are only used on the server. They are never exposed to the browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-raised/50 p-4">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                  <div>
                    <p className="text-sm font-medium text-ink">Read-only access</p>
                    <p className="text-xs text-ink-faint">
                      This dashboard only reads data from AWS. It cannot modify your infrastructure.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-raised/50 p-4">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                  <div>
                    <p className="text-sm font-medium text-ink">Local deployment</p>
                    <p className="text-xs text-ink-faint">
                      This dashboard runs locally on your machine. No data is sent to external services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="rise-enter rounded-2xl border border-line bg-surface p-6 shadow-card" style={{ animationDelay: "200ms" }}>
            <h2 className="text-lg font-semibold text-ink">About</h2>
            <p className="mt-2 text-sm text-ink-muted">
              AWS Infrastructure Dashboard is an internal tool for monitoring your AWS resources.
              Built with Next.js, React, and Tailwind CSS.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-ink-faint">
              <span>Version 0.1.0</span>
              <span>·</span>
              <span>Next.js 16</span>
              <span>·</span>
              <span>React 19</span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
