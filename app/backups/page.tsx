"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { BackupIcon } from "@/components/Icons";

export default function BackupsPage() {
  return (
    <PlaceholderPage
      title="Backup Management"
      subtitle="Disaster recovery"
      serviceName="Backups & DR"
      description="Monitor AWS Backup jobs, EBS snapshots, and AMI management across accounts."
      Icon={BackupIcon}
      features={[
        "AWS Backup plan overview",
        "Protected resources inventory",
        "Recent backup job status",
        "EBS snapshot management",
        "AMI inventory and age tracking",
        "Backup compliance monitoring",
      ]}
    />
  );
}
