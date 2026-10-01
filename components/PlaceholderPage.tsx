"use client";

import Header from "./Header";
import { GearIcon } from "./Icons";

type Props = {
  title: string;
  subtitle?: string;
  serviceName: string;
  description: string;
  features?: string[];
  Icon: React.ComponentType<{ className?: string }>;
};

export default function PlaceholderPage({
  title,
  subtitle,
  serviceName,
  description,
  features = [],
  Icon,
}: Props) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />

      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-violet-soft border border-line">
            <Icon className="h-10 w-10 text-accent" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {serviceName}
          </h1>
          <p className="mt-3 max-w-xl text-base text-ink-muted">{description}</p>

          {/* Status Badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-warn/30 bg-warn-soft px-4 py-2">
            <GearIcon className="h-4 w-4 text-warn" />
            <span className="text-sm font-medium text-warn">Coming Soon</span>
          </div>

          {/* Features Preview */}
          {features.length > 0 && (
            <div className="mt-10 w-full max-w-md">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-muted">
                Planned Features
              </h3>
              <div className="rounded-xl border border-line bg-surface p-4">
                <ul className="space-y-3 text-left">
                  {features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-ink-muted"
                    >
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-medium text-ink-faint">
                        {index + 1}
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Configuration Note */}
          <div className="mt-10 rounded-xl border border-line bg-surface-raised p-6">
            <p className="text-sm text-ink-muted">
              This feature requires additional AWS permissions and configuration.
              <br />
              Check{" "}
              <span className="font-medium text-accent">Settings → AWS Services</span>{" "}
              for configuration options.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
