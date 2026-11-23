"use client";
import { useEffect, useState } from "react";
import { SkipForward, Square } from "lucide-react";
import { usePageVisible } from "@/lib/hooks/use-page-visible";
import { cn } from "@/lib/utils";
import { ensureFocusHydrated, useFocusHydrated, useFocusStore } from "@/stores/companion-store";

function formatLeft(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Compact focus-timer chip: 25 minutes of focus, then a 5-minute break. Persisted, so a refresh
 * carries on. Ticks once a second only while a session runs and the tab is visible; each tick also
 * advances the phase when it runs out (the companion announces the change).
 */
export function FocusTimer({ className }: { className?: string }) {
  const hydrated = useFocusHydrated();
  const session = useFocusStore((s) => s.session);
  const skip = useFocusStore((s) => s.skip);
  const stop = useFocusStore((s) => s.stop);
  const visible = usePageVisible();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    ensureFocusHydrated();
  }, []);

  useEffect(() => {
    if (!session || !visible) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      useFocusStore.getState().advance(t);
    };
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [session, visible]);

  if (!hydrated || !session) return null;
  const isFocus = session.phase === "focus";
  const left = formatLeft(session.endsAt - now);
  const minutesLeft = Math.max(0, Math.ceil((session.endsAt - now) / 60_000));

  return (
    <div
      role="group"
      aria-label={isFocus ? "Focus timer" : "Break timer"}
      data-testid="focus-timer"
      data-phase={session.phase}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-line-strong bg-surface py-0.5 pl-2.5 pr-0.5 text-[0.74rem] text-ink shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", isFocus ? "bg-accent" : "bg-good")} />
      <span className="font-bold">{isFocus ? "Focus" : "Break"}</span>
      <span role="timer" aria-label={`${minutesLeft} ${minutesLeft === 1 ? "minute" : "minutes"} left`} className="font-mono tabular-nums text-ink-2">
        {left}
      </span>
      <button
        type="button"
        data-testid="focus-timer-skip"
        onClick={() => skip(Date.now())}
        aria-label={isFocus ? "Skip to break" : "End break"}
        title={isFocus ? "Skip to break" : "End break"}
        className="grid size-6 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <SkipForward aria-hidden="true" className="size-3.5" />
      </button>
      <button
        type="button"
        data-testid="focus-timer-stop"
        onClick={stop}
        aria-label="Stop timer"
        title="Stop timer"
        className="grid size-6 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-bad"
      >
        <Square aria-hidden="true" className="size-3" />
      </button>
    </div>
  );
}
