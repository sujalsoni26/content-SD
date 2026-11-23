"use client";

import { useEffect, useEffectEvent, useReducer, useRef } from "react";
import type { ComponentType } from "react";
import { motion } from "motion/react";
import type { InteractiveProps } from "../interactive-registry";
import { WidgetFrame, WidgetScroll, ControlRow } from "@/components/ui/widget-frame";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RangeField } from "@/components/ui/range-field";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Chip } from "@/components/ui/chip";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { useInView } from "@/lib/hooks/use-in-view";
import { usePageVisible } from "@/lib/hooks/use-page-visible";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Model                                                               */
/* ------------------------------------------------------------------ */

type Mode = "async" | "sync";
type ReplicaIndex = 0 | 1;
type Source = "primary" | ReplicaIndex;

const REPLICAS = [
  { name: "Replica A", factor: 1 },
  { name: "Replica B", factor: 1.6 },
] as const;
const RYW_WINDOW_MS = 10_000;
const PRIMARY_WRITE_MS = 4;
const TEXTS = ["Love this shot!", "Take me there", "Goals!", "That light though", "Where is this?", "Saving this", "So good"];

interface Comment {
  id: number;
  text: string;
  mine: boolean;
  postedAt: number;
  /** When each replica applies it (ms, performance.now clock). */
  arrives: readonly [number, number];
}

interface Write {
  id: number;
  text: string;
  start: number;
  confirmAt: number;
  mode: Mode;
}

interface Feed {
  source: Source;
  ids: number[];
  stale: boolean;
  readNo: number;
}

type LastEvent = "intro" | "posted" | "read" | "mode" | "ryw" | "lag";

interface RepState {
  now: number;
  comments: Comment[];
  lagS: number;
  mode: Mode;
  ryw: boolean;
  lastWrite: Write | null;
  /** Reads go to the primary until this time when read-your-own-writes is on. */
  rywUntil: number;
  feed: Feed;
  reads: number;
  staleReads: number;
  event: LastEvent;
}

type Action =
  | { type: "tick"; now: number }
  | { type: "post"; now: number }
  | { type: "refresh"; now: number; pick: ReplicaIndex }
  | { type: "lag"; lagS: number }
  | { type: "mode"; mode: Mode }
  | { type: "ryw"; on: boolean };

const SEED: Comment[] = [
  { id: 1, text: "Nice shot!", mine: false, postedAt: 0, arrives: [0, 0] },
  { id: 2, text: "Where is this?", mine: false, postedAt: 0, arrives: [0, 0] },
];

const INITIAL: RepState = {
  now: 0,
  comments: SEED,
  lagS: 2,
  mode: "async",
  ryw: false,
  lastWrite: null,
  rywUntil: 0,
  feed: { source: 0, ids: [1, 2], stale: false, readNo: 0 },
  reads: 0,
  staleReads: 0,
  event: "intro",
};

const isWaiting = (s: RepState, now = s.now) => s.lastWrite !== null && s.lastWrite.mode === "sync" && now < s.lastWrite.confirmAt;
const replicaHas = (c: Comment, i: ReplicaIndex, now: number) => c.arrives[i] <= now;

function reducer(s: RepState, a: Action): RepState {
  switch (a.type) {
    case "tick":
      return a.now === s.now ? s : { ...s, now: a.now };
    case "post": {
      if (isWaiting(s, a.now)) return s;
      const id = s.comments[s.comments.length - 1].id + 1;
      const text = TEXTS[(id - 3) % TEXTS.length];
      const lagMs = s.lagS * 1000;
      const arrives = [a.now + lagMs * REPLICAS[0].factor, a.now + lagMs * REPLICAS[1].factor] as const;
      const confirmAt = s.mode === "sync" && lagMs > 0 ? Math.max(...arrives) + PRIMARY_WRITE_MS : a.now + PRIMARY_WRITE_MS;
      return {
        ...s,
        now: a.now,
        comments: [...s.comments, { id, text, mine: true, postedAt: a.now, arrives }],
        lastWrite: { id, text, start: a.now, confirmAt, mode: s.mode },
        rywUntil: confirmAt + RYW_WINDOW_MS,
        event: "posted",
      };
    }
    case "refresh": {
      if (isWaiting(s, a.now)) return s;
      const source: Source = s.ryw && a.now < s.rywUntil ? "primary" : a.pick;
      const ids = s.comments.filter((c) => source === "primary" || replicaHas(c, source, a.now)).map((c) => c.id);
      const stale = s.lastWrite !== null && !ids.includes(s.lastWrite.id);
      return {
        ...s,
        now: a.now,
        feed: { source, ids, stale, readNo: s.feed.readNo + 1 },
        reads: s.reads + 1,
        staleReads: s.staleReads + (stale ? 1 : 0),
        event: "read",
      };
    }
    case "lag":
      return { ...s, lagS: a.lagS, event: "lag" };
    case "mode":
      return { ...s, mode: a.mode, event: "mode" };
    case "ryw":
      return { ...s, ryw: a.on, event: "ryw" };
  }
}

