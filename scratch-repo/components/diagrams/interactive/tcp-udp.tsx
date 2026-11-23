"use client";

import { useMemo, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Tone } from "@/components/ui/stat";
import { ControlRow, WidgetFrame, WidgetScroll } from "@/components/ui/widget-frame";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { cn } from "@/lib/utils";
import { useFrameLoop, useLoopGate } from "./_wa-shared";

/* ------------------------------------------------------------------ model
   Times are animation milliseconds; one one-way trip (600) stands for 30 ms of network time. */

const ONE_WAY = 600;
const TO_REAL_MS = 30 / ONE_WAY;
const GAP = 200;
const RTO = 1400;
const LOST_FADE = 600;
const PACKETS = 6;

type Kind = "ctl" | "data" | "ack" | "resend";

interface Flight {
  id: string;
  label: string;
  dir: 1 | -1;
  t0: number;
  dur: number;
  kind: Kind;
  lost: boolean;
}

interface Arrival {
  n: number;
  t: number;
}

interface Lane {
  flights: Flight[];
  arrivals: Arrival[];
  /** When the lost packet vanishes (mid-way), or null on a clean network. */
  lostAt: number | null;
  timeoutAt: number | null;
  /** When the app has everything it will ever get. */
  done: number;
}

function planTcp(lossy: boolean): Lane {
  const flights: Flight[] = [
    { id: "syn", label: "SYN", dir: 1, t0: 0, dur: ONE_WAY, kind: "ctl", lost: false },
    { id: "synack", label: "SYN-ACK", dir: -1, t0: ONE_WAY, dur: ONE_WAY, kind: "ctl", lost: false },
    { id: "ack", label: "ACK", dir: 1, t0: 2 * ONE_WAY, dur: ONE_WAY, kind: "ctl", lost: false },
  ];
  const arrivals: Arrival[] = [];
  for (let n = 1; n <= PACKETS; n++) {
    const t0 = 2 * ONE_WAY + (n - 1) * GAP;
    const lost = lossy && n === 3;
    flights.push({ id: `d${n}`, label: String(n), dir: 1, t0, dur: ONE_WAY, kind: "data", lost });
    if (!lost) arrivals.push({ n, t: t0 + ONE_WAY });
  }
  const sent3 = 2 * ONE_WAY + 2 * GAP;
  const timeoutAt = lossy ? sent3 + RTO : null;
  if (timeoutAt !== null) {
    flights.push({ id: "d3again", label: "3 again", dir: 1, t0: timeoutAt, dur: ONE_WAY, kind: "resend", lost: false });
    arrivals.push({ n: 3, t: timeoutAt + ONE_WAY });
  }
  arrivals.sort((a, b) => a.t - b.t);

  // Cumulative ACKs: "ACK 2" = "I have everything up to 2".
  const have = new Set<number>();
  let next = 1;
  let done = 0;
  arrivals.forEach((a, i) => {
    have.add(a.n);
    while (have.has(next)) next++;
    if (next > PACKETS && done === 0) done = a.t;
    flights.push({ id: `ack${i}`, label: `ACK ${next - 1}`, dir: -1, t0: a.t, dur: ONE_WAY, kind: "ack", lost: false });
  });
  return { flights, arrivals, lostAt: lossy ? sent3 + ONE_WAY / 2 : null, timeoutAt, done };
}

function planUdp(lossy: boolean): Lane {
  const flights: Flight[] = [];
  const arrivals: Arrival[] = [];
  for (let n = 1; n <= PACKETS; n++) {
    const t0 = (n - 1) * GAP;
    // On the lossy network packet 4 takes a slower route, so 5 overtakes it.
    const dur = lossy ? (n === 4 ? 1000 : n === 6 ? 650 : ONE_WAY) : ONE_WAY;
    const lost = lossy && n === 3;
    flights.push({ id: `u${n}`, label: String(n), dir: 1, t0, dur, kind: "data", lost });
    if (!lost) arrivals.push({ n, t: t0 + dur });
  }
  arrivals.sort((a, b) => a.t - b.t);
  return {
    flights,
    arrivals,
    lostAt: lossy ? 2 * GAP + ONE_WAY / 2 : null,
    timeoutAt: null,
    done: Math.max(...arrivals.map((a) => a.t)),
  };
}

