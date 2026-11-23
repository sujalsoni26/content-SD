"use client";
import { useMemo } from "react";
import { Check, Lock } from "lucide-react";
import { ACCESSORIES, isUnlocked, progressLabel, rewardContext, SLOT_LABEL, SLOTS } from "@/lib/companion/accessories";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useProgressStore } from "@/stores/progress-store";

/**
 * Accessories Cache can wear, one per slot. Unlocked items are toggle buttons (aria-pressed);
 * locked ones are disabled and show what unlocks them and how close the learner is.
 */
export function Wardrobe({ compact = false, className }: { compact?: boolean; className?: string }) {
  const hydrated = useHydrated();
  const completed = useProgressStore((s) => s.completed);
  const quizAttempts = useProgressStore((s) => s.quizAttempts);
  const knownCards = useProgressStore((s) => s.knownCards);
  const stats = usePreferencesStore((s) => s.companion.stats);
  const equipped = usePreferencesStore((s) => s.companion.equipped);
  const equip = usePreferencesStore((s) => s.equipAccessory);
  const ctx = useMemo(
    () => rewardContext({ completed, quizAttempts, knownCards }, stats),
    [completed, quizAttempts, knownCards, stats],
  );

  if (!hydrated) return <p className="py-2 text-[0.84rem] text-ink-3">Loading wardrobe…</p>;

  return (
    <div className={cn("flex flex-col", compact ? "gap-2" : "gap-3", className)}>
      {SLOTS.map((slot) => (
        <div key={slot} role="group" aria-label={`${SLOT_LABEL[slot]} accessories`}>
          <p className="mb-1 font-mono text-[0.64rem] font-bold uppercase tracking-[0.14em] text-ink-3">{SLOT_LABEL[slot]}</p>
          <div className={cn("grid gap-1.5", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
            {ACCESSORIES.filter((a) => a.slot === slot).map((a) => {
              const unlocked = isUnlocked(a, ctx);
              const worn = equipped[slot] === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  data-testid={`accessory-${a.id}`}
                  aria-pressed={worn}
                  disabled={!unlocked}
                  onClick={() => equip(slot, worn ? null : a.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                    worn
                      ? "border-accent bg-accent-soft text-ink"
                      : unlocked
                        ? "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
                        : "cursor-not-allowed border-dashed border-line bg-surface-2 text-ink-3",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-md",
                      worn ? "bg-accent text-accent-ink" : unlocked ? "border border-line-strong" : "",
                    )}
                  >
                    {worn ? <Check className="size-3.5" /> : unlocked ? null : <Lock className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.84rem] font-bold leading-tight">{a.name}</span>
                    <span className="block text-[0.74rem] leading-snug">
                      {unlocked ? (worn ? "Wearing" : "Unlocked") : `${a.requirement} · ${progressLabel(a, ctx)}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
