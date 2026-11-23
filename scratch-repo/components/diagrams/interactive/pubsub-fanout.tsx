"use client";

import { useReducer, useRef } from "react";
import type { ComponentType } from "react";
import { motion } from "motion/react";
import { Plus, Send, X } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { WidgetFrame, WidgetScroll, ControlRow } from "@/components/ui/widget-frame";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat, StatGrid } from "@/components/ui/stat";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Model                                                               */
/* ------------------------------------------------------------------ */

type Mode = "queue" | "pubsub";

interface Consumer {
  id: string;
  name: string;
  online: boolean;
  received: number;
  /** Pub/sub: copies waiting in this subscriber's own queue while it is offline. */
  backlog: number;
  /** Events published before this consumer joined; it never sees those. */
  joinedAfter: number;
  removable: boolean;
}

interface Flight {
  id: number;
  event: number;
  mode: Mode;
  /** Consumer id, or null when no worker is online and the message waits in the broker. */
  target: string | null;
  /** Pub/sub copy for an offline subscriber: it stops in that subscriber's queue. */
  toQueue: boolean;
  delay: number;
}

interface PState {
  mode: Mode;
  published: Record<Mode, number>;
  subscribers: Consumer[];
  workers: Consumer[];
  /** Queue mode: messages waiting because no worker is online. */
  brokerBacklog: number;
  rr: number;
  flights: Flight[];
  flightSeq: number;
  message: string;
}

type Action =
  | { type: "publish"; count: number; instant: boolean }
  | { type: "land"; id: number }
  | { type: "toggle"; id: string }
  | { type: "add" }
  | { type: "remove"; id: string }
  | { type: "mode"; mode: Mode };

const EXTRA_SUBSCRIBERS = [
  { id: "recommendations", name: "Recommendations" },
  { id: "moderation", name: "Moderation" },
];
const MAX_WORKERS = 4;
const FLIGHT_S = 1.1;
const STAGGER_S = 0.2;

const sub = (id: string, name: string, received: number): Consumer => ({
  id,
  name,
  online: true,
  received,
  backlog: 0,
  joinedAfter: 0,
  removable: false,
});

const INITIAL: PState = {
  mode: "pubsub",
  published: { pubsub: 3, queue: 6 },
  subscribers: [sub("notifications", "Notifications", 3), sub("analytics", "Analytics", 3), sub("search", "Search", 3)],
  workers: [sub("w1", "Worker 1", 2), sub("w2", "Worker 2", 2), sub("w3", "Worker 3", 2)],
  brokerBacklog: 0,
  rr: 0,
  flights: [],
  flightSeq: 1,
  message:
    "Pub/sub: the post service publishes one PostCreated event to the post-events topic, and every subscriber gets its own copy. Publish a post.",
};

const listKey = (mode: Mode): "subscribers" | "workers" => (mode === "pubsub" ? "subscribers" : "workers");
const names = (list: string[]) => (list.length <= 1 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`);

/** Apply one copy arriving at its destination. */
function land(s: PState, f: Flight): PState {
  if (f.mode === "queue") {
    if (f.target === null) return { ...s, brokerBacklog: s.brokerBacklog + 1 };
    return { ...s, workers: s.workers.map((w) => (w.id === f.target ? { ...w, received: w.received + 1 } : w)) };
  }
  return {
    ...s,
    subscribers: s.subscribers.map((c) =>
      c.id !== f.target ? c : c.online ? { ...c, received: c.received + 1 } : { ...c, backlog: c.backlog + 1 },
    ),
  };
}

function publish(s: PState, count: number, instant: boolean): PState {
  const mode = s.mode;
  const flights: Flight[] = [];
  let seq = s.flightSeq;
  let rr = s.rr;
  const chosen: string[] = [];
  for (let e = 0; e < count; e++) {
    const event = s.published[mode] + e + 1;
    const delay = e * STAGGER_S;
    if (mode === "pubsub") {
      for (const c of s.subscribers) flights.push({ id: seq++, event, mode, target: c.id, toQueue: !c.online, delay });
    } else {
      const n = s.workers.length;
      let target: Consumer | null = null;
      for (let k = 0; k < n; k++) {
        const w = s.workers[(rr + k) % n];
        if (w.online) {
          target = w;
          rr = (rr + k + 1) % n;
          break;
        }
      }
      chosen.push(target ? target.name : "nobody (waiting in the queue)");
      flights.push({ id: seq++, event, mode, target: target?.id ?? null, toQueue: false, delay });
    }
  }
  const last = s.published[mode] + count;
  let message: string;
  if (mode === "pubsub") {
    const offline = s.subscribers.filter((c) => !c.online).map((c) => c.name);
    const n = s.subscribers.length;
    message = `${count === 1 ? `PostCreated #${last} was` : `${count} PostCreated events were`} published once, and each of the ${n} subscribers gets its own copy: ${n * count} deliveries in all.${
      offline.length ? ` ${names(offline)} ${offline.length === 1 ? "is" : "are"} down, so ${offline.length === 1 ? "its copies wait" : "their copies wait"} in ${offline.length === 1 ? "its own queue" : "their own queues"}.` : ""
    }`;
  } else {
    message =
      count === 1
        ? `PostCreated #${last} went to ${chosen[0]} only. The other workers never see it: a queue shares out work, it doesn't copy it.`
        : `${count} posts were shared out round-robin: ${chosen.join(", ")}. Each post was handled exactly once.`;
  }
  const base: PState = { ...s, published: { ...s.published, [mode]: last }, rr, flightSeq: seq, message };
  if (instant) return flights.reduce(land, base);
  return { ...base, flights: [...s.flights, ...flights] };
}

