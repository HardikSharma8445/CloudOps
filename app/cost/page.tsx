"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { DollarIcon } from "@/components/Icons";

export default function CostPage() {
  return (
    <PlaceholderPage
      title="Cost Explorer"
      subtitle="FinOps & Billing"
      serviceName="Cost & FinOps"
      description="Track AWS spending, identify cost anomalies, and optimize resource utilization."
      Icon={DollarIcon}
      features={[
        "Current month spend vs previous month",
        "Cost breakdown by service, account, and region",
        "Daily and monthly cost trends",
        "Budget tracking and alerts",
        "Cost anomaly detection",
        "Idle resource identification",
      ]}
    />
  );
}
