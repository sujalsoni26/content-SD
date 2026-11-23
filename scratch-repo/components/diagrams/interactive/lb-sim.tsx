"use client";

import { useEffect, useReducer, useRef, useState, type ComponentType, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HeartPulse, Pause, Play, Power, Server as ServerIcon, Zap } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EventLog } from "@/components/ui/event-log";
import { RangeField } from "@/components/ui/range-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat, StatGrid } from "@/components/ui/stat";
import { ControlRow, WidgetFrame } from "@/components/ui/widget-frame";
import { emitCompanionEvent } from "@/lib/companion-events";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { clamp, cn } from "@/lib/utils";
import { formatInt, useFrameLoop, useLoopGate } from "./_wa-shared";
import {
  ALGORITHMS,
  CHECK_MS,
  FLIGHT_MS,
  initialLbState,
  ipHashMap,
  lbReducer,
  serverStatus,
  type Algorithm,
  type LbState,
  type Server,
} from "./_lb-sim-engine";

/* ------------------------------------------------------------------ geometry (measured, so the layout can reflow) */

interface Point {
  x: number;
  y: number;
}

interface Geometry {
  lb: Point;
  servers: Point[];
}

function useStageGeometry(
  stageRef: RefObject<HTMLDivElement | null>,
  lbRef: RefObject<HTMLDivElement | null>,
  serverRefs: RefObject<Array<HTMLButtonElement | null>>,
): Geometry | null {
  const [geo, setGeo] = useState<Geometry | null>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const lb = lbRef.current;
      if (!lb) return;
      const base = stage.getBoundingClientRect();
      const l = lb.getBoundingClientRect();
      const servers = serverRefs.current.map((el) => {
        if (!el) return { x: 0, y: 0 };
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - base.left, y: r.top - base.top };
      });
      setGeo({ lb: { x: l.left + l.width / 2 - base.left, y: l.bottom - base.top }, servers });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [stageRef, lbRef, serverRefs]);
  return geo;
}

const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

/**
 * Orthogonal wire from the LB to a server: down the centre gap, along the gap just above the
 * server's row, then down into it. Never passes behind another card, whatever the grid layout.
 */
function route(geo: Geometry, i: number): Point[] {
  const card = geo.servers[i];
  const firstRow = Math.min(...geo.servers.map((p) => p.y));
  const busY = card.y - (card.y <= firstRow + 1 ? 16 : 5);
  return [geo.lb, { x: geo.lb.x, y: busY }, { x: card.x, y: busY }, card];
}

/** Point at fraction t (0..1) of the way along a polyline. */
function along(points: readonly Point[], t: number): Point {
  const lengths = points.slice(1).map((p, k) => Math.hypot(p.x - points[k].x, p.y - points[k].y));
  let remaining = t * lengths.reduce((a, b) => a + b, 0);
  for (let k = 0; k < lengths.length; k++) {
    if (remaining <= lengths[k] || k === lengths.length - 1) {
      const f = lengths[k] === 0 ? 1 : Math.min(1, remaining / lengths[k]);
      return { x: points[k].x + (points[k + 1].x - points[k].x) * f, y: points[k].y + (points[k + 1].y - points[k].y) * f };
    }
    remaining -= lengths[k];
  }
  return points[points.length - 1];
}

/* ------------------------------------------------------------------ pieces */

const STATUS_CLASS = {
  good: "bg-good-soft text-good",
  bad: "bg-bad-soft text-bad",
  neutral: "bg-surface-2 text-ink-3",
  warn: "bg-warn-soft text-warn",
} as const;

interface ServerCardProps {
  server: Server;
  share: number;
  index: number;
  registerRef: (index: number, el: HTMLButtonElement | null) => void;
  onToggle: () => void;
  reduced: boolean;
}