function reducer(s: PState, a: Action): PState {
  switch (a.type) {
    case "publish":
      return publish(s, a.count, a.instant);
    case "land": {
      const f = s.flights.find((x) => x.id === a.id);
      if (!f) return s;
      return land({ ...s, flights: s.flights.filter((x) => x.id !== a.id) }, f);
    }
    case "toggle": {
      const key = listKey(s.mode);
      const c = s[key].find((x) => x.id === a.id);
      if (!c) return s;
      if (s.mode === "pubsub") {
        const subscribers = s.subscribers.map((x) =>
          x.id !== a.id ? x : x.online ? { ...x, online: false } : { ...x, online: true, received: x.received + x.backlog, backlog: 0 },
        );
        return {
          ...s,
          subscribers,
          message: c.online
            ? `${c.name} is down. Its copies wait in its own queue; the post service and the other subscribers don't notice.`
            : c.backlog
              ? `${c.name} is back and catches up on ${c.backlog} missed event${c.backlog === 1 ? "" : "s"} from its own queue.`
              : `${c.name} is back online. Nothing was published while it was down.`,
        };
      }
      const goingOnline = !c.online;
      const drained = goingOnline ? s.brokerBacklog : 0;
      return {
        ...s,
        brokerBacklog: s.brokerBacklog - drained,
        workers: s.workers.map((x) => (x.id !== a.id ? x : { ...x, online: goingOnline, received: x.received + drained })),
        message: goingOnline
          ? `${c.name} is back${drained ? ` and takes the ${drained} message${drained === 1 ? "" : "s"} that waited in the queue` : ""}.`
          : `${c.name} is down. New posts go to the remaining workers: competing consumers cover for each other.`,
      };
    }
    case "add": {
      if (s.mode === "pubsub") {
        const next = EXTRA_SUBSCRIBERS.find((e) => !s.subscribers.some((c) => c.id === e.id));
        if (!next) return s;
        const c: Consumer = { ...sub(next.id, next.name, 0), joinedAfter: s.published.pubsub, removable: true };
        return {
          ...s,
          subscribers: [...s.subscribers, c],
          message: `${c.name} subscribed to post-events. The post service didn't change a line or redeploy. ${c.name} only gets events published from now on; a log-based broker like Kafka could replay older ones.`,
        };
      }
      if (s.workers.length >= MAX_WORKERS) return s;
      const n = s.workers.length + 1;
      return {
        ...s,
        workers: [...s.workers, { ...sub(`w${n}`, `Worker ${n}`, 0), joinedAfter: s.published.queue, removable: true }],
        message: `Added Worker ${n}. The same stream of posts is now shared by ${n} workers, so each does less. More consumers on a queue means more throughput, not more features.`,
      };
    }
    case "remove": {
      const key = listKey(s.mode);
      const c = s[key].find((x) => x.id === a.id);
      if (!c || !c.removable) return s;
      return {
        ...s,
        [key]: s[key].filter((x) => x.id !== a.id),
        rr: 0,
        message:
          s.mode === "pubsub"
            ? `${c.name} unsubscribed. Again, the post service didn't change.`
            : `${c.name} removed. The others pick up its share.`,
      };
    }
    case "mode": {
      if (a.mode === s.mode) return s;
      // Anything still in flight lands at once, so no copy is lost when the view switches.
      const settled = s.flights.reduce(land, { ...s, flights: [] });
      return {
        ...settled,
        mode: a.mode,
        message:
          a.mode === "queue"
            ? "Queue: each message goes to ONE of the competing workers (work distribution). Good for sharing a job out, but analytics or search would never see the post."
            : "Pub/sub: each event goes to EVERY subscriber, each through its own queue (fan-out). Real systems combine both: each subscriber can run several workers on its queue.",
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Diagram                                                             */
/* ------------------------------------------------------------------ */

const W = 400;
const ROW_H = 44;
const PRODUCER = { x: 4, w: 100 };
const BROKER = { x: 132, w: 96 };
const SUBQ = { x: 256, w: 24 };
const CONSUMER = { x: 290, w: 106 };

function layout(n: number) {
  const H = Math.max(170, n * ROW_H + 26);
  const cy = H / 2;
  const top = cy - (n * ROW_H) / 2 + ROW_H / 2;
  return { H, cy, rowY: (i: number) => top + i * ROW_H };
}

function FlightDot({ f, cy, rowCy, onLand }: { f: Flight; cy: number; rowCy: number | null; onLand: () => void }) {
  const px = PRODUCER.x + PRODUCER.w;
  const bIn = BROKER.x;
  const bOut = BROKER.x + BROKER.w;
  let cx: number[];
  let cys: number[];
  if (rowCy === null) {
    // No worker online: the message stops inside the broker.
    cx = [px, bIn, BROKER.x + BROKER.w / 2];
    cys = [cy, cy, cy];
  } else if (f.mode === "queue") {
    cx = [px, bIn, bOut, CONSUMER.x];
    cys = [cy, cy, cy, rowCy];
  } else if (f.toQueue) {
    cx = [px, bIn, bOut, SUBQ.x + SUBQ.w / 2];
    cys = [cy, cy, cy, rowCy];
  } else {
    cx = [px, bIn, bOut, SUBQ.x, CONSUMER.x];
    cys = [cy, cy, cy, rowCy, rowCy];
  }
  const times = cx.map((_, i) => i / (cx.length - 1));
  return (
    <motion.circle
      r={6}
      className={cn(f.toQueue || rowCy === null ? "fill-warn" : "fill-accent", "stroke-surface")}
      strokeWidth={1.5}
      initial={{ cx: px, cy, opacity: 0 }}
      animate={{ cx, cy: cys, opacity: 1 }}
      transition={{ duration: FLIGHT_S, delay: f.delay, ease: "linear", times, opacity: { duration: 0.1, delay: f.delay } }}
      onAnimationComplete={onLand}
    />
  );
}

function ConsumerNode({ c, y, mode, reduced }: { c: Consumer; y: number; mode: Mode; reduced: boolean }) {
  return (
    <g>
      {mode === "pubsub" ? (
        <g>
          <rect x={SUBQ.x} y={y - 9} width={SUBQ.w} height={18} rx={4} className={cn("dg-box", c.backlog ? "fill-warn-soft stroke-warn" : "")} />
          <text x={SUBQ.x + SUBQ.w / 2} y={y + 4} textAnchor="middle" className={cn("dg-label text-[10px]", c.backlog ? "fill-warn" : "")}>
            {c.backlog || ""}
          </text>
          <path d={`M${SUBQ.x + SUBQ.w} ${y} L${CONSUMER.x} ${y}`} className={cn("dg-line", !c.online && "dg-line--dash")} />
        </g>
      ) : null}
      <rect
        x={CONSUMER.x}
        y={y - 17}
        width={CONSUMER.w}
        height={34}
        rx={8}
        className={cn("dg-box transition-[fill,stroke] duration-300", c.online ? "dg-box--good" : "dg-box--ghost")}
      />
      {!reduced && c.received > 0 ? (
        <motion.rect
          key={c.received}
          x={CONSUMER.x}
          y={y - 17}
          width={CONSUMER.w}
          height={34}
          rx={8}
          className="fill-good"
          initial={{ opacity: 0.45 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ) : null}
      <text x={CONSUMER.x + CONSUMER.w / 2} y={y - 2} textAnchor="middle" className={cn("dg-text text-[11.5px]", !c.online && "fill-ink-3")}>
        {c.name}
      </text>
      <text x={CONSUMER.x + CONSUMER.w / 2} y={y + 12} textAnchor="middle" className="dg-label text-[10.5px]">
        {c.online ? `${c.received} received` : "offline"}
      </text>
    </g>
  );
}

function FanoutDiagram({ s, reduced, onLand }: { s: PState; reduced: boolean; onLand: (id: number) => void }) {
  const list = s[listKey(s.mode)];
  const { H, cy, rowY } = layout(list.length);
  const bOut = BROKER.x + BROKER.w;
  const rowOf = (id: string | null) => {
    const i = list.findIndex((c) => c.id === id);
    return i < 0 ? null : rowY(i);
  };
  const label =
    s.mode === "pubsub"
      ? `Post service publishes to the post-events topic; ${list.length} subscribers each receive a copy.`
      : `Post service sends to the post-jobs queue; each message goes to one of ${list.length} workers.`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-[34rem]" role="img" aria-label={label}>
      {/* producer → broker */}
      <path d={`M${PRODUCER.x + PRODUCER.w} ${cy} L${BROKER.x} ${cy}`} className="dg-line" markerEnd="url(#ah)" />
      {/* broker → consumers */}
      {list.map((c, i) => {
        const y = rowY(i);
        const end = s.mode === "pubsub" ? SUBQ.x : CONSUMER.x;
        return (
          <path
            key={c.id}
            d={`M${bOut} ${cy} C ${bOut + 18} ${cy}, ${end - 18} ${y}, ${end} ${y}`}
            className={cn("dg-line", s.mode === "queue" && !c.online && "dg-line--dash")}
          />
        );
      })}

      <rect x={PRODUCER.x} y={cy - 28} width={PRODUCER.w} height={56} rx={10} className="dg-box dg-box--accent" />
      <text x={PRODUCER.x + PRODUCER.w / 2} y={cy - 4} textAnchor="middle" className="dg-text text-[13px]">
        Post service
      </text>
      <text x={PRODUCER.x + PRODUCER.w / 2} y={cy + 14} textAnchor="middle" className="dg-label text-[10.5px]">
        v1 · unchanged
      </text>

      <rect x={BROKER.x} y={cy - 32} width={BROKER.w} height={64} rx={10} className="dg-box dg-box--store" />
      <text x={BROKER.x + BROKER.w / 2} y={cy - 8} textAnchor="middle" className="dg-text text-[13px]">
        {s.mode === "pubsub" ? "Topic" : "Queue"}
      </text>
      <text x={BROKER.x + BROKER.w / 2} y={cy + 9} textAnchor="middle" className="dg-label text-[10.5px]">
        {s.mode === "pubsub" ? "post-events" : "post-jobs"}
      </text>
      {s.mode === "queue" && s.brokerBacklog > 0 ? (
        <text x={BROKER.x + BROKER.w / 2} y={cy + 24} textAnchor="middle" className="dg-label dg-text--bad text-[10.5px]">
          {s.brokerBacklog} waiting
        </text>
      ) : null}

      {list.map((c, i) => (
        <ConsumerNode key={c.id} c={c} y={rowY(i)} mode={s.mode} reduced={reduced} />
      ))}

      {s.flights
        .filter((f) => f.mode === s.mode)
        .map((f) => (
          <FlightDot key={f.id} f={f} cy={cy} rowCy={f.target === null ? null : rowOf(f.target)} onLand={() => onLand(f.id)} />
        ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Consumer cards (the accessible controls)                            */
/* ------------------------------------------------------------------ */

function ConsumerCard({
  c,
  mode,
  onToggle,
  onRemove,
}: {
  c: Consumer;
  mode: Mode;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className={cn("flex flex-col gap-1.5 rounded-lg border p-2", c.online ? "border-line bg-surface-2" : "border-dashed border-warn bg-warn-soft")}>
      <div className="flex items-start justify-between gap-1">
        <span className="min-w-0 text-[0.84rem] font-bold text-ink [overflow-wrap:anywhere]">{c.name}</span>
        {c.removable ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${c.name}`}
            className="rounded-md p-0.5 text-ink-3 hover:bg-surface hover:text-bad"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <span className="font-mono text-[0.72rem] tabular-nums text-ink-2">
        {c.received} received
        {mode === "pubsub" && c.backlog ? <span className="text-warn"> · {c.backlog} queued</span> : null}
      </span>
      {c.joinedAfter > 0 ? (
        <span className="text-[0.7rem] text-ink-3">
          joined after {mode === "pubsub" ? "post" : "message"} #{c.joinedAfter}
        </span>
      ) : null}
      <Button size="sm" variant={c.online ? "ghost" : "secondary"} onClick={onToggle} aria-label={`${c.online ? "Take offline" : "Bring online"}: ${c.name}`}>
        {c.online ? "Take offline" : "Bring online"}
      </Button>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

function PubsubFanout() {
  const reduced = useReducedMotion();
  const [s, dispatch] = useReducer(reducer, INITIAL);
  const announced = useRef(false);
  const list = s[listKey(s.mode)];
  const isPubsub = s.mode === "pubsub";
  const nextExtra = EXTRA_SUBSCRIBERS.find((e) => !s.subscribers.some((c) => c.id === e.id));
  const canAdd = isPubsub ? nextExtra !== undefined : s.workers.length < MAX_WORKERS;

  const add = () => {
    if (isPubsub && !announced.current) {
      announced.current = true;
      emitCompanionEvent({ type: "diagram", mood: "happy", message: "A new subscriber, and the post service never changed." });
    }
    dispatch({ type: "add" });
  };

  const delivered = list.reduce((acc, c) => acc + c.received, 0);
  const online = list.filter((c) => c.online).length;

  return (
    <WidgetFrame
      kicker="Fan it out"
      title="Queue vs pub/sub"
      hint="Publish a PostCreated event. In queue mode one worker takes it; in pub/sub every subscriber gets its own copy. Then add a subscriber."
      note={s.message}
    >
      <ControlRow>
        <SegmentedControl
          label="Delivery model"
          size="sm"
          value={s.mode}
          onChange={(mode) => dispatch({ type: "mode", mode })}
          options={[
            { value: "queue", label: "Queue: one consumer" },
            { value: "pubsub", label: "Pub/sub: every subscriber" },
          ]}
        />
      </ControlRow>
      <ControlRow>
        <Button size="sm" variant="primary" onClick={() => dispatch({ type: "publish", count: 1, instant: reduced })}>
          <Send size={14} aria-hidden="true" /> Publish PostCreated
        </Button>
        <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "publish", count: 5, instant: reduced })}>
          Publish 5 posts
        </Button>
        <Button size="sm" variant="secondary" onClick={add} disabled={!canAdd}>
          <Plus size={14} aria-hidden="true" />
          {isPubsub ? (nextExtra ? `Add ${nextExtra.name}` : "All subscribers added") : "Add a worker"}
        </Button>
      </ControlRow>

      <WidgetScroll>
        <div className="min-w-[320px]">
          <FanoutDiagram s={s} reduced={reduced} onLand={(id) => dispatch({ type: "land", id })} />
        </div>
      </WidgetScroll>

      <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface-2 px-3 py-2">
        <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-ink-3">post service code</span>
        <code className="font-mono text-[0.8rem] text-accent [overflow-wrap:anywhere]">
          {isPubsub ? 'publish("post-events", { type: "PostCreated", postId })' : 'send("post-jobs", { type: "PostCreated", postId })'}
        </code>
        <span className="text-[0.76rem] text-ink-3">
          {isPubsub
            ? "The producer only knows the topic. Subscribers come and go without this line changing."
            : "The producer only knows the queue. Which worker picks the message up is the broker's job."}
        </span>
      </div>

      <ul aria-label={isPubsub ? "Subscribers" : "Workers"} className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
        {list.map((c) => (
          <ConsumerCard
            key={c.id}
            c={c}
            mode={s.mode}
            onToggle={() => dispatch({ type: "toggle", id: c.id })}
            onRemove={() => dispatch({ type: "remove", id: c.id })}
          />
        ))}
      </ul>

      <StatGrid>
        <Stat label="Posts published" value={s.published[s.mode]} />
        <Stat label={isPubsub ? "Copies delivered" : "Messages handled"} value={delivered} tone="good" />
        <Stat label={isPubsub ? "Copies per post" : "Handlers per post"} value={isPubsub ? list.length : 1} tone="accent" />
        <Stat label={isPubsub ? "Post service changes" : "Workers online"} value={isPubsub ? 0 : `${online} of ${list.length}`} tone={isPubsub ? "good" : "neutral"} />
      </StatGrid>
    </WidgetFrame>
  );
}

export default PubsubFanout satisfies ComponentType<InteractiveProps>;
