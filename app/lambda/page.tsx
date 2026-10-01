"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { LambdaIcon } from "@/components/Icons";

export default function LambdaPage() {
  return (
    <PlaceholderPage
      title="Lambda Functions"
      subtitle="Serverless compute"
      serviceName="AWS Lambda"
      description="Monitor and manage your serverless functions across all AWS accounts and regions."
      Icon={LambdaIcon}
      features={[
        "Function inventory with runtime, memory, and timeout details",
        "Invocation metrics and error rates",
        "Cold start monitoring",
        "Layer and version management",
        "Environment variable overview (non-sensitive)",
      ]}
    />
  );
}
