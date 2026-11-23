"use client";
// Shared by W-C's simulations (backoff-jitter, circuit-breaker, token-bucket).
import { useEffect, useEffectEvent, type RefObject } from "react";
import { useInView } from "@/lib/hooks/use-in-view";
import { usePageVisible } from "@/lib/hooks/use-page-visible";

/** True while the element is near the viewport and the tab is visible: the only time a loop may run. */
export function useLoopActive(ref: RefObject<Element | null>): boolean {
  const inView = useInView(ref);
  const visible = usePageVisible();
  return inView && visible;
}

/**
 * Calls `onFrame(dt)` on every animation frame while `running` (or every `intervalMs` when given,
 * which reduced-motion mode uses for plain state updates). `dt` is in seconds and capped,
 * so returning to a paused tab never makes the simulation jump.
 */
export function useFrameLoop(onFrame: (dt: number) => void, running: boolean, intervalMs = 0): void {
  const tick = useEffectEvent(onFrame);
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const step = () => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      tick(dt);
    };
    if (intervalMs > 0) {
      const id = window.setInterval(step, intervalMs);
      return () => window.clearInterval(id);
    }
    let raf = 0;
    const loop = () => {
      step();
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [running, intervalMs]);
}
