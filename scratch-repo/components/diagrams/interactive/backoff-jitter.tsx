"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { ControlRow, WidgetFrame, WidgetScroll } from "@/components/ui/widget-frame";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";
import { useFrameLoop, useLoopActive } from "./_wc-frame-loop";
import {
  BUCKET,
  BUCKETS,
  CAPACITY,
  CLIENTS,
  COLLAPSE,
  SPAN,
  simulate,
  type Attempt,
  type SimResult,
  type Strategy,
} from "./_backoff-jitter-sim";

/** Real seconds the 16 simulated seconds take to play. */
const PLAYBACK_SECONDS = 4.5;
const DEFAULT_SEED = 7;

const STRATEGIES = [
  { value: "immediate", label: "Immediate" },
  { value: "backoff", label: "Backoff" },
  { value: "jitter", label: "Backoff + jitter" },
] as const;

const STRATEGY_NAME: Record<Strategy, string> = { immediate: "Immediate", backoff: "Backoff", jitter: "Backoff + jitter" };

const FORMULA: Record<Strategy, string> = {
  immediate: "wait = 0.5 s, every time",
  backoff: "wait = min(8, 2ⁿ⁻¹) s → 1, 2, 4, 8 s",
  jitter: "wait = random(0, min(8, 2ⁿ⁻¹)) s  (full jitter)",
};

// Chart geometry (SVG user units).
const X0 = 56;
const X1 = 624;
const Y0 = 26;
const ROW = 10;
const H_TOP = 248;
const H_HEIGHT = 76;
const H_BASE = H_TOP + H_HEIGHT;
const sx = (t: number) => X0 + (t / SPAN) * (X1 - X0);
const rowY = (client: number) => Y0 + client * ROW;

function fmtSeconds(t: number): string {
  return `${Number(t.toFixed(2))} s`;
}

function loadTone(k: number): string {
  if (k <= CAPACITY) return "fill-good/75";
  if (k <= COLLAPSE) return "fill-warn/75";
  return "fill-bad/75";
}

/** Per-client attempt lists and per-bucket retry arrival times, for drawing. */
function indexResult(r: SimResult) {
  const byClient: Attempt[][] = Array.from({ length: CLIENTS }, () => []);
  const arrivals: number[][] = Array.from({ length: BUCKETS }, () => []);
  for (const a of r.attempts) {
    byClient[a.client].push(a);
    if (a.n > 0) arrivals[Math.min(BUCKETS - 1, Math.floor(a.t / BUCKET))].push(a.t);
  }
  return { byClient, arrivals };
}

function Axes() {
  const ticks = Array.from({ length: SPAN / 2 + 1 }, (_, i) => i * 2);
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={Y0 - 10} y2={H_BASE} className="stroke-line" strokeWidth={1} />
          <text x={sx(t)} y={H_BASE + 17} textAnchor="middle" className="dg-label">
            {t} s
          </text>
        </g>
      ))}
      <text x={8} y={rowY(0) + 4} className="dg-label">
        c1
      </text>
      <text x={8} y={rowY(CLIENTS - 1) + 4} className="dg-label">
        c20
      </text>
      <text x={8} y={H_TOP + 12} className="dg-label">
        retries
      </text>
      <text x={8} y={H_TOP + 26} className="dg-label">
        per ½ s
      </text>
      <line x1={X0} x2={X1} y1={H_BASE} y2={H_BASE} className="stroke-line-strong" strokeWidth={1.2} />
    </g>
  );
}

