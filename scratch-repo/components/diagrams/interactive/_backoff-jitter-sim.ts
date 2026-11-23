// Retry-storm simulation for the backoff-jitter widget. Pure and seeded, so a replay is reproducible.

export type Strategy = "immediate" | "backoff" | "jitter";

export const CLIENTS = 20;
/** Requests the server can serve per half-second bucket. */
export const CAPACITY = 6;
/** Above this many arrivals in one bucket the server falls over and serves none. */
export const COLLAPSE = 12;
export const BUCKET = 0.5;
export const SPAN = 16;
export const BUCKETS = SPAN / BUCKET;
/** Attempts per client, the original call included (so up to 7 retries). */
export const MAX_ATTEMPTS = 8;
export const BACKOFF_CAP = 8;

export interface Attempt {
  client: number;
  /** Seconds since the outage. */
  t: number;
  ok: boolean;
  /** 0 = the original call, 1 = first retry, … */
  n: number;
}

export interface SimResult {
  strategy: Strategy;
  attempts: Attempt[];
  /** Retries arriving per half-second bucket. */
  load: number[];
  served: number;
  sent: number;
  peak: number;
  /** Time the last client got through, or null if someone never did. */
  doneBy: number | null;
}

/** Small, fast seeded PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The exponential base wait before retry n: 1, 2, 4, 8, 8 … seconds. */
export function baseWait(n: number): number {
  return Math.min(BACKOFF_CAP, 2 ** (n - 1));
}

function waitBefore(strategy: Strategy, n: number, rand: () => number): number {
  if (strategy === "immediate") return BUCKET;
  if (strategy === "backoff") return baseWait(n);
  return rand() * baseWait(n); // full jitter: random(0, base)
}

interface Pending {
  client: number;
  t: number;
  n: number;
}

export function simulate(strategy: Strategy, seed: number): SimResult {
  const rand = seededRandom(seed);
  const buckets: Pending[][] = Array.from({ length: BUCKETS }, () => []);
  const attempts: Attempt[] = [];
  const load = new Array<number>(BUCKETS).fill(0);

  const schedule = (client: number, from: number, n: number, afterBucket: number) => {
    if (n >= MAX_ATTEMPTS) return;
    let t = from + waitBefore(strategy, n, rand);
    const b = Math.max(afterBucket + 1, Math.floor(t / BUCKET));
    if (b * BUCKET > t) t = b * BUCKET + 0.01;
    if (b >= BUCKETS || t >= SPAN) return;
    buckets[b].push({ client, t, n });
  };

  for (let c = 0; c < CLIENTS; c++) {
    attempts.push({ client: c, t: 0, ok: false, n: 0 });
    schedule(c, 0, 1, -1);
  }

  for (let b = 0; b < BUCKETS; b++) {
    const arrivals = buckets[b];
    load[b] = arrivals.length;
    const servedHere = arrivals.length <= CAPACITY ? arrivals.length : arrivals.length <= COLLAPSE ? CAPACITY : 0;
    // Which of the arrivals the server picks is random.
    for (let i = arrivals.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arrivals[i], arrivals[j]] = [arrivals[j], arrivals[i]];
    }
    arrivals.forEach((r, i) => {
      const ok = i < servedHere;
      attempts.push({ client: r.client, t: r.t, ok, n: r.n });
      if (!ok) schedule(r.client, r.t, r.n + 1, b);
    });
  }

  attempts.sort((a, b) => a.t - b.t);
  const okTimes = attempts.filter((a) => a.ok);
  const served = new Set(okTimes.map((a) => a.client)).size;
  return {
    strategy,
    attempts,
    load,
    served,
    sent: attempts.length,
    peak: Math.max(...load),
    doneBy: served === CLIENTS ? Math.max(...okTimes.map((a) => a.t)) : null,
  };
}
