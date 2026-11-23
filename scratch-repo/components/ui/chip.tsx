import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./stat";
import type { Level } from "@/types/curriculum";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2 border-line",
  accent: "bg-accent-soft text-accent border-transparent",
  good: "bg-good-soft text-good border-transparent",
  bad: "bg-bad-soft text-bad border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  amber: "bg-amber-soft text-amber-ink border-transparent",
  violet: "bg-violet-soft text-violet border-transparent",
};

export function Chip({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[0.72rem] font-semibold tracking-[0.02em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const levelTone: Record<Level, Tone> = { basic: "good", intermediate: "amber", advanced: "violet" };

export function LevelChip({ level }: { level: Level }) {
  return <Chip tone={levelTone[level]}>{level}</Chip>;
}
