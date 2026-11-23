"use client";

import { useMemo, useRef, useState, type ComponentType } from "react";
import { motion } from "motion/react";
import { Shuffle } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { Button } from "@/components/ui/button";
import { RangeField } from "@/components/ui/range-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat, StatGrid } from "@/components/ui/stat";
import { ControlRow, WidgetFrame, WidgetScroll } from "@/components/ui/widget-frame";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { cn } from "@/lib/utils";
import { formatInt, mulberry32, useInterval, useLoopGate } from "./_wa-shared";

/* ------------------------------------------------------------------ model */

type Percentile = "p99" | "p999";
const FAST_SHARE: Record<Percentile, number> = { p99: 0.99, p999: 0.999 };
const ODDS: Record<Percentile, string> = { p99: "1 in 100", p999: "1 in 1,000" };
const MAX_N = 200;
const PAGES = 100;
/** Target for the "budget" stat: 99% of page loads should be fast. */
const PAGE_TARGET = 0.99;

const chanceOfSlowPage = (n: number, fast: number) => 1 - fast ** n;

/** For each simulated page load, the indexes of its backends that were slow. */
function simulatePages(n: number, slowProb: number, seed: number): number[][] {
  const rand = mulberry32(seed);
  return Array.from({ length: PAGES }, () => {
    const slow: number[] = [];
    for (let j = 0; j < n; j++) if (rand() < slowProb) slow.push(j);
    return slow;
  });
}

const percent = (p: number) => `${(p * 100).toFixed(1)}%`;

/* ------------------------------------------------------------------ chart */

const CX0 = 46;
const CX1 = 328;
const CY0 = 14;
const CY1 = 170;
const cx = (n: number) => CX0 + (n / MAX_N) * (CX1 - CX0);
const cy = (p: number) => CY1 - p * (CY1 - CY0);

function curvePath(fast: number): string {
  const pts: string[] = [];
  for (let n = 0; n <= MAX_N; n += 2) pts.push(`${n === 0 ? "M" : "L"}${cx(n).toFixed(1)} ${cy(chanceOfSlowPage(n, fast)).toFixed(1)}`);
  return pts.join(" ");
}

function TailChart({ n, fast, reduced }: { n: number; fast: number; reduced: boolean }) {
  const p = chanceOfSlowPage(n, fast);
  const mx = cx(n);
  const my = cy(p);
  const labelLeft = mx > 250;
  return (
    <svg
      viewBox="0 0 340 214"
      className="mx-auto h-auto w-full min-w-[280px] max-w-[520px]"
      role="img"
      aria-label={`Curve of the chance a page load waits on at least one slow backend. At ${n} backends it is ${percent(p)}.`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <path d={`M${CX0} ${cy(v)} H${CX1}`} className="dg-line opacity-40" />
          <text x={CX0 - 6} y={cy(v) + 4} textAnchor="end" className="dg-label">
            {v * 100}%
          </text>
        </g>
      ))}
      {[0, 50, 100, 150, 200].map((v) => (
        <text key={v} x={cx(v)} y={CY1 + 16} textAnchor="middle" className="dg-label">
          {v}
        </text>
      ))}
      <text x={(CX0 + CX1) / 2} y={208} textAnchor="middle" className="dg-label">
        parallel backend calls per page
      </text>
      <motion.path
        className="fill-none stroke-accent"
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={false}
        animate={{ d: curvePath(fast) }}
        transition={{ duration: reduced ? 0 : 0.5 }}
      />
      <path d={`M${mx} ${CY1} V${my}`} className="dg-line dg-line--dash" />
      <path d={`M${CX0} ${my} H${mx}`} className="dg-line dg-line--dash" />
      <circle cx={mx} cy={my} r={6} strokeWidth={2} className="fill-accent stroke-surface" />
      <text x={labelLeft ? mx - 10 : mx + 10} y={Math.min(CY1 - 8, my + 22)} textAnchor={labelLeft ? "end" : "start"} className="dg-text dg-text--accent">
        {percent(p)}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ simulation */

function PageStrip({ pages, revealed, shown }: { pages: number[][]; revealed: number; shown: number }) {
  return (
    <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px]" aria-hidden="true">
      {pages.map((slow, i) => (
        <span
          key={i}
          className={cn(
            "aspect-square rounded-[3px] transition-colors duration-150",
            i >= revealed ? "bg-surface-3/60" : slow.length > 0 ? "bg-bad" : "bg-good/35",
            i === shown && "outline-2 outline-offset-1 outline-ink",
          )}
        />
      ))}
    </div>
  );
}

