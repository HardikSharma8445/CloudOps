"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { ShieldIcon } from "@/components/Icons";

export default function SecurityPage() {
  return (
    <PlaceholderPage
      title="Security Center"
      subtitle="Security posture"
      serviceName="Security Center"
      description="Centralized security monitoring and vulnerability assessment across your AWS infrastructure."
      Icon={ShieldIcon}
      features={[
        "Security Group analysis (open ports, 0.0.0.0/0 rules)",
        "S3 bucket security posture",
        "Public resource detection",
        "GuardDuty findings summary (if enabled)",
        "Security Hub integration (if enabled)",
        "IAM access key age monitoring",
      ]}
    />
  );
}
