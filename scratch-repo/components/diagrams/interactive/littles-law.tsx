"use client";

import { useRef, useState, type ComponentType } from "react";
import type { InteractiveProps } from "../interactive-registry";
import { Button } from "@/components/ui/button";
import { RangeField } from "@/components/ui/range-field";
import { Stat, StatGrid } from "@/components/ui/stat";
import { ControlRow, WidgetFrame, WidgetScroll } from "@/components/ui/widget-frame";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { cn } from "@/lib/utils";
import { formatInt, formatSmart, useFrameLoop, useLoopGate } from "./_wa-shared";

/* ------------------------------------------------------------------ model: L = λ × W */

interface Inputs {
  rate: number; // λ, requests per second
  latencyMs: number; // W, average time each request spends inside
  pool: number; // threads (or connections) available
}

const PRESETS: readonly { label: string; values: Omit<Inputs, "pool">; hint: string }[] = [
  { label: "5,000 req/s × 200 ms", values: { rate: 5000, latencyMs: 200 }, hint: "The textbook case: about 1,000 requests in flight." },
  { label: "DB slows to 400 ms", values: { rate: 5000, latencyMs: 400 }, hint: "Same traffic, slower database: twice as many requests in flight." },
  { label: "100 req/s × 500 ms", values: { rate: 100, latencyMs: 500 }, hint: "A small service: 50 in flight." },
];

function analyse({ rate, latencyMs, pool }: Inputs) {
  const inFlight = (rate * latencyMs) / 1000;
  const utilisation = inFlight / pool;
  const maxRate = (pool * 1000) / latencyMs;
  return { inFlight, utilisation, maxRate, queueGrowth: Math.max(0, rate - maxRate) };
}

/* ------------------------------------------------------------------ flowing pipe
   Dots enter at the throughput rate and take the latency to cross, so the number inside at any
   moment is λ × W. Time is slowed so the crossing is visible; longer latency = slower crossing. */

const PIPE = { x: 92, y: 26, w: 196, h: 78 };
const MAX_DOTS = 60;

/** Visible crossing time in seconds: 1.2 s for 10 ms up to 5 s for 2,000 ms. */
const crossingSeconds = (latencyMs: number) => 1.2 + (3.8 * (Math.log10(latencyMs) - 1)) / (Math.log10(2000) - 1);