function ServerCard({ server, share, index, registerRef, onToggle, reduced }: ServerCardProps) {
  const status = serverStatus(server);
  const load = server.active / server.capacity;
  return (
    <button
      ref={(el) => registerRef(index, el)}
      type="button"
      onClick={onToggle}
      aria-label={`${server.id}: ${status.text}. ${server.active} active, ${server.served} served, ${server.failed} failed. Press to ${server.up ? "crash" : "restart"} it.`}
      className={cn(
        "relative flex min-w-0 flex-col gap-1.5 rounded-xl border-2 p-2.5 text-left transition-colors duration-200",
        server.up ? "border-line bg-surface hover:border-ink-3" : "border-bad bg-bad-soft",
      )}
    >
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        <ServerIcon size={15} aria-hidden="true" className={server.up ? "text-ink-2" : "text-bad"} />
        <strong className="font-display text-base text-ink">{server.id}</strong>
        {server.weight > 1 ? <Chip tone="accent" className="px-1.5">2× size</Chip> : null}
      </span>
      <span className="flex items-start gap-1">
        <HeartPulse
          size={14}
          aria-hidden="true"
          className={cn("mt-0.5 shrink-0", server.lastCheck === "fail" ? "text-bad" : "text-good")}
        />
        <span className={cn("rounded-md px-1.5 py-px font-mono text-[0.7rem] font-bold leading-snug", STATUS_CLASS[status.tone])}>
          {status.text}
        </span>
      </span>
      <span className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <span
          className={cn("block h-full rounded-full transition-[width] duration-200", load >= 0.9 ? "bg-bad" : load >= 0.6 ? "bg-warn" : "bg-accent")}
          style={{ width: `${Math.min(100, load * 100)}%` }}
        />
      </span>
      <span className="font-mono text-[0.72rem] leading-snug tabular-nums text-ink-2">
        {server.active}/{server.capacity} active
        <br />
        {server.served} served · <span className={server.failed ? "text-bad" : undefined}>{server.failed} failed</span>
        <br />
        <span className="text-ink-3">{Math.round(share * 100)}% of traffic</span>
      </span>
      <span className="flex items-center gap-1 text-[0.7rem] text-ink-3">
        <Power size={12} aria-hidden="true" />
        {server.up ? "click to crash" : "click to restart"}
      </span>
      {!reduced ? (
        <AnimatePresence>
          {server.failFlash > 0 ? (
            <motion.span
              key={server.failFlash}
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-8 rounded bg-bad px-1 font-mono text-[0.7rem] font-bold text-accent-ink"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.9 }}
            >
              502
            </motion.span>
          ) : null}
        </AnimatePresence>
      ) : null}
    </button>
  );
}

function BalancerCard({ state, lbRef }: { state: LbState; lbRef: RefObject<HTMLDivElement | null> }) {
  const sinceCheck = clamp((state.now - state.lastCheckAt) / CHECK_MS, 0, 1);
  const algorithm = ALGORITHMS.find((a) => a.value === state.algorithm);
  return (
    <div ref={lbRef} className="relative mx-auto flex w-full max-w-xs flex-col gap-1 rounded-xl border-2 border-accent bg-accent-soft px-3 py-2.5 text-center">
      <strong className="font-display text-base text-ink">Load balancer</strong>
      <span className="text-[0.82rem] font-bold text-accent">{algorithm?.name}</span>
      <span className="flex items-center justify-center gap-1.5 font-mono text-[0.7rem] text-ink-2">
        <HeartPulse size={13} aria-hidden="true" />
        GET /health every {CHECK_MS / 1000} s
      </span>
      <span className="h-1 overflow-hidden rounded-full bg-surface" aria-hidden="true">
        <span className="block h-full bg-accent" style={{ width: `${sinceCheck * 100}%` }} />
      </span>
    </div>
  );
}

function Wires({ geo, servers }: { geo: Geometry; servers: readonly Server[] }) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
      {geo.servers.map((_, i) => {
        const s = servers[i];
        return (
          <path
            key={s.id}
            d={"M" + route(geo, i).map((p) => `${p.x} ${p.y}`).join(" L")}
            className={cn("dg-line transition-opacity duration-300", !s.inRotation && "dg-line--dash opacity-30", s.inRotation && !s.up && "dg-line--bad")}
          />
        );
      })}
    </svg>
  );
}

function Packets({ geo, state, flightMs }: { geo: Geometry; state: LbState; flightMs: number }) {
  return (
    <>
      {state.flights.map((f) => {
        const { x, y } = along(route(geo, f.server), ease(clamp((state.now - f.sentAt) / flightMs, 0, 1)));
        return (
          <span
            key={f.id}
            aria-hidden="true"
            className={cn("pointer-events-none absolute left-0 top-0 size-3 rounded-full ring-2 ring-surface", f.long ? "bg-violet" : "bg-accent")}
            style={{ transform: `translate(${x - 6}px, ${y - 6}px)` }}
          />
        );
      })}
    </>
  );
}