function planRace(lossy: boolean) {
  const tcp = planTcp(lossy);
  const udp = planUdp(lossy);
  return { tcp, udp, end: Math.max(tcp.done + ONE_WAY, udp.done) + 300 };
}

const realMs = (t: number) => Math.round(t * TO_REAL_MS);

/** What the receiving app has at time t. TCP only hands over an unbroken prefix; the rest waits in its buffer. */
function received(proto: "tcp" | "udp", lane: Lane, t: number) {
  const arrived = lane.arrivals.filter((a) => a.t <= t).map((a) => a.n);
  if (proto === "udp") return { delivered: arrived, held: [] as number[] };
  const have = new Set(arrived);
  let next = 1;
  while (have.has(next)) next++;
  const delivered = Array.from({ length: next - 1 }, (_, i) => i + 1);
  return { delivered, held: arrived.filter((n) => n >= next).sort((a, b) => a - b) };
}

function laneStatus(proto: "tcp" | "udp", lane: Lane, t: number): { text: string; tone: Tone } {
  if (t >= lane.done) {
    if (proto === "tcp") return { text: `all ${PACKETS} in order`, tone: "good" };
    return lane.lostAt !== null ? { text: `${lane.arrivals.length} of ${PACKETS}, out of order`, tone: "bad" } : { text: `all ${PACKETS} arrived`, tone: "good" };
  }
  if (proto === "tcp") {
    if (t < 2 * ONE_WAY) return { text: "handshake", tone: "violet" };
    if (lane.timeoutAt !== null && t >= lane.timeoutAt) return { text: "timeout: resending 3", tone: "amber" };
    if (lane.lostAt !== null && t >= lane.lostAt) return { text: "3 lost: holding 4+", tone: "warn" };
    return { text: "sending data", tone: "accent" };
  }
  if (lane.lostAt !== null && t >= lane.lostAt) return { text: "3 lost: nobody resends", tone: "bad" };
  return { text: "sending, no handshake", tone: "accent" };
}

/* ------------------------------------------------------------------ lane drawing */

const RAIL_X0 = 62;
const RAIL_X1 = 298;
const railY = (dir: 1 | -1) => (dir === 1 ? 34 : 64);

const KIND_CLASS: Record<Kind | "lost", { box: string; text: string }> = {
  ctl: { box: "fill-violet-soft stroke-violet", text: "fill-violet" },
  data: { box: "fill-accent stroke-accent", text: "fill-accent-ink" },
  ack: { box: "fill-good-soft stroke-good", text: "fill-good" },
  resend: { box: "fill-amber-soft stroke-amber", text: "fill-amber-ink" },
  lost: { box: "fill-bad-soft stroke-bad", text: "fill-bad" },
};

interface VisiblePacket {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  style: Kind | "lost";
  opacity: number;
}

function packetsAt(lane: Lane, t: number): VisiblePacket[] {
  const out: VisiblePacket[] = [];
  for (const f of lane.flights) {
    if (t < f.t0) continue;
    const w = Math.max(24, f.label.length * 6.6 + 12);
    const span = RAIL_X1 - w - RAIL_X0;
    const at = (p: number) => (f.dir === 1 ? RAIL_X0 + span * p : RAIL_X1 - w - span * p);
    const p = (t - f.t0) / f.dur;
    if (f.lost && p >= 0.5) {
      const since = t - (f.t0 + f.dur / 2);
      if (since >= LOST_FADE) continue;
      const fade = since / LOST_FADE;
      out.push({ id: f.id, label: "lost", x: at(0.5), y: railY(f.dir) + fade * 12, w: Math.max(w, 36), style: "lost", opacity: 1 - fade });
      continue;
    }
    if (p >= 1) continue;
    out.push({ id: f.id, label: f.label, x: at(p), y: railY(f.dir), w, style: f.kind, opacity: 1 });
  }
  return out;
}

