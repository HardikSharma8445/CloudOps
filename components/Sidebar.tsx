"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav";
import AwsIcon from "./AwsIcon";

const iconMap: Record<string, "ec2" | "rds" | "eks" | "elb" | "s3"> = {
  EC2: "ec2",
  RDS: "rds",
  EKS: "eks",
  ALB: "elb",
  S3: "s3",
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line-soft bg-surface md:flex">
      <Link
        href="/overview"
        className="flex h-16 items-center gap-3 border-b border-line-soft px-5 transition-all duration-200 hover:bg-surface-raised"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet text-[14px] font-bold text-white shadow-sm transition-transform duration-200 hover:scale-110">
          A
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold tracking-tight">
            AWS Dashboard
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Infrastructure
          </span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1 p-3">
        <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Services
        </p>

        {navItems.map(({ label, href, Icon, count }) => {
          const active = pathname === href;
          const awsIcon = iconMap[label];

          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                active
                  ? "border border-accent/25 bg-accent/10 font-semibold text-accent shadow-sm"
                  : "border border-transparent text-ink-muted hover:scale-[1.02] hover:border-line hover:bg-surface-raised hover:text-ink hover:shadow-sm"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-all duration-300" />
              )}
              {awsIcon ? (
                <AwsIcon
                  service={awsIcon}
                  className={`h-[17px] w-[17px] transition-transform duration-200 ${
                    active ? "" : "group-hover:scale-110"
                  }`}
                />
              ) : (
                <Icon className="h-[17px] w-[17px]" />
              )}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                {label}
              </span>
              {count !== null && (
                <span
                  className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-all duration-200 ${
                    active
                      ? "bg-accent/15 text-accent"
                      : "bg-surface-raised text-ink-faint group-hover:bg-accent/10 group-hover:text-accent"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <div className="rounded-xl border border-line bg-surface-raised p-3.5">
          <p className="text-[11px] font-semibold text-ink-muted">
            UI Prototype
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
            Mock data only. No AWS account is connected.
          </p>
        </div>
      </div>
    </aside>
  );
}