/** Seconds of lag for a replica, without float noise (1.5 × 1.6 → 2.4). */
const lagFor = (lagS: number, i: ReplicaIndex) => Number((lagS * REPLICAS[i].factor).toFixed(2));
const sourceName = (src: Source) => (src === "primary" ? "Primary" : REPLICAS[src].name);
const secs = (ms: number) => `${Math.max(0, ms / 1000).toFixed(1)} s`;

function describe(s: RepState): string {
  const w = s.lastWrite;
  switch (s.event) {
    case "intro":
      return "Async replication with 2 s of lag. Post a comment, then refresh right away.";
    case "posted":
      if (!w) return "";
      if (w.mode === "sync") {
        return s.now < w.confirmAt
          ? "Sync replication: the primary holds the confirmation until both replicas have the comment. You wait as long as the slowest replica."
          : `Saved and confirmed by both replicas after ${Math.round((w.confirmAt - w.start) / 10) * 10} ms. Slower, but no replica can serve a stale read of it.`;
      }
      return s.lagS === 0
        ? "Saved on the primary, and with 0 s of lag the replicas have it at once. Real replicas are never quite that fast."
        : `Saved on the primary in ${PRIMARY_WRITE_MS} ms. The replicas catch up in the background (${lagFor(s.lagS, 0)} s and ${lagFor(s.lagS, 1)} s). Now hit Refresh.`;
    case "read": {
      const name = sourceName(s.feed.source);
      if (s.feed.stale) {
        return `Your comment vanished! ${name} hasn't received it yet (replication lag). Turn on read-your-own-writes, or wait and refresh again.`;
      }
      if (s.feed.source === "primary") {
        return "Read from the primary because you wrote in the last 10 s (read-your-own-writes). Your comment is there. Everyone else still reads replicas.";
      }
      return w
        ? `${name} has caught up, so your comment shows. This is eventual consistency: replicas converge once writes stop.`
        : `Read from ${name}. Reads are spread across the replicas.`;
    }
    case "mode":
      return s.mode === "sync"
        ? "Sync: the primary waits for both replicas before confirming. Reads are never stale, but every write takes as long as the slowest replica."
        : "Async: the primary confirms at once and replicas catch up in the background. Fast writes, but reads can be stale.";
    case "ryw":
      return s.ryw
        ? "Read-your-own-writes: for 10 s after you write, your reads go to the primary. Everyone else still reads replicas."
        : "Read-your-own-writes off: every read goes to a random replica.";
    case "lag":
      return `Replication lag ${s.lagS} s: Replica A applies writes after ${lagFor(s.lagS, 0)} s, Replica B after ${lagFor(s.lagS, 1)} s.`;
  }
}

/* ------------------------------------------------------------------ */
/* Diagram                                                             */
/* ------------------------------------------------------------------ */

const LINKS = [
  { from: [150, 152], to: [79, 204] },
  { from: [210, 152], to: [281, 204] },
] as const;
const READ_PATHS: Record<Source, string> = {
  primary: "M200 46 L200 94",
  0: "M120 30 C 40 30, 24 120, 46 202",
  1: "M240 30 C 320 30, 336 120, 314 202",
};
const REPLICA_X = [6, 208] as const;

function Node({ x, y, w, h = 52, title, sub, tone }: { x: number; y: number; w: number; h?: number; title: string; sub: string; tone: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} className={cn("dg-box transition-[fill,stroke] duration-300", tone)} />
      <text x={x + w / 2} y={y + h * 0.42} textAnchor="middle" className="dg-text">
        {title}
      </text>
      <text x={x + w / 2} y={y + h * 0.8} textAnchor="middle" className="dg-label">
        {sub}
      </text>
    </g>
  );
}

