/**
 * Pure simulation engine for the lb-sim diagram: a reducer over simulated time.
 * Randomness comes from a seed stored in state, so the reducer stays pure.
 */
import type { LogEntry } from "@/components/ui/event-log";

export type Algorithm = "rr" | "wrr" | "lc" | "ip";

export interface Server {
  id: string;
  weight: number;
  /** Comfortable number of concurrent requests (the big server holds twice as many). */
  capacity: number;
  up: boolean;
  inRotation: boolean;
  active: number;
  served: number;
  failed: number;
  /** Requests the LB sent here (including ones that failed). */
  routed: number;
  /** Increments on every failure at this server: a key for the "502" flash. */
  failFlash: number;
  lastCheck: "pass" | "fail" | null;
}

interface Job {
  server: number;
  endsAt: number;
}

export interface Flight {
  id: number;
  server: number;
  ip: string;
  sentAt: number;
  durationMs: number;
  long: boolean;
}

export interface LbState {
  now: number;
  seed: number;
  nextId: number;
  algorithm: Algorithm;
  servers: Server[];
  jobs: Job[];
  flights: Flight[];
  rr: number;
  /** Fractional requests owed by the arrival rate. */
  carry: number;
  /** Times of queued burst requests. */
  burst: number[];
  nextCheckAt: number;
  lastCheckAt: number;
  total: number;
  ok: number;
  failed: number;
  log: LogEntry[];
  note: string;
  /** Dead servers the health check has pulled so far. */
  caught: number;
}

export type LbAction =
  | { type: "tick"; dt: number; rate: number; flightMs: number }
  | { type: "toggle"; index: number }
  | { type: "algorithm"; algorithm: Algorithm }
  | { type: "burst"; count: number };

export const FLIGHT_MS = 450;
export const CHECK_MS = 1200;
const LOG_MAX = 7;
const BURST_GAP_MS = 70;

/** Chosen so that, with all four servers up, IP hash spreads them 2 / 2 / 1 / 1. */
export const CLIENTS = ["10.0.0.11", "10.0.0.18", "10.0.0.23", "10.0.0.35", "10.0.0.37", "10.0.0.41"] as const;

export const ALGORITHMS: readonly { value: Algorithm; label: string; name: string; note: string }[] = [
  {
    value: "rr",
    label: "Round robin",
    name: "round robin",
    note: "Round robin: 1 → 2 → 3 → 4 → 1 … Simple and fair when servers and requests are alike, but it ignores that S4 is twice as big and that some requests run long.",
  },
  {
    value: "wrr",
    label: "Weighted",
    name: "weighted round robin",
    note: "Weighted round robin: S4 has weight 2, so it gets two of every five requests (40%). Good for mixed hardware.",
  },
  {
    value: "lc",
    label: "Least conn.",
    name: "least connections",
    note: "Least connections: each request goes to the server with the fewest open connections. Best when request durations vary, so long jobs don't pile up on one server.",
  },
  {
    value: "ip",
    label: "IP hash",
    name: "IP hash",
    note: "IP hash: hash(client IP) % servers in rotation. The same client always lands on the same server (sticky sessions, warm caches). When a server leaves, many clients get remapped.",
  },
];

/** FNV-1a: a stable 32-bit hash of the client IP. */
export function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Which server each client maps to under IP hash, now and with all servers in rotation. */
export function ipHashMap(servers: readonly Server[]) {
  const rotation = servers.filter((s) => s.inRotation);
  return CLIENTS.map((ip) => {
    const h = strHash(ip);
    const base = servers[h % servers.length].id;
    const now = rotation.length ? rotation[h % rotation.length].id : null;
    return { ip, base, now, moved: now !== base };
  });
}

export function initialLbState(): LbState {
  const specs = [
    { id: "S1", weight: 1, capacity: 6, served: 7 },
    { id: "S2", weight: 1, capacity: 6, served: 6 },
    { id: "S3", weight: 1, capacity: 6, served: 7 },
    { id: "S4", weight: 2, capacity: 12, served: 6 },
  ];
  // Pre-warmed with a little history so the panel opens mid-flight.
  const servers: Server[] = specs.map((s) => ({
    ...s,
    up: true,
    inRotation: true,
    active: 0,
    failed: 0,
    routed: s.served,
    failFlash: 0,
    lastCheck: "pass",
  }));
  return {
    now: 0,
    seed: 20240607,
    nextId: 1,
    algorithm: "rr",
    servers,
    jobs: [],
    flights: [],
    rr: 0,
    carry: 0,
    burst: [],
    nextCheckAt: CHECK_MS,
    lastCheckAt: 0,
    total: 26,
    ok: 26,
    failed: 0,
    log: [{ id: 0, text: "LB up: 4 servers in rotation, health check every 1.2 s", tone: "neutral" }],
    note: ALGORITHMS[0].note,
    caught: 0,
  };
}

/* ------------------------------------------------------------------ internals (operate on a private copy) */

function clone(state: LbState): LbState {
  return {
    ...state,
    servers: state.servers.map((s) => ({ ...s })),
    jobs: [...state.jobs],
    flights: [...state.flights],
    burst: [...state.burst],
    log: [...state.log],
  };
}