/** One client's attempts up to the playhead. Memoised: during playback only rows whose count changed re-render. */
const ClientRow = memo(function ClientRow({
  client,
  attempts,
  count,
  reduced,
  runKey,
}: {
  client: number;
  attempts: Attempt[];
  count: number;
  reduced: boolean;
  runKey: string;
}) {
  const visible = attempts.slice(0, count);
  const last = visible[visible.length - 1];
  const served = visible.some((a) => a.ok);
  return (
    <g>
      {last && last.t > 0 ? (
        <line
          x1={sx(0)}
          x2={sx(last.t)}
          y1={rowY(client)}
          y2={rowY(client)}
          strokeWidth={1.4}
          className={served ? "stroke-good/50" : "stroke-line-strong/70"}
        />
      ) : null}
      {visible.map((a, i) => (
        <motion.circle
          key={`${runKey}-${i}`}
          cx={sx(a.t)}
          cy={rowY(client)}
          initial={reduced ? false : { r: 0 }}
          animate={{ r: a.ok ? 4.2 : 3.4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={a.ok ? "dg-dot dg-dot--good" : "dg-dot dg-dot--bad"}
        />
      ))}
    </g>
  );
});

function ClientRows({ byClient, shownT, reduced, runKey }: { byClient: Attempt[][]; shownT: number; reduced: boolean; runKey: string }) {
  return (
    <g>
      {byClient.map((list, c) => (
        <ClientRow
          key={c}
          client={c}
          attempts={list}
          count={list.filter((a) => a.t <= shownT).length}
          reduced={reduced}
          runKey={runKey}
        />
      ))}
    </g>
  );
}

function LoadHistogram({ arrivals, shownT, peak }: { arrivals: number[][]; shownT: number; peak: number }) {
  const scale = Math.max(CLIENTS, peak);
  const y = (k: number) => H_BASE - (k / scale) * H_HEIGHT;
  const bw = (X1 - X0) / BUCKETS;
  return (
    <g>
      {arrivals.map((times, b) => {
        const k = times.filter((t) => t <= shownT).length;
        if (!k) return null;
        return (
          <rect
            key={b}
            x={X0 + b * bw + 1}
            y={y(k)}
            width={bw - 2}
            height={H_BASE - y(k)}
            rx={1.5}
            className={loadTone(k)}
          />
        );
      })}
      <line x1={X0} x2={X1} y1={y(CAPACITY)} y2={y(CAPACITY)} className="dg-line dg-line--good dg-line--dash" />
      <text x={X1} y={y(CAPACITY) - 4} textAnchor="end" className="dg-label dg-text--good">
        capacity {CAPACITY}
      </text>
      <line x1={X0} x2={X1} y1={y(COLLAPSE)} y2={y(COLLAPSE)} className="dg-line dg-line--bad dg-line--dash" />
      <text x={X1} y={y(COLLAPSE) - 4} textAnchor="end" className="dg-label dg-text--bad">
        collapses above {COLLAPSE}
      </text>
    </g>
  );
}

function Playhead({ t }: { t: number }) {
  return (
    <g aria-hidden="true">
      <line x1={sx(t)} x2={sx(t)} y1={Y0 - 14} y2={H_BASE} className="dg-line dg-line--accent" strokeWidth={2} />
      <text x={sx(t)} y={Y0 - 16} textAnchor={t > SPAN * 0.9 ? "end" : "middle"} className="dg-label dg-text--accent">
        t = {t.toFixed(1)} s
      </text>
    </g>
  );
}

function Timeline({ result, shownT, reduced, runKey }: { result: SimResult; shownT: number; reduced: boolean; runKey: string }) {
  const { byClient, arrivals } = useMemo(() => indexResult(result), [result]);
  const summary = `${STRATEGY_NAME[result.strategy]}: ${CLIENTS} clients send ${result.sent} requests in ${SPAN} seconds; ${result.served} of ${CLIENTS} get served; the busiest half-second gets ${result.peak} retries.`;
  return (
    <WidgetScroll>
      <svg viewBox="0 0 640 352" className="h-auto w-full min-w-[560px]" role="img" aria-label={summary}>
        <Axes />
        <ClientRows byClient={byClient} shownT={shownT} reduced={reduced} runKey={runKey} />
        <LoadHistogram arrivals={arrivals} shownT={shownT} peak={result.peak} />
        {shownT < SPAN ? <Playhead t={shownT} /> : null}
      </svg>
    </WidgetScroll>
  );
}

function Legend() {
  const item = "inline-flex items-center gap-1.5";
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8rem] text-ink-2">
      <span className={item}>
        <i className="h-2.5 w-2.5 rounded-full bg-good" />
        served
      </span>
      <span className={item}>
        <i className="h-2 w-2 rounded-full bg-bad" />
        failed, will retry
      </span>
      <span className={item}>
        <i className="h-0 w-4 border-t-2 border-dashed border-good" />
        capacity {CAPACITY} per ½ s
      </span>
      <span className={item}>
        <i className="h-0 w-4 border-t-2 border-dashed border-bad" />
        collapse above {COLLAPSE}
      </span>
    </div>
  );
}

