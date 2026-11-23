"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { RotateCcw, Send } from "lucide-react";
import { ControlRow, WidgetFrame, WidgetScroll } from "@/components/ui/widget-frame";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { Stat, type Tone } from "@/components/ui/stat";
import { EventLog } from "@/components/ui/event-log";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";
import { useFrameLoop, useLoopActive } from "./_wc-frame-loop";
import {
  COOLDOWN,
  FAST_LEG,
  LEG,
  STATE_NAME,
  THRESHOLD,
  TIMEOUT_MS,
  TRIALS,
  advance,
  createBreaker,
  isBusy,
  pendingCalls,
  send,
  setHealthy,
  type BreakerSim,
  type BreakerState,
  type Call,
  type Edge,
} from "./_circuit-breaker-sim";

type Traffic = "auto" | "manual";

const HEALTH_OPTIONS = [
  { value: "up", label: "Healthy" },
  { value: "down", label: "Failing" },
] as const;
const TRAFFIC_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "manual", label: "Manual" },
] as const;

const STATE_BOX: Record<BreakerState, string> = { closed: "dg-box dg-box--good", open: "dg-box dg-box--bad", half: "dg-box dg-box--accent" };
const STATE_TONE: Record<BreakerState, Tone> = { closed: "good", open: "bad", half: "accent" };
const lerp = (a: number, b: number, p: number) => a + (b - a) * Math.min(1, Math.max(0, p));

/* ---------------- request flow: caller → breaker → ranking service ---------------- */

const CALLER_R = 140;
const BREAKER_L = 235;
const BREAKER_R = 365;
const SERVICE_L = 460;
const OUT_Y = 56;
const BACK_Y = 80;
const LEVER = { x: 262, y: 92, length: 76 };
const LEVER_ANGLE: Record<BreakerState, number> = { closed: 0, half: -12, open: -28 };

interface DotView {
  id: number;
  x: number;
  y: number;
  className: string;
  /** 0..1 of the timeout used up while waiting on a dead service. */
  timer?: number;
  /** Parked in front of the service, waiting for its reply. */
  waiting?: boolean;
}

function dotView(c: Call, now: number): DotView {
  const t = now - c.sentAt;
  if (c.kind === "fast") {
    if (t < FAST_LEG) return { id: c.id, x: lerp(CALLER_R, BREAKER_L, t / FAST_LEG), y: OUT_Y, className: "dg-dot dg-dot--accent" };
    return { id: c.id, x: lerp(BREAKER_L, CALLER_R, (t - FAST_LEG) / FAST_LEG), y: BACK_Y, className: "fill-amber" };
  }
  const outbound = c.trial ? "fill-violet" : "dg-dot dg-dot--accent";
  if (t < LEG) return { id: c.id, x: lerp(CALLER_R, SERVICE_L, t / LEG), y: OUT_Y, className: outbound };
  const replyAt = c.doneAt - LEG;
  if (now < replyAt) {
    const timer = c.ok ? undefined : (now - c.sentAt - LEG) / (TIMEOUT_MS / 1000);
    return { id: c.id, x: SERVICE_L - 12, y: OUT_Y, className: outbound, timer, waiting: true };
  }
  return {
    id: c.id,
    x: lerp(SERVICE_L, CALLER_R, (now - replyAt) / LEG),
    y: BACK_Y,
    className: c.ok ? "dg-dot dg-dot--good" : "dg-dot dg-dot--bad",
  };
}

function TimerRing({ x, y, progress }: { x: number; y: number; progress: number }) {
  const r = 10;
  const c = 2 * Math.PI * r;
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill="none"
      strokeWidth={2.5}
      className="stroke-bad"
      strokeDasharray={`${(progress * c).toFixed(2)} ${c.toFixed(2)}`}
      transform={`rotate(-90 ${x} ${y})`}
    />
  );
}

function Lever({ state, reduced }: { state: BreakerState; reduced: boolean }) {
  const a = (LEVER_ANGLE[state] * Math.PI) / 180;
  const x2 = LEVER.x + LEVER.length * Math.cos(a);
  const y2 = LEVER.y + LEVER.length * Math.sin(a);
  return (
    <g aria-hidden="true">
      <circle cx={LEVER.x} cy={LEVER.y} r={4} className="fill-ink-2" />
      <circle cx={LEVER.x + LEVER.length} cy={LEVER.y} r={4} className="fill-ink-2" />
      <motion.line
        x1={LEVER.x}
        y1={LEVER.y}
        initial={false}
        animate={{ x2, y2 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 18 }}
        strokeWidth={4}
        strokeLinecap="round"
        className={state === "closed" ? "stroke-good" : state === "open" ? "stroke-bad" : "stroke-accent"}
      />
    </g>
  );
}

