// Discrete-event model of a circuit breaker in front of a ranking service. Pure: every function returns a new state.
import type { LogEntry } from "@/components/ui/event-log";

export type BreakerState = "closed" | "open" | "half";
export type Edge = "closed>open" | "open>half" | "half>closed" | "half>open";

/** Consecutive failures that trip the breaker. */
export const THRESHOLD = 5;
/** Seconds the breaker stays open before letting a trial call through. */
export const COOLDOWN = 5;
/** Successful trial calls needed to close again. */
export const TRIALS = 2;
export const OK_MS = 120;
export const TIMEOUT_MS = 1000;
/** Seconds between automatic requests. */
export const AUTO_GAP = 0.7;
/** Seconds a request takes to travel (in the picture) from caller to service, and the reply back. */
export const LEG = 0.45;
/** A fail-fast call only travels to the breaker and back. */
export const FAST_LEG = 0.3;
const LOG_LIMIT = 30;

export const STATE_NAME: Record<BreakerState, string> = { closed: "Closed", open: "Open", half: "Half-open" };

export interface Call {
  id: number;
  kind: "pass" | "fast";
  trial: boolean;
  ok: boolean;
  sentAt: number;
  /** When the caller learns the outcome (the reply arrives, or the timeout fires). */
  doneAt: number;
  resolved: boolean;
}

export interface Transition {
  id: number;
  edge: Edge;
  at: number;
}

export interface BreakerSim {
  now: number;
  state: BreakerState;
  healthy: boolean;
  fails: number;
  openedAt: number;
  trialOk: number;
  trialInFlight: boolean;
  nextAutoAt: number;
  calls: Call[];
  passed: number;
  fastFails: number;
  log: LogEntry[];
  transition: Transition | null;
  nextId: number;
}

function stamp(t: number): string {
  return `${t.toFixed(1)}s`;
}

function addLog(s: BreakerSim, text: string, tone: LogEntry["tone"]): BreakerSim {
  const entry: LogEntry = { id: s.nextId, text: `${stamp(s.now)}  ${text}`, tone };
  return { ...s, nextId: s.nextId + 1, log: [entry, ...s.log].slice(0, LOG_LIMIT) };
}

export function createBreaker(): BreakerSim {
  const base: BreakerSim = {
    now: 0,
    state: "closed",
    healthy: true,
    fails: 0,
    openedAt: 0,
    trialOk: 0,
    trialInFlight: false,
    nextAutoAt: 0.2,
    calls: [],
    passed: 0,
    fastFails: 0,
    log: [],
    transition: null,
    nextId: 1,
  };
  return addLog(base, "Breaker Closed: calls pass through to the ranking service", "good");
}

export function pendingCalls(s: BreakerSim): number {
  return s.calls.filter((c) => c.kind === "pass" && !c.resolved).length;
}

function moveTo(s: BreakerSim, to: BreakerState, why: string): BreakerSim {
  const edge = `${s.state}>${to}` as Edge;
  let next: BreakerSim = {
    ...s,
    state: to,
    transition: { id: s.nextId, edge, at: s.now },
    trialOk: 0,
    fails: to === "closed" ? 0 : s.fails,
    openedAt: to === "open" ? s.now : s.openedAt,
  };
  next = addLog(next, `Breaker → ${STATE_NAME[to]}: ${why}`, to === "open" ? "bad" : to === "closed" ? "good" : "accent");
  return next;
}

export function send(s: BreakerSim): BreakerSim {
  const failFast = s.state === "open" || (s.state === "half" && s.trialInFlight);
  if (failFast) {
    const call: Call = { id: s.nextId, kind: "fast", trial: false, ok: false, sentAt: s.now, doneAt: s.now, resolved: true };
    const next: BreakerSim = { ...s, nextId: s.nextId + 1, calls: [...s.calls, call], fastFails: s.fastFails + 1 };
    return addLog(
      next,
      s.state === "open" ? "Fail fast → fallback (cached feed) · 1 ms" : "Trial already running → fallback · 1 ms",
      "neutral",
    );
  }
  const trial = s.state === "half";
  const latency = (s.healthy ? OK_MS : TIMEOUT_MS) / 1000;
  const call: Call = {
    id: s.nextId,
    kind: "pass",
    trial,
    ok: s.healthy,
    sentAt: s.now,
    doneAt: s.now + 2 * LEG + latency,
    resolved: false,
  };
  return {
    ...s,
    nextId: s.nextId + 1,
    calls: [...s.calls, call],
    passed: s.passed + 1,
    trialInFlight: trial ? true : s.trialInFlight,
  };
}