function Scoreboard({ results, current }: { results: Record<Strategy, SimResult>; current: Strategy }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[300px] border-collapse text-left text-[0.84rem]">
        <caption className="sr-only">The same outage under each retry strategy</caption>
        <thead className="bg-surface-2 font-mono text-[0.66rem] uppercase tracking-[0.06em] text-ink-3">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">
              Strategy
            </th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">
              Requests
            </th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">
              Served
            </th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">
              Peak ½ s
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              All served by
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {STRATEGIES.map(({ value }) => {
            const r = results[value];
            const active = value === current;
            return (
              <tr
                key={value}
                aria-current={active ? "true" : undefined}
                className={cn("border-t border-line", active ? "bg-accent-soft font-bold text-ink" : "text-ink-2")}
              >
                <th scope="row" className={cn("px-3 py-1.5 font-semibold", active && "text-accent")}>
                  {STRATEGY_NAME[value]}
                </th>
                <td className="px-2 py-1.5 text-right">
                  {r.sent} <span className="text-ink-3">({Number((r.sent / CLIENTS).toFixed(1))}×)</span>
                </td>
                <td className={cn("px-2 py-1.5 text-right", r.served === CLIENTS ? "text-good" : "text-bad")}>
                  {r.served} / {CLIENTS}
                </td>
                <td className={cn("px-2 py-1.5 text-right", r.peak > COLLAPSE ? "text-bad" : r.peak > CAPACITY ? "text-warn" : "text-good")}>
                  {r.peak}
                </td>
                <td className="px-3 py-1.5 text-right">{r.doneBy === null ? "never" : fmtSeconds(r.doneBy)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function explain(r: SimResult) {
  const load = `${Number((r.sent / CLIENTS).toFixed(1))}×`;
  if (r.strategy === "immediate") {
    return (
      <>
        <strong>Retry storm.</strong> Every client retries every 0.5 s in lockstep, so all 20 land in the same half-second, the
        server collapses each time, and {r.sent} requests ({load} the load) serve {r.served} clients. Now try Backoff.
      </>
    );
  }
  if (r.strategy === "backoff") {
    return (
      <>
        <strong>Backoff alone.</strong> Waiting 1, 2, 4, 8 s gives the server breathing room, but every client waits the same
        amounts, so they come back together and collide again: {r.served} of {CLIENTS} served from {r.sent} requests. Add jitter.
      </>
    );
  }
  return (
    <>
      <strong>Backoff + jitter.</strong> Each wait is random between 0 and 1, 2, 4, 8 s, which spreads the retries out. Arrivals
      stay near capacity, and {r.served} of {CLIENTS} clients are served
      {r.doneBy !== null ? ` by ${fmtSeconds(r.doneBy)}` : ""} with {r.sent} requests ({load}). Replay draws new random waits.
    </>
  );
}

export default function BackoffJitter() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const active = useLoopActive(ref);
  const [strategy, setStrategy] = useState<Strategy>("immediate");
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [clock, setClock] = useState(0);

  const results = useMemo<Record<Strategy, SimResult>>(
    () => ({ immediate: simulate("immediate", seed), backoff: simulate("backoff", seed), jitter: simulate("jitter", seed) }),
    [seed],
  );
  const result = results[strategy];
  const shownT = reduced ? SPAN : clock;
  const finished = shownT >= SPAN;

  useFrameLoop((dt) => setClock((c) => Math.min(SPAN, c + (dt * SPAN) / PLAYBACK_SECONDS)), active && !reduced && !finished);

  const praised = useRef(false);
  useEffect(() => {
    if (!finished || strategy !== "jitter" || praised.current || result.served !== CLIENTS) return;
    praised.current = true;
    emitCompanionEvent({ type: "diagram", mood: "happy", message: "Jitter spread the retries out, and every client got through." });
  }, [finished, strategy, result.served]);

  const choose = (s: Strategy) => {
    setStrategy(s);
    setClock(0);
  };
  const replay = () => {
    setSeed(Math.floor(Math.random() * 1_000_000) + 1);
    setClock(0);
  };

  return (
    <WidgetFrame
      kicker="Simulate"
      title="Retry storms vs backoff + jitter"
      hint="20 clients fail at t = 0 and retry. The server serves 6 requests per half-second; past 12 it falls over and serves none."
      note={explain(result)}
    >
      <div ref={ref} className="flex flex-col gap-3">
        <ControlRow>
          <SegmentedControl label="Retry strategy" options={STRATEGIES} value={strategy} onChange={choose} />
          <Button size="sm" variant="ghost" onClick={replay}>
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Replay
          </Button>
        </ControlRow>
        <p className="font-mono text-[0.8rem] text-ink-2">
          <span className="text-ink-3">retry n: </span>
          {FORMULA[strategy]}
        </p>
        <Timeline result={result} shownT={shownT} reduced={reduced} runKey={`${strategy}-${seed}`} />
        <Legend />
        <Scoreboard results={results} current={strategy} />
      </div>
    </WidgetFrame>
  );
}