function FlowLane({ sim, reduced }: { sim: BreakerSim; reduced: boolean }) {
  const waiting = pendingCalls(sim);
  // Waiting calls queue up in front of the service, oldest nearest, so a pile-up is visible.
  const dots: DotView[] = [];
  if (!reduced) {
    let queued = 0;
    for (const c of sim.calls) {
      const d = dotView(c, sim.now);
      dots.push(d.waiting ? { ...d, x: d.x - 24 * queued++ } : d);
    }
  }
  const label = `Feed service calls the ranking service through a breaker that is ${STATE_NAME[sim.state]}. The ranking service is ${
    sim.healthy ? "healthy" : "failing"
  }; ${waiting} ${waiting === 1 ? "call is" : "calls are"} waiting.`;
  return (
    <WidgetScroll>
      <svg viewBox="0 0 600 164" className="h-auto w-full min-w-[500px]" role="img" aria-label={label}>
        <path d={`M${CALLER_R},${OUT_Y} L${BREAKER_L},${OUT_Y} M${BREAKER_R},${OUT_Y} L${SERVICE_L - 2},${OUT_Y}`} className="dg-line" markerEnd="url(#ah)" />
        <path d={`M${SERVICE_L},${BACK_Y} L${BREAKER_R},${BACK_Y} M${BREAKER_L},${BACK_Y} L${CALLER_R + 2},${BACK_Y}`} className="dg-line dg-line--dash" markerEnd="url(#ah)" />
        <text x={(CALLER_R + BREAKER_L) / 2} y={OUT_Y - 8} textAnchor="middle" className="dg-label">
          request
        </text>
        <text x={(CALLER_R + BREAKER_L) / 2} y={BACK_Y + 16} textAnchor="middle" className="dg-label">
          reply
        </text>

        <rect x={10} y={36} width={130} height={64} rx={10} className="dg-box" />
        <text x={75} y={63} textAnchor="middle" className="dg-text">
          Feed service
        </text>
        <text x={75} y={82} textAnchor="middle" className="dg-sub">
          the caller
        </text>

        <rect x={BREAKER_L} y={28} width={BREAKER_R - BREAKER_L} height={80} rx={10} className={STATE_BOX[sim.state]} />
        <text x={(BREAKER_L + BREAKER_R) / 2} y={48} textAnchor="middle" className="dg-text">
          Breaker
        </text>
        <Lever state={sim.state} reduced={reduced} />

        <rect x={BREAKER_L} y={124} width={BREAKER_R - BREAKER_L} height={30} rx={8} className={sim.state === "closed" ? "dg-box dg-box--ghost" : "dg-box dg-box--store"} />
        <text x={(BREAKER_L + BREAKER_R) / 2} y={143} textAnchor="middle" className="dg-sub">
          fallback: cached feed
        </text>

        <rect x={SERVICE_L} y={36} width={130} height={64} rx={10} className={sim.healthy ? "dg-box" : "dg-box dg-box--bad"} />
        <text x={SERVICE_L + 65} y={63} textAnchor="middle" className="dg-text">
          Ranking service
        </text>
        <text x={SERVICE_L + 65} y={82} textAnchor="middle" className={sim.healthy ? "dg-sub" : "dg-sub dg-text--bad"}>
          {sim.healthy ? "replies in 120 ms" : "hangs, times out"}
        </text>
        {waiting > 0 ? (
          <text x={SERVICE_L + 65} y={120} textAnchor="middle" className={sim.healthy ? "dg-label" : "dg-label dg-text--bad"}>
            {waiting} {waiting === 1 ? "thread" : "threads"} waiting
          </text>
        ) : null}

        {dots.map((d) => (
          <g key={d.id}>
            {d.timer !== undefined ? <TimerRing x={d.x} y={d.y} progress={d.timer} /> : null}
            <circle cx={d.x} cy={d.y} r={5.5} className={d.className} />
          </g>
        ))}
      </svg>
    </WidgetScroll>
  );
}

/* ---------------- state machine ---------------- */

