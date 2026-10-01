"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { InventoryIcon } from "@/components/Icons";

export default function InventoryPage() {
  return (
    <PlaceholderPage
      title="Global Inventory"
      subtitle="All resources"
      serviceName="Resource Inventory"
      description="Comprehensive inventory of all AWS resources with powerful search and filtering."
      Icon={InventoryIcon}
      features={[
        "Cross-service resource search",
        "Filter by account, region, and tags",
        "Search by resource ID, name, IP, or ARN",
        "Resource relationship mapping",
        "Export inventory to CSV/JSON",
        "Tag-based grouping",
      ]}
    />
  );
}