function ReplicationDiagram({ s, reduced }: { s: RepState; reduced: boolean }) {
  const { now } = s;
  const waiting = isWaiting(s);
  const readSrc = s.reads > 0 ? s.feed.source : null;
  const behind = (i: ReplicaIndex) => s.comments.filter((c) => !replicaHas(c, i, now));

  return (
    <svg
      viewBox="0 0 360 262"
      className="mx-auto block h-auto w-full max-w-[30rem]"
      role="img"
      aria-label={`Primary has ${s.comments.length} comments. ${REPLICAS.map((r, i) => `${r.name} has ${s.comments.length - behind(i as ReplicaIndex).length}`).join(", ")}.`}
    >
      {/* write path */}
      <path d="M160 46 L160 94" className="dg-line dg-line--accent" markerEnd="url(#ah-accent)" />
      <text x={152} y={74} textAnchor="end" className="dg-label">
        write
      </text>
      {/* replication links */}
      {LINKS.map((l, i) => (
        <path
          key={i}
          d={`M${l.from[0]} ${l.from[1]} L${l.to[0]} ${l.to[1]}`}
          className={cn("dg-line", behind(i as ReplicaIndex).length ? "dg-line--dash" : "")}
          markerEnd="url(#ah)"
        />
      ))}
      <text x={180} y={182} textAnchor="middle" className="dg-label">
        replication ({s.mode})
      </text>
      {/* read path, redrawn on every refresh */}
      {readSrc !== null ? (
        <motion.path
          key={s.feed.readNo}
          d={READ_PATHS[readSrc]}
          className={cn("dg-line", s.feed.stale ? "dg-line--bad" : "dg-line--good")}
          strokeWidth={2.5}
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      ) : null}
      {readSrc !== null ? (
        <text
          x={readSrc === "primary" ? 208 : readSrc === 0 ? 44 : 316}
          y={readSrc === "primary" ? 74 : 120}
          textAnchor={readSrc === 1 ? "end" : "start"}
          className={cn("dg-label", s.feed.stale ? "dg-text--bad" : "dg-text--good")}
        >
          read
        </text>
      ) : null}

      <Node x={120} y={0} w={120} h={46} title="You" sub={waiting ? "waiting for confirm…" : "app"} tone={waiting ? "dg-box--accent" : ""} />
      <Node x={105} y={96} w={150} title="Primary" sub={`${s.comments.length} comments · takes writes`} tone="dg-box--accent" />
      {REPLICAS.map((r, i) => {
        const idx = i as ReplicaIndex;
        const pending = behind(idx);
        const next = pending.length ? Math.min(...pending.map((c) => c.arrives[idx])) : 0;
        return (
          <Node
            key={r.name}
            x={REPLICA_X[idx]}
            y={204}
            w={146}
            title={r.name}
            sub={pending.length ? `catching up · ${secs(next - now)}` : `in sync · ${s.comments.length} comments`}
            tone={pending.length ? "fill-warn-soft stroke-warn" : "dg-box--good"}
          />
        );
      })}

      {/* comments in flight along each replication link */}
      {reduced
        ? null
        : REPLICAS.map((_, i) => {
            const idx = i as ReplicaIndex;
            const l = LINKS[idx];
            return behind(idx).map((c) => {
              const p = Math.min(1, Math.max(0, (now - c.postedAt) / Math.max(1, c.arrives[idx] - c.postedAt)));
              return (
                <circle
                  key={`${idx}-${c.id}`}
                  cx={l.from[0] + (l.to[0] - l.from[0]) * p}
                  cy={l.from[1] + (l.to[1] - l.from[1]) * p}
                  r={6}
                  className="fill-amber stroke-surface"
                  strokeWidth={1.5}
                />
              );
            });
          })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Feed                                                                */
/* ------------------------------------------------------------------ */

function FeedCard({ s }: { s: RepState }) {
  const visible = s.comments.filter((c) => s.feed.ids.includes(c.id)).slice(-4);
  const missing = s.feed.stale && s.lastWrite ? s.lastWrite : null;
  const pinned = s.ryw && s.now < s.rywUntil;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line-strong bg-surface-2 p-3">
      <p className="flex flex-wrap items-center gap-2 text-[0.88rem]">
        <strong className="text-ink">Your feed</strong>
        <span className="text-[0.8rem] text-ink-3">{s.reads ? `read from ${sourceName(s.feed.source)}` : "not refreshed yet"}</span>
        {s.reads ? (
          s.feed.stale ? (
            <Chip tone="bad">your comment is missing</Chip>
          ) : s.feed.source === "primary" ? (
            <Chip tone="accent">read-your-writes</Chip>
          ) : (
            <Chip tone="good">up to date</Chip>
          )
        ) : null}
      </p>
      <ul className="flex flex-col gap-1 text-[0.86rem]">
        {visible.map((c) => (
          <li
            key={c.id}
            className={cn(
              "rounded-md px-2 py-1 [overflow-wrap:anywhere]",
              c.mine ? "bg-amber-soft font-bold text-amber-ink" : "bg-surface text-ink-2",
            )}
          >
            {c.text}
            {c.mine ? <span className="font-normal"> · you</span> : null}
          </li>
        ))}
        {missing ? (
          <li className="rounded-md border border-dashed border-bad px-2 py-1 text-bad [overflow-wrap:anywhere]">
            “{missing.text}” (yours) is not on this replica yet
          </li>
        ) : null}
      </ul>
      {pinned ? (
        <p className="font-mono text-[0.72rem] tabular-nums text-accent">
          your reads are pinned to the primary for {Math.ceil((s.rywUntil - s.now) / 1000)} s
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

function ReplicationLag() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const visible = usePageVisible();
  const warned = useRef(false);
  const [s, dispatch] = useReducer(reducer, INITIAL);

  const waiting = isWaiting(s);
  const inFlight = s.comments.some((c) => c.arrives[0] > s.now || c.arrives[1] > s.now);
  const needsClock = inFlight || waiting || (s.ryw && s.now < s.rywUntil);
  const clockOn = needsClock && inView && visible;

  const tick = useEffectEvent(() => dispatch({ type: "tick", now: performance.now() }));
  useEffect(() => {
    if (!clockOn) return;
    if (reduced) {
      const id = window.setInterval(() => tick(), 250);
      return () => window.clearInterval(id);
    }
    let raf = 0;
    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [clockOn, reduced]);

  const refresh = () => {
    const now = performance.now();
    const pick: ReplicaIndex = Math.random() < 0.5 ? 0 : 1;
    const toPrimary = s.ryw && now < s.rywUntil;
    const willBeStale =
      !toPrimary && s.lastWrite !== null && !s.comments.some((c) => c.id === s.lastWrite?.id && replicaHas(c, pick, now));
    if (willBeStale && !warned.current) {
      warned.current = true;
      emitCompanionEvent({ type: "diagram", mood: "confused", message: "Where did my comment go? Replication lag!" });
    }
    dispatch({ type: "refresh", now, pick });
  };

  const w = s.lastWrite;
  const confirmed = w && s.now >= w.confirmAt ? `${Math.round((w.confirmAt - w.start) / 10) * 10 || PRIMARY_WRITE_MS} ms` : w ? "waiting…" : "–";

  return (
    <WidgetFrame
      kicker="Try it"
      title="The vanishing comment"
      hint="Post a comment, then refresh. Your read goes to a replica that may not have caught up yet."
      note={describe(s)}
    >
      <div ref={rootRef} className="flex flex-col gap-4">
        <ControlRow>
          <Button variant="primary" size="sm" onClick={() => dispatch({ type: "post", now: performance.now() })} disabled={waiting}>
            {waiting && w ? `Waiting for replicas… ${secs(w.confirmAt - s.now)}` : "Post comment"}
          </Button>
          <Button variant="secondary" size="sm" onClick={refresh} disabled={waiting}>
            Refresh feed
          </Button>
        </ControlRow>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
          <WidgetScroll>
            <div className="min-w-[288px]">
              <ReplicationDiagram s={s} reduced={reduced} />
            </div>
          </WidgetScroll>
          <FeedCard s={s} />
        </div>

        <ControlRow>
          <RangeField
            label="Replication lag"
            min={0}
            max={5}
            step={0.5}
            value={s.lagS}
            onChange={(lagS) => dispatch({ type: "lag", lagS })}
            display={`${s.lagS} s`}
          />
        </ControlRow>
        <ControlRow>
          <SegmentedControl
            label="Replication mode"
            size="sm"
            value={s.mode}
            onChange={(mode) => dispatch({ type: "mode", mode })}
            options={[
              { value: "async", label: "Async" },
              { value: "sync", label: "Sync" },
            ]}
          />
          <SegmentedControl
            label="Read-your-own-writes"
            size="sm"
            value={s.ryw ? "on" : "off"}
            onChange={(v) => dispatch({ type: "ryw", on: v === "on" })}
            options={[
              { value: "off", label: "Read-your-writes off" },
              { value: "on", label: "Read-your-writes on" },
            ]}
          />
        </ControlRow>

        <StatGrid>
          <Stat label="Reads" value={s.reads} />
          <Stat label="Stale reads" value={s.staleReads} tone={s.staleReads ? "bad" : "neutral"} />
          <Stat label="Write confirmed in" value={confirmed} tone={w?.mode === "sync" ? "warn" : "good"} />
        </StatGrid>
      </div>
    </WidgetFrame>
  );
}

export default ReplicationLag satisfies ComponentType<InteractiveProps>;