function random(s: LbState): number {
  s.seed = (s.seed + 0x6d2b79f5) | 0;
  let t = Math.imul(s.seed ^ (s.seed >>> 15), 1 | s.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function log(s: LbState, text: string, tone: LogEntry["tone"] = "neutral") {
  s.log = [{ id: s.nextId++, text, tone }, ...s.log].slice(0, LOG_MAX);
}

function choose(s: LbState, ip: string): number {
  const rotation = s.servers.flatMap((sv, i) => (sv.inRotation ? [i] : []));
  if (rotation.length === 0) return -1;
  switch (s.algorithm) {
    case "rr":
      return rotation[s.rr++ % rotation.length];
    case "wrr": {
      const slots = rotation.flatMap((i) => Array.from({ length: s.servers[i].weight }, () => i));
      return slots[s.rr++ % slots.length];
    }
    case "lc": {
      // Open connections = requests being served + requests already on their way.
      const open = (i: number) => s.servers[i].active + s.flights.filter((f) => f.server === i).length;
      return rotation.reduce((best, i) => (open(i) < open(best) ? i : best), rotation[0]);
    }
    case "ip":
      return rotation[strHash(ip) % rotation.length];
  }
}

function spawn(s: LbState) {
  const ip = CLIENTS[Math.floor(random(s) * CLIENTS.length)];
  const long = random(s) < 0.3;
  const durationMs = long ? 3000 + random(s) * 2500 : 500 + random(s) * 1000;
  const target = choose(s, ip);
  s.total++;
  if (target < 0) {
    s.failed++;
    log(s, `${ip} → no healthy server (503)`, "bad");
    return;
  }
  s.servers[target].routed++;
  s.flights.push({ id: s.nextId++, server: target, ip, sentAt: s.now, durationMs, long });
  log(s, `${ip} → ${s.servers[target].id}${long ? " (long job)" : ""}`);
}

function land(s: LbState, f: Flight, flightMs: number) {
  const server = s.servers[f.server];
  if (!server.up) {
    s.failed++;
    server.failed++;
    server.failFlash++;
    log(s, `${f.ip} → ${server.id} failed: server is down (502)`, "bad");
    return;
  }
  server.active++;
  s.jobs.push({ server: f.server, endsAt: f.sentAt + flightMs + f.durationMs });
}

function healthCheck(s: LbState) {
  s.lastCheckAt = s.now;
  s.servers.forEach((server) => {
    server.lastCheck = server.up ? "pass" : "fail";
    if (!server.up && server.inRotation) {
      server.inRotation = false;
      s.caught++;
      log(s, `Health check: ${server.id} failed → out of rotation`, "accent");
      s.note = `The health check caught it: ${server.id} is out of rotation, so no more requests fail. One dead server no longer takes the app down.`;
    } else if (server.up && !server.inRotation) {
      server.inRotation = true;
      log(s, `Health check: ${server.id} passed → back in rotation`, "good");
      s.note = `${server.id} passed GET /health and is back in rotation.`;
    }
  });
}

/* ------------------------------------------------------------------ reducer */

export function lbReducer(state: LbState, action: LbAction): LbState {
  const s = clone(state);
  switch (action.type) {
    case "tick": {
      s.now += action.dt;
      const landed = s.flights.filter((f) => f.sentAt + action.flightMs <= s.now);
      s.flights = s.flights.filter((f) => f.sentAt + action.flightMs > s.now);
      landed.forEach((f) => land(s, f, action.flightMs));

      const finished = s.jobs.filter((j) => j.endsAt <= s.now);
      s.jobs = s.jobs.filter((j) => j.endsAt > s.now);
      finished.forEach((j) => {
        const server = s.servers[j.server];
        server.active--;
        server.served++;
        s.ok++;
      });

      s.carry += (action.dt * action.rate) / 1000;
      while (s.carry >= 1) {
        s.carry -= 1;
        spawn(s);
      }
      while (s.burst.length > 0 && s.burst[0] <= s.now) {
        s.burst.shift();
        spawn(s);
      }
      if (s.now >= s.nextCheckAt) {
        healthCheck(s);
        s.nextCheckAt = s.now + CHECK_MS;
      }
      return s;
    }
    case "toggle": {
      const server = s.servers[action.index];
      if (server.up) {
        server.up = false;
        const lost = server.active;
        if (lost > 0) {
          s.failed += lost;
          server.failed += lost;
          server.failFlash++;
          log(s, `${server.id} crashed: ${lost} in-flight request${lost > 1 ? "s" : ""} lost`, "bad");
        } else {
          log(s, `${server.id} crashed. The LB doesn't know yet…`, "bad");
        }
        s.jobs = s.jobs.filter((j) => j.server !== action.index);
        server.active = 0;
        s.note = `${server.id} is down but still in rotation until the next health check fails. Requests sent to it in the meantime fail with 502.`;
      } else {
        server.up = true;
        log(s, `${server.id} restarted; waiting for a passing health check`);
        s.note = server.inRotation
          ? `${server.id} came back before the health check noticed, so it never left rotation.`
          : `${server.id} is back up. The LB adds it back once GET /health passes.`;
      }
      return s;
    }
    case "algorithm": {
      s.algorithm = action.algorithm;
      s.rr = 0;
      s.note = ALGORITHMS.find((a) => a.value === action.algorithm)?.note ?? s.note;
      log(s, `Algorithm → ${ALGORITHMS.find((a) => a.value === action.algorithm)?.name ?? action.algorithm}`, "accent");
      return s;
    }
    case "burst": {
      const start = Math.max(s.now, s.burst[s.burst.length - 1] ?? 0);
      for (let k = 1; k <= action.count; k++) s.burst.push(start + k * BURST_GAP_MS);
      return s;
    }
  }
}

export type ServerStatus = { text: string; tone: "good" | "bad" | "neutral" | "warn" };

export function serverStatus(s: Server): ServerStatus {
  if (s.up && s.inRotation) return { text: "healthy", tone: "good" };
  if (!s.up && s.inRotation) return { text: "down · still in rotation", tone: "bad" };
  if (!s.up) return { text: "out of rotation", tone: "neutral" };
  return { text: "recovering", tone: "warn" };
}