function complete(s: BreakerSim, id: number): BreakerSim {
  const call = s.calls.find((c) => c.id === id);
  if (!call) return s;
  let next: BreakerSim = {
    ...s,
    calls: s.calls.map((c) => (c.id === id ? { ...c, resolved: true } : c)),
    trialInFlight: call.trial ? false : s.trialInFlight,
  };
  const who = call.trial ? "Trial call" : "Call";
  if (call.ok) {
    next = addLog(next, `${who} → 200 OK · ${OK_MS} ms`, "good");
    if (call.trial && next.state === "half") {
      const trialOk = next.trialOk + 1;
      next = trialOk >= TRIALS ? moveTo(next, "closed", `${TRIALS} trial calls succeeded`) : { ...next, trialOk };
    } else if (next.state === "closed") {
      next = { ...next, fails: 0 };
    }
    return next;
  }
  next = addLog(next, `${who} → timed out after ${TIMEOUT_MS.toLocaleString("en-US")} ms`, "bad");
  if (call.trial && next.state === "half") return moveTo(next, "open", "the trial call failed");
  if (next.state === "closed") {
    const fails = next.fails + 1;
    next = { ...next, fails };
    if (fails >= THRESHOLD) next = moveTo(next, "open", `${THRESHOLD} failures in a row`);
  }
  return next;
}

interface NextEvent {
  at: number;
  apply: (s: BreakerSim) => BreakerSim;
}

function nextEvent(s: BreakerSim, auto: boolean): NextEvent | null {
  const events: NextEvent[] = s.calls
    .filter((c) => !c.resolved)
    .map((c) => ({ at: c.doneAt, apply: (x: BreakerSim) => complete(x, c.id) }));
  if (s.state === "open") {
    events.push({ at: s.openedAt + COOLDOWN, apply: (x) => moveTo(x, "half", "cooldown over, letting a trial call through") });
  }
  // A stale schedule (auto was off for a while) fires once now, never as a catch-up burst.
  if (auto) events.push({ at: Math.max(s.nextAutoAt, s.now), apply: (x) => ({ ...send(x), nextAutoAt: x.now + AUTO_GAP }) });
  return events.reduce<NextEvent | null>((best, e) => (!best || e.at < best.at ? e : best), null);
}

/** Visible lifetime of a call in the picture. */
export function callEnd(c: Call): number {
  return c.kind === "fast" ? c.sentAt + 2 * FAST_LEG : c.doneAt;
}

/** Runs every event due in the next `dt` seconds, in time order. `auto` sends a request every AUTO_GAP seconds. */
export function advance(s: BreakerSim, dt: number, auto: boolean): BreakerSim {
  const target = s.now + dt;
  let next = s;
  for (let guard = 0; guard < 200; guard++) {
    const e = nextEvent(next, auto);
    if (!e || e.at > target) break;
    next = e.apply({ ...next, now: Math.max(next.now, e.at) });
  }
  return { ...next, now: target, calls: next.calls.filter((c) => !c.resolved || callEnd(c) > target - 0.05) };
}

export function setHealthy(s: BreakerSim, healthy: boolean): BreakerSim {
  if (s.healthy === healthy) return s;
  return addLog(
    { ...s, healthy },
    healthy ? "Ranking service recovered (replies in 120 ms)" : "Ranking service is failing: every call times out",
    healthy ? "good" : "bad",
  );
}

/** Does the clock need to run? (Traffic flowing, calls in flight, or a cooldown counting down.) */
export function isBusy(s: BreakerSim, auto: boolean): boolean {
  return auto || s.calls.length > 0 || s.state === "open";
}
