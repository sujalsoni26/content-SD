"use client";

import { useRef, useState, type ComponentType } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat, StatGrid } from "@/components/ui/stat";
import { ControlRow, WidgetFrame, WidgetScroll } from "@/components/ui/widget-frame";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { clamp, cn } from "@/lib/utils";
import { useLoopGate, useStepPlayer } from "./_wa-shared";

/* ------------------------------------------------------------------ model */

type Actor = "client" | "dns" | "server";
type Row = "DNS" | "TCP" | "TLS" | "Request" | "Server" | "Response";
type Scenario = "cold" | "dns-cached" | "reused";

interface Step {
  from: Actor;
  /** Same as `from` for work done on one machine. */
  to: Actor;
  label: string;
  /** Milliseconds this step adds (40 ms client-server round trip, 20 ms to the DNS resolver and back). */
  ms: number;
  row: Row;
  note: string;
}

const STEPS: readonly Step[] = [
  { from: "client", to: "dns", label: "api.example.com?", ms: 10, row: "DNS",
    note: "The client asks DNS for the server's IP address. Nothing can be sent until it knows where to send it." },
  { from: "dns", to: "client", label: "203.0.113.10", ms: 10, row: "DNS",
    note: "DNS answers with the IP. The client caches it for the record's TTL, so the next request skips this step." },
  { from: "client", to: "server", label: "SYN", ms: 20, row: "TCP",
    note: "TCP handshake, step 1: \"Can we talk?\" A reliable connection costs a round trip before any data moves." },
  { from: "server", to: "client", label: "SYN-ACK", ms: 20, row: "TCP",
    note: "Step 2: the server agrees and acknowledges. One full round trip (40 ms) has passed." },
  { from: "client", to: "server", label: "ACK", ms: 0, row: "TCP",
    note: "Step 3: the client confirms. The ACK rides along with the next packet, so it adds no extra wait." },
  { from: "client", to: "server", label: "TLS ClientHello", ms: 20, row: "TLS",
    note: "TLS starts: the client lists the ciphers it supports and sends its half of the key exchange." },
  { from: "server", to: "client", label: "ServerHello + certificate", ms: 20, row: "TLS",
    note: "The server picks a cipher and sends its certificate, proving it really is api.example.com. Both sides can now derive the same secret keys." },
  { from: "client", to: "server", label: "Finished", ms: 0, row: "TLS",
    note: "Handshake done. TLS 1.3 needs one round trip (TLS 1.2 needed two). Everything from here on is encrypted." },
  { from: "client", to: "server", label: "GET /feed", ms: 20, row: "Request",
    note: "Now the real HTTP request: method, path and headers, including the Authorization token." },
  { from: "server", to: "server", label: "auth · DB query · JSON", ms: 30, row: "Server",
    note: "The server checks the token, queries the database and builds the JSON. At scale, this is usually where the time goes." },
  { from: "server", to: "client", label: "200 OK + JSON", ms: 20, row: "Response",
    note: "The response arrives: status 200, headers and the JSON body. The connection stays open, so the next request can skip DNS, TCP and TLS." },
];

const SKIPPED: Record<Scenario, ReadonlySet<Row>> = {
  cold: new Set(),
  "dns-cached": new Set<Row>(["DNS"]),
  reused: new Set<Row>(["DNS", "TCP", "TLS"]),
};

const SCENARIOS = [
  { value: "cold", label: "Cold start" },
  { value: "dns-cached", label: "DNS cached" },
  { value: "reused", label: "Reused connection" },
] as const;

const FIRST_STEP_NOTE: Record<Scenario, string> = {
  cold: STEPS[0].note,
  "dns-cached": "The IP is already in the DNS cache, so the client skips the lookup and opens a TCP connection straight away: SYN, \"can we talk?\"",
  reused: "The TCP + TLS connection from the previous request is still open (HTTP keep-alive), so GET /feed leaves at once: no DNS lookup and no handshakes.",
};

