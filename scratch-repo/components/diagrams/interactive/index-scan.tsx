"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { InteractiveProps } from "../interactive-registry";
import { WidgetFrame, WidgetScroll, ControlRow } from "@/components/ui/widget-frame";
import { Button } from "@/components/ui/button";
import { Stat, StatGrid } from "@/components/ui/stat";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { useInView } from "@/lib/hooks/use-in-view";
import { usePageVisible } from "@/lib/hooks/use-page-visible";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Model: the same assumptions as the lesson                           */
/* ------------------------------------------------------------------ */

const PAGE_READ_S = 0.15e-3; // one B-tree page read ≈ 0.15 ms
const SCAN_RATE = 5e6; // rows checked per second by a full scan
const FANOUT = 100; // keys per B-tree page
const BYTES_PER_ENTRY = 40; // email (~30 B) + row pointer
const INDEX_ANIM_MS = 700; // the index lane always takes 0.7 s on screen
const MAX_ANIM_MS = 3200; // the race never runs longer than this

const PRESETS = [
  { label: "1k", exp: 3 },
  { label: "1M", exp: 6 },
  { label: "50M", exp: Math.log10(5e7) },
  { label: "500M", exp: Math.log10(5e8) },
  { label: "1B", exp: 9 },
];

/** Round to two significant figures so the slider lands on readable sizes. */
function nice(x: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(x)));
  return (Math.round((x / mag) * 10) / 10) * mag;
}