const EDGES: Record<Edge, { d: string; label: string; lx: number; ly: number; anchor: "start" | "middle" | "end" }> = {
  "closed>open": { d: "M172,52 L386,52", label: `${THRESHOLD} failures in a row`, lx: 279, ly: 42, anchor: "middle" },
  "open>half": { d: "M450,88 C450,150 420,172 360,174", label: `cooldown ${COOLDOWN} s`, lx: 440, ly: 136, anchor: "end" },
  "half>open": { d: "M360,198 C470,202 502,150 494,90", label: "trial fails", lx: 476, ly: 226, anchor: "middle" },
  "half>closed": { d: "M202,186 C120,184 96,150 96,90", label: `${TRIALS} trials pass`, lx: 112, ly: 150, anchor: "start" },
};

const NODES: Record<BreakerState, { x: number; y: number; sub: string }> = {
  closed: { x: 20, y: 30, sub: "calls pass" },
  open: { x: 388, y: 30, sub: "fail fast" },
  half: { x: 204, y: 156, sub: "trial calls" },
};

function StateMachine({ sim, reduced }: { sim: BreakerSim; reduced: boolean }) {
  const hot = sim.transition && sim.now - sim.transition.at < 1.6 ? sim.transition : null;
  return (
    <WidgetScroll>
      <svg viewBox="0 0 560 236" className="h-auto w-full min-w-[440px]" role="img" aria-label={`Breaker state machine, currently ${STATE_NAME[sim.state]}`}>
        {(Object.keys(EDGES) as Edge[]).map((edge) => {
          const e = EDGES[edge];
          const isHot = hot?.edge === edge;
          return (
            <g key={edge}>
              <path d={e.d} className={isHot ? "dg-line dg-line--accent" : "dg-line"} markerEnd={isHot ? "url(#ah-accent)" : "url(#ah)"} />
              {isHot && !reduced ? (
                <motion.path
                  key={hot.id}
                  d={e.d}
                  className="dg-line dg-line--accent"
                  strokeWidth={4}
                  initial={{ pathLength: 0, opacity: 1 }}
                  animate={{ pathLength: 1, opacity: 0.35 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              ) : null}
              <text x={e.lx} y={e.ly} textAnchor={e.anchor} className={isHot ? "dg-label dg-text--accent" : "dg-label"}>
                {e.label}
              </text>
            </g>
          );
        })}
        {(Object.keys(NODES) as BreakerState[]).map((s) => {
          const n = NODES[s];
          const on = s === sim.state;
          return (
            <g key={s}>
              <rect x={n.x} y={n.y} width={152} height={58} rx={10} className={on ? STATE_BOX[s] : "dg-box"} strokeWidth={on ? 2.5 : 1.5} />
              <text x={n.x + 76} y={n.y + 26} textAnchor="middle" className="dg-text">
                {STATE_NAME[s]}
              </text>
              <text x={n.x + 76} y={n.y + 45} textAnchor="middle" className="dg-sub">
                {n.sub}
              </text>
            </g>
          );
        })}
      </svg>
    </WidgetScroll>
  );
}

/* ---------------- failure counter / cooldown ---------------- */

function Pips({ count, filled, tone, label }: { count: number; filled: number; tone: "bad" | "good"; label: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          className={cn(
            "h-3 w-3 rounded-full border transition-colors duration-200",
            i < filled ? (tone === "bad" ? "border-bad bg-bad" : "border-good bg-good") : "border-line-strong bg-surface",
          )}
        />
      ))}
    </span>
  );
}

function Meter({ sim }: { sim: BreakerSim }) {
  const row = "flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.86rem]";
  if (sim.state === "open") {
    const left = Math.max(0, COOLDOWN - (sim.now - sim.openedAt));
    return (
      <div className={row}>
        <span className="font-bold text-ink-2">Cooldown</span>
        <span className="h-2 w-40 max-w-full overflow-hidden rounded-full bg-surface-3">
          <span className="block h-full rounded-full bg-bad" style={{ width: `${((COOLDOWN - left) / COOLDOWN) * 100}%` }} />
        </span>
        <span className="font-mono tabular-nums text-ink">trial call in {left.toFixed(1)} s</span>
      </div>
    );
  }
  if (sim.state === "half") {
    return (
      <div className={row}>
        <span className="font-bold text-ink-2">Trial calls passed</span>
        <Pips count={TRIALS} filled={sim.trialOk} tone="good" label={`${sim.trialOk} of ${TRIALS} trial calls passed`} />
        <span className="font-mono tabular-nums text-ink">
          {sim.trialOk} / {TRIALS}
        </span>
      </div>
    );
  }
  return (
    <div className={row}>
      <span className="font-bold text-ink-2">Failures in a row</span>
      <Pips count={THRESHOLD} filled={sim.fails} tone="bad" label={`${sim.fails} of ${THRESHOLD} failures`} />
      <span className="font-mono tabular-nums text-ink">
        {sim.fails} / {THRESHOLD}
      </span>
    </div>
  );
}

