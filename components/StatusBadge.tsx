import { badgeTone, dotTone, type Tone } from "./types";

type Props = {
  label: string;
  tone: Tone;
  pulse?: boolean;
  size?: "sm" | "md";
};

export default function StatusBadge({
  label,
  tone,
  pulse = false,
  size = "sm",
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold capitalize transition-all duration-200 ${
        size === "md" ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[11px]"
      } ${badgeTone[tone]}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotTone[tone]}`}
            style={{ animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
          />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotTone[tone]}`}
        />
      </span>
      {label}
    </span>
  );
}
