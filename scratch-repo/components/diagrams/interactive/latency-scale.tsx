"use client";

import { useState, type ComponentType } from "react";
import { motion } from "motion/react";
import type { InteractiveProps } from "../interactive-registry";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ControlRow, WidgetFrame } from "@/components/ui/widget-frame";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { cn } from "@/lib/utils";
import { formatInt } from "./_wa-shared";

/* ------------------------------------------------------------------ data
   Peter Norvig's list, popularised by Jeff Dean. Exact values drift with hardware; the ratios drive design. */

interface Op {
  name: string;
  seconds: number;
  /** One of the four to memorise. */
  key?: boolean;
}

const OPS: readonly Op[] = [
  { name: "L1 cache reference", seconds: 0.5e-9 },
  { name: "Branch mispredict", seconds: 5e-9 },
  { name: "L2 cache reference", seconds: 7e-9 },
  { name: "Mutex lock/unlock", seconds: 25e-9 },
  { name: "Main memory (RAM) reference", seconds: 100e-9, key: true },
  { name: "Compress 1 KB", seconds: 3e-6 },
  { name: "Send 2 KB over 1 Gbps", seconds: 20e-6 },
  { name: "SSD random read (4 KB)", seconds: 150e-6, key: true },
  { name: "Read 1 MB sequentially from RAM", seconds: 250e-6 },
  { name: "Round trip within a data center", seconds: 0.5e-3, key: true },
  { name: "Read 1 MB sequentially from SSD", seconds: 1e-3 },
  { name: "Disk seek", seconds: 10e-3 },
  { name: "Read 1 MB sequentially from disk", seconds: 20e-3 },
  { name: "Round trip across continents", seconds: 150e-3, key: true },
];

const PRESETS: readonly { label: string; a: number; b: number; lesson: string }[] = [
  { label: "RAM vs SSD read", a: 4, b: 7, lesson: "That gap is why hot data is cached in RAM." },
  { label: "Data center vs continent", a: 9, b: 13, lesson: "One cross-region call eats most of a 200 ms budget, hence CDNs and geo-replication." },
  { label: "Disk seek vs 1 MB read", a: 11, b: 12, lesson: "One seek costs half a sequential megabyte, so sequential I/O wins: append-only logs, LSM trees." },
  { label: "Compress vs send", a: 5, b: 6, lesson: "Compress before sending over the network." },
];

/* ------------------------------------------------------------------ scale + formatting */

const LO = -9.6; // log10 of the left edge (≈0.25 ns)
const HI = 0.15; // log10 of the right edge (≈1.4 s)
const pos = (seconds: number) => ((Math.log10(seconds) - LO) / (HI - LO)) * 100;

const DECADES = Array.from({ length: 10 }, (_, i) => 10 ** (i - 9)); // 1 ns … 1 s
const MAJOR = [
  { at: 1e-9, real: "1 ns", human: "1 s" },
  { at: 1e-6, real: "1 µs", human: "16.7 min" },
  { at: 1e-3, real: "1 ms", human: "11.6 days" },
  { at: 1, real: "1 s", human: "31.7 years" },
];

function realTime(v: number): string {
  if (v < 1e-6) return `${+(v * 1e9).toPrecision(3)} ns`;
  if (v < 4e-4) return `${+(v * 1e6).toPrecision(3)} µs`;
  return `${+(v * 1e3).toPrecision(3)} ms`;
}

/** Duration in seconds as a human phrase. */
function humanDuration(sec: number): string {
  const one = (n: number) => (n < 10 ? n.toFixed(1) : formatInt(n));
  if (sec < 120) return `${one(sec)} s`;
  if (sec < 7200) return `${(sec / 60).toFixed(sec < 600 ? 1 : 0)} min`;
  if (sec < 86400) return `${(sec / 3600).toFixed(1)} hours`;
  if (sec < 86400 * 60) return `${(sec / 86400).toFixed(1)} days`;
  if (sec < 86400 * 365 * 2) return `${(sec / (86400 * 30.4)).toFixed(1)} months`;
  return `${(sec / (86400 * 365)).toFixed(1)} years`;
}

/** Human scale: stretch time so 1 ns becomes 1 s. */
const human = (v: number) => humanDuration(v * 1e9);

