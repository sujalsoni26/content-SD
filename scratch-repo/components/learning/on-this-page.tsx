"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { LessonHeading } from "@/lib/lesson-headings";

/** Section list for long lessons, highlighting the section being read. */
export function OnThisPage({ headings }: { headings: LessonHeading[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;
  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink-3">On this page</p>
      <ul className="mt-3 space-y-0.5 border-l border-line">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l-2 py-1 pl-3 leading-snug transition-colors",
                active === h.id ? "border-accent font-bold text-ink" : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Thin reading-progress line under the header. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-16 z-30 h-0.5">
      <div className="h-full bg-amber transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}
