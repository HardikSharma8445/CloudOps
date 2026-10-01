"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { BellIcon } from "@/components/Icons";

export default function AlarmsPage() {
  return (
    <PlaceholderPage
      title="CloudWatch Alarms"
      subtitle="Alert management"
      serviceName="CloudWatch Alarms"
      description="Monitor and track CloudWatch alarms across all your AWS accounts."
      Icon={BellIcon}
      features={[
        "Alarm status overview (OK, ALARM, INSUFFICIENT_DATA)",
        "Alarm history and state changes",
        "Metric thresholds and conditions",
        "SNS topic associations",
        "Filter by service, account, and region",
      ]}
    />
  );
}