function LaneDiagram({ lane, t, label }: { lane: Lane; t: number; label: string }) {
  return (
    <svg viewBox="0 0 360 96" className="mx-auto h-auto w-full min-w-[280px] max-w-[560px]" role="img" aria-label={label}>
      <rect x={4} y={10} width={54} height={76} rx={9} className="dg-box" />
      <text x={31} y={52} textAnchor="middle" className="dg-sub">
        Client
      </text>
      <rect x={302} y={10} width={54} height={76} rx={9} className="dg-box" />
      <text x={329} y={52} textAnchor="middle" className="dg-sub">
        Server
      </text>
      <path d={`M${RAIL_X0} ${railY(1)} H${RAIL_X1}`} className="dg-line dg-line--dash" />
      <path d={`M${RAIL_X0} ${railY(-1)} H${RAIL_X1}`} className="dg-line dg-line--dash" />
      {packetsAt(lane, t).map((p) => (
        <g key={p.id} transform={`translate(${p.x.toFixed(1)} ${(p.y - 9).toFixed(1)})`} opacity={p.opacity}>
          <rect width={p.w} height={18} rx={4} strokeWidth={1.4} className={KIND_CLASS[p.style].box} />
          <text x={p.w / 2} y={12.5} textAnchor="middle" className={cn("font-mono text-[10.5px] font-bold", KIND_CLASS[p.style].text)}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ReceivedChips({ delivered, held, lost, layout }: { delivered: number[]; held: number[]; lost: boolean; layout: boolean }) {
  // One key per packet number, so a held chip slides into place when TCP releases it.
  const chips = [...delivered.map((n) => ({ n, held: false })), ...held.map((n) => ({ n, held: true }))];
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[0.8rem]">
      <span className="mr-1 font-bold text-ink-2">App receives</span>
      <AnimatePresence initial={false}>
        {chips.map((c) => (
          <motion.span
            key={c.n}
            layout={layout}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            title={c.held ? "Arrived, but held in TCP's buffer until the gap is filled" : undefined}
            className={cn(
              "inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 font-mono text-[0.78rem] font-bold transition-colors duration-300",
              c.held ? "border-dashed border-line-strong bg-transparent text-ink-3" : "border-accent bg-accent text-accent-ink",
            )}
          >
            {c.n}
            {c.held ? <span className="sr-only"> (held in buffer)</span> : null}
          </motion.span>
        ))}
      </AnimatePresence>
      {held.length > 0 ? <span className="text-[0.74rem] text-ink-3">dashed = held in buffer</span> : null}
      {lost ? <Chip tone="bad">3 lost</Chip> : null}
      {delivered.length === 0 && held.length === 0 && !lost ? <span className="text-ink-3">nothing yet</span> : null}
    </div>
  );
}

interface LaneCardProps {
  proto: "tcp" | "udp";
  lane: Lane;
  t: number;
  layout: boolean;
  firstDone: boolean;
}

function LaneCard({ proto, lane, t, layout, firstDone }: LaneCardProps) {
  const name = proto === "tcp" ? "TCP" : "UDP";
  const sub = proto === "tcp" ? "handshake, acks, resends, in order" : "no connection, no guarantees";
  const status = laneStatus(proto, lane, t);
  const { delivered, held } = received(proto, lane, t);
  const sent = lane.flights.filter((f) => f.t0 <= t).length;
  const finished = t >= lane.done;
  const inOrder = delivered.every((n, i) => i === 0 || n > delivered[i - 1]);
  const lostShown = proto === "udp" && lane.lostAt !== null && t >= lane.lostAt;

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-line p-3" aria-label={`${name} lane`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.9rem]">
          <strong className="font-display text-base text-ink">{name}</strong> <span className="text-ink-2">{sub}</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {finished && firstDone ? <Chip tone="accent">finished first</Chip> : null}
          <Chip tone={status.tone}>{status.text}</Chip>
        </div>
      </header>
      <WidgetScroll>
        <LaneDiagram lane={lane} t={t} label={`${name}: packets between client and server`} />
      </WidgetScroll>
      <ReceivedChips delivered={delivered} held={held} lost={lostShown} layout={layout} />
      <p className="font-mono text-[0.76rem] tabular-nums text-ink-2">
        {sent} packets on the wire · {delivered.length} of {PACKETS} delivered
        {finished && proto === "udp" && !inOrder ? ", out of order" : ""}
        {finished ? ` · done at ${realMs(lane.done)} ms` : ""}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ widget */

const NETWORK_OPTIONS = [
  { value: "lossy", label: "Lossy network" },
  { value: "clean", label: "Clean network" },
] as const;

function raceNote(race: ReturnType<typeof planRace>, lossy: boolean, t: number): string {
  const { tcp, udp, end } = race;
  if (t >= end) {
    const tcpSent = tcp.flights.length;
    const udpSent = udp.flights.length;
    return lossy
      ? `TCP needed a timeout and a resend but delivered 1–6 in order, done at ${realMs(tcp.done)} ms (${tcpSent} packets on the wire). UDP was done at ${realMs(udp.done)} ms with packet 3 gone and 4/5 swapped. For a video call that is fine: a late frame is useless anyway.`
      : `On a clean network both deliver everything. TCP still pays a round trip for the handshake and an ACK per packet (${tcpSent} packets vs ${udpSent}), so it finishes at ${realMs(tcp.done)} ms; UDP at ${realMs(udp.done)} ms.`;
  }
  if (t < 2 * ONE_WAY) return "TCP opens with a 3-way handshake (SYN → SYN-ACK → ACK) before any data moves. UDP has no connection: it starts sending immediately.";
  if (tcp.timeoutAt !== null && t >= tcp.timeoutAt) return "No ACK for packet 3 before the retransmission timeout, so the TCP client resends it. When it lands, 3–6 are handed to the app together, in order.";
  if (tcp.lostAt !== null && t >= tcp.lostAt) return "Packet 3 was lost. TCP's receiver must deliver in order, so it holds 4, 5 and 6 in its buffer and keeps answering ACK 2. UDP's app simply never gets 3.";
  return "TCP numbers every packet and the server acknowledges each one. UDP just fires datagrams.";
}

function TcpUdp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gate = useLoopGate(rootRef);
  const reduced = useReducedMotion();
  const [lossy, setLossy] = useState(true);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(true);
  const race = useMemo(() => planRace(lossy), [lossy]);

  // Reduced motion: show the outcome straight away, no playback.
  const shownT = reduced ? race.end : t;

  useFrameLoop((dt) => {
    const next = Math.min(race.end, t + dt);
    setT(next);
    if (next >= race.end) setRunning(false);
  }, running && gate && !reduced);

  const restart = () => {
    setT(0);
    setRunning(true);
  };
  const changeNetwork = (v: "lossy" | "clean") => {
    setLossy(v === "lossy");
    restart();
  };

  const firstDone = Math.min(race.tcp.done, race.udp.done);

  return (
    <WidgetFrame
      title="TCP vs UDP packet race"
      hint="Both send six packets. On a lossy network, watch TCP hold, wait and resend while UDP just keeps going."
      note={raceNote(race, lossy, shownT)}
    >
      <div ref={rootRef} className="flex flex-col gap-3">
        <ControlRow>
          <Button size="sm" variant="primary" onClick={restart} disabled={running && !reduced && shownT < race.end}>
            <RotateCcw size={16} aria-hidden="true" />
            Run race
          </Button>
          <SegmentedControl label="Network" size="sm" options={NETWORK_OPTIONS} value={lossy ? "lossy" : "clean"} onChange={changeNetwork} />
          <span className="ml-auto font-mono text-[0.82rem] tabular-nums text-ink-2" aria-hidden="true">
            t = {realMs(shownT)} ms
          </span>
        </ControlRow>
        <LaneCard proto="tcp" lane={race.tcp} t={shownT} layout={!reduced} firstDone={race.tcp.done === firstDone} />
        <LaneCard proto="udp" lane={race.udp} t={shownT} layout={!reduced} firstDone={race.udp.done === firstDone} />
        <p className="text-[0.78rem] text-ink-3">
          One one-way trip = 30 ms. Colours: <span className="font-bold text-violet">handshake</span> ·{" "}
          <span className="font-bold text-accent">data</span> · <span className="font-bold text-good">ACK</span> ·{" "}
          <span className="font-bold text-amber-ink">resend</span> · <span className="font-bold text-bad">lost</span>
        </p>
      </div>
    </WidgetFrame>
  );
}

export default TcpUdp satisfies ComponentType<InteractiveProps>;
