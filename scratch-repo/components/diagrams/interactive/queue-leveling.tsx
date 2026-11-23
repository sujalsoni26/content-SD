"use client";

import { memo, useEffect, useReducer, useRef, useState } from "react";
import type { ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowRight, Minus, Pause, Play, Plus, Skull, StepForward } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { WidgetFrame, ControlRow } from "@/components/ui/widget-frame";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RangeField } from "@/components/ui/range-field";
import { Stat } from "@/components/ui/stat";
import { EventLog, type LogEntry } from "@/components/ui/event-log";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { useInView } from "@/lib/hooks/use-in-view";
import { usePageVisible } from "@/lib/hooks/use-page-visible";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Model                                                               */
/* ------------------------------------------------------------------ */

type Mode = "bounded" | "unbounded";

const SERVICE_S = 0.6; // seconds per message per worker
const STEADY = 2; // messages per second, always arriving
const DT = 0.1; // simulation step, seconds
const MEMORY_FACTOR = 4; // an unbounded broker runs out of memory at 4× the buffer size
const MAX_ATTEMPTS = 3;
const MIN_WORKERS = 1;
const MAX_WORKERS = 8;

interface Msg {
  id: number;
  poison: boolean;
  attempts: number;
}

interface Worker {
  msg: Msg | null;
  remaining: number;
}

interface QState {
  mode: Mode;
  cap: number;
  burst: number;
  queue: Msg[];
  workers: Worker[];
  nextId: number;
  acc: number;
  processed: number;
  shed: number;
  dlq: Msg[];
  /** Messages lost in the crash, or null while the broker is up. */
  crashed: number | null;
  lastShed: { id: number; count: number } | null;
  log: LogEntry[];
  logSeq: number;
}

type Action =
  | { type: "tick"; steps: number }
  | { type: "burst" }
  | { type: "poison" }
  | { type: "workers"; delta: number }
  | { type: "cap"; cap: number }
  | { type: "burst-size"; burst: number }
  | { type: "mode"; mode: Mode }
  | { type: "restart" };

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const rate = (n: number) => Number((n / SERVICE_S).toFixed(2));

function addLog(s: QState, text: string, tone: LogEntry["tone"] = "neutral"): QState {
  return { ...s, log: [{ id: s.logSeq, text, tone }, ...s.log].slice(0, 30), logSeq: s.logSeq + 1 };
}

function makeMsgs(from: number, count: number, poison = false): Msg[] {
  return Array.from({ length: count }, (_, i) => ({ id: from + i, poison, attempts: 0 }));
}

/** One 0.1 s step: steady arrivals, workers finish and pick up, crash check. */
function step(s: QState): QState {
  if (s.crashed !== null) return s;
  let next = s;
  const queue = [...s.queue];
  let changed = false;
  let acc = s.acc + STEADY * DT;
  let nextId = s.nextId;
  let shed = s.shed;
  while (acc >= 1 - 1e-9) {
    acc -= 1;
    if (s.mode === "bounded" && queue.length >= s.cap) shed++;
    else {
      queue.push({ id: nextId, poison: false, attempts: 0 });
      changed = true;
    }
    nextId++;
  }
  let processed = s.processed;
  const dlq = [...s.dlq];
  const notes: Array<[string, LogEntry["tone"]]> = [];
  const workers = s.workers.map((w) => ({ ...w }));
  for (const w of workers) {
    if (w.msg) {
      w.remaining -= DT;
      if (w.remaining <= 1e-6) {
        const m = w.msg;
        w.msg = null;
        w.remaining = 0;
        if (!m.poison) processed++;
        else {
          const attempts = m.attempts + 1;
          if (attempts >= MAX_ATTEMPTS) {
            dlq.push({ ...m, attempts });
            notes.push([`upload #${m.id} failed ${attempts} times → moved to the dead-letter queue`, "bad"]);
          } else {
            queue.unshift({ ...m, attempts });
            changed = true;
            notes.push([`upload #${m.id} failed (attempt ${attempts}/${MAX_ATTEMPTS}) → not acked, redelivered`, "neutral"]);
          }
        }
      }
    }
    if (!w.msg && queue.length > 0) {
      w.msg = queue.shift() ?? null;
      w.remaining = SERVICE_S;
      changed = true;
    }
  }
  next = { ...s, acc, nextId, shed, processed, dlq: dlq.length === s.dlq.length ? s.dlq : dlq, workers, queue: changed ? queue : s.queue };
  for (const [text, tone] of notes) next = addLog(next, text, tone);
  if (next.mode === "unbounded" && next.queue.length >= next.cap * MEMORY_FACTOR) {
    next = addLog({ ...next, crashed: next.queue.length, queue: [] }, `Broker out of memory → crashed, ${fmt(next.queue.length)} queued messages lost`, "bad");
  }
  return next;
}

