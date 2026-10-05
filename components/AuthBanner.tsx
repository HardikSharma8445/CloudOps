"use client";

import { useEffect, useState } from "react";
import { AlertTriangleIcon, CheckCircleIcon, XIcon } from "./Icons";
import type { AwsAccountInfo } from "@/lib/dashboardApi";

type AuthStatus = {
  workingAccounts: AwsAccountInfo[];
  failedAccounts: Array<{ name: string; error: string }>;
  loading: boolean;
};

export default function AuthBanner() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    workingAccounts: [],
    failedAccounts: [],
    loading: true,
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch('/api/accounts');
        const data = await response.json();
        
        if (data.success) {
          // Count working and failed accounts from response
          const working = data.accounts?.filter((acc: any) => acc.isActive !== false) || [];
          const failed: Array<{ name: string; error: string }> = [];
          
          // Get failed accounts from the accounts array
          const failedFromAccounts = data.accounts?.filter((acc: any) => acc.isActive === false) || [];
          failedFromAccounts.forEach((acc: any) => {
            failed.push({
              name: acc.name,
              error: acc.error || 'Authentication failed'
            });
          });
          
          // Also check response-level failed accounts
          if (data.failedAccounts) {
            failed.push(...data.failedAccounts);
          }
          
          // Check if we have counts indicating failures
          if (data.failedCount > 0 && failed.length === 0) {
            // If we have failedCount but no specific errors, create generic entries
            failed.push({
              name: `${data.failedCount} account${data.failedCount > 1 ? 's' : ''}`,
              error: 'Authentication failed'
            });
          }

          setAuthStatus({
            workingAccounts: working,
            failedAccounts: failed,
            loading: false,
          });
        } else {
          // If the API itself failed, check if it's due to authentication
          if (data.failedAccounts) {
            setAuthStatus({
              workingAccounts: [],
              failedAccounts: data.failedAccounts,
              loading: false,
            });
          } else {
            setAuthStatus(prev => ({ ...prev, loading: false }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch authentication status:', error);
        setAuthStatus(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAuthStatus();
  }, []);

  // Don't show banner if loading, no failed accounts, or dismissed
  if (authStatus.loading || authStatus.failedAccounts.length === 0 || dismissed) {
    return null;
  }

  return (
    <div className="border-b border-warn/20 bg-warn-soft">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 py-3 sm:items-center sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-warn sm:mt-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              Authentication Failed for {authStatus.failedAccounts.length} AWS Account{authStatus.failedAccounts.length > 1 ? 's' : ''}
            </p>
            <p className="break-words text-xs text-ink-muted">
              {authStatus.failedAccounts.map(acc => acc.name).join(', ')} - Check AWS credentials in configuration
            </p>
          </div>
        </div>
        
        <div className="flex shrink-0 items-center gap-3">
          {/* Working accounts indicator */}
          {authStatus.workingAccounts.length > 0 && (
            <div className="hidden items-center gap-2 sm:flex">
              <CheckCircleIcon className="h-4 w-4 text-ok" />
              <span className="text-xs font-medium text-ink-muted">
                {authStatus.workingAccounts.length} account{authStatus.workingAccounts.length > 1 ? 's' : ''} connected
              </span>
            </div>
          )}
          
          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-warn/20 hover:text-ink"
            aria-label="Dismiss authentication warning"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}