function ratioText(r: number): string {
  if (r >= 100) return formatInt(r);
  return r.toFixed(r < 10 ? 1 : 0);
}

type Units = "real" | "human";

/* ------------------------------------------------------------------ pieces */

function Gridlines() {
  return (
    <>
      {DECADES.map((d) => {
        const major = MAJOR.some((m) => m.at === d);
        return (
          <span
            key={d}
            aria-hidden="true"
            className={cn("absolute inset-y-0 w-px", major ? "bg-line-strong" : "bg-line")}
            style={{ left: `${pos(d)}%` }}
          />
        );
      })}
    </>
  );
}

interface RowProps {
  op: Op;
  units: Units;
  pick: "A" | "B" | null;
  onPick: () => void;
}

function OpRow({ op, units, pick, onPick }: RowProps) {
  const p = pos(op.seconds);
  const value = units === "real" ? realTime(op.seconds) : human(op.seconds);
  return (
    <li>
      <button
        type="button"
        aria-pressed={pick !== null}
        onClick={onPick}
        className={cn(
          "grid w-full grid-cols-1 gap-x-3 gap-y-1 rounded-lg border-l-[3px] px-2 py-1.5 text-left transition-colors duration-150 @xl:grid-cols-[minmax(0,14.5rem)_minmax(0,1fr)] @xl:items-center",
          op.key ? "border-amber" : "border-transparent",
          pick === "A" ? "bg-accent-soft" : pick === "B" ? "bg-violet-soft" : "hover:bg-surface-2",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5 text-[0.86rem] leading-snug">
          {pick ? (
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.68rem] font-bold text-accent-ink",
                pick === "A" ? "bg-accent" : "bg-violet",
              )}
            >
              {pick}
            </span>
          ) : null}
          <span className={cn("min-w-0", op.key ? "font-bold text-ink" : "text-ink-2")}>{op.name}</span>
          {op.key ? <Chip tone="amber" className="ml-auto @xl:ml-0">memorise</Chip> : null}
        </span>
        <span className="relative block h-6" aria-hidden="true">
          <Gridlines />
          <span
            className={cn(
              "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface",
              op.key ? "bg-amber" : "bg-accent",
            )}
            style={{ left: `${p}%` }}
          />
          <span
            className={cn(
              "absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[0.74rem] tabular-nums text-ink",
              p > 62 ? "-translate-x-full pr-3" : "pl-3",
            )}
            style={{ left: `${p}%` }}
          >
            {value}
          </span>
        </span>
        <span className="sr-only">{value}</span>
      </button>
    </li>
  );
}

function Axis({ units }: { units: Units }) {
  return (
    <div className="grid grid-cols-1 gap-x-3 px-2 @xl:grid-cols-[minmax(0,14.5rem)_minmax(0,1fr)]" aria-hidden="true">
      <span className="hidden text-right font-mono text-[0.68rem] text-ink-3 @xl:block">{units === "real" ? "real time" : "1 ns = 1 s"}</span>
      <span className="relative block h-5 font-mono text-[0.68rem] text-ink-3">
        {MAJOR.map((m, i) => (
          <span
            key={m.real}
            className={cn("absolute whitespace-nowrap", i === MAJOR.length - 1 ? "-translate-x-full" : i === 0 ? "" : "-translate-x-1/2")}
            style={{ left: `${pos(m.at)}%` }}
          >
            {units === "real" ? m.real : m.human}
          </span>
        ))}
      </span>
    </div>
  );
}