/** Drop messages from the back until the queue fits the buffer. */
function enforceBound(s: QState, why: string): QState {
  if (s.mode !== "bounded" || s.queue.length <= s.cap) return s;
  const excess = s.queue.length - s.cap;
  return addLog({ ...s, queue: s.queue.slice(0, s.cap), shed: s.shed + excess }, `${why} → ${excess} excess messages shed`, "accent");
}

function enqueue(s: QState, msgs: Msg[]): { state: QState; rejected: number } {
  const room = s.mode === "bounded" ? Math.max(0, s.cap - s.queue.length) : Infinity;
  const ok = msgs.slice(0, room);
  const rejected = msgs.length - ok.length;
  return {
    state: { ...s, queue: ok.length ? [...s.queue, ...ok] : s.queue, nextId: s.nextId + msgs.length, shed: s.shed + rejected },
    rejected,
  };
}

function reducer(s: QState, a: Action): QState {
  switch (a.type) {
    case "tick": {
      let next = s;
      for (let i = 0; i < a.steps; i++) next = step(next);
      return next;
    }
    case "burst": {
      if (s.crashed !== null) return s;
      const { state, rejected } = enqueue(s, makeMsgs(s.nextId, s.burst));
      const withShed = rejected > 0 ? { ...state, lastShed: { id: s.logSeq, count: rejected } } : state;
      return addLog(
        withShed,
        `Burst of ${s.burst} uploads → ${rejected ? `${s.burst - rejected} queued, ${rejected} shed with 503` : "all queued"}`,
        rejected ? "bad" : "accent",
      );
    }
    case "poison": {
      if (s.crashed !== null) return s;
      const { state, rejected } = enqueue(s, makeMsgs(s.nextId, 1, true));
      return addLog(
        state,
        rejected ? `Poison message #${s.nextId} → shed with 503 (buffer full)` : `Poison message #${s.nextId} queued: it fails every time it is processed`,
        "bad",
      );
    }
    case "workers": {
      const n = Math.min(MAX_WORKERS, Math.max(MIN_WORKERS, s.workers.length + a.delta));
      if (n === s.workers.length) return s;
      if (n > s.workers.length) {
        return addLog({ ...s, workers: [...s.workers, { msg: null, remaining: 0 }] }, `Workers → ${n} (${rate(n)} msg/s)`);
      }
      const removed = s.workers[s.workers.length - 1];
      const queue = removed.msg ? [removed.msg, ...s.queue] : s.queue;
      return addLog(
        { ...s, workers: s.workers.slice(0, -1), queue },
        `Workers → ${n} (${rate(n)} msg/s)${removed.msg ? `; its unacked message #${removed.msg.id} goes back to the queue` : ""}`,
      );
    }
    case "cap":
      return enforceBound({ ...s, cap: a.cap }, `Buffer shrunk to ${a.cap}`);
    case "burst-size":
      return { ...s, burst: a.burst };
    case "mode":
      if (a.mode === s.mode) return s;
      return enforceBound(addLog({ ...s, mode: a.mode }, a.mode === "bounded" ? "Bounded buffer: full means 503" : "Unbounded: the broker keeps everything in memory"), "Bound applied");
    case "restart":
      return addLog({ ...s, crashed: null, acc: 0 }, "Broker restarted (empty)", "good");
  }
}

const INITIAL: QState = {
  mode: "bounded",
  cap: 40,
  burst: 80,
  queue: makeMsgs(185, 26),
  workers: [
    { msg: null, remaining: 0 },
    { msg: null, remaining: 0 },
  ],
  nextId: 211,
  acc: 0,
  processed: 184,
  shed: 0,
  dlq: [{ id: 97, poison: true, attempts: MAX_ATTEMPTS }],
  crashed: null,
  lastShed: null,
  log: [
    { id: 1, text: "Earlier burst of 80 uploads → queued, draining", tone: "neutral" },
    { id: 0, text: "upload #97 failed 3 times → moved to the dead-letter queue", tone: "bad" },
  ],
  logSeq: 2,
};

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

