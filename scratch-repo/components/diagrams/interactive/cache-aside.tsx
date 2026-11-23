"use client";

import { useEffect, useEffectEvent, useReducer, useRef, useState } from "react";
import type { ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Flame, RotateCcw } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { WidgetFrame, WidgetScroll, ControlRow } from "@/components/ui/widget-frame";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Chip } from "@/components/ui/chip";
import { EventLog, type LogEntry } from "@/components/ui/event-log";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { useInView } from "@/lib/hooks/use-in-view";
import { usePageVisible } from "@/lib/hooks/use-page-visible";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Model                                                               */
/* ------------------------------------------------------------------ */

type Key = "virat-post" | "post:1" | "post:2" | "post:3" | "post:4" | "post:5";
const HOT: Key = "virat-post";
const KEYS: Key[] = ["virat-post", "post:1", "post:2", "post:3", "post:4", "post:5"];
const CAPACITY = 4;
const TTL_S = 30;
const HIT_MS = 1;
const MISS_MS = 21; // 1 ms cache check + ~20 ms database read
const TRAFFIC_MS = 800;
const WEIGHTS: ReadonlyArray<readonly [Key, number]> = [
  ["virat-post", 0.45],
  ["post:1", 0.18],
  ["post:2", 0.13],
  ["post:3", 0.1],
  ["post:4", 0.08],
  ["post:5", 0.06],
];

interface Entry {
  key: Key;
  value: number;
  expiresAt: number;
}

type Outcome = "hit" | "miss" | "stale";

interface LastRequest {
  id: number;
  key: Key;
  outcome: Outcome;
}

interface CacheState {
  /** Simulated seconds; only advances while the widget is on screen. */
  clock: number;
  db: Record<Key, number>;
  /** Most recently used first. */
  cache: Entry[];
  hits: number;
  misses: number;
  staleHits: number;
  evictions: number;
  invalidate: boolean;
  last: LastRequest | null;
  log: LogEntry[];
  seq: number;
  message: string;
}

type Action =
  | { type: "get"; key: Key }
  | { type: "batch"; keys: Key[] }
  | { type: "update"; delta: number }
  | { type: "flush" }
  | { type: "tick"; dt: number }
  | { type: "invalidate"; on: boolean };

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const likes = (n: number) => `${fmt(n)} likes`;

function addLog(s: CacheState, text: string, tone: LogEntry["tone"]): CacheState {
  return { ...s, log: [{ id: s.seq, text, tone }, ...s.log].slice(0, 30), seq: s.seq + 1 };
}

function purge(s: CacheState): CacheState {
  const expired = s.cache.filter((e) => e.expiresAt <= s.clock);
  if (expired.length === 0) return s;
  let next: CacheState = { ...s, cache: s.cache.filter((e) => e.expiresAt > s.clock) };
  for (const e of expired) next = addLog(next, `${e.key}: TTL expired → removed`, "neutral");
  return next;
}

function get(state: CacheState, key: Key): CacheState {
  const s = purge(state);
  const i = s.cache.findIndex((e) => e.key === key);
  if (i >= 0) {
    const entry = s.cache[i];
    const stale = entry.value !== s.db[key];
    const cache = [entry, ...s.cache.filter((_, j) => j !== i)];
    const left = Math.ceil(entry.expiresAt - s.clock);
    const next = addLog(
      { ...s, cache, hits: s.hits + 1, staleHits: s.staleHits + (stale ? 1 : 0), last: { id: s.seq, key, outcome: stale ? "stale" : "hit" } },
      `GET ${key} → HIT${stale ? " (stale!)" : ""} · ${HIT_MS} ms`,
      stale ? "bad" : "good",
    );
    return {
      ...next,
      message: stale
        ? `Stale hit! Redis still says ${likes(entry.value)}, but the database has ${likes(s.db[key])}. Without invalidation it stays wrong until the TTL runs out in ${left} s.`
        : `Hit. ${key} came straight from RAM in about ${HIT_MS} ms, and moved to the top of the LRU list. The database did no work.`,
    };
  }
  const full = s.cache.length >= CAPACITY;
  const evicted = full ? s.cache[s.cache.length - 1] : null;
  const kept = full ? s.cache.slice(0, -1) : s.cache;
  const cache = [{ key, value: s.db[key], expiresAt: s.clock + TTL_S }, ...kept];
  const next = addLog(
    { ...s, cache, misses: s.misses + 1, evictions: s.evictions + (evicted ? 1 : 0), last: { id: s.seq, key, outcome: "miss" } },
    `GET ${key} → MISS → read DB → SET, TTL ${TTL_S} s · ${MISS_MS} ms${evicted ? ` · evicted ${evicted.key}` : ""}`,
    "bad",
  );
  return {
    ...next,
    message: `Miss. The app read ${key} from the database (about 20 ms), stored it in Redis with a ${TTL_S} s TTL, then returned it.${
      evicted ? ` Redis was full, so the least recently used key, ${evicted.key}, was evicted.` : ""
    }`,
  };
}