function BackendGrid({ n, slow }: { n: number; slow: readonly number[] }) {
  const slowSet = new Set(slow);
  return (
    <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[2px]" aria-hidden="true">
      {Array.from({ length: n }, (_, j) => (
        <span key={j} className={cn("aspect-square rounded-[2px]", slowSet.has(j) ? "bg-bad" : "bg-surface-3")} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ widget */

const PERCENTILE_OPTIONS = [
  { value: "p99", label: "slow 1 in 100 (p99)" },
  { value: "p999", label: "slow 1 in 1,000 (p99.9)" },
] as const;

function TailLatency() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gate = useLoopGate(rootRef);
  const reduced = useReducedMotion();
  const [n, setN] = useState(100);
  const [pct, setPct] = useState<Percentile>("p99");
  const [seed, setSeed] = useState(7);
  const [revealed, setRevealed] = useState(PAGES);

  const fast = FAST_SHARE[pct];
  const p = chanceOfSlowPage(n, fast);
  const pages = useMemo(() => simulatePages(n, 1 - fast, seed), [n, fast, seed]);
  const shownRevealed = reduced ? PAGES : revealed;

  useInterval(() => setRevealed((r) => Math.min(PAGES, r + 1)), shownRevealed < PAGES && gate ? 30 : null);

  const slowPages = pages.slice(0, shownRevealed).filter((s) => s.length > 0).length;
  // While the run plays, follow the newest page; at rest, show the newest slow page (if any) as the example.
  let shown = shownRevealed - 1;
  if (shownRevealed === PAGES) {
    for (let i = PAGES - 1; i >= 0; i--) {
      if (pages[i].length > 0) {
        shown = i;
        break;
      }
    }
  }
  const example = pages[shown] ?? [];
  const budget = 1 / (1 - PAGE_TARGET ** (1 / n));

  const rerun = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setRevealed(0);
  };

  const note =
    `Each backend is slow only ${ODDS[pct]} times (its ${pct === "p99" ? "p99" : "p99.9"}). With ${n} called in parallel, ` +
    `${percent(p)} of page loads wait on at least one of them: 1 − ${fast}^${n}. ` +
    (p > 0.5 ? "The rare slow case has become the common one." : "Fan out further and the tail takes over.");

  return (
    <WidgetFrame
      title="The tail at scale"
      hint="A page calls N backends in parallel and waits for the slowest. Slide N and watch how often a rare slow response hits."
      note={note}
    >
      <div ref={rootRef} className="@container flex flex-col gap-4">
        <ControlRow>
          <RangeField label="Backends per page" value={n} min={1} max={MAX_N} onChange={setN} />
          <SegmentedControl label="How often one backend is slow" size="sm" options={PERCENTILE_OPTIONS} value={pct} onChange={setPct} />
        </ControlRow>

        <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <WidgetScroll>
            <TailChart n={n} fast={fast} reduced={reduced} />
          </WidgetScroll>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[0.86rem] text-ink-2">
                <strong className="text-ink">
                  {slowPages} of {shownRevealed}
                </strong>{" "}
                simulated page loads hit a slow backend
                <span className="text-ink-3"> (formula: {percent(p)})</span>
              </p>
              <Button size="sm" onClick={rerun} disabled={shownRevealed < PAGES}>
                <Shuffle size={16} aria-hidden="true" />
                Load 100 more pages
              </Button>
            </div>
            <PageStrip pages={pages} revealed={shownRevealed} shown={shown} />
            <p className="flex flex-wrap gap-x-3 text-[0.74rem] text-ink-3">
              <span><span className="mr-1 inline-block size-2.5 rounded-[2px] bg-bad align-middle" />slow page</span>
              <span><span className="mr-1 inline-block size-2.5 rounded-[2px] bg-good/35 align-middle" />fast page</span>
            </p>
            <div className="flex flex-col gap-1.5 rounded-lg border border-line p-2.5">
              <p className="text-[0.8rem] text-ink-2">
                Page #{shown + 1}: {n} backend calls, <strong className={example.length ? "text-bad" : "text-good"}>{example.length} slow</strong>
                {example.length ? ", so the whole page waited." : ", so the page was fast."}
              </p>
              <BackendGrid n={n} slow={example} />
            </div>
          </div>
        </div>

        <StatGrid>
          <Stat label="Backends per page" value={n} />
          <Stat label="Pages that wait on a slow one" value={percent(p)} tone={p > 0.5 ? "bad" : p > 0.1 ? "warn" : "good"} />
          <Stat label="Each backend may be slow at most" value={`1 in ${formatInt(budget)}`} tone="violet" />
        </StatGrid>
        <p className="text-[0.8rem] text-ink-3">
          The last number is the budget that keeps 99% of page loads fast: 0.99<sup>1/{n}</sup> of calls must be fast. That is why big
          services chase p99.9 and p99.99, hedge slow requests, or cut the fan-out.
        </p>
      </div>
    </WidgetFrame>
  );
}

export default TailLatency satisfies ComponentType<InteractiveProps>;
