import { ArrowRight, Blocks, Flame, Scale, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Lesson } from "@/types/curriculum";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  text: string;
  icon: LucideIcon;
  tone: string;
}

/** The course's teaching pattern for every lesson: Problem → What breaks → Building block → Trade-offs. */
export function TeachingStrip({ lesson }: { lesson: Lesson }) {
  const steps: Step[] = [
    { label: "The problem", text: lesson.problem, icon: Flame, tone: "bg-bad-soft text-bad" },
    { label: "What breaks", text: lesson.breaks, icon: TriangleAlert, tone: "bg-warn-soft text-warn" },
    { label: "Building block", text: lesson.summary, icon: Blocks, tone: "bg-good-soft text-good" },
    { label: "Trade-offs", text: lesson.tradeoffs, icon: Scale, tone: "bg-violet-soft text-violet" },
  ].filter((s) => s.text);

  return (
    <ol aria-label="Problem to building block" className="not-prose mb-10 grid gap-2 sm:grid-cols-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <li key={s.label} className="relative flex min-w-0 gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", s.tone)}>
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
                {i + 1}. {s.label}
              </p>
              <p className="mt-0.5 text-[0.95rem] leading-snug text-ink">{s.text}</p>
            </div>
            {i < steps.length - 1 ? (
              <ArrowRight aria-hidden="true" className="absolute -bottom-3 left-7 z-10 size-4 rotate-90 rounded-full bg-canvas text-ink-3 sm:hidden" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
