"use client";
import Link from "next/link";
import { useState } from "react";
import { Bookmark, Check, CircleHelp } from "lucide-react";
import { LevelChip } from "@/components/ui/chip";
import { ProgressRing } from "@/components/ui/progress-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getModuleLessons, knowledgeCheckAfter, modules, moduleProgress } from "@/lib/curriculum";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import type { Level } from "@/types/curriculum";

type LevelFilter = "all" | Level;
const FILTERS = [
  { value: "all", label: "All" },
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

/** Full learning roadmap: every module and lesson, with completion state and a level highlight. */
export function Roadmap() {
  const hydrated = useHydrated();
  const completedRaw = useProgressStore((s) => s.completed);
  const bookmarks = useProgressStore((s) => s.bookmarks);
  const completed = hydrated ? completedRaw : {};
  const [filter, setFilter] = useState<LevelFilter>("all");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold text-ink-2">Highlight level</span>
        <SegmentedControl<LevelFilter> label="Highlight lessons by level" options={FILTERS} value={filter} onChange={setFilter} size="sm" />
      </div>
      <ol className="relative flex flex-col gap-10 before:absolute before:bottom-6 before:left-[19px] before:top-6 before:w-0.5 before:bg-line">
        {modules.map((m) => {
          const p = moduleProgress(m.id, completed);
          return (
            <li key={m.id} id={m.id} className="relative scroll-mt-24 pl-14">
              <span
                className={cn(
                  "absolute left-0 top-0 grid size-10 place-items-center rounded-full border-2 bg-canvas font-mono text-sm font-bold",
                  p.fraction === 1 ? "border-good bg-good text-accent-ink" : "border-accent text-accent",
                )}
              >
                {p.fraction === 1 ? <Check aria-hidden="true" className="size-5" strokeWidth={3} /> : m.number}
              </span>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-3">
                    Module {m.number} · stage: <span className="text-amber-ink">{m.stage}</span>
                  </p>
                  <h2 className="font-display text-2xl font-bold text-ink">{m.title}</h2>
                  <p className="mt-1 max-w-2xl text-ink-2">{m.description}</p>
                </div>
                <span className="flex items-center gap-2 font-mono text-sm tabular-nums text-ink-2">
                  {p.done}/{p.total}
                  <ProgressRing value={p.fraction} label={`${m.title} progress`} />
                </span>
              </div>
              <ul className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
                {getModuleLessons(m.id).map((l) => {
                  const done = Boolean(completed[l.slug]);
                  const dim = filter !== "all" && l.level !== filter;
                  const check = knowledgeCheckAfter(l.slug);
                  return (
                    <li key={l.slug} className={cn("border-b border-line last:border-b-0 transition-opacity", dim && "opacity-40")}>
                      <Link
                        href={`/learn/${l.slug}`}
                        className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                      >
                        <span
                          className={cn(
                            "grid size-5 place-items-center rounded-full border-2",
                            done ? "border-good bg-good text-accent-ink" : "border-line-strong",
                          )}
                        >
                          {done ? <Check aria-hidden="true" className="size-3" strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="mr-2 font-mono text-xs text-ink-3">{l.number}</span>
                          <span className="font-bold text-ink">{l.title}</span>
                          {done ? <span className="sr-only"> (learned)</span> : null}
                          <span className="mt-0.5 block truncate text-sm text-ink-3">{l.problem}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          {hydrated && bookmarks.includes(l.slug) ? <Bookmark aria-label="Bookmarked" className="size-4 text-amber-ink" /> : null}
                          {check ? <CircleHelp aria-label="Has a knowledge check" className="size-4 text-violet" /> : null}
                          <span className="hidden font-mono text-xs text-ink-3 sm:inline">{l.minutes} min</span>
                          <LevelChip level={l.level} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
