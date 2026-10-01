"use client";

import { useEffect } from "react";
import CopyButton from "./CopyButton";
import StatusBadge from "./StatusBadge";
import { CloseIcon } from "./Icons";
import type { DrawerContent, Field, IconComponent } from "./types";

type Props = {
  title: string;
  content: DrawerContent | null;
  onClose: () => void;
};

function FieldRow({ field }: { field: Field }) {
  const copyable = field.copyable !== false && field.value !== "—";

  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-surface-raised">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
          {field.label}
        </p>
        <p
          className={`mt-1.5 break-all text-sm font-medium text-ink ${
            field.mono ? "font-mono text-xs" : ""
          }`}
        >
          {field.value}
        </p>
      </div>

      {copyable && (
        <div className="pt-5">
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
    <section className="border-b border-line-soft px-2 py-4 last:border-b-0">
      <div className="mb-2 flex items-center gap-2 px-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-raised">
          <Icon className="h-3.5 w-3.5 text-ink-faint" />
        </span>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
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
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="overlay-enter fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        key={content.heading}
        className="drawer-enter fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-drawer"
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line px-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {title}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CopyButton
              value={buildSummary(content)}
              label="all details"
              size="md"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details panel"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-raised text-ink-muted transition-all duration-200 hover:border-halt/30 hover:bg-halt-soft hover:text-halt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Hero Section */}
          <div className="border-b border-line bg-gradient-to-br from-accent-soft via-surface to-surface px-6 py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="break-all text-xl font-semibold tracking-tight text-ink">
                  {content.heading}
                </h3>
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
                      className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
              <CopyButton value={content.heading} label="name" />
            </div>
          </div>

          {/* Sections */}
          <div className="pb-4">
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
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-surface-raised px-5 py-3">
          <p className="text-[11px] text-ink-faint">
            Press <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close
          </p>
          <button
            onClick={onClose}
            className="btn-secondary h-8 px-3 text-xs"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