function explain(state: BreakerState, healthy: boolean, auto: boolean) {
  if (state === "closed") {
    return (
      <>
        <strong>Closed.</strong> Calls pass through and consecutive failures are counted; {THRESHOLD} in a row trips the breaker.{" "}
        {healthy ? "Switch the ranking service to Failing to see what happens." : "Each failing call holds a thread for a full second before it times out."}
      </>
    );
  }
  if (state === "open") {
    return (
      <>
        <strong>Open.</strong> Calls fail fast with a fallback (the cached feed) instead of waiting a second on a dead service, which
        also gives it room to recover. After the {COOLDOWN} s cooldown, a trial call goes through.
        {healthy ? "" : " Switch the service back to Healthy so the trial can pass."}
      </>
    );
  }
  return (
    <>
      <strong>Half-open.</strong> One trial call at a time goes through: {TRIALS} successes close the breaker, one failure opens it
      again. {healthy ? "" : "The service is still failing, so expect it to reopen. "}
      {auto ? "" : "Press Send request to make the trial call."}
    </>
  );
}

export default function CircuitBreaker() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const active = useLoopActive(ref);
  const [sim, setSim] = useState(createBreaker);
  const [traffic, setTraffic] = useState<Traffic | null>(null);
  // Automatic traffic is the default, except with reduced motion (no auto-play).
  const auto = (traffic ?? (reduced ? "manual" : "auto")) === "auto";

  useFrameLoop((dt) => setSim((s) => advance(s, dt, auto)), active && isBusy(sim, auto), reduced ? 200 : 0);

  const said = useRef({ open: false, closed: false });
  const transition = sim.transition;
  useEffect(() => {
    if (!transition) return;
    if (transition.edge === "closed>open" && !said.current.open) {
      said.current.open = true;
      emitCompanionEvent({ type: "diagram", mood: "thinking", message: "Breaker tripped: callers now fail fast instead of piling up." });
    } else if (transition.edge === "half>closed" && said.current.open && !said.current.closed) {
      said.current.closed = true;
      emitCompanionEvent({ type: "diagram", mood: "happy", message: "The service is back and the breaker closed itself." });
    }
  }, [transition]);

  const waiting = pendingCalls(sim);

  return (
    <WidgetFrame
      title="Circuit breaker"
      hint="The feed service calls a ranking service. Make the ranking service fail and watch the breaker trip, wait, test and recover."
      note={explain(sim.state, sim.healthy, auto)}
    >
      <div ref={ref} className="flex flex-col gap-4">
        <ControlRow>
          <span className="text-sm font-bold text-ink-2">Ranking service</span>
          <SegmentedControl
            label="Ranking service health"
            size="sm"
            options={HEALTH_OPTIONS}
            value={sim.healthy ? "up" : "down"}
            onChange={(v) => setSim((s) => setHealthy(s, v === "up"))}
          />
          <span className="text-sm font-bold text-ink-2">Traffic</span>
          <SegmentedControl label="Traffic" size="sm" options={TRAFFIC_OPTIONS} value={auto ? "auto" : "manual"} onChange={setTraffic} />
        </ControlRow>
        <ControlRow>
          <Button size="sm" variant="primary" onClick={() => setSim(send)}>
            <Send aria-hidden="true" className="h-4 w-4" />
            Send request
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSim(createBreaker())}>
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Reset
          </Button>
        </ControlRow>

        <FlowLane sim={sim} reduced={reduced} />
        <Meter sim={sim} />
        <StateMachine sim={sim} reduced={reduced} />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2">
          <Stat label="State" value={STATE_NAME[sim.state]} tone={STATE_TONE[sim.state]} />
          <Stat label="Calls passed" value={sim.passed} />
          <Stat label="Failed fast" value={sim.fastFails} tone={sim.fastFails ? "amber" : "neutral"} />
          <Stat label="Threads waiting" value={waiting} tone={waiting && !sim.healthy ? "bad" : "neutral"} />
        </div>
        <EventLog entries={sim.log} label="Call log, newest first" />
      </div>
    </WidgetFrame>
  );
}
