"use client";

import PlaceholderPage from "@/components/PlaceholderPage";
import { BotIcon } from "@/components/Icons";

export default function AiAssistantPage() {
  return (
    <PlaceholderPage
      title="AI Assistant"
      subtitle="Natural language queries"
      serviceName="CloudOps AI"
      description="Ask questions about your infrastructure using natural language."
      Icon={BotIcon}
      features={[
        '"Show all stopped EC2 instances"',
        '"Which accounts have the most resources?"',
        '"Find resources without Environment tag"',
        '"Show active CloudWatch alarms"',
        '"Which S3 buckets are not encrypted?"',
        '"List recent failed deployments"',
      ]}
    />
  );
}