function IpHashPanel({ servers }: { servers: readonly Server[] }) {
  const map = ipHashMap(servers);
  const moved = map.filter((m) => m.moved).length;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <p className="text-[0.84rem] text-ink-2">
        <strong className="text-ink">Who goes where:</strong> hash(IP) % {servers.filter((s) => s.inRotation).length} servers in rotation.{" "}
        {moved > 0 ? (
          <span className="font-bold text-warn">
            {moved} of {map.length} clients were remapped
          </span>
        ) : (
          "Every client has its usual server."
        )}
      </p>
      <ul className="grid grid-cols-1 gap-1 font-mono text-[0.76rem] min-[400px]:grid-cols-2 sm:grid-cols-3">
        {map.map((m) => (
          <li key={m.ip} className={cn("rounded px-1.5 py-0.5", m.moved ? "bg-warn-soft" : "bg-surface-2")}>
            {m.ip} → <strong className="text-ink">{m.now ?? "none"}</strong>
            {m.moved ? <span className="text-warn"> (was {m.base})</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ widget */

const ALG_OPTIONS = ALGORITHMS.map((a) => ({ value: a.value, label: a.label }));

function LbSim() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lbRef = useRef<HTMLDivElement>(null);
  const serverRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const gate = useLoopGate(rootRef);
  const reduced = useReducedMotion();
  const geo = useStageGeometry(stageRef, lbRef, serverRefs);

  const [state, dispatch] = useReducer(lbReducer, undefined, initialLbState);
  const [rate, setRate] = useState(4);
  // "auto" runs unless the learner prefers reduced motion; then traffic waits for an explicit Start.
  const [mode, setMode] = useState<"auto" | "on" | "off">("auto");
  const flowing = mode === "on" || (mode === "auto" && !reduced);
  const flightMs = reduced ? 0 : FLIGHT_MS;

  useFrameLoop((dt) => dispatch({ type: "tick", dt, rate, flightMs }), flowing && gate);

  const cheered = useRef(false);
  useEffect(() => {
    if (state.caught > 0 && !cheered.current) {
      cheered.current = true;
      emitCompanionEvent({ type: "diagram", mood: "happy", message: "Health check caught the dead server. No more failed requests!" });
    }
  }, [state.caught]);

  const registerRef = (index: number, el: HTMLButtonElement | null) => {
    serverRefs.current[index] = el;
  };
  const routedTotal = state.servers.reduce((sum, s) => sum + s.routed, 0) || 1;
  const inRotation = state.servers.filter((s) => s.inRotation).length;
  const note = flowing ? state.note : `Traffic is paused. ${state.note}`;

  return (
    <WidgetFrame
      kicker="Simulate"
      title="Load balancer"
      hint="Pick an algorithm and watch traffic spread. Click a server to crash it: the health check pulls it out of rotation."
      note={note}
    >
      <div ref={rootRef} className="flex flex-col gap-4">
        <ControlRow>
          <SegmentedControl<Algorithm>
            label="Algorithm"
            size="sm"
            options={ALG_OPTIONS}
            value={state.algorithm}
            onChange={(algorithm) => dispatch({ type: "algorithm", algorithm })}
          />
        </ControlRow>

        <div ref={stageRef} className="@container relative flex flex-col gap-10 py-1">
          {geo ? <Wires geo={geo} servers={state.servers} /> : null}
          <BalancerCard state={state} lbRef={lbRef} />
          <div className="relative grid grid-cols-2 gap-2.5 @lg:grid-cols-4">
            {state.servers.map((s, i) => (
              <ServerCard
                key={s.id}
                server={s}
                index={i}
                share={s.routed / routedTotal}
                registerRef={registerRef}
                onToggle={() => dispatch({ type: "toggle", index: i })}
                reduced={reduced}
              />
            ))}
          </div>
          {geo && !reduced ? <Packets geo={geo} state={state} flightMs={flightMs} /> : null}
        </div>
        <p className="flex flex-wrap gap-x-3 text-[0.74rem] text-ink-3">
          <span>
            <span className="mr-1 inline-block size-2.5 rounded-full bg-accent align-middle" />
            short request (0.5–1.5 s)
          </span>
          <span>
            <span className="mr-1 inline-block size-2.5 rounded-full bg-violet align-middle" />
            long job (3–5.5 s)
          </span>
        </p>

        {state.algorithm === "ip" ? <IpHashPanel servers={state.servers} /> : null}

        <ControlRow>
          <RangeField label="Traffic" value={rate} min={1} max={10} onChange={setRate} display={`${rate} req/s`} />
          <Button size="sm" variant={flowing ? "secondary" : "primary"} onClick={() => setMode(flowing ? "off" : "on")}>
            {flowing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {flowing ? "Pause" : "Start traffic"}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              dispatch({ type: "burst", count: 10 });
              if (!flowing) setMode("on");
            }}
          >
            <Zap size={16} aria-hidden="true" />
            Burst ×10
          </Button>
        </ControlRow>

        <StatGrid>
          <Stat label="Requests" value={formatInt(state.total)} />
          <Stat label="Served" value={formatInt(state.ok)} tone="good" />
          <Stat label="Failed" value={formatInt(state.failed)} tone={state.failed ? "bad" : "neutral"} />
          <Stat label="In rotation" value={`${inRotation} / ${state.servers.length}`} tone={inRotation < state.servers.length ? "warn" : "neutral"} />
        </StatGrid>
        <EventLog entries={state.log} label="Load balancer log" />
      </div>
    </WidgetFrame>
  );
}

export default LbSim satisfies ComponentType<InteractiveProps>;