function Comparison({ a, b, units, reduced }: { a: Op; b: Op; units: Units; reduced: boolean }) {
  const [fast, slow] = a.seconds <= b.seconds ? [a, b] : [b, a];
  const left = pos(fast.seconds);
  const width = pos(slow.seconds) - left;
  const ratio = slow.seconds / fast.seconds;
  const fmt = units === "real" ? realTime : human;
  const transition = { duration: reduced ? 0 : 0.45, ease: [0.2, 0.8, 0.2, 1] as const };
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-display text-2xl font-bold tabular-nums text-accent">≈{ratioText(ratio)}×</span>
        <span className="text-[0.88rem] text-ink-2">slower, from one to the other</span>
      </div>
      <div className="relative h-7 rounded-md bg-surface" aria-hidden="true">
        <Gridlines />
        <motion.span
          className="absolute inset-y-1 rounded bg-accent-soft outline outline-1 outline-accent"
          initial={false}
          animate={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
          transition={transition}
        />
        {[
          { op: a, tone: "bg-accent" },
          { op: b, tone: "bg-violet" },
        ].map(({ op, tone }) => (
          <motion.span
            key={tone}
            className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface", tone)}
            initial={false}
            animate={{ left: `${pos(op.seconds)}%` }}
            transition={transition}
          />
        ))}
      </div>
      <dl className="grid gap-1 text-[0.8rem] sm:grid-cols-2">
        {[
          { op: a, label: "A", tone: "bg-accent" },
          { op: b, label: "B", tone: "bg-violet" },
        ].map(({ op, label, tone }) => (
          <div key={label} className="flex min-w-0 items-center gap-1.5">
            <dt className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.68rem] font-bold text-accent-ink", tone)}>
              {label}
            </dt>
            <dd className="min-w-0 text-ink-2">
              {op.name} · <span className="font-mono tabular-nums text-ink">{fmt(op.seconds)}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="font-mono text-[0.74rem] tabular-nums text-ink-3">
        {Math.log10(ratio).toFixed(1)} orders of magnitude apart (each faint gridline is one)
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ widget */

const UNIT_OPTIONS = [
  { value: "real", label: "Real time" },
  { value: "human", label: "Human scale: 1 ns = 1 s" },
] as const;

const FILTER_OPTIONS = [
  { value: "all", label: `All ${OPS.length}` },
  { value: "key", label: "The 4 to memorise" },
] as const;

function LatencyScale() {
  const reduced = useReducedMotion();
  const [units, setUnits] = useState<Units>("real");
  const [filter, setFilter] = useState<"all" | "key">("all");
  const [[a, b], setPair] = useState<[number, number]>([4, 7]);

  const pick = (i: number) => {
    if (i === a || i === b) return;
    setPair([b, i]);
  };

  const opA = OPS[a];
  const opB = OPS[b];
  const [fast, slow] = opA.seconds <= opB.seconds ? [opA, opB] : [opB, opA];
  const ratio = slow.seconds / fast.seconds;
  const preset = PRESETS.find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));
  const fmt = units === "real" ? realTime : human;
  const note =
    `${slow.name}: ${fmt(slow.seconds)}. ${fast.name}: ${fmt(fast.seconds)}. That is about ${ratioText(ratio)}× slower.` +
    (units === "human" ? " (Stretched so 1 ns lasts 1 s.)" : "") +
    (preset ? ` ${preset.lesson}` : "");

  const visible = OPS.map((op, i) => ({ op, i })).filter(({ op }) => filter === "all" || op.key);

  return (
    <WidgetFrame
      kicker="Explore"
      title="Latency numbers, to scale"
      hint="Log scale: each faint gridline is 10× the last, each labelled one 1,000×. Click any two rows to compare them."
      note={note}
    >
      <ControlRow>
        <SegmentedControl label="Units" size="sm" options={UNIT_OPTIONS} value={units} onChange={setUnits} />
        <SegmentedControl label="Rows" size="sm" options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </ControlRow>

      <Comparison a={opA} b={opB} units={units} reduced={reduced} />

      <ControlRow className="gap-x-2">
        <span className="text-[0.82rem] font-bold text-ink-2">Classic gaps:</span>
        {PRESETS.map((p) => (
          <Button key={p.label} size="sm" variant={preset === p ? "primary" : "secondary"} onClick={() => setPair([p.a, p.b])} aria-pressed={preset === p}>
            {p.label}
          </Button>
        ))}
      </ControlRow>

      <div className="@container flex flex-col gap-1">
        <ol className="flex flex-col gap-0.5" aria-label="Operations, fastest first">
          {visible.map(({ op, i }) => (
            <OpRow key={op.name} op={op} units={units} pick={i === a ? "A" : i === b ? "B" : null} onPick={() => pick(i)} />
          ))}
        </ol>
        <Axis units={units} />
      </div>
    </WidgetFrame>
  );
}

export default LatencyScale satisfies ComponentType<InteractiveProps>;
