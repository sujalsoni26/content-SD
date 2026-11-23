"use client";

import { useId, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Plus, X } from "lucide-react";
import type { ComponentType } from "react";
import type { InteractiveProps } from "../interactive-registry";
import { WidgetFrame, ControlRow } from "@/components/ui/widget-frame";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */

const SECONDS = { year: 8760 * 3600, month: 730 * 3600, week: 168 * 3600, day: 86400 } as const; // 365-day year, month = year / 12
const DAYS_PER_YEAR = 365;
const MINUTES_PER_WEEK = 10080;

interface Level {
  pct: number;
  label: string;
  name: string;
  feel: string;
  context: string;
}

const LEVELS: readonly Level[] = [
  {
    pct: 99,
    label: "99%",
    name: "two nines",
    feel: "a long weekend offline every year",
    context: "Fine for an internal tool, painful for anything customers pay for.",
  },
  {
    pct: 99.9,
    label: "99.9%",
    name: "three nines",
    feel: "a full working day offline every year",
    context: "Most cloud service SLAs sit between 99.9% and 99.99%.",
  },
  {
    pct: 99.99,
    label: "99.99%",
    name: "four nines",
    feel: "one lunch break a year",
    context: "Payments and critical gateways aim here or higher. No more maintenance windows.",
  },
  {
    pct: 99.999,
    label: "99.999%",
    name: "five nines",
    feel: "about one coffee refill a year",
    context: "Even the biggest clouds rarely promise this. It needs multi-region failover that runs itself.",
  },
];

/** Round to `digits` significant figures and print without trailing zeros. */
function sig(n: number, digits = 3): string {
  return Number(n.toPrecision(digits)).toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0 s";
  if (seconds >= 2 * 86400) return `${sig(seconds / 86400)} days`;
  if (seconds >= 3600) return `${sig(seconds / 3600)} hours`;
  if (seconds >= 60) return `${sig(seconds / 60)} min`;
  return `${sig(seconds)} s`;
}

/** 0.998001 → "99.8001%" (up to 6 decimals, trailing zeros trimmed). */
function formatPct(fraction: number): string {
  if (fraction >= 1) return "100%";
  const s = (fraction * 100).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  return `${s}%`;
}

/** A fraction as a short decimal: 0.0010000000000000009 → "0.001". */
function formatFraction(x: number): string {
  return String(Number(x.toPrecision(10)));
}

/* ------------------------------------------------------------------ */
/* Part 1: the nines table                                             */
/* ------------------------------------------------------------------ */

const LOG_MAX = Math.log10(MINUTES_PER_WEEK);
const TICKS = [
  { label: "1 min", at: 0 },
  { label: "1 h", at: Math.log10(60) / LOG_MAX },
  { label: "1 day", at: Math.log10(1440) / LOG_MAX },
  { label: "1 wk", at: 1 },
];

function barWidth(level: Level): number {
  const minutes = (1 - level.pct / 100) * (SECONDS.year / 60);
  return Math.min(100, Math.max(2, (Math.log10(Math.max(1, minutes)) / LOG_MAX) * 100));
}

