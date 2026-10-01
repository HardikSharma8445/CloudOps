"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { VpcIcon } from "@/components/Icons";

export default function VpcPage() {
  return (
    <PlaceholderPage
      title="VPC & Networking"
      subtitle="Network infrastructure"
      serviceName="VPC & Networking"
      description="Visualize and monitor your Virtual Private Cloud infrastructure, subnets, and network resources."
      Icon={VpcIcon}
      features={[
        "VPC inventory with CIDR blocks and tags",
        "Subnet mapping (public/private)",
        "NAT Gateway and Internet Gateway status",
        "Route table visualization",
        "Network ACL overview",
        "Elastic IP management",
      ]}
    />
  );
}
