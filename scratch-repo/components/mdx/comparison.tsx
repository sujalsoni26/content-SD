import type { ReactNode } from "react";

/** Side-by-side options; stacks on narrow screens. */
export function Comparison({ children }: { children: ReactNode }) {
  return <div className="my-6 grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">{children}</div>;
}

export function ComparisonItem({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface px-4 pb-1 pt-3.5 text-[0.97rem]" aria-label={title}>
      <h4 className="mb-1.5 font-display text-[1.05rem] font-bold text-ink">{title}</h4>
      <div className="[&>*:last-child]:mb-3 [&_p]:my-2 [&_ul]:my-2">{children}</div>
    </section>
  );
}