function reducer(s: CacheState, a: Action): CacheState {
  switch (a.type) {
    case "get":
      return get(s, a.key);
    case "batch": {
      const after = a.keys.reduce(get, s);
      const hits = after.hits - s.hits;
      const misses = after.misses - s.misses;
      return {
        ...after,
        message: `${a.keys.length} requests, ${a.keys.filter((k) => k === HOT).length} of them for ${HOT}: ${hits} hits, ${misses} misses. The hot key stays cached, so the hit ratio climbs.`,
      };
    }
    case "update": {
      const value = s.db[HOT] + a.delta;
      const db = { ...s.db, [HOT]: value };
      const cached = s.cache.find((e) => e.key === HOT);
      if (s.invalidate) {
        const next = addLog({ ...s, db, cache: s.cache.filter((e) => e.key !== HOT) }, `UPDATE DB ${HOT} → DEL cache key`, "accent");
        return {
          ...next,
          message: `Write path. The app updated the database, then deleted ${HOT} from Redis. The next read misses once and loads the fresh count (${likes(value)}).`,
        };
      }
      const next = addLog({ ...s, db }, `UPDATE DB ${HOT} (cache left alone)`, "accent");
      return {
        ...next,
        message: cached
          ? `The database now says ${likes(value)}, but Redis still holds ${likes(cached.value)}. Reads stay stale for up to ${Math.ceil(cached.expiresAt - s.clock)} s more, until the TTL expires.`
          : `${HOT} isn't cached right now, so the next read loads the fresh value anyway. Cache it first, then update, to see stale data.`,
      };
    }
    case "flush":
      return {
        ...addLog({ ...s, cache: [] }, "Redis restarted → cache is cold", "accent"),
        message: "Cold start. Redis came back empty, so every next read misses and lands on the database at once. This is why teams warm caches before sending traffic.",
      };
    case "tick":
      return purge({ ...s, clock: s.clock + a.dt });
    case "invalidate":
      return {
        ...s,
        invalidate: a.on,
        message: a.on
          ? "On update, the app deletes the cache key, so the next read reloads fresh data."
          : "On update, the cache is left alone: Redis keeps serving the old value until its TTL runs out. Try it: GET virat-post, then update it.",
      };
  }
}

function createInitial(): CacheState {
  const base: CacheState = {
    clock: 0,
    db: { "post:1": 180, "post:2": 227, "post:3": 274, "post:4": 321, "post:5": 368, "virat-post": 12_400_000 },
    cache: [],
    hits: 0,
    misses: 0,
    staleHits: 0,
    evictions: 0,
    invalidate: true,
    last: null,
    log: [],
    seq: 1,
    message: "",
  };
  // A few earlier requests, so the cache opens warm; entries were cached at different moments.
  const warm = (["virat-post", "post:2", "virat-post", "post:1", "virat-post", "post:3", "post:2"] as Key[]).reduce(get, base);
  return {
    ...warm,
    cache: warm.cache.map((e, i) => ({ ...e, expiresAt: e.expiresAt - (4 + i * 6) })),
    last: null,
    log: [{ id: 0, text: `Warm start: 7 earlier requests (${warm.hits} hits, ${warm.misses} misses)`, tone: "neutral" }],
    message: "The cache is warm from a few earlier requests. Click a GET button, or simulate traffic.",
  };
}
const INITIAL = createInitial();

function pickKey(r: number): Key {
  let acc = 0;
  for (const [k, w] of WEIGHTS) {
    acc += w;
    if (r < acc) return k;
  }
  return "post:5";
}