/** Cheap deterministic jitter in [0, 1) so dots spread across the pipe's height. */
const jitter = (k: number) => {
  const x = Math.sin(k * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

interface PipeProps {
  dots: number;
  perDot: number;
  clock: number;
  crossing: number;
  overloaded: boolean;
  rate: number;
  queueGrowth: number;
}

function Pipe({ dots, perDot, clock, crossing, overloaded, rate, queueGrowth }: PipeProps) {
  const positions = Array.from({ length: dots }, (_, k) => {
    const phase = (clock / crossing + k / dots) % 1;
    return {
      k,
      x: PIPE.x + 7 + phase * (PIPE.w - 14),
      y: PIPE.y + 8 + jitter(k + 1) * (PIPE.h - 16),
    };
  });
  const queued = overloaded ? Math.min(15, 3 + Math.round((queueGrowth / rate) * 20)) : 0;

  return (
    <svg
      viewBox="0 0 360 132"
      className="mx-auto h-auto w-full min-w-[300px] max-w-[580px]"
      role="img"
      aria-label={`Requests flowing through the system: ${dots} dots in flight, each standing for about ${formatSmart(perDot)} requests.${overloaded ? " The pool is full and a queue is forming." : ""}`}
    >
      {/* queue in front of the pipe */}
      {Array.from({ length: queued }, (_, i) => (
        <circle key={i} cx={78 - (i % 5) * 13} cy={PIPE.y + PIPE.h / 2 - 26 + Math.floor(i / 5) * 13 + 13} r={4.5} className="fill-bad" />
      ))}
      {overloaded ? (
        <text x={46} y={PIPE.y + PIPE.h + 22} textAnchor="middle" className="dg-label dg-text--bad font-bold">
          queue +{formatInt(queueGrowth)}/s
        </text>
      ) : (
        <>
          <path d={`M14 ${PIPE.y + PIPE.h / 2} H${PIPE.x - 4}`} className="dg-line dg-line--accent" markerEnd="url(#ah-accent)" />
          <text x={14} y={PIPE.y + PIPE.h / 2 - 8} className="dg-label">
            in
          </text>
        </>
      )}
      <rect
        x={PIPE.x}
        y={PIPE.y}
        width={PIPE.w}
        height={PIPE.h}
        rx={14}
        className={cn("dg-box", overloaded ? "dg-box--bad" : "dg-box--accent")}
        fillOpacity={0.5}
      />
      <text x={PIPE.x + PIPE.w / 2} y={PIPE.y - 9} textAnchor="middle" className="dg-sub">
        inside the system
      </text>
      {positions.map((d) => (
        <circle key={d.k} cx={d.x} cy={d.y} r={4} className="fill-accent" />
      ))}
      <path d={`M${PIPE.x + PIPE.w + 4} ${PIPE.y + PIPE.h / 2} H346`} className="dg-line dg-line--accent" markerEnd="url(#ah-accent)" />
      <text x={346} y={PIPE.y + PIPE.h / 2 - 8} textAnchor="end" className="dg-label">
        out
      </text>
      <text x={PIPE.x + PIPE.w / 2} y={PIPE.y + PIPE.h + 22} textAnchor="middle" className="dg-label">
        each dot ≈ {formatSmart(perDot)} {perDot === 1 ? "request" : "requests"}
      </text>
    </svg>
  );
}

function PoolMeter({ pool, inFlight, utilisation }: { pool: number; inFlight: number; utilisation: number }) {
  const tone = utilisation > 1 ? "bg-bad" : utilisation > 0.8 ? "bg-warn" : "bg-good";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap justify-between gap-x-3 text-[0.82rem]">
        <span className="font-bold text-ink-2">Pool of {formatInt(pool)} threads</span>
        <span className="font-mono tabular-nums text-ink">
          {formatSmart(Math.min(inFlight, pool))} busy · {Math.round(utilisation * 100)}%
        </span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-surface-2"
        role="meter"
        aria-label="Pool utilisation"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(utilisation * 100))}
      >
        <div className={cn("h-full rounded-full transition-[width,background-color] duration-300", tone)} style={{ width: `${Math.min(100, utilisation * 100)}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ widget */

function LittlesLaw() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gate = useLoopGate(rootRef);
  const reduced = useReducedMotion();
  const [inputs, setInputs] = useState<Inputs>({ rate: 5000, latencyMs: 200, pool: 1500 });
  const [clock, setClock] = useState(0);

  const { rate, latencyMs, pool } = inputs;
  const { inFlight, utilisation, maxRate, queueGrowth } = analyse(inputs);
  const overloaded = queueGrowth > 0;

  const slots = Math.min(MAX_DOTS, pool);
  const perDot = pool / slots;
  const dots = inFlight > 0 ? Math.max(1, Math.round((Math.min(inFlight, pool) / pool) * slots)) : 0;
  const crossing = crossingSeconds(latencyMs);

  useFrameLoop((dt) => setClock((c) => c + dt / 1000), gate && !reduced && dots > 0);

  const set = (patch: Partial<Inputs>) => setInputs((prev) => ({ ...prev, ...patch }));
  const preset = PRESETS.find((p) => p.values.rate === rate && p.values.latencyMs === latencyMs);

  let note = `About ${formatSmart(inFlight)} requests are inside the system at any moment, each holding a thread, memory and often a database connection.`;
  if (overloaded) {
    note += ` The pool can only sustain ${formatInt(maxRate)} req/s at this latency (${formatInt(pool)} ÷ ${latencyMs / 1000} s), so ${formatInt(queueGrowth)} req/s pile into a queue. Latency climbs and the queue feeds itself. Grow the pool, cut latency, or shed load.`;
  } else if (utilisation > 0.8) {
    note += " Under 20% headroom: a latency blip (one slow query) will push you over. Plug in p99 latency for a pessimistic bound.";
  } else {
    note += " Plenty of headroom. The average hides the tail, so plugging in p99 latency gives a safer upper bound.";
  }
  if (preset) note = `${preset.hint} ${note}`;

  return (
    <WidgetFrame
      kicker="Calculate"
      title="Little's Law"
      hint="Requests in flight = throughput × average latency. Size your thread and connection pools from it."
      note={note}
    >
      <div ref={rootRef} className="@container flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 rounded-xl bg-surface-2 px-3 py-3 text-center font-display">
          <span className="flex flex-col">
            <span className={cn("text-3xl font-bold tabular-nums", overloaded ? "text-bad" : "text-accent")}>{formatSmart(inFlight)}</span>
            <span className="font-sans text-[0.72rem] text-ink-3">in flight (L)</span>
          </span>
          <span className="text-2xl text-ink-3">=</span>
          <span className="flex flex-col">
            <span className="text-xl font-bold tabular-nums text-ink">{formatInt(rate)} req/s</span>
            <span className="font-sans text-[0.72rem] text-ink-3">throughput (λ)</span>
          </span>
          <span className="text-2xl text-ink-3">×</span>
          <span className="flex flex-col">
            <span className="text-xl font-bold tabular-nums text-ink">{latencyMs / 1000} s</span>
            <span className="font-sans text-[0.72rem] text-ink-3">latency (W)</span>
          </span>
        </div>

        <WidgetScroll>
          <Pipe dots={dots} perDot={perDot} clock={clock} crossing={crossing} overloaded={overloaded} rate={rate} queueGrowth={queueGrowth} />
        </WidgetScroll>
        <PoolMeter pool={pool} inFlight={inFlight} utilisation={utilisation} />

        <div className="grid gap-x-6 gap-y-2.5 @2xl:grid-cols-2">
          <RangeField label="Throughput (req/s)" value={rate} min={10} max={10000} step={10} onChange={(v) => set({ rate: v })} display={formatInt(rate)} />
          <RangeField label="Avg latency (ms)" value={latencyMs} min={10} max={2000} step={10} onChange={(v) => set({ latencyMs: v })} display={formatInt(latencyMs)} />
          <RangeField label="Pool size (threads)" value={pool} min={50} max={5000} step={50} onChange={(v) => set({ pool: v })} display={formatInt(pool)} />
        </div>
        <ControlRow className="gap-x-2">
          <span className="text-[0.82rem] font-bold text-ink-2">Presets:</span>
          {PRESETS.map((p) => (
            <Button key={p.label} size="sm" variant={preset === p ? "primary" : "secondary"} aria-pressed={preset === p} onClick={() => set(p.values)}>
              {p.label}
            </Button>
          ))}
        </ControlRow>

        <StatGrid>
          <Stat label="In flight (L)" value={formatSmart(inFlight)} tone="accent" />
          <Stat label="Pool busy" value={`${Math.round(utilisation * 100)}%`} tone={overloaded ? "bad" : utilisation > 0.8 ? "warn" : "good"} />
          <Stat label="Pool's max throughput" value={`${formatInt(maxRate)} req/s`} />
          <Stat label="Queue growth" value={overloaded ? `+${formatInt(queueGrowth)} req/s` : "none"} tone={overloaded ? "bad" : "neutral"} />
        </StatGrid>
      </div>
    </WidgetFrame>
  );
}

export default LittlesLaw satisfies ComponentType<InteractiveProps>;