function depthFor(n: number): number {
  return Math.max(1, Math.ceil(Math.log(n) / Math.log(FANOUT) - 1e-9));
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function shortNum(n: number): string {
  const trim = (x: number) => String(Number(x.toFixed(1)));
  if (n >= 1e9) return `${trim(n / 1e9)}B`;
  if (n >= 1e6) return `${trim(n / 1e6)}M`;
  if (n >= 1e3) return `${trim(n / 1e3)}k`;
  return String(n);
}

function longNum(n: number): string {
  if (n >= 1e9) return `${Number((n / 1e9).toFixed(1))} billion`;
  if (n >= 1e6) return `${Number((n / 1e6).toFixed(1))} million`;
  if (n >= 1e3) return `${Number((n / 1e3).toFixed(1))} thousand`;
  return String(n);
}

function fmtSec(sec: number): string {
  if (sec < 1e-4) return `${Number((sec * 1e6).toFixed(1))} µs`;
  if (sec < 1) return `${Number((sec * 1e3).toPrecision(3))} ms`;
  if (sec < 120) return `${sec < 10 ? sec.toFixed(1) : fmt(sec)} s`;
  if (sec < 7200) return `${(sec / 60).toFixed(sec < 600 ? 1 : 0)} min`;
  return `${(sec / 3600).toFixed(1)} hours`;
}

function fmtBytes(b: number): string {
  const units: Array<[string, number]> = [["TB", 1e12], ["GB", 1e9], ["MB", 1e6], ["KB", 1e3]];
  for (const [u, v] of units) if (b >= v) return `${Number((b / v).toPrecision(3))} ${u}`;
  return `${Math.round(b)} B`;
}

interface Plan {
  n: number;
  depth: number;
  comparisons: number;
  tIdx: number;
  tScan: number;
  /** Real seconds represented by one millisecond of animation. */
  realPerMs: number;
  animScan: number;
  total: number;
}

function planFor(n: number): Plan {
  const depth = depthFor(n);
  const tIdx = depth * PAGE_READ_S;
  const tScan = n / SCAN_RATE;
  const realPerMs = tIdx / INDEX_ANIM_MS;
  const animScan = tScan / realPerMs;
  return {
    n,
    depth,
    comparisons: Math.ceil(Math.log2(n)),
    tIdx,
    tScan,
    realPerMs,
    animScan,
    total: Math.min(MAX_ANIM_MS, Math.max(INDEX_ANIM_MS, animScan)),
  };
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function LogSlider({ exp, n, onChange }: { exp: number; n: number; onChange: (exp: number) => void }) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <label htmlFor={id} className="font-bold text-ink-2">
        Rows in users
      </label>
      <input
        id={id}
        type="range"
        min={3}
        max={9}
        step={0.05}
        value={exp}
        aria-valuetext={`${longNum(n)} rows`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-44 max-w-full accent-[var(--accent)]"
      />
      <output htmlFor={id} className="min-w-[4ch] font-mono text-[0.85rem] tabular-nums text-ink">
        {shortNum(n)}
      </output>
    </div>
  );
}

function Lane({
  name,
  sub,
  progress,
  tone,
  result,
  racing,
}: {
  name: string;
  sub: string;
  progress: number;
  tone: "warn" | "good";
  result: string;
  /** During a race the bar is live progress; otherwise it is relative time and purely visual. */
  racing: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-center">
      <div className="flex flex-col">
        <span className="text-[0.88rem] font-bold text-ink">{name}</span>
        <span className="font-mono text-[0.7rem] text-ink-3">{sub}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span
          role={racing ? "progressbar" : undefined}
          aria-hidden={racing ? undefined : true}
          aria-label={racing ? `${name} progress` : undefined}
          aria-valuemin={racing ? 0 : undefined}
          aria-valuemax={racing ? 100 : undefined}
          aria-valuenow={racing ? Math.round(progress * 100) : undefined}
          className="block h-3.5 overflow-hidden rounded-full bg-surface-3"
        >
          <span
            className={cn("block h-full rounded-full", tone === "warn" ? "bg-warn" : "bg-good")}
            style={{ width: progress > 0 ? `max(3px, ${(progress * 100).toFixed(3)}%)` : "0%" }}
          />
        </span>
        <span className="font-mono text-[0.76rem] tabular-nums text-ink-2 [overflow-wrap:anywhere]">{result}</span>
      </div>
    </div>
  );
}

/** The B-tree path: root → … → leaf → row. Levels light up as pages are read. */
function TreePath({ depth, pagesRead }: { depth: number; pagesRead: number }) {
  const xs = [24, 140, 256];
  const path = [1, 0, 2, 1, 2, 0];
  const rowH = 40;
  const top = 10;
  const rowY = top + depth * rowH + 6;
  const H = rowY + 52;
  const leafX = (depth === 1 ? 140 : xs[path[depth - 1]]) + 40;
  const rowLit = pagesRead >= depth;
  return (
    <svg viewBox={`0 0 400 ${H}`} className="mx-auto block h-auto w-full max-w-[28rem]" role="img" aria-label={`B-tree lookup: ${depth} page reads from root to leaf, then the row.`}>
      {Array.from({ length: depth }, (_, l) => {
        const y = top + l * rowH;
        const count = l === 0 ? 1 : 3;
        const lit = l < pagesRead;
        return (
          <g key={l}>
            {Array.from({ length: count }, (_, k) => {
              const x = l === 0 ? 140 : xs[k];
              const onPath = l === 0 || k === path[l];
              return (
                <g key={k}>
                  <rect
                    x={x}
                    y={y}
                    width={80}
                    height={26}
                    rx={6}
                    className={cn("transition-[fill,stroke] duration-200", onPath ? (lit ? "dg-box dg-box--good" : "dg-box dg-box--accent") : "dg-box dg-box--ghost")}
                  />
                  <text x={x + 40} y={y + 17} textAnchor="middle" className={cn("dg-label", onPath && (lit ? "dg-text--good" : "dg-text--accent"))}>
                    {l === 0 ? "root" : l === depth - 1 ? "leaf" : "page"}
                  </text>
                </g>
              );
            })}
            {l < depth - 1 ? (
              <path
                d={`M${(l === 0 ? 140 : xs[path[l]]) + 40} ${y + 26} L${xs[path[l + 1]] + 40} ${y + rowH}`}
                className={cn("dg-line", l + 1 < pagesRead ? "dg-line--good" : "dg-line--accent")}
              />
            ) : null}
            <text x={396} y={y + 17} textAnchor="end" className={cn("dg-label", lit && "dg-text--good")}>
              {lit ? `read ${l + 1}` : `${l + 1}`}
            </text>
          </g>
        );
      })}
      <path d={`M${leafX} ${top + (depth - 1) * rowH + 26} L${leafX} ${rowY}`} className={cn("dg-line dg-line--dash", rowLit && "dg-line--good")} markerEnd="url(#ah)" />
      <rect x={leafX - 70} y={rowY} width={140} height={26} rx={6} className={rowLit ? "dg-box dg-box--good" : "dg-box dg-box--store"} />
      <text x={leafX} y={rowY + 17} textAnchor="middle" className="dg-label">
        row in users table
      </text>
      <text x={180} y={H - 6} textAnchor="middle" className="dg-label">
        {depth} page read{depth > 1 ? "s" : ""} → row pointer → the row
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

type Race = { status: "idle" } | { status: "running" | "done"; elapsed: number; plan: Plan };

function IndexScan() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const visible = usePageVisible();
  const announced = useRef(false);

  const [exp, setExp] = useState(Math.log10(5e8));
  const [race, setRace] = useState<Race>({ status: "idle" });
  const n = nice(Math.pow(10, exp));
  const plan = planFor(n);

  const running = race.status === "running";
  const frame = useEffectEvent((dt: number) => {
    setRace((r) => {
      if (r.status !== "running") return r;
      const elapsed = Math.min(r.plan.total, r.elapsed + dt);
      return { status: elapsed >= r.plan.total ? "done" : "running", elapsed, plan: r.plan };
    });
  });

  useEffect(() => {
    if (!running || !inView || !visible) return;
    let id = 0;
    let last = -1;
    const step = (t: number) => {
      if (last >= 0) frame(Math.min(64, t - last));
      last = t;
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [running, inView, visible]);

  const startRace = () => {
    const p = planFor(n);
    setRace(reduced ? { status: "done", elapsed: p.total, plan: p } : { status: "running", elapsed: 0, plan: p });
    if (!announced.current && p.tScan / p.tIdx > 1000) {
      announced.current = true;
      emitCompanionEvent({ type: "diagram", mood: "happy", message: `The index found it in ${p.depth} page reads.` });
    }
  };

  const changeExp = (value: number) => {
    setExp(value);
    setRace({ status: "idle" });
  };

  // What each lane shows right now.
  const shown = race.status === "idle" ? null : race;
  const p = shown ? shown.plan : plan;
  const elapsed = shown ? shown.elapsed : 0;
  const pagesRead = !shown ? p.depth : elapsed >= INDEX_ANIM_MS ? p.depth : Math.floor((elapsed / INDEX_ANIM_MS) * p.depth + 1e-9);
  const idxDone = !shown || elapsed >= INDEX_ANIM_MS;
  const rowsChecked = shown ? Math.min(p.n, elapsed * p.realPerMs * SCAN_RATE) : p.n;
  const scanDone = rowsChecked >= p.n;
  const realElapsed = elapsed * p.realPerMs;

  const idxProgress = shown ? pagesRead / p.depth : Math.max(0.015, p.tIdx / Math.max(p.tScan, p.tIdx));
  const scanProgress = shown ? rowsChecked / p.n : Math.min(1, p.tScan / Math.max(p.tScan, p.tIdx));

  const idxResult = !shown
    ? `${fmtSec(p.tIdx)} (${p.depth} pages × 0.15 ms)`
    : idxDone
      ? `done · ${fmtSec(p.tIdx)} · ${p.depth} pages read`
      : `walking the tree… page ${Math.min(p.depth, pagesRead + 1)} of ${p.depth}`;
  const scanPct = (rowsChecked / p.n) * 100;
  const scanResult = !shown
    ? `${fmtSec(p.tScan)} (${fmt(p.n)} rows ÷ 5M rows/s)`
    : scanDone
      ? `done · ${fmtSec(p.tScan)} · ${fmt(p.n)} rows checked`
      : `${fmt(rowsChecked)} of ${fmt(p.n)} rows (${scanPct < 0.01 ? "<0.01" : scanPct.toFixed(scanPct < 1 ? 2 : 0)}%)${race.status === "done" ? ` · needs ${fmtSec(p.tScan)}` : "…"}`;

  const ratio = plan.tScan / plan.tIdx;
  const rowsAtIndexFinish = Math.min(plan.n, plan.tIdx * SCAN_RATE);
  let note: string;
  if (race.status === "running") {
    note = `Racing… the animation is slowed so each of the index's ${p.depth} page reads is visible.`;
  } else if (plan.tScan <= plan.tIdx) {
    note = `At ${fmt(n)} rows a full scan (${fmtSec(plan.tScan)}) is as fast as or faster than the index (${fmtSec(plan.tIdx)}), so the query planner may skip the index. Indexes pay off as tables grow.`;
  } else {
    note = `At ${fmt(n)} rows a scan checks every row (O(n)): about ${fmtSec(plan.tScan)}. The B-tree reads ${plan.depth} pages from root to leaf (O(log n)): about ${fmtSec(plan.tIdx)}, roughly ${fmt(ratio)}× faster. By the time the index answers, the scan has checked only ${fmt(rowsAtIndexFinish)} rows.`;
  }

  return (
    <WidgetFrame
      kicker="Race"
      title="Full scan vs index"
      hint="Grow the users table, then race WHERE email = … with and without a B-tree index."
      note={note}
    >
      <div ref={rootRef} className="flex flex-col gap-4">
        <ControlRow>
          <LogSlider exp={exp} n={n} onChange={changeExp} />
          <div role="group" aria-label="Table size presets" className="flex flex-wrap gap-1">
            {PRESETS.map((pr) => (
              <Button
                key={pr.label}
                size="sm"
                variant="ghost"
                aria-pressed={Math.abs(pr.exp - exp) < 1e-6}
                className="aria-pressed:bg-accent-soft aria-pressed:text-accent"
                onClick={() => changeExp(pr.exp)}
              >
                {pr.label}
              </Button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={startRace} disabled={running}>
            {running ? "Racing…" : race.status === "done" ? "Race again" : "Race"}
          </Button>
        </ControlRow>

        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-2 p-3">
          <p className="font-mono text-[0.78rem] text-ink-2">
            SELECT * FROM users WHERE email = &apos;priya@example.com&apos;;
          </p>
          <Lane name="Full table scan" sub="O(n): check every row" progress={scanProgress} tone="warn" result={scanResult} racing={shown !== null} />
          <Lane name="B-tree index" sub="O(log n): one page per level" progress={idxProgress} tone="good" result={idxResult} racing={shown !== null} />
          {shown ? (
            <p className="font-mono text-[0.72rem] tabular-nums text-ink-3">
              real time elapsed: {fmtSec(realElapsed)} · animation slowed {fmt(INDEX_ANIM_MS / (p.tIdx * 1000))}×
            </p>
          ) : null}
        </div>

        <WidgetScroll>
          <div className="min-w-[300px]">
            <TreePath depth={p.depth} pagesRead={pagesRead} />
          </div>
        </WidgetScroll>

        <StatGrid>
          <Stat label="Rows" value={fmt(n)} />
          <Stat label="Scan checks" value={fmt(n)} tone="warn" />
          <Stat label="Index page reads" value={plan.depth} tone="good" />
          <Stat label="Comparisons" value={`~${plan.comparisons}`} />
          <Stat label="Index size (~40 B/row)" value={fmtBytes(n * BYTES_PER_ENTRY)} tone="amber" />
        </StatGrid>
        <p className="text-[0.8rem] text-ink-3">
          Assumes ~0.15 ms per page read, ~5M rows/s scanned and {FANOUT} keys per B-tree page. The price of the index: extra
          storage, and every INSERT or UPDATE of email must update it too.
        </p>
      </div>
    </WidgetFrame>
  );
}

export default IndexScan satisfies ComponentType<InteractiveProps>;