const ROW_ORDER: readonly Row[] = ["DNS", "TCP", "TLS", "Request", "Server", "Response"];
const SETUP_ROWS: ReadonlySet<Row> = new Set<Row>(["DNS", "TCP", "TLS"]);
const ROW_META: Record<Row, { label: string; bar: string }> = {
  DNS: { label: "DNS lookup", bar: "bg-violet" },
  TCP: { label: "TCP handshake", bar: "bg-amber" },
  TLS: { label: "TLS handshake", bar: "bg-good" },
  Request: { label: "Request", bar: "bg-accent" },
  Server: { label: "Server work", bar: "bg-ink-3" },
  Response: { label: "Response", bar: "bg-accent" },
};

/** Every scenario is drawn on the cold-start scale so the savings are visible. */
const SCALE_MS = STEPS.reduce((sum, s) => sum + s.ms, 0);
const HOLD_MS = 650;
/** With reduced motion nothing travels, so each step simply stays up long enough to read. */
const REDUCED_HOLD_MS = 1400;
const travelSeconds = (ms: number) => 0.32 + ms * 0.0125;

function stepsFor(scenario: Scenario): Step[] {
  return STEPS.filter((s) => !SKIPPED[scenario].has(s.row));
}

/** Start and end time (ms) of each step. */
function timeline(steps: readonly Step[]): { start: number; end: number }[] {
  let t = 0;
  return steps.map((s) => {
    const start = t;
    t += s.ms;
    return { start, end: t };
  });
}

const sumMs = (steps: readonly Step[]) => steps.reduce((sum, s) => sum + s.ms, 0);
const pct = (ms: number) => `${(ms / SCALE_MS) * 100}%`;

/* ------------------------------------------------------------------ sequence diagram */

const X: Record<Actor, number> = { client: 52, dns: 180, server: 308 };
const ACTORS: readonly { id: Actor; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "dns", label: "DNS resolver" },
  { id: "server", label: "Server" },
];
const TOP = 62;
const ROW_H = 30;

type StepState = "done" | "current" | "future";

function StepArrow({ step, y, state }: { step: Step; y: number; state: StepState }) {
  const current = state === "current";
  const labelClass = cn("dg-label", current && "fill-accent font-bold");
  if (step.from === step.to) {
    return (
      <g className={cn("transition-opacity duration-300", state === "future" && "opacity-25")}>
        <rect x={X.server - 6} y={y - 12} width={12} height={24} rx={3} className={cn("dg-box", current && "dg-box--accent")} />
        <text x={X.server - 14} y={y + 4} textAnchor="end" className={labelClass}>
          {step.label} · {step.ms} ms
        </text>
      </g>
    );
  }
  const dir = X[step.to] > X[step.from] ? 1 : -1;
  return (
    <g className={cn("transition-opacity duration-300", state === "future" && "opacity-25")}>
      <path
        d={`M${X[step.from] + dir * 4} ${y} H${X[step.to] - dir * 7}`}
        className={cn("dg-line", current && "dg-line--accent")}
        markerEnd={current ? "url(#ah-accent)" : "url(#ah)"}
      />
      <text x={(X[step.from] + X[step.to]) / 2} y={y - 7} textAnchor="middle" className={labelClass}>
        {step.label}
      </text>
    </g>
  );
}

/** The dot that carries the current message (or the server's work bar filling up). */
function Packet({ step, y, travel }: { step: Step; y: number; travel: number }) {
  if (step.from === step.to) {
    return (
      <motion.rect
        x={X.server - 6}
        y={y - 12}
        width={12}
        height={24}
        rx={3}
        className="fill-accent"
        style={{ originY: 0 }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: travel, ease: "linear" }}
      />
    );
  }
  const dir = X[step.to] > X[step.from] ? 1 : -1;
  return (
    <motion.circle
      r={6}
      cy={y}
      strokeWidth={2}
      className="fill-accent stroke-surface"
      initial={{ cx: X[step.from] + dir * 4, opacity: 1 }}
      animate={{ cx: X[step.to] - dir * 9, opacity: 0 }}
      transition={{ cx: { duration: travel, ease: "easeInOut" }, opacity: { duration: 0.2, delay: travel } }}
    />
  );
}

interface SequenceProps {
  steps: readonly Step[];
  index: number;
  dnsUsed: boolean;
  packet: { key: number; travel: number } | null;
}

