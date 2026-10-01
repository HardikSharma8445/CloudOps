"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { ActivityIcon } from "@/components/Icons";

export default function ActivityPage() {
  return (
    <PlaceholderPage
      title="Activity Log"
      subtitle="CloudTrail events"
      serviceName="Activity & Audit"
      description="View recent infrastructure changes and API activity from CloudTrail."
      Icon={ActivityIcon}
      features={[
        "Recent API activity timeline",
        "Filter by user, service, and action",
        "Resource modification history",
        "Security-related events",
        "Cross-account activity view",
        "Export activity reports",
      ]}
    />
  );
}
