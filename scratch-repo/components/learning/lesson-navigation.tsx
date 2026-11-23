"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Lesson } from "@/types/curriculum";

/** Previous / next lesson cards, plus ← → keyboard shortcuts (ignored while typing or inside a simulation). */
export function LessonNavigation({ prev, next }: { prev?: Lesson; next?: Lesson }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable], [data-interactive], dialog, [role='slider']") || t.isContentEditable)) return;
      if (e.key === "ArrowRight" && next) router.push(`/learn/${next.slug}`);
      if (e.key === "ArrowLeft" && prev) router.push(`/learn/${prev.slug}`);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [prev, next, router]);

  return (
    <nav aria-label="Lesson navigation" data-companion-avoid="" className="mt-8 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/learn/${prev.slug}`}
          className="group flex flex-col gap-0.5 rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-soft)]"
        >
          <span className="flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-ink-3">
            <ArrowLeft aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-x-0.5" /> Previous · {prev.number}
          </span>
          <span className="font-display font-bold leading-snug text-ink">{prev.title}</span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next ? (
        <Link
          href={`/learn/${next.slug}`}
          className="group flex flex-col gap-0.5 rounded-2xl border border-line bg-surface p-4 text-right transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-soft)]"
        >
          <span className="flex items-center justify-end gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-ink-3">
            Next · {next.number} <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="font-display font-bold leading-snug text-ink">{next.title}</span>
        </Link>
      ) : (
        <Link href="/practice" className="flex flex-col gap-0.5 rounded-2xl border border-accent bg-accent-soft p-4 text-right">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-accent">Course complete</span>
          <span className="font-display font-bold text-ink">Go to practice</span>
        </Link>
      )}
    </nav>
  );
}
