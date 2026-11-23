"use client";
import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { glossaryByTerm } from "@/data/glossary";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { usePreferencesStore } from "@/stores/preferences-store";

interface AcronymProps {
  term: string;
  children?: ReactNode;
}

/**
 * First mention of a glossary term in a lesson (inserted by lib/mdx/remark-acronyms.mjs).
 * Hover or keyboard focus shows the full form; tap or click pins it open; Escape closes.
 * Screen readers hear the full form as the button's description.
 */
export function Acronym({ term, children }: AcronymProps) {
  const entry = glossaryByTerm[term];
  const hydrated = useHydrated();
  const known = usePreferencesStore((s) => s.knownTerms.includes(term));
  const setTermKnown = usePreferencesStore((s) => s.setTermKnown);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [shift, setShift] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const id = useId();
  const popId = `${id}-pop`;
  const fullId = `${id}-full`;

  // Keep the popover inside the viewport horizontally.
  useLayoutEffect(() => {
    if (!open || !popRef.current) return;
    const rect = popRef.current.getBoundingClientRect();
    const margin = 12;
    const overflowRight = rect.right - (window.innerWidth - margin);
    const overflowLeft = margin - rect.left;
    const next = overflowRight > 0 ? -overflowRight : overflowLeft > 0 ? overflowLeft : 0;
    if (next !== 0) setShift((s) => s + next);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setPinned(false);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  if (!entry || (hydrated && known)) return <>{children ?? term}</>;

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setShift(0);
    setOpen(true);
  };
  const hideSoon = () => {
    if (pinned) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  };

  return (
    <span ref={wrapRef} className="relative inline-block" onMouseEnter={show} onMouseLeave={hideSoon}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popId}
        aria-describedby={fullId}
        onFocus={show}
        onBlur={(e) => {
          if (!wrapRef.current?.contains(e.relatedTarget as Node)) hideSoon();
        }}
        onClick={() => {
          setPinned((p) => !p || !open);
          show();
        }}
        className="cursor-help rounded-sm border-b-[1.5px] border-dotted border-accent font-[inherit] leading-[inherit] text-inherit transition-colors hover:bg-accent-soft aria-expanded:bg-accent-soft"
      >
        {children ?? term}
      </button>
      <span
        ref={popRef}
        id={popId}
        role="group"
        aria-label={`${term} definition`}
        hidden={!open}
        style={{ marginLeft: shift }}
        className="absolute left-1/2 top-full z-40 mt-2 w-max max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 animate-rise rounded-xl border border-line-strong bg-surface px-3.5 pb-2.5 pt-3 text-left font-sans text-[0.9rem] font-normal not-italic leading-snug text-ink shadow-[var(--shadow-lift)]"
      >
        <span className="block font-mono text-[0.72rem] font-semibold tracking-[0.1em] text-accent">{term}</span>
        <span id={fullId} className="block font-display text-[1.02rem] font-bold">
          {entry.full}
        </span>
        {entry.note ? <span className="mt-1 block text-ink-2">{entry.note}</span> : null}
        <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-dashed border-line pt-2 text-[0.78rem]">
          <button
            type="button"
            className="font-bold text-ink-3 underline underline-offset-2 hover:text-accent"
            onClick={() => {
              setTermKnown(term, true);
              setOpen(false);
            }}
          >
            I know this, stop hinting
          </button>
          <Link href={`/glossary#term-${encodeURIComponent(term)}`} className="font-bold text-ink-3 underline underline-offset-2 hover:text-accent">
            Glossary
          </Link>
        </span>
      </span>
    </span>
  );
}
