"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { glossary } from "@/data/glossary";
import { lessons } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

interface Result {
  kind: "Lesson" | "Term";
  label: string;
  detail: string;
  href: string;
  score: number;
}

/** Crude English stem so "cache" matches "caching" and "retries" matches "retry". */
function stem(word: string): string {
  return word.replace(/(ing|ies|es|ed|e|s|y)$/, "");
}

function titleWordMatch(title: string, q: string): boolean {
  const qs = stem(q);
  return qs.length >= 3 && title.split(/[^a-z0-9]+/).some((w) => stem(w).startsWith(qs));
}

function search(query: string): Result[] {
  const q = query.trim().toLowerCase();
  const out: Result[] = [];
  for (const l of lessons) {
    const title = l.title.toLowerCase();
    const score = !q
      ? 1
      : title.startsWith(q)
        ? 4
        : title.includes(q)
          ? 3
          : titleWordMatch(title, q)
            ? 2.8
            : `${l.summary} ${l.problem}`.toLowerCase().includes(q)
              ? 1
              : 0;
    if (score) out.push({ kind: "Lesson", label: l.title, detail: `Lesson ${l.number}`, href: `/learn/${l.slug}`, score });
  }
  if (q) {
    for (const g of glossary) {
      const t = g.term.toLowerCase();
      const score = t === q ? 5 : t.startsWith(q) ? 2.5 : g.full.toLowerCase().includes(q) ? 1.5 : 0;
      if (score) out.push({ kind: "Term", label: g.term, detail: g.full, href: `/glossary#term-${encodeURIComponent(g.term)}`, score });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 10);
}

/** Search lessons and glossary terms. Opens with the button, "/" or Ctrl/Cmd+K. */
export function SearchDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => search(query), [query]);
  const listId = useId();

  const open = () => {
    setQuery("");
    setActive(0);
    dialogRef.current?.showModal();
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };
  const close = () => dialogRef.current?.close();
  const choose = (r: Result | undefined) => {
    if (!r) return;
    close();
    router.push(r.href);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        open();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Search lessons and terms"
        title="Search (/)"
        className="grid size-10 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Search"
        data-companion-avoid=""
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="m-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line-strong bg-surface p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-ink/30 backdrop:backdrop-blur-[2px]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search aria-hidden="true" className="size-5 text-ink-3" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(results[active]);
              }
            }}
            placeholder="Search lessons or terms, e.g. cache, TLS"
            aria-label="Search lessons and glossary terms"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            role="combobox"
            aria-expanded="true"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-ink-3"
          />
        </div>
        <ul id={listId} role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.length === 0 ? <li className="px-3 py-3 text-sm text-ink-3">Nothing matches “{query}”.</li> : null}
          {results.map((r, i) => (
            <li
              key={`${r.kind}-${r.href}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(r)}
              className={cn("grid cursor-pointer grid-cols-[3.5rem_1fr] items-baseline gap-3 rounded-lg px-3 py-2", i === active && "bg-accent-soft")}
            >
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-ink-3">{r.kind}</span>
              <span className="min-w-0 truncate">
                <span className="font-bold">{r.label}</span> <span className="text-sm text-ink-2">{r.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-2 text-xs text-ink-3">↑ ↓ to choose · Enter to open · Esc to close</p>
      </dialog>
    </>
  );
}