/* ------------------------------------------------------------------ */
/* Diagram: app, Redis and database                                    */
/* ------------------------------------------------------------------ */

const APP_TO_REDIS = { x0: 98, y0: 64, x1: 214, y1: 30 };
const APP_TO_DB = { x0: 98, y0: 86, x1: 214, y1: 120 };

function Trip({
  path,
  tone,
  delay,
  oneWay = false,
}: {
  path: typeof APP_TO_REDIS;
  tone: "good" | "bad" | "accent" | "warn";
  delay: number;
  oneWay?: boolean;
}) {
  const cls = { good: "fill-good", bad: "fill-bad", accent: "fill-accent", warn: "fill-warn" }[tone];
  return (
    <motion.circle
      r={6}
      className={cn(cls, "stroke-surface")}
      strokeWidth={1.5}
      initial={{ cx: path.x0, cy: path.y0, opacity: 0 }}
      animate={{
        cx: oneWay ? [path.x0, path.x1] : [path.x0, path.x1, path.x0],
        cy: oneWay ? [path.y0, path.y1] : [path.y0, path.y1, path.y0],
        opacity: oneWay ? [1, 1, 0] : [1, 1, 1, 0],
      }}
      transition={{ duration: oneWay ? 0.45 : 0.75, delay, ease: "easeInOut" }}
    />
  );
}

