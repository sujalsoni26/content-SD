"use client";
/**
 * Small hooks and formatters shared by the W-A diagrams (request-journey, dns-lookup, tcp-udp,
 * latency-scale, tail-latency, littles-law, lb-sim, scaling-compare, polling-vs-ws).
 */
import { useEffect, useEffectEvent, useState, type RefObject } from "react";
import { useInView } from "@/lib/hooks/use-in-view";
import { usePageVisible } from "@/lib/hooks/use-page-visible";

/** True while the widget is (nearly) on screen and the tab is visible. Loops may only run then. */
export function useLoopGate(ref: RefObject<Element | null>): boolean {
  const inView = useInView(ref);
  const pageVisible = usePageVisible();
  return inView && pageVisible;
}

/** requestAnimationFrame loop that runs while `running`. `onFrame` receives ms since the last frame (capped). */
export function useFrameLoop(onFrame: (dtMs: number) => void, running: boolean, maxStepMs = 64): void {
  const frame = useEffectEvent(onFrame);
  useEffect(() => {
    if (!running) return;
    let id = 0;
    let last: number | null = null;
    const step = (now: number) => {
      frame(last === null ? 0 : Math.min(maxStepMs, now - last));
      last = now;
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [running, maxStepMs]);
}

/** setInterval that only runs while `delayMs` is a number. */
export function useInterval(onTick: () => void, delayMs: number | null): void {
  const tick = useEffectEvent(onTick);
  useEffect(() => {
    if (delayMs === null) return;
    const id = window.setInterval(() => tick(), delayMs);
    return () => window.clearInterval(id);
  }, [delayMs]);
}

/* ------------------------------------------------------------------ step player */

export interface StepPlayerOptions {
  count: number;
  /** How long to stay on `index` before auto-advancing (travel animation + reading time). */
  waitMs: (index: number) => number;
  /** False pauses auto-advance (off-screen or hidden tab). */
  active: boolean;
  /** Called whenever the current step changes, from handlers and timers (never during render). */
  onStep?: (index: number) => void;
}

export interface StepPlayer {
  index: number;
  last: number;
  /** True when the current step was reached by moving forward (so its packet should animate). */
  forward: boolean;
  /** Increments on every move; use as a React key to restart per-step animations. */
  seq: number;
  playing: boolean;
  next: () => void;
  back: () => void;
  togglePlay: () => void;
  /** Jump to a step (e.g. after a scenario change); `index` is clamped to the new step count on render. */
  jump: (index: number, options: { play: boolean }) => void;
}

/** Back / Next / Play state for step-through diagrams. Auto-advance uses one timeout per step. */
export function useStepPlayer({ count, waitMs, active, onStep }: StepPlayerOptions): StepPlayer {
  const last = count - 1;
  const [nav, setNav] = useState({ index: last, forward: false, seq: 0 });
  const [playing, setPlaying] = useState(false);
  const index = Math.min(nav.index, last);
  const autoplaying = playing && index < last;
  const wait = autoplaying ? waitMs(index) : 0;

  const go = (to: number, forward: boolean) => {
    const target = Math.max(0, to);
    setNav((n) => ({ index: target, forward, seq: n.seq + 1 }));
    onStep?.(target);
  };

  const advance = useEffectEvent(() => go(Math.min(index + 1, last), true));
  useEffect(() => {
    if (!autoplaying || !active) return;
    const id = window.setTimeout(() => advance(), wait);
    return () => window.clearTimeout(id);
  }, [autoplaying, active, index, wait]);

  return {
    index,
    last,
    forward: nav.forward,
    seq: nav.seq,
    playing: autoplaying,
    next: () => {
      setPlaying(false);
      go(Math.min(index + 1, last), true);
    },
    back: () => {
      setPlaying(false);
      go(index - 1, false);
    },
    togglePlay: () => {
      if (autoplaying) {
        setPlaying(false);
        return;
      }
      if (index >= last) go(0, true);
      setPlaying(true);
    },
    jump: (to, { play }) => {
      go(to, play);
      setPlaying(play);
    },
  };
}

/* ------------------------------------------------------------------ formatting */

export function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** One decimal below 10, whole numbers above: 0.4, 7.5, 1,000. */
export function formatSmart(n: number): string {
  if (n < 10 && n % 1 !== 0) return n.toFixed(1);
  return formatInt(n);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

/** Small seeded PRNG so simulations are reproducible (and pure when used during render). */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
