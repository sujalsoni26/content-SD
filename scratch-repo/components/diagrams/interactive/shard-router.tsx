"use client";

import { useId, useRef, useState } from "react";
import type { ComponentType } from "react";
import { MotionConfig, motion } from "motion/react";
import type { InteractiveProps } from "../interactive-registry";
import { WidgetFrame, ControlRow } from "@/components/ui/widget-frame";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat, StatGrid } from "@/components/ui/stat";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Deterministic model (same hash and seed as the original widget)     */
/* ------------------------------------------------------------------ */

type Strategy = "mod" | "hash" | "range" | "ring";
type ShardCount = 3 | 4;

const MAX_ID = 3_000_000;
const PER_SHARD = 1_000_000;
const VNODES = 8;
const SAMPLE_SIZE = 96;
const MOVE_SIZE = 6000;
const SIGNUP_BATCH = 12;
const MAX_SIGNUPS = 48;
const RING_SIZE = 4294967296;

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function h32(input: number): number {
  let x = input | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x = x ^ (x >>> 16);
  return x >>> 0;
}

const random = rng(4242);
function uniqueIds(count: number): number[] {
  const set = new Set<number>();
  while (set.size < count) set.add(1 + Math.floor(random() * MAX_ID));
  return [...set];
}
const SAMPLE = uniqueIds(SAMPLE_SIZE);
const MOVE = uniqueIds(MOVE_SIZE);

interface RingPoint {
  pos: number;
  shard: number;
}
function ringPoints(n: number): RingPoint[] {
  const pts: RingPoint[] = [];
  for (let s = 0; s < n; s++) for (let v = 0; v < VNODES; v++) pts.push({ pos: h32(s * 7919 + v * 104729 + 12345), shard: s });
  return pts.sort((a, b) => a.pos - b.pos);
}
const RING: Record<ShardCount, RingPoint[]> = { 3: ringPoints(3), 4: ringPoints(4) };

function ringOwner(key: number, n: ShardCount): RingPoint {
  const pos = h32(key);
  return RING[n].find((p) => p.pos >= pos) ?? RING[n][0];
}

function shardOf(id: number, n: ShardCount, strategy: Strategy): number {
  switch (strategy) {
    case "mod":
      return id % n;
    case "hash":
      return h32(id) % n;
    case "range":
      return Math.min(n - 1, Math.max(0, Math.floor((id - 1) / PER_SHARD)));
    case "ring":
      return ringOwner(id, n).shard;
  }
}

const STRATEGIES: Strategy[] = ["mod", "hash", "range", "ring"];

/** Share of keys that change shard when going from 3 to 4 shards, over 6,000 sampled user ids. */
const MOVED = Object.fromEntries(
  STRATEGIES.map((st) => [st, MOVE.filter((id) => shardOf(id, 3, st) !== shardOf(id, 4, st)).length / MOVE.length]),
) as Record<Strategy, number>;

/** Share of stored keys per shard, over the same sample. */
const LOAD = Object.fromEntries(
  STRATEGIES.map((st) => {
    const per = (n: ShardCount) => {
      const counts = Array.from({ length: n }, () => 0);
      for (const id of MOVE) counts[shardOf(id, n, st)]++;
      return counts.map((c) => c / MOVE.length);
    };
    return [st, { 3: per(3), 4: per(4) }];
  }),
) as Record<Strategy, Record<ShardCount, number[]>>;

const TONES = [
  { dot: "bg-accent", fill: "fill-accent", text: "text-accent" },
  { dot: "bg-amber", fill: "fill-amber", text: "text-amber-ink" },
  { dot: "bg-good", fill: "fill-good", text: "text-good" },
  { dot: "bg-violet", fill: "fill-violet", text: "text-violet" },
] as const;

