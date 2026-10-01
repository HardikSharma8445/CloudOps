"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { IamIcon } from "@/components/Icons";

export default function IamPage() {
  return (
    <PlaceholderPage
      title="IAM Management"
      subtitle="Identity & Access"
      serviceName="IAM Overview"
      description="Review IAM users, roles, and access patterns across your AWS accounts."
      Icon={IamIcon}
      features={[
        "User and role inventory",
        "Access key age and last used",
        "MFA status for users",
        "Console access tracking",
        "Policy attachment overview",
        "Cross-account role detection",
      ]}
    />
  );
}
