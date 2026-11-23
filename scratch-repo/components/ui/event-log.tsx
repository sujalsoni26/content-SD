import { cn } from "@/lib/utils";

export interface LogEntry {
  id: number;
  text: string;
  tone?: "neutral" | "good" | "bad" | "accent";
}

const toneClass = { neutral: "text-ink-2", good: "text-good", bad: "text-bad", accent: "text-accent" } as const;

/** Monospace event log, newest first. */
export function EventLog({ entries, label = "Event log", className }: { entries: LogEntry[]; label?: string; className?: string }) {
  return (
    <ol
      aria-label={label}
      className={cn(
        "max-h-40 overflow-y-auto rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[0.76rem] leading-relaxed",
        className,
      )}
    >
      {entries.length === 0 ? <li className="text-ink-3">Nothing yet.</li> : null}
      {entries.map((e) => (
        <li key={e.id} className={cn("border-b border-dashed border-line py-px last:border-b-0 [overflow-wrap:anywhere]", toneClass[e.tone ?? "neutral"])}>
          {e.text}
        </li>
      ))}
    </ol>
  );
}
