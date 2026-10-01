"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { ComplianceIcon } from "@/components/Icons";

export default function CompliancePage() {
  return (
    <PlaceholderPage
      title="Compliance"
      subtitle="Policy adherence"
      serviceName="Compliance Dashboard"
      description="Track infrastructure compliance against best practices and organizational policies."
      Icon={ComplianceIcon}
      features={[
        "Resource tagging compliance (Name, Environment, etc.)",
        "Encryption status checks (S3, RDS, EBS)",
        "Public access detection",
        "Backup policy compliance",
        "Security group rule violations",
        "Custom compliance rules",
      ]}
    />
  );
}
