"use client";
import { useId, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { ControlRow, WidgetFrame } from "@/components/ui/widget-frame";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { cn } from "@/lib/utils";
import { fmtInt, sup } from "./_estimator-math";
import { ALPHABET, CAPACITY, MAX_ID, decode, divisionSteps, encode, lifetime, scrambledCode } from "./_base62-codec";

const STYLES = [
  { value: "plain", label: "Sequential" },
  { value: "scrambled", label: "Scrambled" },
] as const;
type CodeStyle = (typeof STYLES)[number]["value"];

const GROUPS = [
  { label: "0–9", from: 0, to: 9 },
  { label: "A–Z", from: 10, to: 35 },
  { label: "a–z", from: 36, to: 61 },
] as const;

/** URLs the lesson's own estimate needs (1B over 10 years), and the estimation lesson's 100M a day for 10 years. */
const TARGETS = [
  { label: "1B URLs", count: 1e9 },
  { label: "365B URLs", count: 365e9 },
] as const;

function parseId(text: string): number | null {
  const raw = text.replace(/[,\s_]/g, "");
  return /^\d{1,15}$/.test(raw) ? Number(raw) : null;
}

function codeError(text: string): string | null {
  const s = text.trim();
  if (!s) return "Type a code.";
  const n = decode(s);
  if (Number.isNaN(n)) return "Use only 0–9, A–Z and a–z.";
  if (!Number.isFinite(n)) return `Too large for this demo (IDs up to ${fmtInt(MAX_ID)}).`;
  return null;
}

/* ---------------- inputs ---------------- */

function TextField({
  label,
  value,
  error,
  onChange,
  inputMode,
  className,
}: {
  label: string;
  value: string;
  error: string | null;
  onChange: (v: string) => void;
  inputMode: "numeric" | "text";
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}>
      <label htmlFor={id} className="text-[0.8rem] font-bold text-ink-2">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn(
          "w-full rounded-lg border px-3 py-2 font-mono text-base tabular-nums text-ink",
          error ? "border-bad bg-bad-soft" : "border-line-strong bg-surface",
        )}
      />
      {error ? (
        <span id={`${id}-err`} className="text-[0.75rem] text-bad">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function ShortUrl({ code, reduced }: { code: string; reduced: boolean }) {
  return (
    <p className="font-mono text-lg text-ink-2 [overflow-wrap:anywhere]" aria-label={`Short URL sho.rt/${code}`}>
      sho.rt/
      <span className="font-bold text-accent" aria-hidden="true">
        {code.split("").map((ch, i) => (
          <motion.span
            key={`${code.length - i}-${ch}`}
            className="inline-block"
            initial={reduced ? false : { y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.22 }}
          >
            {ch}
          </motion.span>
        ))}
      </span>
    </p>
  );
}

/* ---------------- working ---------------- */

function DivisionTable({ n, reduced }: { n: number; reduced: boolean }) {
  const steps = divisionSteps(n);
  const code = encode(n);
  const th = "px-2 py-1.5 font-semibold";
  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[420px] border-collapse text-right font-mono text-[0.8rem] tabular-nums">
        <caption className="px-2 pt-2 text-left font-sans text-[0.84rem] font-bold text-ink-2">
          Encode: divide by 62 until nothing is left
        </caption>
        <thead className="text-[0.7rem] uppercase tracking-[0.05em] text-ink-3">
          <tr>
            <th scope="col" className={th}>
              Number
            </th>
            <th scope="col" className={th}>
              ÷ 62
            </th>
            <th scope="col" className={th}>
              Remainder
            </th>
            <th scope="col" className={cn(th, "text-center")}>
              Char
            </th>
            <th scope="col" className={th}>
              Worth
            </th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, i) => (
            <motion.tr
              key={`${n}-${i}`}
              className="border-t border-line text-ink-2"
              initial={reduced ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reduced ? 0 : i * 0.07, duration: 0.2 }}
            >
              <td className="px-2 py-1">{fmtInt(s.value)}</td>
              <td className="px-2 py-1">{fmtInt(s.quotient)}</td>
              <td className="px-2 py-1">{s.remainder}</td>
              <td className="px-2 py-1 text-center">
                <span className="rounded bg-accent-soft px-1.5 font-bold text-accent">{s.char}</span>
              </td>
              <td className="whitespace-nowrap px-2 py-1">
                {s.remainder} × 62{sup(i)} = {fmtInt(s.remainder * 62 ** i)}
              </td>
            </motion.tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-line-strong text-ink">
          <tr>
            <td colSpan={4} className="px-2 py-1.5 text-left font-sans text-[0.8rem]">
              Read the chars bottom-up: <strong className="font-mono text-accent">{code}</strong>
            </td>
            <td className="whitespace-nowrap px-2 py-1.5 font-bold">sum = {fmtInt(n)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function AlphabetStrip({ used }: { used: Set<string> }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[0.84rem] font-bold text-ink-2">The 62 characters (URL-safe: no ?, # or /)</p>
      {GROUPS.map((g) => (
        <div key={g.label} className="flex items-start gap-2">
          <span className="w-24 shrink-0 font-mono text-[0.72rem] text-ink-3">
            {g.label} = {g.from}–{g.to}
          </span>
          <span className="flex flex-wrap gap-0.5 font-mono text-[0.78rem]">
            {ALPHABET.slice(g.from, g.to + 1)
              .split("")
              .map((ch, k) => {
                const on = used.has(ch);
                return (
                  <span
                    key={ch}
                    title={`${ch} = ${g.from + k}`}
                    className={cn(
                      "inline-flex h-5 min-w-[1.1rem] items-center justify-center rounded px-0.5",
                      on ? "bg-accent font-bold text-accent-ink" : "text-ink-3",
                    )}
                  >
                    {ch}
                    {on ? <span className="sr-only"> is {g.from + k}</span> : null}
                  </span>
                );
              })}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- capacity ---------------- */

function CapacityTable({ codeLength }: { codeLength: number }) {
  const th = "px-2 py-1.5 font-semibold";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="max-w-full overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[460px] border-collapse text-left text-[0.82rem]">
          <caption className="px-2 pt-2 text-left text-[0.84rem] font-bold text-ink-2">How many codes does each length give?</caption>
          <thead className="text-[0.7rem] uppercase tracking-[0.05em] text-ink-3">
            <tr>
              <th scope="col" className={th}>
                Length
              </th>
              <th scope="col" className={cn(th, "text-right")}>
                Codes
              </th>
              {TARGETS.map((t) => (
                <th key={t.label} scope="col" className={th}>
                  {t.label}
                </th>
              ))}
              <th scope="col" className={cn(th, "text-right")}>
                At 100M a day
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {CAPACITY.map((row) => (
              <tr key={row.length} className={cn("border-t border-line", row.length === codeLength && "bg-accent-soft")}>
                <th scope="row" className="px-2 py-1.5 font-mono font-bold text-ink">
                  62{sup(row.length)}
                </th>
                <td className="px-2 py-1.5 text-right">
                  <span className="block font-mono text-ink">{fmtInt(row.codes)}</span>
                  <span className="block text-[0.72rem] text-ink-3">≈ {row.words}</span>
                </td>
                {TARGETS.map((t) => (
                  <td key={t.label} className="px-2 py-1.5">
                    {row.codes >= t.count ? <Chip tone="good">fits</Chip> : <Chip tone="bad">too few</Chip>}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-right text-ink-2">lasts {lifetime(row.daysAt100M)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[0.8rem] text-ink-3">
        1B URLs is this design’s 10-year estimate (6 characters). 365B is 100M new URLs a day for 10 years, which needs 7.
        {codeLength < 5 ? ` Your code has ${codeLength} characters: 62${sup(codeLength)} = ${fmtInt(62 ** codeLength)} codes.` : ""}
      </p>
    </div>
  );
}

/* ---------------- next IDs ---------------- */

function NextIds({ n, style, onStyle, reduced }: { n: number; style: CodeStyle; onStyle: (s: CodeStyle) => void; reduced: boolean }) {
  const ids = Array.from({ length: 4 }, (_, i) => n + i).filter((id) => id <= MAX_ID);
  return (
    <div className="flex flex-col gap-2">
      <ControlRow>
        <span className="text-[0.84rem] font-bold text-ink-2">The next IDs</span>
        <SegmentedControl label="Code style" size="sm" options={STYLES} value={style} onChange={onStyle} />
      </ControlRow>
      <ol className="grid gap-1 font-mono text-[0.84rem] min-[420px]:grid-cols-2">
        {ids.map((id) => (
          <li key={id} className="flex items-center gap-2 rounded-md bg-surface-2 px-2.5 py-1">
            <span className="tabular-nums text-ink-3">{fmtInt(id)}</span>
            <span aria-hidden="true" className="text-ink-3">
              →
            </span>
            <motion.code
              key={`${style}-${id}`}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-accent"
            >
              {style === "scrambled" ? scrambledCode(id) : encode(id)}
            </motion.code>
          </li>
        ))}
      </ol>
      <p className="text-[0.84rem] text-ink-2">
        {style === "scrambled" ? (
          <>
            <strong>Scrambled.</strong> Each ID first goes through a reversible permutation, (ID × a large prime + offset) mod 62⁷,
            then base 62. Codes stay unique but no longer reveal the next link.
          </>
        ) : (
          <>
            <strong>Sequential.</strong> Neighbouring IDs give neighbouring codes, so anyone can walk through every link. Fine
            unless that matters; if it does, scramble.
          </>
        )}
      </p>
    </div>
  );
}

export default function Base62() {
  const reduced = useReducedMotion();
  const [n, setN] = useState(1_000_000);
  const [idText, setIdText] = useState("1000000");
  const [codeText, setCodeText] = useState("4C92");
  const [style, setStyle] = useState<CodeStyle>("plain");

  const idError = parseId(idText) === null ? "Use a whole number of up to 15 digits." : null;
  const codeErr = codeError(codeText);
  const code = encode(n);

  const fromId = (text: string) => {
    setIdText(text);
    const v = parseId(text);
    if (v === null) return;
    setN(v);
    setCodeText(encode(v));
  };
  const fromCode = (text: string) => {
    setCodeText(text);
    if (codeError(text)) return;
    const v = decode(text.trim());
    setN(v);
    setIdText(String(v));
  };
  const next = () => {
    if (n >= MAX_ID) return;
    const v = n + 1;
    setN(v);
    setIdText(String(v));
    setCodeText(encode(v));
  };

  return (
    <WidgetFrame
      title="Counter + base 62"
      hint="Each new URL takes the next number from a counter; base 62 (0–9, A–Z, a–z) turns it into a short code. Type in either box."
      note={
        <>
          <strong>
            {fmtInt(n)} → {code}
          </strong>
          : {code.length} base-62 {code.length === 1 ? "character" : "characters"}. Each character holds one of 62 values, so every
          extra character multiplies the space by 62.
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <TextField label="Counter value (ID)" value={idText} error={idError} onChange={fromId} inputMode="numeric" className="basis-44" />
          <ArrowLeftRight aria-hidden="true" className="mt-9 hidden h-5 w-5 shrink-0 text-ink-3 min-[420px]:block" />
          <TextField label="Short code" value={codeText} error={codeErr} onChange={fromCode} inputMode="text" className="basis-32" />
        </div>
        <ControlRow>
          <ShortUrl code={code} reduced={reduced} />
          <Button size="sm" variant="secondary" onClick={next} disabled={n >= MAX_ID}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Next ID (INCR)
          </Button>
        </ControlRow>
        <DivisionTable n={n} reduced={reduced} />
        <AlphabetStrip used={new Set(code.split(""))} />
        <CapacityTable codeLength={code.length} />
        <NextIds n={n} style={style} onStyle={setStyle} reduced={reduced} />
      </div>
    </WidgetFrame>
  );
}