function SequenceDiagram({ steps, index, dnsUsed, packet }: SequenceProps) {
  const height = TOP + steps.length * ROW_H;
  return (
    <svg
      viewBox={`0 0 360 ${height}`}
      className="mx-auto h-auto w-full min-w-[280px] max-w-[480px]"
      role="img"
      aria-label={`Sequence diagram: ${steps.length} messages between the client${dnsUsed ? ", the DNS resolver" : ""} and the server. Step ${index + 1} is highlighted.`}
    >
      {ACTORS.map((a) => {
        const ghost = a.id === "dns" && !dnsUsed;
        return (
          <g key={a.id} className={cn(ghost && "opacity-40")}>
            <rect x={X[a.id] - 46} y={6} width={92} height={28} rx={8} className={cn("dg-box", ghost && "dg-box--ghost")} />
            <text x={X[a.id]} y={24.5} textAnchor="middle" className="dg-sub">
              {a.label}
            </text>
            <path d={`M${X[a.id]} 34 V${height - 4}`} className="dg-line dg-line--dash" />
          </g>
        );
      })}
      {steps.map((s, i) => (
        <StepArrow key={s.label} step={s} y={TOP + i * ROW_H} state={i < index ? "done" : i === index ? "current" : "future"} />
      ))}
      {packet ? <Packet key={packet.key} step={steps[index]} y={TOP + index * ROW_H} travel={packet.travel} /> : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ waterfall */

interface WaterfallProps {
  steps: readonly Step[];
  times: readonly { start: number; end: number }[];
  now: number;
  travel: number;
}

function Waterfall({ steps, times, now, travel }: WaterfallProps) {
  const rows = ROW_ORDER.flatMap((row) => {
    const idx = steps.flatMap((s, i) => (s.row === row ? [i] : []));
    if (idx.length === 0) return [];
    return [{ row, start: times[idx[0]].start, end: times[idx[idx.length - 1]].end }];
  });
  const total = times[times.length - 1].end;
  const tween = { duration: travel, ease: "linear" } as const;
  const grid = "grid grid-cols-[6.6rem_minmax(0,1fr)_3.4rem] items-center gap-2";

  return (
    <div className="flex flex-col gap-1.5 text-[0.8rem]" role="group" aria-label="Timing waterfall">
      {rows.map((r) => {
        const filled = clamp(now - r.start, 0, r.end - r.start);
        return (
          <div key={r.row} className={grid}>
            <span className="truncate text-ink-2">{ROW_META[r.row].label}</span>
            <div className="relative h-3 rounded-full bg-surface-2">
              <div
                className="absolute inset-y-0 rounded-full border border-dashed border-line-strong"
                style={{ left: pct(r.start), width: pct(r.end - r.start) }}
              />
              <motion.div
                className={cn("absolute inset-y-0 rounded-full", ROW_META[r.row].bar)}
                style={{ left: pct(r.start) }}
                initial={false}
                animate={{ width: pct(filled) }}
                transition={tween}
              />
            </div>
            <span className="text-right font-mono tabular-nums text-ink-2">{r.end - r.start} ms</span>
          </div>
        );
      })}
      <div className={cn(grid, "mt-1 border-t border-line pt-2")}>
        <span className="font-bold text-ink">Elapsed</span>
        <div className="relative h-3 rounded-full bg-surface-2">
          <motion.div className="absolute inset-y-0 left-0 rounded-full bg-ink-2" initial={false} animate={{ width: pct(now) }} transition={tween} />
          {total < SCALE_MS ? (
            <span
              aria-hidden="true"
              className="absolute -top-1 bottom-[-4px] w-0 border-l-2 border-dashed border-bad"
              style={{ left: pct(SCALE_MS) }}
              title="Cold start total"
            />
          ) : null}
        </div>
        <span className="text-right font-mono font-bold tabular-nums text-ink">{now} ms</span>
      </div>
      <div className={grid} aria-hidden="true">
        <span />
        <div className="relative h-4 font-mono text-[0.68rem] text-ink-3">
          {[0, 50, 100, 150].map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
              {t}
            </span>
          ))}
        </div>
        <span className="text-right font-mono text-[0.68rem] text-ink-3">ms</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ widget */

function RequestJourney() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gate = useLoopGate(rootRef);
  const reduced = useReducedMotion();
  const [scenario, setScenario] = useState<Scenario>("cold");

  const steps = stepsFor(scenario);
  const times = timeline(steps);
  const player = useStepPlayer({
    count: steps.length,
    waitMs: (i) => (reduced ? REDUCED_HOLD_MS : travelSeconds(steps[i].ms) * 1000 + HOLD_MS),
    active: gate,
  });
  const { index, last } = player;
  const step = steps[index];
  const now = times[index].end;
  const animate = player.forward && !reduced;
  const travel = animate ? travelSeconds(step.ms) : 0;

  const done = steps.slice(0, index + 1);
  const roundTrips = done.filter((s) => s.to === "client").length;
  const setupSoFar = sumMs(done.filter((s) => SETUP_ROWS.has(s.row)));
  const total = times[last].end;
  const totalSetup = sumMs(steps.filter((s) => SETUP_ROWS.has(s.row)));
  const totalTrips = steps.filter((s) => s.to === "client").length;

  const summary =
    totalSetup > 0
      ? `Total ${total} ms over ${totalTrips} round trips; ${totalSetup} ms (${Math.round((totalSetup / total) * 100)}%) went on setup before GET /feed could leave.`
      : `Total ${total} ms over one round trip: reusing the connection skipped ${SCALE_MS - total} ms of setup. This is why keep-alive and HTTP/2 matter.`;
  const stepNote = index === 0 ? FIRST_STEP_NOTE[scenario] : step.note;
  const note = index === last ? `${stepNote} ${summary}` : stepNote;

  const changeScenario = (next: Scenario) => {
    setScenario(next);
    player.jump(stepsFor(next).length - 1, { play: false });
  };

  return (
    <WidgetFrame
      title="One request, end to end"
      hint="Step through an HTTPS request for /feed. Each arrow is a packet; the clock assumes a 40 ms round trip to the server."
      note={note}
    >
      <div ref={rootRef} className="@container flex flex-col gap-4">
        <ControlRow>
          <SegmentedControl label="Scenario" size="sm" options={SCENARIOS} value={scenario} onChange={changeScenario} />
        </ControlRow>

        <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @4xl:items-start">
          <WidgetScroll>
            <SequenceDiagram
              steps={steps}
              index={index}
              dnsUsed={!SKIPPED[scenario].has("DNS")}
              packet={animate ? { key: player.seq, travel } : null}
            />
          </WidgetScroll>
          <div className="flex flex-col gap-3">
            <Waterfall steps={steps} times={times} now={now} travel={travel} />
            <p className="text-[0.82rem] text-ink-2">
              Bars use the cold-start scale ({SCALE_MS} ms).{" "}
              {total < SCALE_MS ? (
                <>
                  The dashed red line marks where a cold start would finish:{" "}
                  <strong className="text-good">{SCALE_MS - total} ms saved</strong>.
                </>
              ) : (
                <>Setup (DNS + TCP + TLS) is {totalSetup} ms of it.</>
              )}
            </p>
          </div>
        </div>

        <ControlRow>
          <Button size="sm" onClick={player.back} disabled={index === 0}>
            <ChevronLeft size={16} aria-hidden="true" />
            Back
          </Button>
          <Button size="sm" variant="primary" onClick={player.next} disabled={index === last}>
            Next step
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
          <Button size="sm" variant="ghost" onClick={player.togglePlay}>
            {player.playing ? <Pause size={16} aria-hidden="true" /> : index >= last ? <RotateCcw size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {player.playing ? "Pause" : index >= last ? "Replay" : "Play"}
          </Button>
          <span className="font-mono text-[0.78rem] tabular-nums text-ink-3">
            Step {index + 1} of {steps.length}
          </span>
        </ControlRow>

        <StatGrid>
          <Stat label="Elapsed" value={`${now} ms`} tone="accent" />
          <Stat label="Round trips" value={roundTrips} />
          <Stat label="Now" value={ROW_META[step.row].label} />
          <Stat label="Spent on setup" value={`${setupSoFar} ms`} tone={setupSoFar > 0 ? "amber" : "good"} />
        </StatGrid>
      </div>
    </WidgetFrame>
  );
}

export default RequestJourney satisfies ComponentType<InteractiveProps>;