function PathDiagram({ last, reduced }: { last: LastRequest | null; reduced: boolean }) {
  const outcome = last?.outcome ?? null;
  const redisTone = outcome === "hit" ? "dg-box--good" : outcome === "stale" ? "fill-warn-soft stroke-warn" : outcome === "miss" ? "dg-box--bad" : "";
  const dbTone = outcome === "miss" ? "dg-box--accent" : "dg-box--store";
  const label = !last
    ? "No request yet."
    : outcome === "miss"
      ? `Miss on ${last.key}: Redis had nothing, the app read the database, then wrote the value to Redis.`
      : `${outcome === "stale" ? "Stale hit" : "Hit"} on ${last.key}: answered by Redis without touching the database.`;
  return (
    <svg viewBox="0 0 360 150" className="mx-auto block h-auto w-full max-w-[30rem]" role="img" aria-label={label}>
      <path
        d={`M${APP_TO_REDIS.x0} ${APP_TO_REDIS.y0} L${APP_TO_REDIS.x1} ${APP_TO_REDIS.y1}`}
        className={cn("dg-line", reduced && outcome === "hit" && "dg-line--good", reduced && outcome === "miss" && "dg-line--bad")}
        strokeWidth={2}
      />
      <path
        d={`M${APP_TO_DB.x0} ${APP_TO_DB.y0} L${APP_TO_DB.x1} ${APP_TO_DB.y1}`}
        className={cn("dg-line", outcome !== "miss" && "dg-line--dash", reduced && outcome === "miss" && "dg-line--accent")}
        strokeWidth={2}
      />
      <text x={150} y={36} textAnchor="middle" className="dg-label">
        1 · GET
      </text>
      <text x={150} y={128} textAnchor="middle" className="dg-label">
        2 · SELECT on a miss
      </text>
      <text x={150} y={58} textAnchor="middle" className="dg-label">
        3 · SET + TTL
      </text>

      <rect x={6} y={48} width={92} height={54} rx={10} className="dg-box" />
      <text x={52} y={72} textAnchor="middle" className="dg-text">
        App
      </text>
      <text x={52} y={91} textAnchor="middle" className="dg-label">
        cache-aside
      </text>
      <rect x={214} y={6} width={140} height={48} rx={10} className={cn("dg-box transition-[fill,stroke] duration-300", redisTone)} />
      <text x={284} y={27} textAnchor="middle" className="dg-text">
        Redis
      </text>
      <text x={284} y={45} textAnchor="middle" className="dg-label">
        RAM · ≈ {HIT_MS} ms
      </text>
      <rect x={214} y={96} width={140} height={48} rx={10} className={cn("dg-box transition-[fill,stroke] duration-300", dbTone)} />
      <text x={284} y={117} textAnchor="middle" className="dg-text">
        Database
      </text>
      <text x={284} y={135} textAnchor="middle" className="dg-label">
        disk · ≈ 20 ms
      </text>

      {!reduced && last ? (
        <g key={last.id}>
          {outcome === "miss" ? (
            <>
              <Trip path={APP_TO_REDIS} tone="bad" delay={0} />
              <Trip path={APP_TO_DB} tone="accent" delay={0.75} />
              <Trip path={APP_TO_REDIS} tone="accent" delay={1.5} oneWay />
            </>
          ) : (
            <Trip path={APP_TO_REDIS} tone={outcome === "stale" ? "warn" : "good"} delay={0} />
          )}
        </g>
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Redis slots                                                         */
/* ------------------------------------------------------------------ */

function Slot({ entry, rank, s, reduced }: { entry: Entry; rank: number; s: CacheState; reduced: boolean }) {
  const left = Math.max(0, entry.expiresAt - s.clock);
  const stale = entry.value !== s.db[entry.key];
  const hot = entry.key === HOT;
  const nextToGo = rank === CAPACITY - 1;
  return (
    <motion.li
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: 40, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-lg border px-2.5 py-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem_2.6rem]",
        stale ? "border-warn bg-warn-soft" : hot ? "border-amber bg-amber-soft" : "border-line bg-surface",
      )}
    >
      <span className={cn("flex min-w-0 items-center gap-1 font-mono text-[0.82rem]", hot ? "font-bold text-amber-ink" : "text-ink")}>
        {hot ? <Flame size={13} aria-label="hot key" /> : null}
        <span className="truncate">{entry.key}</span>
      </span>
      <span className="flex min-w-0 items-center justify-end gap-1.5 text-[0.8rem] text-ink-2 sm:justify-start">
        <span className="truncate tabular-nums">{likes(entry.value)}</span>
        {stale ? <Chip tone="warn">stale</Chip> : null}
      </span>
      <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-surface-3">
        <span
          className={cn("block h-full rounded-full transition-[width] duration-300 ease-linear", left < 6 ? "bg-bad" : "bg-accent")}
          style={{ width: `${(left / TTL_S) * 100}%` }}
        />
      </span>
      <span className="text-right font-mono text-[0.72rem] tabular-nums text-ink-3">
        <span className="sr-only">TTL </span>
        {Math.ceil(left)} s
        {nextToGo ? <span className="sr-only">, next to be evicted</span> : null}
      </span>
    </motion.li>
  );
}

function RedisSlots({ s, reduced }: { s: CacheState; reduced: boolean }) {
  const full = s.cache.length >= CAPACITY;
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-2 p-2.5">
      <div className="flex flex-wrap justify-between gap-x-3 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-3">
        <span>
          Redis · {CAPACITY} slots · LRU · TTL {TTL_S} s
        </span>
        <span>most recently used on top</span>
      </div>
      <ol aria-label="Redis contents, most recently used first" className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {s.cache.map((e, i) => (
            <Slot key={e.key} entry={e} rank={i} s={s} reduced={reduced} />
          ))}
        </AnimatePresence>
        {Array.from({ length: CAPACITY - s.cache.length }, (_, i) => (
          <li key={`empty-${i}`} className="rounded-lg border border-dashed border-line-strong px-2.5 py-1.5 font-mono text-[0.8rem] text-ink-3">
            empty slot
          </li>
        ))}
      </ol>
      {full ? <p className="text-[0.76rem] text-ink-3">Full: the bottom key is evicted on the next miss.</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

function CacheAside() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const visible = usePageVisible();
  const announced = useRef({ stale: false, ratio: false });
  const [s, dispatch] = useReducer(reducer, INITIAL);
  const [traffic, setTraffic] = useState(false);
  const active = inView && visible;

  // TTL clock: simulated time only moves while the widget is on screen.
  const tickStep = reduced ? 1 : 0.25;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => dispatch({ type: "tick", dt: tickStep }), tickStep * 1000);
    return () => window.clearInterval(id);
  }, [active, tickStep]);

  // Simulated traffic: 45% of reads go to the celebrity post.
  const sendRandom = useEffectEvent(() => dispatch({ type: "get", key: pickKey(Math.random()) }));
  const trafficOn = traffic && active && !reduced;
  useEffect(() => {
    if (!trafficOn) return;
    const id = window.setInterval(() => sendRandom(), TRAFFIC_MS);
    return () => window.clearInterval(id);
  }, [trafficOn]);

  // Companion reactions, once each.
  const total = s.hits + s.misses;
  const ratio = total ? s.hits / total : 0;
  useEffect(() => {
    if (s.staleHits > 0 && !announced.current.stale) {
      announced.current.stale = true;
      emitCompanionEvent({ type: "diagram", mood: "confused", message: "Stale cache! Delete the key when you write." });
    } else if (total >= 25 && ratio >= 0.8 && !announced.current.ratio) {
      announced.current.ratio = true;
      emitCompanionEvent({ type: "diagram", mood: "happy", message: `Hit ratio ${Math.round(ratio * 100)}%. The database can relax.` });
    }
  }, [s.staleHits, total, ratio]);

  const sendBatch = () => dispatch({ type: "batch", keys: Array.from({ length: 20 }, () => pickKey(Math.random())) });
  const avg = total ? (s.hits * HIT_MS + s.misses * MISS_MS) / total : 0;
  const lastLatency = !s.last ? "–" : s.last.outcome === "miss" ? `${MISS_MS} ms` : `${HIT_MS} ms`;
  const stats = (
    <>
      <Stat label="Hit ratio" value={total ? `${Math.round(ratio * 100)}%` : "–"} tone={ratio >= 0.7 ? "good" : ratio >= 0.4 ? "warn" : "bad"} />
      <Stat label="Avg read" value={total ? `${avg.toFixed(1)} ms` : "–"} />
      <Stat label="DB queries" value={`${s.misses} of ${total}`} tone="accent" />
      <Stat label="Evictions" value={s.evictions} />
      <Stat label="Last read" value={lastLatency} tone={s.last?.outcome === "miss" ? "bad" : s.last ? "good" : "neutral"} />
    </>
  );
  const note = trafficOn
    ? "Simulated traffic: 45% of reads hit the celebrity post. Watch the hot key stay at the top of the LRU list while the hit ratio climbs. Stop traffic to read each request's explanation."
    : s.message;

  return (
    <WidgetFrame
      kicker="Try it"
      title="Cache-aside with Redis"
      hint="Request posts. A first read misses and goes to the database; repeats come from RAM until the TTL runs out."
      note={note}
    >
      <div ref={rootRef} className="flex flex-col gap-4">
        <div role="group" aria-label="Read a key" className="flex flex-wrap gap-1.5">
          {KEYS.map((k) => (
            <Button key={k} size="sm" variant={k === HOT ? "primary" : "secondary"} className="font-mono" onClick={() => dispatch({ type: "get", key: k })}>
              {k === HOT ? <Flame size={13} aria-hidden="true" /> : null}GET {k}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <WidgetScroll>
            <div className="min-w-[288px]">
              <PathDiagram last={s.last} reduced={reduced} />
            </div>
          </WidgetScroll>
          <RedisSlots s={s} reduced={reduced} />
        </div>

        <ControlRow>
          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "update", delta: 1000 + Math.round(Math.random() * 900) })}>
            Update {HOT} (+likes)
          </Button>
          <SegmentedControl
            label="On update"
            size="sm"
            value={s.invalidate ? "delete" : "keep"}
            onChange={(v) => dispatch({ type: "invalidate", on: v === "delete" })}
            options={[
              { value: "delete", label: "Delete cache key" },
              { value: "keep", label: "Leave cache alone" },
            ]}
          />
        </ControlRow>
        <ControlRow>
          {reduced ? (
            <Button size="sm" variant="secondary" onClick={sendBatch}>
              Send 20 requests
            </Button>
          ) : (
            <Button size="sm" variant={traffic ? "success" : "secondary"} onClick={() => setTraffic((t) => !t)}>
              {traffic ? "Stop traffic" : "Simulate traffic"}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "flush" })}>
            <RotateCcw size={14} aria-hidden="true" /> Restart Redis
          </Button>
          {traffic && !reduced ? (
            <span className="text-[0.8rem] text-ink-3">{active ? "≈1.25 requests/s, 45% for the hot post" : "paused while off screen"}</span>
          ) : null}
        </ControlRow>

        {trafficOn ? (
          // While traffic runs the numbers change every request, so they are not announced.
          <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2">{stats}</div>
        ) : (
          <StatGrid>{stats}</StatGrid>
        )}
        <EventLog entries={s.log} label="Request log" />
      </div>
    </WidgetFrame>
  );
}

export default CacheAside satisfies ComponentType<InteractiveProps>;
