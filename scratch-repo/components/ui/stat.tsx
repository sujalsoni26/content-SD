import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "accent" | "good" | "bad" | "warn" | "amber" | "violet";

const valueTone: Record<Tone, string> = {
  neutral: "text-ink",
  accent: "text-accent",
  good: "text-good",
  bad: "text-bad",
  warn: "text-warn",
  amber: "text-amber-ink",
  violet: "text-violet",
};

export function Stat({ label, value, tone = "neutral" }: { label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-line bg-surface-2 px-3 py-2">
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-ink-3">{label}</span>
      <span className={cn("font-display text-lg font-bold tabular-nums [overflow-wrap:anywhere]", valueTone[tone])}>{value}</span>
    </div>
  );
}

/** Grid of stats. `live` announces changes politely; turn it off for numbers that change every tick. */
export function StatGrid({ children, className, live = true }: { children: ReactNode; className?: string; live?: boolean }) {
  return (
    <div className={cn("grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2", className)} aria-live={live ? "polite" : undefined}>
      {children}
    </div>
  );
}
