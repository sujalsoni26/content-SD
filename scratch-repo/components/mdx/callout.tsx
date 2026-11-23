import type { ReactNode } from "react";
import { Lightbulb, MessagesSquare, Puzzle, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalloutType = "idea" | "analogy" | "warning" | "interview";

const styles: Record<CalloutType, { box: string; title: string; icon: LucideIcon; label: string }> = {
  idea: { box: "bg-accent-soft border-accent/30", title: "text-accent", icon: Lightbulb, label: "Key idea" },
  analogy: { box: "bg-amber-soft border-amber/35", title: "text-amber-ink", icon: Puzzle, label: "Analogy" },
  warning: { box: "bg-bad-soft border-bad/30", title: "text-bad", icon: TriangleAlert, label: "Watch out" },
  interview: { box: "bg-violet-soft border-violet/30", title: "text-violet", icon: MessagesSquare, label: "Interview tip" },
};

export function Callout({ type = "idea", title, children }: { type?: CalloutType; title?: string; children: ReactNode }) {
  const s = styles[type] ?? styles.idea;
  const Icon = s.icon;
  return (
    <aside className={cn("my-6 rounded-xl border px-5 pb-1 pt-4", s.box)} aria-label={title ?? s.label}>
      <p className={cn("mb-1.5 flex items-center gap-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.12em]", s.title)}>
        <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.2} />
        {title ?? s.label}
      </p>
      <div className="[&>*:last-child]:mb-3 [&_p]:my-2">{children}</div>
    </aside>
  );
}
