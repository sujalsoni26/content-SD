"use client";
import { useId, useState } from "react";
import { motion } from "motion/react";
import { Eye } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { ControlRow, WidgetFrame } from "@/components/ui/widget-frame";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { cn } from "@/lib/utils";
import {
  FIELDS,
  FIELD_HELP,
  PRESETS,
  estimate,
  fmtBytes,
  fmtSI,
  isPresetId,
  parseInputs,
  type Estimate,
  type FieldKey,
  type FieldSpec,
  type Inputs,
  type OutputRow,
  type PresetId,
} from "./_estimator-math";

type Choice = PresetId | "custom";

const CHOICES: ReadonlyArray<{ value: Choice; label: string }> = [
  { value: "url", label: PRESETS.url.label },
  { value: "drive", label: PRESETS.drive.label },
  { value: "chat", label: PRESETS.chat.label },
  { value: "custom", label: "Custom" },
];

const CUSTOM_ABOUT = "Custom: edit any field. Say every assumption out loud before you compute.";

function estimateFor(inputs: Inputs): Estimate | null {
  const { values } = parseInputs(inputs);
  return values ? estimate(values) : null;
}

function Field({ spec, value, invalid, onChange }: { spec: FieldSpec; value: string; invalid: boolean; onChange: (key: FieldKey, v: string) => void }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[0.8rem] font-bold leading-tight text-ink-2">
        {spec.label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(spec.key, e.target.value)}
        className={cn(
          "w-full rounded-lg border px-2.5 py-1.5 font-mono text-[0.9rem] tabular-nums text-ink",
          invalid ? "border-bad bg-bad-soft" : "border-line-strong bg-surface",
        )}
      />
      <span id={`${id}-hint`} className={cn("text-[0.72rem] leading-snug", invalid ? "text-bad" : "text-ink-3")}>
        {invalid ? FIELD_HELP[spec.kind] : spec.hint}
      </span>
    </div>
  );
}

function Output({ row, dominant, reduced }: { row: OutputRow; dominant: boolean; reduced: boolean }) {
  return (
    <li
      className={cn(
        "grid items-baseline gap-x-4 gap-y-0.5 border-b border-b-line py-2 pl-2 last:border-b-0 sm:grid-cols-[minmax(0,10rem)_minmax(0,9.5rem)_minmax(0,1fr)]",
        dominant ? "border-l-[3px] border-l-accent bg-accent-soft/50" : "border-l-[3px] border-l-transparent",
      )}
    >
      <span className="text-[0.84rem] font-bold text-ink-2">
        {row.label}
        {dominant ? <span className="sr-only"> (dominant number)</span> : null}
      </span>
      <motion.span
        key={row.value}
        initial={reduced ? false : { opacity: 0.2, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="font-display text-[1.05rem] font-bold tabular-nums text-ink"
      >
        {row.value}
        {row.sub ? <span className="ml-1.5 font-sans text-[0.76rem] font-normal text-ink-3">{row.sub}</span> : null}
      </motion.span>
      <span className="font-mono text-[0.76rem] text-ink-3 [overflow-wrap:anywhere]">{row.working}</span>
    </li>
  );
}

function Verdict({ est }: { est: Estimate }) {
  const v = est.verdict;
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={v.tone}>System shape</Chip>
        <strong className="font-display text-[1.05rem] text-ink">{v.shape}</strong>
      </div>
      <p className="text-[0.9rem] text-ink-2">{v.focus}</p>
      {v.dominant.length ? (
        <p className="text-[0.8rem] text-ink-3">Highlighted rows are the numbers that drive this design.</p>
      ) : null}
    </div>
  );
}

function Reveal({ onReveal }: { onReveal: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line-strong bg-surface-2 p-4">
      <p className="text-[0.9rem] text-ink-2">
        Work the drill on paper first: write QPS and its peak, total QPS, 30-day storage, ingress, egress and the system shape.
        Then check yourself.
      </p>
      <Button variant="primary" size="sm" onClick={onReveal}>
        <Eye aria-hidden="true" className="h-4 w-4" />
        Show the results
      </Button>
    </div>
  );
}

export default function Estimator({ variant }: InteractiveProps) {
  const start: PresetId = isPresetId(variant) ? variant : "url";
  const reduced = useReducedMotion();
  const [choice, setChoice] = useState<Choice>(start);
  const [inputs, setInputs] = useState<Inputs>(() => ({ ...PRESETS[start].inputs }));
  // Keep the last valid estimate on screen while a field is half-typed.
  const [shown, setShown] = useState<Estimate | null>(() => estimateFor(PRESETS[start].inputs));
  // The chat drill is a self-test: answers stay hidden until asked for.
  const [revealed, setRevealed] = useState(start !== "chat");

  const { invalid } = parseInputs(inputs);

  const load = (next: Inputs) => {
    setInputs(next);
    const e = estimateFor(next);
    if (e) setShown(e);
  };
  const choose = (c: Choice) => {
    setChoice(c);
    if (c !== "custom") load({ ...PRESETS[c].inputs });
    if (c !== "chat") setRevealed(true);
  };
  const edit = (key: FieldKey, v: string) => {
    setChoice("custom");
    setRevealed(true);
    load({ ...inputs, [key]: v });
  };

  const about = choice === "custom" ? CUSTOM_ABOUT : PRESETS[choice].about;
  const note =
    shown && revealed ? (
      <>
        <strong>{shown.verdict.shape}.</strong> Write QPS {fmtSI(shown.writeQps)}, read QPS {fmtSI(shown.readQps)}, storage{" "}
        {fmtBytes(shown.storage)}. {invalid.length ? "Fix the highlighted field to update the results." : "Change one assumption and watch which output moves most."}
      </>
    ) : null;

  return (
    <WidgetFrame
      kicker="Calculate"
      title="Back-of-the-envelope estimator"
      hint="Pick a preset or type your own assumptions (100M, 1B and 500KB all work). Every result shows its working."
      note={note}
    >
      <ControlRow>
        <SegmentedControl label="Preset" options={CHOICES} value={choice} onChange={choose} />
      </ControlRow>
      <p className="text-[0.88rem] text-ink-2">{about}</p>

      <fieldset className="grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
        <legend className="sr-only">Assumptions</legend>
        {FIELDS.map((f) => (
          <Field key={f.key} spec={f} value={inputs[f.key]} invalid={invalid.includes(f.key)} onChange={edit} />
        ))}
      </fieldset>

      {!revealed ? (
        <Reveal onReveal={() => setRevealed(true)} />
      ) : shown ? (
        <div className={cn("flex flex-col gap-3 transition-opacity duration-200", invalid.length > 0 && "opacity-60")}>
          <ul aria-label="Results with working" className="rounded-xl border border-line">
            {shown.rows.map((row) => (
              <Output key={row.id} row={row} dominant={shown.verdict.dominant.includes(row.id)} reduced={reduced} />
            ))}
          </ul>
          <Verdict est={shown} />
        </div>
      ) : (
        <p className="text-[0.9rem] text-bad">Check the highlighted fields to see results.</p>
      )}
    </WidgetFrame>
  );
}
