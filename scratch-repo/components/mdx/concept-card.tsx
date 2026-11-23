import type { ReactNode } from "react";

/** A named concept with a one-line definition, for lessons that introduce several terms at once. */
export function ConceptCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="my-4 rounded-xl border border-line bg-surface px-4 pb-1 pt-3 shadow-[var(--shadow-soft)]">
      <p className="mb-1 font-display text-base font-bold text-ink">{title}</p>
      <div className="text-[0.97rem] text-ink-2 [&>*:last-child]:mb-2.5 [&_p]:my-1.5">{children}</div>
    </div>
  );
}
