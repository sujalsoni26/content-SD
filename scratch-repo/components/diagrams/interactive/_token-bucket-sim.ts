// Rate limiter model for the token-bucket widget: a token bucket and a fixed-window counter. Pure functions.

export type LimiterMode = "bucket" | "fixed";

export const CAPACITY = 10;
/** Fixed window: LIMIT requests per WINDOW seconds. */
export const WINDOW = 10;
export const LIMIT = 10;
/** Seconds of history on the timeline. */
export const HISTORY = 20;
/** Clock origin, deliberately not on a window boundary. */
const START = 1003.4;
const BURST_GAP = 0.045;
const DEMO_GAP = 0.03;

export interface LimiterRequest {
  id: number;
  t: number;
  ok: boolean;
}

export interface LimiterResponse {
  id: number;
  ok: boolean;
  retryAfter: number;
}

export interface BoundaryResult {
  boundary: number;
  allowed: number;
}

export interface LimiterSim {
  now: number;
  mode: LimiterMode;
  rate: number;
  tokens: number;
  refilledAt: number;
  windowIndex: number;
  windowCount: number;
  requests: LimiterRequest[];
  allowed: number;
  rejected: number;
  /** Times of requests already scheduled (bursts, the boundary demo), ascending. */
  queue: number[];
  response: LimiterResponse | null;
  demo: { boundary: number; reportAt: number } | null;
  result: BoundaryResult | null;
  nextId: number;
}

function refill(s: LimiterSim, t: number): LimiterSim {
  if (t <= s.refilledAt) return s;
  return { ...s, tokens: Math.min(CAPACITY, s.tokens + (t - s.refilledAt) * s.rate), refilledAt: t };
}

/** One request arriving at time t. */
function hit(state: LimiterSim, t: number): LimiterSim {
  let s = state;
  let ok: boolean;
  let retryAfter = 0;
  if (s.mode === "bucket") {
    s = refill(s, t);
    ok = s.tokens >= 1;
    if (ok) s = { ...s, tokens: s.tokens - 1 };
    else retryAfter = Math.max(1, Math.ceil((1 - s.tokens) / s.rate));
  } else {
    const w = Math.floor(t / WINDOW);
    const count = w === s.windowIndex ? s.windowCount : 0;
    ok = count < LIMIT;
    s = { ...s, windowIndex: w, windowCount: ok ? count + 1 : count };
    if (!ok) retryAfter = Math.max(1, Math.ceil((w + 1) * WINDOW - t));
  }
  const id = s.nextId;
  return {
    ...s,
    nextId: id + 1,
    requests: [...s.requests, { id, t, ok }],
    allowed: s.allowed + (ok ? 1 : 0),
    rejected: s.rejected + (ok ? 0 : 1),
    response: { id, ok, retryAfter },
  };
}

export function createLimiter(): LimiterSim {
  let s: LimiterSim = {
    now: START,
    mode: "bucket",
    rate: 2,
    tokens: CAPACITY,
    refilledAt: START - 9,
    windowIndex: -1,
    windowCount: 0,
    requests: [],
    allowed: 0,
    rejected: 0,
    queue: [],
    response: null,
    demo: null,
    result: null,
    nextId: 1,
  };
  // Some earlier traffic, so the timeline is not empty.
  for (const d of [-8.2, -6.5, -6.3, -4.1, -2.4, -1.2]) s = hit(s, START + d);
  return refill(s, START);
}

export function advance(state: LimiterSim, dt: number): LimiterSim {
  const target = state.now + dt;
  let s = state;
  let i = 0;
  while (i < s.queue.length && s.queue[i] <= target) {
    s = hit(s, s.queue[i]);
    i++;
  }
  if (i > 0) s = { ...s, queue: s.queue.slice(i) };
  if (s.mode === "bucket") s = refill(s, target);
  if (s.demo && s.demo.reportAt <= target) {
    const { boundary } = s.demo;
    const allowed = s.requests.filter((r) => r.ok && Math.abs(r.t - boundary) <= 1).length;
    s = { ...s, demo: null, result: { boundary, allowed } };
  }
  const oldest = target - HISTORY;
  const requests = s.requests[0] && s.requests[0].t < oldest ? s.requests.filter((r) => r.t >= oldest) : s.requests;
  return { ...s, now: target, requests };
}

/** Sends `n` requests now, `gap` seconds apart (gap 0 = all at once). */
export function sendBurst(state: LimiterSim, n: number, gap = BURST_GAP): LimiterSim {
  let s = hit(state, state.now);
  if (gap === 0) {
    for (let k = 1; k < n; k++) s = hit(s, s.now);
    return s;
  }
  const times = Array.from({ length: n - 1 }, (_, k) => s.now + (k + 1) * gap);
  return { ...s, queue: [...s.queue, ...times].sort((a, b) => a - b) };
}

export function setMode(s: LimiterSim, mode: LimiterMode): LimiterSim {
  return {
    ...s,
    mode,
    tokens: CAPACITY,
    refilledAt: s.now,
    windowIndex: -1,
    windowCount: 0,
    queue: [],
    demo: null,
    result: null,
    response: null,
  };
}

export function setRate(s: LimiterSim, rate: number): LimiterSim {
  return { ...refill(s, s.now), rate };
}

/** Fires LIMIT requests just before the next window boundary and LIMIT more just after it. */
export function armBoundaryDemo(s: LimiterSim): LimiterSim {
  if (s.mode !== "fixed" || s.demo) return s;
  let boundary = (Math.floor(s.now / WINDOW) + 1) * WINDOW;
  if (boundary - s.now < 1.4) boundary += WINDOW;
  const before = Array.from({ length: LIMIT }, (_, k) => boundary - 0.7 + k * DEMO_GAP);
  const after = Array.from({ length: LIMIT }, (_, k) => boundary + 0.15 + k * DEMO_GAP);
  return {
    ...s,
    queue: [...s.queue, ...before, ...after].sort((a, b) => a - b),
    demo: { boundary, reportAt: boundary + 1.1 },
    result: null,
  };
}

export interface WindowInfo {
  used: number;
  /** 0..1 through the current window. */
  progress: number;
  resetsIn: number;
}

export function windowInfo(s: LimiterSim): WindowInfo {
  const w = Math.floor(s.now / WINDOW);
  return {
    used: w === s.windowIndex ? s.windowCount : 0,
    progress: (s.now - w * WINDOW) / WINDOW,
    resetsIn: (w + 1) * WINDOW - s.now,
  };
}

export function allowedInLast(s: LimiterSim, seconds: number): number {
  return s.requests.filter((r) => r.ok && s.now - r.t <= seconds).length;
}

/** Window boundaries visible on the timeline. */
export function boundariesInView(s: LimiterSim): number[] {
  const out: number[] = [];
  for (let b = Math.ceil((s.now - HISTORY) / WINDOW) * WINDOW; b <= s.now; b += WINDOW) out.push(b);
  return out;
}
