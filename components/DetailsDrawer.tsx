"use client";

import { useEffect } from "react";
import CopyButton from "./CopyButton";
import StatusBadge from "./StatusBadge";
import { ClockIcon, CloseIcon } from "./Icons";
import type { DrawerContent, Field, IconComponent } from "./types";

type Props = {
  title: string;
  content: DrawerContent | null;
  onClose: () => void;
};

function FieldRow({ field }: { field: Field }) {
  const copyable = field.copyable !== false;

  return (
    <div className="group flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-raised">
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
          {field.label}
        </p>
        <p
          className={`mt-1 break-all text-[13.5px] font-medium text-ink ${
            field.mono ? "font-mono text-[12.5px]" : ""
          }`}
        >
          {field.value}
        </p>
      </div>

      {copyable && (
        <div className="pt-4">
          <CopyButton value={field.value} label={field.label.toLowerCase()} />
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: IconComponent;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line-soft px-3 py-4 last:border-b-0">
      <div className="mb-1 flex items-center gap-2 px-3">
        <Icon className="h-3.5 w-3.5 text-ink-faint" />
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          {title}
        </h4>
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function buildSummary(content: DrawerContent) {
  const lines = [
    `Name: ${content.heading}`,
    `Status: ${content.status.label}`,
    ...content.sections.flatMap((section) =>
      section.fields.map((field) => `${field.label}: ${field.value}`)
    ),
  ];
  return lines.join("\n");
}

export default function DetailsDrawer({ title, content, onClose }: Props) {
  useEffect(() => {
    if (!content) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [content, onClose]);

  if (!content) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="overlay-enter fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        key={content.heading}
        className="drawer-enter shadow-drawer fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-line bg-surface"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line px-5">
          <h2 className="truncate text-[13px] font-bold uppercase tracking-[0.1em] text-ink-muted">
            {title}
          </h2>

          <div className="flex shrink-0 items-center gap-2">
            <CopyButton
              value={buildSummary(content)}
              label="all details"
              className="h-8 w-8"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details panel"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface-raised text-ink-muted transition-colors hover:border-halt/40 hover:bg-halt/10 hover:text-halt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-line bg-gradient-to-br from-accent/10 via-transparent to-transparent px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="break-all text-[19px] font-semibold tracking-tight">
                {content.heading}
              </h3>
              <div className="shrink-0 pt-1">
                <CopyButton value={content.heading} label="name" />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge
                label={content.status.label}
                tone={content.status.tone}
                pulse={content.status.pulse}
                size="md"
              />
              {content.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-ink-muted"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {content.sections.map((section) => (
            <SectionBlock
              key={section.title}
              title={section.title}
              Icon={section.Icon}
            >
              {section.fields.map((field) => (
                <FieldRow key={field.label} field={field} />
              ))}
            </SectionBlock>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-line bg-surface-raised px-5 py-3">
          <ClockIcon className="h-3.5 w-3.5 text-ink-faint" />
          <p className="text-[11px] text-ink-faint">
            Mock data — press Esc to close
          </p>
        </div>
      </aside>
    </>
  );
}
