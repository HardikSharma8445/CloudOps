"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./Icons";

type Props = {
  value: string;
  label?: string;
  /** Fade the button in only on row/field hover. */
  subtle?: boolean;
  className?: string;
};

function legacyCopy(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  if (!ok) throw new Error("copy command was rejected");
}

async function writeToClipboard(text: string) {
  // The async Clipboard API needs a secure context AND document focus, so fall
  // back to the legacy path whenever it is unavailable or gets rejected.
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      legacyCopy(text);
      return;
    }
  }

  legacyCopy(text);
}

export default function CopyButton({
  value,
  label = "value",
  subtle = false,
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleCopy = async (event: React.MouseEvent) => {
    // Never let a copy click bubble into a row click / drawer open.
    event.stopPropagation();

    try {
      await writeToClipboard(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied" : `Copy ${label}`}
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
        copied
          ? "scale-110 border-ok/40 bg-ok/10 text-ok"
          : "border-line bg-surface-raised text-ink-faint hover:scale-105 hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
      } ${
        subtle && !copied
          ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          : "opacity-100"
      } ${className}`}
    >
      {copied ? (
        <CheckIcon className="pop-enter h-3 w-3" />
      ) : (
        <CopyIcon className="h-3 w-3" />
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}
