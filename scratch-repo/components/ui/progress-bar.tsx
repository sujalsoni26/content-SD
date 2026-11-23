import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  label: string;
  /** Text equivalent, e.g. "12 of 42 lessons". */
  valueText?: string;
  size?: "sm" | "md";
  tone?: "accent" | "good";
  className?: string;
}

export function ProgressBar({ value, label, valueText, size = "md", tone = "accent", className }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={valueText ?? `${pct}%`}
      className={cn("relative w-full overflow-hidden rounded-full border border-line bg-surface-2", size === "sm" ? "h-2" : "h-3", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone === "good" ? "bg-good" : "bg-accent",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Circular progress for module cards. */
export function ProgressRing({ value, size = 40, label }: { value: number; size?: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${pct}%`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-surface-3" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="fill-none stroke-good transition-[stroke-dashoffset] duration-700 ease-out"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
      />
    </svg>
  );
}
