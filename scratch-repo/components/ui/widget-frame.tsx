import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WidgetFrameProps {
  title: string;
  /** One line on what to do. */
  hint?: string;
  kicker?: string;
  children: ReactNode;
  /** Live explanation that updates with state; announced politely to screen readers. */
  note?: ReactNode;
  className?: string;
}

/** Standard container for every interactive diagram: header, stage, live note. */
export function WidgetFrame({ title, hint, kicker = "Try it", children, note, className }: WidgetFrameProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "not-prose relative my-8 flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-surface p-4 text-[0.95rem] leading-normal shadow-[var(--shadow-soft)] sm:p-5",
        className,
      )}
    >
      <header className="flex flex-col gap-0.5">
        <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">{kicker}</p>
        <h3 className="font-display text-lg font-bold leading-snug text-ink">{title}</h3>
        {hint ? <p className="text-[0.9rem] text-ink-2">{hint}</p> : null}
      </header>
      {children}
      {note ? (
        <p aria-live="polite" className="rounded-lg bg-surface-2 px-3 py-2.5 text-[0.9rem] text-ink">
          {note}
        </p>
      ) : null}
    </section>
  );
}

/** Wrapper for wide SVG stages: scrolls sideways inside the widget instead of widening the page. */
export function WidgetScroll({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("max-w-full overflow-x-auto", className)}>{children}</div>;
}

export function ControlRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-x-3.5 gap-y-2.5", className)}>{children}</div>;
}
