"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import { getModule, getModuleLessons, modules, moduleProgress } from "@/lib/curriculum";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import type { ModuleId } from "@/types/curriculum";

function LessonList({ moduleId, currentSlug }: { moduleId: ModuleId; currentSlug: string }) {
  const hydrated = useHydrated();
  const completed = useProgressStore((s) => s.completed);
  return (
    <ol className="relative mt-2 space-y-0.5 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-0.5 before:bg-line">
      {getModuleLessons(moduleId).map((l) => {
        const done = hydrated && Boolean(completed[l.slug]);
        const current = l.slug === currentSlug;
        return (
          <li key={l.slug}>
            <Link
              href={`/learn/${l.slug}`}
              aria-current={current ? "page" : undefined}
              className={cn(
                "relative grid grid-cols-[24px_1fr] items-start gap-2.5 rounded-lg py-1.5 pr-2 text-[0.88rem] leading-snug transition-colors",
                current ? "bg-accent-soft font-bold text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "relative z-10 mx-auto mt-0.5 grid size-[18px] place-items-center rounded-full border-2 bg-canvas",
                  done ? "border-good bg-good text-accent-ink" : current ? "border-accent" : "border-line-strong",
                )}
              >
                {done ? <Check aria-hidden="true" className="size-3" strokeWidth={3} /> : null}
              </span>
              <span>
                <span className="mr-1 font-mono text-[0.7rem] text-ink-3">{l.number}</span>
                {l.title}
                {done ? <span className="sr-only"> (learned)</span> : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** Module outline next to a lesson; other modules collapse to one line each. */
export function LessonSidebar({ moduleId, currentSlug }: { moduleId: ModuleId; currentSlug: string }) {
  const hydrated = useHydrated();
  const completed = useProgressStore((s) => s.completed);
  return (
    <nav aria-label="Course outline" className="text-sm">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink-3">Course outline</p>
      <ul className="mt-3 space-y-1">
        {modules.map((m) => {
          const p = moduleProgress(m.id, hydrated ? completed : {});
          const open = m.id === moduleId;
          return (
            <li key={m.id}>
              <Link
                href={open ? `/learn#${m.id}` : `/learn/${m.lessons[0]}`}
                className={cn("flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 font-display font-bold", open ? "text-ink" : "text-ink-2 hover:text-ink")}
              >
                <span>
                  <span className="mr-1.5 font-mono text-xs text-ink-3">{m.number}</span>
                  {getModule(m.id).title}
                </span>
                <span className="font-mono text-[0.7rem] font-normal tabular-nums text-ink-3">
                  {p.done}/{p.total}
                </span>
              </Link>
              {open ? <LessonList moduleId={m.id} currentSlug={currentSlug} /> : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
