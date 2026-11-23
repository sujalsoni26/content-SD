"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { glossary } from "@/data/glossary";
import { getLesson } from "@/lib/curriculum";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/stores/preferences-store";

/** Searchable glossary. Each term has an anchor (#term-TLS) so lesson popovers can link here. */
export function GlossaryBrowser() {
  const hydrated = useHydrated();
  const knownTerms = usePreferencesStore((s) => s.knownTerms);
  const setTermKnown = usePreferencesStore((s) => s.setTermKnown);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return glossary;
    return glossary.filter((g) => g.term.toLowerCase().includes(q) || g.full.toLowerCase().includes(q) || g.note.toLowerCase().includes(q));
  }, [query]);

  const letters = useMemo(() => Array.from(new Set(glossary.map((g) => g.term[0].toUpperCase()))), []);

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-3 bg-canvas/90 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <label className="relative block">
          <span className="sr-only">Filter terms</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter terms, e.g. TLS or consistency"
            className="h-12 w-full rounded-xl border-[1.5px] border-line-strong bg-surface pl-11 pr-4 text-base text-ink outline-none placeholder:text-ink-3 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </label>
        {!query ? (
          <nav aria-label="Jump to letter" className="flex flex-wrap gap-1">
            {letters.map((l) => (
              <a key={l} href={`#letter-${l}`} className="grid size-8 place-items-center rounded-md font-mono text-sm font-semibold text-ink-2 hover:bg-surface-2 hover:text-accent">
                {l}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
      <p className="text-sm text-ink-3" aria-live="polite">
        {filtered.length} of {glossary.length} terms
      </p>
      <dl className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {filtered.map((g, i) => {
          const known = hydrated && knownTerms.includes(g.term);
          const lesson = getLesson(g.lessonSlug);
          const firstOfLetter = !query && (i === 0 || filtered[i - 1].term[0].toUpperCase() !== g.term[0].toUpperCase());
          return (
            <div
              key={g.term}
              id={`term-${g.term}`}
              className="grid scroll-mt-40 gap-x-5 gap-y-1 px-5 py-4 target:bg-accent-soft sm:grid-cols-[7rem_minmax(0,1fr)_auto]"
            >
              {firstOfLetter ? <span id={`letter-${g.term[0].toUpperCase()}`} className="sr-only" /> : null}
              <dt className={cn("font-mono text-base font-semibold [overflow-wrap:anywhere]", known ? "text-ink-3" : "text-accent")}>{g.term}</dt>
              <dd className="min-w-0">
                <p className="font-bold text-ink">{g.full}</p>
                <p className="text-sm text-ink-2">
                  {g.note}{" "}
                  {lesson ? (
                    <Link href={`/learn/${lesson.slug}`} className="font-bold text-accent underline underline-offset-2">
                      Lesson {lesson.number}
                    </Link>
                  ) : null}
                </p>
              </dd>
              <dd className="self-center">
                <button
                  type="button"
                  aria-pressed={known}
                  onClick={() => setTermKnown(g.term, !known)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-bold transition-colors",
                    known ? "border-transparent bg-good-soft text-good" : "border-line-strong text-ink-3 hover:text-ink",
                  )}
                >
                  {known ? "Known: hints off" : "Mark as known"}
                </button>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