const QueueCells = memo(function QueueCells({ queue, cap, reduced }: { queue: Msg[]; cap: number; reduced: boolean }) {
  const shown = queue.slice(0, cap);
  return (
    <div aria-hidden="true" className="grid grid-cols-[repeat(auto-fill,minmax(11px,1fr))] gap-[3px]">
      {shown.map((m) => (
        <motion.span
          key={m.id}
          layout={!reduced}
          initial={reduced ? false : { scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className={cn("aspect-square rounded-[3px]", m.poison ? "border border-dashed border-ink bg-bad" : "bg-accent")}
        />
      ))}
      {Array.from({ length: Math.max(0, cap - shown.length) }, (_, i) => (
        <span key={`e${i}`} className="aspect-square rounded-[3px] border border-line bg-surface" />
      ))}
    </div>
  );
});

function MemoryBar({ used }: { used: number }) {
  const pct = Math.min(1, used);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-mono text-[0.7rem] text-ink-3">
        <span>broker memory</span>
        <span className="tabular-nums">{Math.round(pct * 100)}%</span>
      </div>
      <span
        role="meter"
        aria-label="Broker memory used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct * 100)}
        className="block h-2 overflow-hidden rounded-full bg-surface-3"
      >
        <span
          className={cn("block h-full rounded-full transition-[width] duration-100 ease-linear", pct > 0.75 ? "bg-bad" : pct > 0.25 ? "bg-warn" : "bg-good")}
          style={{ width: `${pct * 100}%` }}
        />
      </span>
    </div>
  );
}

function WorkerCard({ index, w }: { index: number; w: Worker }) {
  const p = w.msg ? 1 - w.remaining / SERVICE_S : 0;
  const poison = w.msg?.poison ?? false;
  return (
    <div className={cn("flex flex-col gap-1 rounded-md border px-2 py-1.5", poison ? "border-bad bg-bad-soft" : w.msg ? "border-good bg-surface" : "border-line bg-surface")}>
      <div className="flex items-center justify-between gap-1 font-mono text-[0.72rem]">
        <span className="font-bold text-ink">W{index + 1}</span>
        <span className={cn("truncate tabular-nums", poison ? "text-bad" : "text-ink-3")}>
          {w.msg ? (poison ? `#${w.msg.id} ${w.msg.attempts + 1}/${MAX_ATTEMPTS}` : `#${w.msg.id}`) : "idle"}
        </span>
      </div>
      <span aria-hidden="true" className="block h-1 overflow-hidden rounded-full bg-surface-3">
        <span className={cn("block h-full transition-[width] duration-100 ease-linear", poison ? "bg-bad" : "bg-good")} style={{ width: `${p * 100}%` }} />
      </span>
    </div>
  );
}

function FlowArrow() {
  return (
    <span aria-hidden="true" className="flex items-center justify-center text-ink-3">
      <ArrowDown size={18} className="md:hidden" />
      <ArrowRight size={18} className="hidden md:block" />
    </span>
  );
}

function phaseNote(s: QState, paused: boolean): string {
  const out = rate(s.workers.length);
  if (s.crashed !== null) {
    return `Crashed: ${fmt(s.crashed)} queued messages are gone. An unbounded queue only delays the failure: under sustained overload it grows until memory runs out.`;
  }
  if (paused) return "Paused. Press Run (or Step) to move the simulation forward.";
  if (s.mode === "unbounded" && s.queue.length > s.cap) {
    return "No bound. The backlog keeps growing in memory. If producers outpace workers for long, the broker dies. Add workers or apply backpressure.";
  }
  if (s.mode === "bounded" && s.queue.length >= s.cap) {
    return "Buffer full. New messages get a fast 503 (load shedding), so the system stays healthy. Producers should back off and retry.";
  }
  if (out < STEADY) {
    return `Consumers too slow: ${out} msg/s out against ${STEADY} msg/s in, so the queue grows even without bursts. Add a worker.`;
  }
  if (s.workers.some((w) => w.msg?.poison)) {
    return `A poison message keeps failing and being redelivered. After ${MAX_ATTEMPTS} attempts it moves to the dead-letter queue so it can't block the line forever.`;
  }
  if (s.queue.length > 0) {
    return `Draining. ${s.workers.length} workers × 1 message per ${SERVICE_S} s = ${out} msg/s out vs ${STEADY} msg/s in, so the backlog shrinks by ${Number((out - STEADY).toFixed(2))} msg/s.`;
  }
  return "Queue empty. Workers keep up with the steady trickle. Send a burst to see the queue absorb it.";
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

function QueueLeveling() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const visible = usePageVisible();
  const [s, dispatch] = useReducer(reducer, INITIAL);
  /** null = not chosen yet: run by default, but start paused when motion is reduced. */
  const [pausedChoice, setPausedChoice] = useState<boolean | null>(null);
  const paused = pausedChoice ?? reduced;
  const running = !paused && s.crashed === null && inView && visible;
  const crashSeen = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => dispatch({ type: "tick", steps: 1 }), DT * 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (s.crashed !== null && !crashSeen.current) {
      crashSeen.current = true;
      emitCompanionEvent({ type: "diagram", mood: "confused", message: "The unbounded queue ate all the memory. Bound it and shed the excess." });
    }
  }, [s.crashed]);

  const sendBurst = () => {
    if (s.mode === "bounded" && s.queue.length >= s.cap) {
      emitCompanionEvent({ type: "diagram", mood: "thinking", message: "Buffer full: the whole burst was shed. That's backpressure working." });
    }
    dispatch({ type: "burst" });
  };

  const out = rate(s.workers.length);
  const memUsed = s.queue.length / (s.cap * MEMORY_FACTOR);
  const overflow = s.queue.length - s.cap;
  const drainTime = s.queue.length === 0 ? "–" : out > STEADY ? `≈ ${Math.ceil(s.queue.length / (out - STEADY))} s` : "never: growing";

  return (
    <WidgetFrame
      kicker="Simulate"
      title="Queue load leveling"
      hint="Fire a burst of photo uploads. The queue absorbs it and workers drain it at their own pace. Then break it."
      note={phaseNote(s, paused)}
    >
      <div ref={rootRef} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[8.5rem_auto_minmax(0,1.3fr)_auto_minmax(0,1fr)] md:items-start">
          {/* Producers */}
          <div className="relative flex flex-col gap-1 rounded-lg border border-line bg-surface-2 p-2.5">
            <p className="text-[0.85rem] font-bold text-ink">Producers</p>
            <p className="text-[0.76rem] text-ink-2">
              {STEADY} msg/s steady, plus your bursts
            </p>
            {s.lastShed ? (
              reduced ? (
                <p className="font-mono text-[0.72rem] text-bad">last burst: {s.lastShed.count} × 503</p>
              ) : (
                <AnimatePresence>
                  <motion.span
                    key={s.lastShed.id}
                    aria-hidden="true"
                    className="absolute right-2 top-2 rounded-full bg-bad px-2 py-0.5 font-mono text-[0.7rem] font-bold text-accent-ink"
                    initial={{ x: 24, opacity: 1 }}
                    animate={{ x: -8, opacity: 0 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                  >
                    503 × {s.lastShed.count}
                  </motion.span>
                </AnimatePresence>
              )
            ) : null}
          </div>
          <FlowArrow />
          {/* Queue */}
          <div className="flex flex-col gap-2 rounded-lg border border-accent bg-accent-soft/40 p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[0.85rem] font-bold text-ink">Queue</p>
              <span className="font-mono text-[0.76rem] tabular-nums text-ink-2">
                {fmt(s.queue.length)} / {s.cap}
              </span>
            </div>
            <QueueCells queue={s.queue} cap={s.cap} reduced={reduced} />
            {overflow > 0 ? (
              <p className="font-mono text-[0.72rem] font-bold text-warn">+{fmt(overflow)} more held in memory beyond the buffer</p>
            ) : null}
            <MemoryBar used={memUsed} />
            <p className="text-[0.7rem] text-ink-3">
              {s.mode === "bounded" ? `capped at ${s.cap}: memory can't pass 25%` : `out of memory at ${fmt(s.cap * MEMORY_FACTOR)} messages`}
            </p>
          </div>
          <FlowArrow />
          {/* Workers + DLQ */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-2 p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[0.85rem] font-bold text-ink">Workers</p>
                <span className="font-mono text-[0.76rem] tabular-nums text-ink-2">{out} msg/s</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(4.6rem,1fr))] gap-1.5">
                {s.workers.map((w, i) => (
                  <WorkerCard key={i} index={i} w={w} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-dashed border-bad bg-bad-soft/50 p-2.5">
              <p className="flex items-baseline justify-between text-[0.82rem] font-bold text-ink">
                Dead-letter queue <span className="font-mono tabular-nums text-bad">{s.dlq.length}</span>
              </p>
              <p className="font-mono text-[0.7rem] text-ink-2 [overflow-wrap:anywhere]">
                {s.dlq
                  .slice(-3)
                  .reverse()
                  .map((m) => `#${m.id} failed ${m.attempts}×`)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </div>

        {s.crashed !== null ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-bad bg-bad-soft px-3 py-2 text-[0.88rem] text-bad">
            <span>The broker ran out of memory and crashed. {fmt(s.crashed)} queued messages are gone.</span>
            <Button size="sm" variant="danger" onClick={() => dispatch({ type: "restart" })}>
              Restart broker
            </Button>
          </div>
        ) : null}

        <ControlRow>
          <Button variant="primary" size="sm" onClick={sendBurst} disabled={s.crashed !== null}>
            Send burst of {s.burst}
          </Button>
          <RangeField label="Burst size" min={20} max={300} step={10} value={s.burst} onChange={(burst) => dispatch({ type: "burst-size", burst })} />
          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "poison" })} disabled={s.crashed !== null}>
            <Skull size={14} aria-hidden="true" /> Send a poison message
          </Button>
        </ControlRow>
        <ControlRow>
          <div role="group" aria-label="Workers" className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-ink-2">Workers</span>
            <Button size="sm" variant="secondary" aria-label="Remove a worker" onClick={() => dispatch({ type: "workers", delta: -1 })} disabled={s.workers.length <= MIN_WORKERS}>
              <Minus size={14} aria-hidden="true" />
            </Button>
            <output aria-live="polite" className="min-w-[2ch] text-center font-mono text-sm font-bold tabular-nums text-ink">
              {s.workers.length}
            </output>
            <Button size="sm" variant="secondary" aria-label="Add a worker" onClick={() => dispatch({ type: "workers", delta: 1 })} disabled={s.workers.length >= MAX_WORKERS}>
              <Plus size={14} aria-hidden="true" />
            </Button>
          </div>
          <RangeField label="Buffer size" min={10} max={80} step={5} value={s.cap} onChange={(cap) => dispatch({ type: "cap", cap })} />
        </ControlRow>
        <ControlRow>
          <SegmentedControl
            label="When the buffer is full"
            size="sm"
            value={s.mode}
            onChange={(mode) => dispatch({ type: "mode", mode })}
            options={[
              { value: "bounded", label: "Bounded: shed with 503" },
              { value: "unbounded", label: "Unbounded: keep everything" },
            ]}
          />
          <Button size="sm" variant="ghost" onClick={() => setPausedChoice(!paused)}>
            {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            {paused ? "Run" : "Pause"}
          </Button>
          {paused ? (
            <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "tick", steps: 10 })} disabled={s.crashed !== null}>
              <StepForward size={14} aria-hidden="true" /> Step 1 s
            </Button>
          ) : null}
        </ControlRow>

        {/* Not a live region: these numbers change ten times a second. */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2">
          <Stat label="In queue" value={fmt(s.queue.length)} tone={overflow > 0 ? "bad" : "neutral"} />
          <Stat label="Processed" value={fmt(s.processed)} tone="good" />
          <Stat label="Shed (503)" value={fmt(s.shed)} tone={s.shed ? "warn" : "neutral"} />
          <Stat label="Dead-letter" value={s.dlq.length} tone="bad" />
          <Stat label="Out vs in" value={`${out} vs ${STEADY}/s`} tone={out < STEADY ? "bad" : "neutral"} />
          <Stat label="Time to drain" value={drainTime} />
        </div>
        <EventLog entries={s.log} label="Queue events" />
      </div>
    </WidgetFrame>
  );
}

export default QueueLeveling satisfies ComponentType<InteractiveProps>;
