"use client";
import { useState } from "react";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecallPrompt } from "@/types/curriculum";

/** Active recall at the end of every lesson: think first, then reveal. */
export function RecallCard({ recall, hint }: { recall: RecallPrompt; hint: string }) {
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  return (
    <section aria-label="Quick recall" className="mt-12 rounded-2xl border-[1.5px] border-line-strong bg-surface p-5">
      <p className="flex items-center gap-2 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-amber-ink">
        <Brain aria-hidden="true" className="size-4" /> Before you move on
      </p>
      <p className="mt-2 font-display text-lg font-bold leading-snug text-ink">{recall.q}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!revealed ? (
          <Button size="sm" onClick={() => setRevealed(true)}>
            Think first, then reveal
          </Button>
        ) : null}
        {!revealed && !showHint ? (
          <Button size="sm" variant="ghost" onClick={() => setShowHint(true)}>
            Hint
          </Button>
        ) : null}
      </div>
      <div aria-live="polite">
        {showHint && !revealed ? <p className="mt-3 text-sm text-ink-2">Hint: {hint}</p> : null}
        {revealed ? <p className="mt-3 animate-rise rounded-lg bg-good-soft px-3 py-2.5 text-ink">{recall.a}</p> : null}
      </div>
    </section>
  );
}