function NinesChart({ selected, onSelect, reduced }: { selected: number; onSelect: (i: number) => void; reduced: boolean }) {
  const highlightId = useId();
  return (
    <div role="group" aria-label="Availability targets" className="flex flex-col gap-1.5">
      <div aria-hidden="true" className="grid grid-cols-[4.6rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[5rem_minmax(0,1fr)_6.5rem]">
        <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-ink-3">target</span>
        <span className="relative h-4 font-mono text-[0.66rem] text-ink-3">
          {TICKS.map((t) => (
            <span
              key={t.label}
              className="absolute top-0 whitespace-nowrap"
              style={{ left: `${t.at * 100}%`, transform: t.at === 1 ? "translateX(-100%)" : t.at === 0 ? undefined : "translateX(-50%)" }}
            >
              {t.label}
            </span>
          ))}
        </span>
      </div>
      {LEVELS.map((level, i) => {
        const active = i === selected;
        const perYear = (1 - level.pct / 100) * SECONDS.year;
        return (
          <button
            key={level.label}
            type="button"
            aria-pressed={active}
            aria-label={`${level.label}, ${level.name}: ${formatDuration(perYear)} of downtime a year`}
            onClick={() => onSelect(i)}
            className="relative grid grid-cols-[4.6rem_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 rounded-lg px-2 py-1.5 text-left sm:grid-cols-[5rem_minmax(0,1fr)_6.5rem]"
          >
            {active ? (
              <motion.span
                layoutId={highlightId}
                aria-hidden="true"
                className="absolute inset-0 rounded-lg border border-accent bg-accent-soft"
                transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className={cn("relative font-mono text-[0.85rem] font-bold tabular-nums", active ? "text-accent" : "text-ink")}>
              {level.label}
            </span>
            <span className="relative h-3 overflow-hidden rounded-full bg-surface-3">
              <span
                className={cn("block h-full rounded-full", active ? "bg-bad" : "bg-ink-3")}
                style={{ width: `${barWidth(level)}%` }}
              />
            </span>
            <span className="relative col-start-2 font-mono text-[0.78rem] tabular-nums text-ink-2 sm:col-start-3 sm:text-right">
              {formatDuration(perYear)}/yr
            </span>
          </button>
        );
      })}
      <p className="text-[0.78rem] text-ink-3">Bars use a log scale: each step left is 10× less downtime.</p>
    </div>
  );
}

/** A year as 365 day-cells; red is the downtime budget. Makes "3.65 days" vs "52 minutes" tangible. */
function YearStrip({ level }: { level: Level }) {
  const downDays = (1 - level.pct / 100) * DAYS_PER_YEAR;
  const full = Math.floor(downDays + 1e-9);
  const partial = downDays - full;
  return (
    <figure className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={`One year as 365 day squares. ${sig(downDays)} days of downtime are shaded.`}
        className="grid grid-cols-[repeat(auto-fill,minmax(7px,1fr))] gap-[2px]"
      >
        {Array.from({ length: DAYS_PER_YEAR }, (_, d) => {
          const fill = d < full ? 1 : d === full ? partial : 0;
          return (
            <span key={d} className="relative aspect-square overflow-hidden rounded-[2px] bg-surface-3">
              {fill > 0 ? (
                <span
                  className="absolute inset-y-0 left-0 bg-bad transition-[width] duration-500"
                  style={{ width: fill >= 1 ? "100%" : `max(1px, ${(fill * 100).toFixed(2)}%)` }}
                />
              ) : null}
            </span>
          );
        })}
      </div>
      <figcaption className="text-[0.78rem] text-ink-3">
        One year, one square per day. Red is the downtime {level.label} allows: {sig(downDays)} days
        {downDays < 1 ? ` (${sig(downDays * 100)}% of the first square${downDays < 0.05 ? ", drawn at least 1 px wide" : ""})` : ""}.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Part 2: dependencies multiply                                       */
/* ------------------------------------------------------------------ */

type Arrangement = "series" | "parallel";
interface Service {
  id: number;
  name: string;
  value: string;
}

const NAMES = ["A", "B", "C", "D"];
const MAX_SERVICES = 4;

function parseAvailability(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 50 || n > 100) return null;
  return n / 100;
}

function ServiceBox({
  service,
  onChange,
  onRemove,
}: {
  service: Service;
  onChange: (value: string) => void;
  onRemove?: () => void;
}) {
  const id = useId();
  const invalid = parseAvailability(service.value) === null;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border bg-accent-soft px-2 py-1.5",
        invalid ? "border-bad" : "border-accent",
      )}
    >
      <label htmlFor={id} className="font-display text-sm font-bold text-accent">
        {service.name}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={50}
        max={100}
        step={0.01}
        value={service.value}
        aria-invalid={invalid}
        aria-label={`Service ${service.name} availability, percent`}
        onChange={(e) => onChange(e.target.value)}
        className="w-[5.6rem] rounded-md border border-line-strong bg-surface px-1.5 py-0.5 font-mono text-[0.85rem] tabular-nums text-ink"
      />
      <span className="text-[0.8rem] text-ink-2">%</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove service ${service.name}`}
          className="rounded-md p-0.5 text-ink-3 hover:bg-surface hover:text-bad"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function CallerBox() {
  return (
    <div className="rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 font-display text-sm font-bold text-ink">Caller</div>
  );
}

function Combiner() {
  const [arrangement, setArrangement] = useState<Arrangement>("series");
  const [services, setServices] = useState<Service[]>([
    { id: 0, name: "A", value: "99.9" },
    { id: 1, name: "B", value: "99.9" },
  ]);

  const values = services.map((s) => parseAvailability(s.value));
  const valid = values.every((v): v is number => v !== null);
  const nums = valid ? (values as number[]) : [];

  const combined = !valid
    ? null
    : arrangement === "series"
      ? nums.reduce((acc, a) => acc * a, 1)
      : 1 - nums.reduce((acc, a) => acc * (1 - a), 1);
  const formula = !valid
    ? ""
    : arrangement === "series"
      ? `${nums.map(formatFraction).join(" × ")} = ${formatFraction(combined ?? 0)}`
      : `1 − (${nums.map((a) => formatFraction(1 - a)).join(" × ")}) = ${formatFraction(combined ?? 0)}`;
  const nines = combined !== null && combined < 1 ? -Math.log10(1 - combined) : null;
  const weakest = valid ? Math.min(...nums) : null;
  const strongest = valid ? Math.max(...nums) : null;

  const update = (id: number, value: string) => setServices((list) => list.map((s) => (s.id === id ? { ...s, value } : s)));
  const add = () =>
    setServices((list) => {
      if (list.length >= MAX_SERVICES) return list;
      const used = new Set(list.map((s) => s.name));
      const name = NAMES.find((n) => !used.has(n)) ?? "?";
      const id = Math.max(...list.map((s) => s.id)) + 1;
      return [...list, { id, name, value: "99.9" }];
    });
  const remove = (id: number) => setServices((list) => (list.length <= 2 ? list : list.filter((s) => s.id !== id)));

  const boxes = services.map((s) => (
    <ServiceBox
      key={s.id}
      service={s}
      onChange={(v) => update(s.id, v)}
      onRemove={services.length > 2 ? () => remove(s.id) : undefined}
    />
  ));

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <div className="flex flex-col gap-0.5">
        <p className="font-display font-bold text-ink">Dependencies multiply</p>
        <p className="text-[0.88rem] text-ink-2">
          Type each service&apos;s availability. In series every one must be up; in parallel any one is enough.
        </p>
      </div>
      <ControlRow>
        <SegmentedControl
          label="Arrangement"
          size="sm"
          value={arrangement}
          onChange={setArrangement}
          options={[
            { value: "series", label: "In series" },
            { value: "parallel", label: "In parallel (redundant)" },
          ]}
        />
        <Button size="sm" variant="ghost" onClick={add} disabled={services.length >= MAX_SERVICES}>
          <Plus size={14} aria-hidden="true" /> Add service
        </Button>
      </ControlRow>

      <div className="rounded-lg border border-dashed border-line-strong bg-surface-2 p-3">
        {arrangement === "series" ? (
          <div className="flex flex-wrap items-center gap-2">
            <CallerBox />
            {boxes.map((box, i) => (
              <div key={services[i].id} className="flex items-center gap-2">
                <ArrowRight size={16} aria-hidden="true" className="text-ink-3" />
                {box}
              </div>
            ))}
            <span className="basis-full text-[0.78rem] text-ink-3">Every one must be up for the request to succeed.</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <CallerBox />
            <ArrowRight size={16} aria-hidden="true" className="text-ink-3" />
            <div className="flex flex-col gap-1.5 border-l-2 border-accent pl-2">{boxes}</div>
            <span className="basis-full text-[0.78rem] text-ink-3">
              Any one copy is enough, so all of them have to fail at the same time.
            </span>
          </div>
        )}
      </div>

      <div aria-live="polite" className="flex flex-col gap-1 rounded-lg border border-line bg-surface px-3 py-2.5">
        {combined === null ? (
          <p className="text-[0.9rem] text-bad">Enter an availability between 50 and 100 for every service.</p>
        ) : (
          <>
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span
                className={cn(
                  "font-display text-2xl font-bold tabular-nums",
                  arrangement === "series" ? "text-warn" : "text-good",
                )}
              >
                {formatPct(combined)}
              </span>
              <code className="font-mono text-[0.8rem] text-ink-2 [overflow-wrap:anywhere]">{formula}</code>
            </p>
            <p className="text-[0.88rem] text-ink-2">
              ≈ {formatDuration((1 - combined) * SECONDS.year)} of downtime a year
              {nines !== null ? ` (${sig(nines, 2)} nines)` : ""}.{" "}
              {arrangement === "series"
                ? `Lower than the weakest link alone (${formatPct(weakest ?? 0)}): every dependency in the chain subtracts.`
                : `Higher than the best copy alone (${formatPct(strongest ?? 0)}). Assumes failures are independent and failover is instant; real redundancy delivers a bit less.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

function Nines() {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(1);
  const level = LEVELS[selected];
  const down = 1 - level.pct / 100;
  const prev = selected > 0 ? LEVELS[selected - 1] : null;

  const note = (
    <>
      <strong>
        {level.label} ({level.name})
      </strong>{" "}
      allows about {formatDuration(down * SECONDS.year)} of downtime a year, roughly {level.feel}.{" "}
      {prev ? `That is 10× less than ${prev.label}. ` : ""}
      {level.context}
    </>
  );

  return (
    <WidgetFrame
      kicker="Calculate"
      title="How much downtime does each nine allow?"
      hint="Pick a target. Each extra nine cuts the allowed downtime 10×. Then combine services below."
      note={note}
    >
      <NinesChart selected={selected} onSelect={setSelected} reduced={reduced} />
      <StatGrid>
        <Stat label="Per year" value={formatDuration(down * SECONDS.year)} tone="bad" />
        <Stat label="Per month" value={formatDuration(down * SECONDS.month)} />
        <Stat label="Per week" value={formatDuration(down * SECONDS.week)} />
        <Stat label="Per day" value={formatDuration(down * SECONDS.day)} />
      </StatGrid>
      <YearStrip level={level} />
      <Combiner />
    </WidgetFrame>
  );
}

export default Nines satisfies ComponentType<InteractiveProps>;
