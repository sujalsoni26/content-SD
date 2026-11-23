import type { ReactNode } from "react";
import { Plus } from "lucide-react";

/** Optional extra depth, collapsed by default (native <details>, so it works without JavaScript). */
export function DeepDive({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group my-6 rounded-xl border-[1.5px] border-dashed border-line-strong bg-surface/60">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-3 font-display text-base font-bold text-ink transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface-2 text-accent transition-transform duration-300 group-open:rotate-45">
          <Plus aria-hidden="true" className="size-4" />
        </span>
        {title}
      </summary>
      <div className="px-5 pb-2 text-[0.98rem] [&>*:first-child]:mt-0">{children}</div>
    </details>
  );
}