const EXPLAIN: Record<Strategy, string> = {
  mod: "Modulo: user_id % N. Easy to read, but changing N reshuffles almost every key, even between the old shards. Real systems hash the key first.",
  hash: "Hash: hash(user_id) % N. Spreads keys evenly, but a range query has to ask every shard, and changing N still moves most keys.",
  range: "Range: each shard owns a block of ids. Range queries are easy, but ids grow over time, so every new sign-up lands on the newest shard: a hot shard.",
  ring: "Consistent hashing: shards sit at points on a ring and a key belongs to the next point clockwise. A new shard only takes over the slices next to its own points.",
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (f: number) => `${Math.round(f * 100)}%`;

function routeText(uid: number, n: ShardCount, strategy: Strategy): string {
  const s = shardOf(uid, n, strategy);
  switch (strategy) {
    case "mod":
      return `${uid} % ${n} = ${uid % n} → Shard ${s + 1}`;
    case "hash":
      return `hash(${uid}) = 0x${h32(uid).toString(16).padStart(8, "0")} → % ${n} = ${s} → Shard ${s + 1}`;
    case "range": {
      const lo = s * PER_SHARD + 1;
      const hi = s === n - 1 ? null : (s + 1) * PER_SHARD;
      return `${uid} is in ${fmt(lo)}${hi ? ` – ${fmt(hi)}` : "+"} → Shard ${s + 1}`;
    }
    case "ring":
      return `hash(${uid}) sits ${((h32(uid) / RING_SIZE) * 100).toFixed(1)}% round the ring → next point clockwise → Shard ${s + 1}`;
  }
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

interface KeyDot {
  id: number;
  home: number;
  moved: boolean;
  signup: boolean;
}

function ShardColumn({
  index,
  load,
  dots,
  hit,
  uid,
  scope,
}: {
  index: number;
  load: number;
  dots: KeyDot[];
  hit: boolean;
  uid: number;
  scope: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-lg border bg-surface-2 p-2 transition-colors",
        hit ? "border-accent shadow-[var(--shadow-soft)]" : "border-line",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-1">
        <span className="flex items-center gap-1 whitespace-nowrap text-[0.8rem] font-bold text-ink">
          <span aria-hidden="true" className={cn("size-2.5 rounded-full", TONES[index].dot)} />
          Shard {index + 1}
        </span>
        <span className="font-mono text-[0.72rem] tabular-nums text-ink-2">{pct(load)}</span>
      </div>
      <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-surface-3">
        <span className={cn("block h-full rounded-full transition-[width] duration-500", TONES[index].dot)} style={{ width: `${Math.min(100, load * 100 * 2)}%` }} />
      </span>
      <div aria-hidden="true" className="flex min-h-16 flex-wrap content-start gap-[3px]">
        {hit ? (
          <motion.span
            layoutId={`${scope}-you`}
            className="order-first rounded-full border-2 border-ink bg-surface px-1 font-mono text-[0.62rem] font-bold leading-tight text-ink"
          >
            {uid}
          </motion.span>
        ) : null}
        {dots.map((d) => (
          <motion.span
            key={d.id}
            layoutId={`${scope}-${d.id}`}
            className={cn(
              "size-[7px]",
              d.signup ? "rounded-[1px]" : "rounded-full",
              TONES[d.home].dot,
              d.moved && "outline outline-[1.5px] outline-offset-1 outline-bad",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function Ring({ uid, n }: { uid: number; n: ShardCount }) {
  const cx = 110;
  const cy = 110;
  const rad = 78;
  const point = (pos: number, r = rad): [number, number] => {
    const a = (pos / RING_SIZE) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const owner = ringOwner(uid, n);
  const kp = h32(uid);
  const a0 = (kp / RING_SIZE) * Math.PI * 2;
  let a1 = (owner.pos / RING_SIZE) * Math.PI * 2;
  if (a1 < a0) a1 += Math.PI * 2;
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = point(kp);
  const [x1, y1] = point(owner.pos);
  const [kx, ky] = point(kp, rad + 14);
  return (
    <svg viewBox="0 0 220 220" className="mx-auto block h-auto w-full max-w-[220px]" role="img" aria-label={`Hash ring with ${n} shards and ${VNODES} points each. User ${uid} belongs to Shard ${owner.shard + 1}.`}>
      <circle cx={cx} cy={cy} r={rad} className="fill-none stroke-line-strong" strokeWidth={2} />
      <path
        d={`M${x0.toFixed(1)} ${y0.toFixed(1)} A${rad} ${rad} 0 ${largeArc} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`}
        className="fill-none stroke-accent"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {RING[n].map((p) => {
        const [x, y] = point(p.pos);
        const isOwner = p === owner;
        return (
          <circle
            key={`${p.shard}-${p.pos}`}
            cx={x}
            cy={y}
            r={isOwner ? 7 : 4.5}
            className={cn(TONES[p.shard].fill, isOwner ? "stroke-ink" : "stroke-surface")}
            strokeWidth={isOwner ? 2 : 1.5}
          />
        );
      })}
      <path d={`M${kx.toFixed(1)} ${(ky - 6).toFixed(1)} l6 6 l-6 6 l-6 -6 z`} className="fill-ink" />
      <text x={cx} y={cy - 4} textAnchor="middle" className="dg-sub">
        user {uid}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" className="dg-text dg-text--accent">
        → Shard {owner.shard + 1}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

function ShardRouter() {
  const reduced = useReducedMotion();
  const scope = useId();
  const inputId = useId();
  const announced = useRef(false);

  const [strategy, setStrategy] = useState<Strategy>("mod");
  const [n, setN] = useState<ShardCount>(3);
  const [uidText, setUidText] = useState("42");
  const [signups, setSignups] = useState(0);

  // user ids start at 1; an empty box routes user 1
  const uid = Math.min(999_999_999, Math.max(1, Number(uidText.replace(/\D/g, "") || "1")));
  const hitShard = shardOf(uid, n, strategy);
  const keys = [...SAMPLE, ...Array.from({ length: signups }, (_, i) => MAX_ID + 1 + i)];
  const dots: KeyDot[] = keys.map((id) => {
    const home = shardOf(id, 3, strategy);
    return { id, home, moved: n === 4 && shardOf(id, 4, strategy) !== home, signup: id > MAX_ID };
  });
  const columns = Array.from({ length: n }, (_, k) => dots.filter((d) => shardOf(d.id, n, strategy) === k));
  const movedDots = dots.filter((d) => d.moved).length;
  const signupShards = Array.from({ length: n }, (_, k) => columns[k].filter((d) => d.signup).length);
  const busiestSignup = signupShards.indexOf(Math.max(...signupShards));

  const toggleShard = () => {
    const next: ShardCount = n === 3 ? 4 : 3;
    setN(next);
    if (next === 4 && !announced.current) {
      announced.current = true;
      const moved = MOVED[strategy];
      emitCompanionEvent(
        moved > 0.5
          ? { type: "diagram", mood: "confused", message: `${pct(moved)} of keys had to move. Ouch.` }
          : { type: "diagram", mood: "happy", message: `Only ${pct(moved)} of keys moved.` },
      );
    }
  };

  let tail: string;
  if (strategy === "range") {
    tail = signups
      ? ` All ${signups} new sign-ups landed on Shard ${busiestSignup + 1}, the newest range.`
      : " Adding Shard 4 for ids above 3,000,000 moves nothing, but every new user lands on it. Try adding sign-ups.";
  } else if (strategy === "ring") {
    tail = ` Going from 3 to 4 shards moves ${pct(MOVED.ring)} of keys: only the slices Shard 4 takes over, never keys between old shards. An even split would move exactly 25%; with just ${VNODES} points per shard the slices are uneven, which is why real rings use hundreds of virtual nodes.`;
  } else {
    tail = ` Going from 3 to 4 shards moves ${pct(MOVED[strategy])} of keys, three times the 25% an even split needs. That is why resharding hurts.`;
  }
  const note = `${EXPLAIN[strategy]}${tail}${n === 4 && strategy !== "range" ? " Outlined dots are keys that moved." : ""}`;

  return (
    <WidgetFrame
      kicker="Route it"
      title="Which shard holds this user?"
      hint="Type a user_id, switch strategies, then add a fourth shard and count how many keys have to move."
      note={note}
    >
      <ControlRow>
        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="font-mono text-sm font-bold text-ink-2">
            user_id
          </label>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={uidText}
            onChange={(e) => setUidText(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="w-28 rounded-lg border border-line-strong bg-surface px-2 py-1.5 font-mono text-sm tabular-nums text-ink"
          />
        </div>
        <p aria-live="polite" className="min-w-0 flex-1 basis-56">
          <code className="rounded-md bg-surface-2 px-2 py-1 font-mono text-[0.8rem] text-accent [overflow-wrap:anywhere]">
            {routeText(uid, n, strategy)}
          </code>
        </p>
      </ControlRow>

      <ControlRow>
        <SegmentedControl
          label="Sharding strategy"
          size="sm"
          value={strategy}
          onChange={setStrategy}
          options={[
            { value: "mod", label: "Modulo" },
            { value: "hash", label: "Hash" },
            { value: "range", label: "Range" },
            { value: "ring", label: "Consistent hashing" },
          ]}
        />
        <Button size="sm" variant={n === 3 ? "primary" : "secondary"} onClick={toggleShard}>
          {n === 3 ? "Add shard 4" : "Remove shard 4"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSignups((s) => Math.min(MAX_SIGNUPS, s + SIGNUP_BATCH))} disabled={signups >= MAX_SIGNUPS}>
          + {SIGNUP_BATCH} new sign-ups
        </Button>
        {signups > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => setSignups(0)}>
            Clear sign-ups
          </Button>
        ) : null}
      </ControlRow>

      <MotionConfig reducedMotion={reduced ? "always" : "never"} transition={{ type: "spring", stiffness: 260, damping: 30 }}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className={cn("grid min-w-0 flex-1 gap-1.5", n === 3 ? "grid-cols-3" : "grid-cols-4")}>
            {columns.map((col, k) => (
              <ShardColumn key={k} index={k} load={LOAD[strategy][n][k]} dots={col} hit={k === hitShard} uid={uid} scope={scope} />
            ))}
          </div>
          {strategy === "ring" ? (
            <div className="shrink-0 md:w-[220px]">
              <Ring uid={uid} n={n} />
            </div>
          ) : null}
        </div>
      </MotionConfig>
      <p className="text-[0.8rem] text-ink-3">
        Each dot is a user (squares are new sign-ups), coloured by the shard it lived on with 3 shards.
        {n === 4 ? ` ${movedDots} of ${dots.length} dots changed shard.` : ""}
        {signups > 0 ? ` New sign-ups per shard: ${signupShards.join(" / ")}.` : ""} Column % is the share of all stored keys.
      </p>

      <StatGrid>
        <Stat label="Shards" value={n} />
        <Stat label="3 → 4 shards moves" value={`${pct(MOVED[strategy])} of keys`} tone={MOVED[strategy] > 0.5 ? "bad" : "good"} />
        <Stat label="Even split needs" value="25% moved" />
        <Stat label="User lands on" value={`Shard ${hitShard + 1}`} tone="accent" />
      </StatGrid>
    </WidgetFrame>
  );
}

export default ShardRouter satisfies ComponentType<InteractiveProps>;
