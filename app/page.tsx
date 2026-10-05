"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to overview page immediately
    router.replace('/overview');
  }, [router]);

  // Show minimal loading state during redirect
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-ink-muted">Loading CloudOps Platform...</span>
      </div>
    </div>
  );
}
