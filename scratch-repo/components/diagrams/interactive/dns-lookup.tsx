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
import { cn } from "@/lib/utils";
import { useInterval, useLoopGate, useStepPlayer } from "./_wa-shared";

/* ------------------------------------------------------------------ model */

type NodeId = "browser" | "resolver" | "root" | "tld" | "auth";
type EdgeId = "browser-resolver" | "resolver-root" | "resolver-tld" | "resolver-auth";
type CacheState = "cold" | "resolver" | "browser";
type RecordType = "A" | "AAAA";
type StatusTone = "hit" | "miss" | "referral" | "answer";

interface Status {
  text: string;
  tone: StatusTone;
}

interface DnsStep {
  /** Nodes active in this step. */
  nodes: readonly NodeId[];
  edge?: EdgeId;
  /** out = browser → resolver, back = resolver → browser, round = there and back. */
  trip?: "out" | "back" | "round";
  ms: number;
  queries: number;
  status: Partial<Record<NodeId, Status>>;
  final?: boolean;
  note: string;
}

const DOMAIN = "instagram.com";
const IP: Record<RecordType, string> = { A: "203.0.113.10", AAAA: "2001:db8::10" };
/** Seconds left on the cached record when the lookup finishes. */
const TTL_START: Record<CacheState, number> = { cold: 300, resolver: 214, browser: 187 };

const NODES: Record<NodeId, { x: number; y: number; title: string; sub: string }> = {
  browser: { x: 4, y: 98, title: "Browser + OS", sub: "local cache" },
  resolver: { x: 140, y: 98, title: "Resolver", sub: "8.8.8.8" },
  root: { x: 288, y: 8, title: "Root", sub: "\".\" servers" },
  tld: { x: 288, y: 98, title: "TLD", sub: ".com servers" },
  auth: { x: 288, y: 188, title: "Authoritative", sub: DOMAIN },
};
const NODE_W = 100;
const NODE_H = 60;

const EDGES: Record<EdgeId, { a: [number, number]; b: [number, number] }> = {
  "browser-resolver": { a: [104, 128], b: [140, 128] },
  "resolver-root": { a: [240, 116], b: [288, 38] },
  "resolver-tld": { a: [240, 128], b: [288, 128] },
  "resolver-auth": { a: [240, 140], b: [288, 218] },
};

function scenario(cache: CacheState, rec: RecordType): DnsStep[] {
  const miss: DnsStep = {
    nodes: ["browser"],
    ms: 0,
    queries: 0,
    status: { browser: { text: "cache miss", tone: "miss" } },
    note: `Browser and OS caches are checked first: no entry for ${DOMAIN}.`,
  };
  if (cache === "browser") {
    return [
      {
        nodes: ["browser"],
        ms: 0,
        queries: 0,
        final: true,
        status: { browser: { text: "cache hit", tone: "hit" } },
        note: "Hit in the browser/OS cache: no network trip at all. This is why most lookups feel instant, and why DNS changes spread slowly until old TTLs expire.",
      },
    ];
  }
  if (cache === "resolver") {
    return [
      miss,
      {
        nodes: ["browser", "resolver"],
        edge: "browser-resolver",
        trip: "round",
        ms: 4,
        queries: 1,
        final: true,
        status: { resolver: { text: "cache hit", tone: "hit" }, browser: { text: "cached", tone: "hit" } },
        note: `The resolver already has ${DOMAIN} cached (someone asked recently), so it answers at once. No root, TLD or authoritative trips.`,
      },
    ];
  }
  return [
    miss,
    {
      nodes: ["browser", "resolver"],
      edge: "browser-resolver",
      trip: "out",
      ms: 2,
      queries: 1,
      status: { resolver: { text: "cache miss", tone: "miss" } },
      note: "Ask a resolver (your ISP's, or a public one like 8.8.8.8). Its cache is empty too, so it starts at the top.",
    },
    {
      nodes: ["resolver", "root"],
      edge: "resolver-root",
      trip: "round",
      ms: 30,
      queries: 1,
      status: { root: { text: "→ ask .com", tone: "referral" } },
      note: `Root server: "I don't know ${DOMAIN}, but here are the .com servers." A referral, not an answer.`,
    },
    {
      nodes: ["resolver", "tld"],
      edge: "resolver-tld",
      trip: "round",
      ms: 30,
      queries: 1,
      status: { tld: { text: "→ ask its NS", tone: "referral" } },
      note: `.com TLD server: "${DOMAIN} is handled by its own name servers. Ask them."`,
    },
    {
      nodes: ["resolver", "auth"],
      edge: "resolver-auth",
      trip: "round",
      ms: 30,
      queries: 1,
      status: { auth: { text: `${rec} record`, tone: "answer" } },
      note: `Authoritative server: the real answer, an ${rec} record: ${DOMAIN} → ${IP[rec]} (${rec === "A" ? "IPv4" : "IPv6"}).`,
    },
    {
      nodes: ["resolver", "browser"],
      edge: "browser-resolver",
      trip: "back",
      ms: 2,
      queries: 0,
      final: true,
      status: { resolver: { text: "cached 300 s", tone: "hit" }, browser: { text: "cached", tone: "hit" } },
      note: "The resolver caches the answer for its TTL (300 s here) and hands the IP to the browser, which caches it too.",
    },
  ];
}

const tripSeconds = (trip: DnsStep["trip"]) => (trip === "round" ? 1 : trip ? 0.55 : 0);
const HOLD_MS = 700;

const STATUS_CLASS: Record<StatusTone, string> = {
  hit: "fill-good",
  miss: "fill-warn",
  referral: "fill-ink-2",
  answer: "fill-accent",
};

/* ------------------------------------------------------------------ diagram */

function DnsNode({ id, active, involved, status }: { id: NodeId; active: boolean; involved: boolean; status?: Status }) {
  const n = NODES[id];
  return (
    <g className={cn("transition-opacity duration-300", !involved && "opacity-40")}>
      <rect
        x={n.x}
        y={n.y}
        width={NODE_W}
        height={NODE_H}
        rx={10}
        className={cn("dg-box transition-[fill,stroke] duration-300", active ? "dg-box--accent" : !involved && "dg-box--ghost")}
      />
      <text x={n.x + NODE_W / 2} y={n.y + 21} textAnchor="middle" className="dg-text text-[14px]">
        {n.title}
      </text>
      <text x={n.x + NODE_W / 2} y={n.y + 37} textAnchor="middle" className="dg-sub">
        {n.sub}
      </text>
      {status ? (
        <text x={n.x + NODE_W / 2} y={n.y + 52} textAnchor="middle" className={cn("font-mono text-[11px] font-bold", STATUS_CLASS[status.tone])}>
          {status.text}
        </text>
      ) : null}
    </g>
  );
}

function DnsPacket({ step }: { step: DnsStep }) {
  if (!step.edge || !step.trip) return null;
  const { a, b } = EDGES[step.edge];
  const [from, to] = step.trip === "back" ? [b, a] : [a, b];
  const xs = step.trip === "round" ? [from[0], to[0], from[0]] : [from[0], to[0]];
  const ys = step.trip === "round" ? [from[1], to[1], from[1]] : [from[1], to[1]];
  const duration = tripSeconds(step.trip);
  return (
    <motion.circle
      r={6}
      strokeWidth={2}
      className="fill-accent stroke-surface"
      initial={{ cx: from[0], cy: from[1], opacity: 1 }}
      animate={{ cx: xs, cy: ys, opacity: 0 }}
      transition={{
        cx: { duration, ease: "easeInOut" },
        cy: { duration, ease: "easeInOut" },
        opacity: { duration: 0.2, delay: duration },
      }}
    />
  );
}

interface DiagramProps {
  steps: readonly DnsStep[];
  index: number;
  packetKey: number | null;
}

function DnsDiagram({ steps, index, packetKey }: DiagramProps) {
  const step = steps[index];
  const seen = steps.slice(0, index + 1);
  const involved = new Set<NodeId>(seen.flatMap((s) => s.nodes));
  const usedEdges = new Set<EdgeId>(seen.flatMap((s) => (s.edge ? [s.edge] : [])));
  const status = seen.reduce<Partial<Record<NodeId, Status>>>((acc, s) => ({ ...acc, ...s.status }), {});

  return (
    <svg
      viewBox="0 0 392 256"
      className="mx-auto h-auto w-full min-w-[300px] max-w-[540px]"
      role="img"
      aria-label={`DNS resolution path: browser, resolver, root, TLD and authoritative servers. ${involved.size} of 5 involved so far.`}
    >
      {(Object.keys(EDGES) as EdgeId[]).map((id) => {
        const { a, b } = EDGES[id];
        const current = step.edge === id;
        return (
          <path
            key={id}
            d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`}
            className={cn("dg-line transition-opacity duration-300", current && "dg-line--accent", !current && !usedEdges.has(id) && "dg-line--dash opacity-40")}
          />
        );
      })}
      {(Object.keys(NODES) as NodeId[]).map((id) => (
        <DnsNode key={id} id={id} active={step.nodes.includes(id)} involved={involved.has(id)} status={status[id]} />
      ))}
      {packetKey !== null ? <DnsPacket key={packetKey} step={step} /> : null}
    </svg>
  );
}

function RecordCard({ rec, ttl, resolved }: { rec: RecordType; ttl: number; resolved: boolean }) {
  if (!resolved) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong bg-surface-2 px-3 py-2.5 font-mono text-[0.85rem] text-ink-3">
        Resolving {DOMAIN} …
      </p>
    );
  }
  const cells = [
    { head: "name", value: `${DOMAIN}.` },
    { head: "TTL", value: ttl > 0 ? `${ttl}` : "expired" },
    { head: "class", value: "IN" },
    { head: "type", value: rec },
    { head: "value", value: IP[rec] },
  ];
  return (
    <dl
      className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg border border-accent bg-accent-soft px-3 py-2 font-mono"
      aria-label="DNS answer record"
    >
      {cells.map((c) => (
        <div key={c.head} className="flex min-w-0 flex-col">
          <dt className="text-[0.65rem] uppercase tracking-[0.08em] text-ink-3">{c.head}</dt>
          <dd
            className={cn(
              "text-[0.88rem] font-bold tabular-nums [overflow-wrap:anywhere]",
              c.head === "TTL" && ttl === 0 ? "text-bad" : "text-ink",
            )}
          >
            {c.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ widget */

const CACHE_OPTIONS = [
  { value: "cold", label: "Cold cache" },
  { value: "resolver", label: "Resolver cached" },
  { value: "browser", label: "Browser cached" },
] as const;

const RECORD_OPTIONS = [
  { value: "A", label: "A (IPv4)" },
  { value: "AAAA", label: "AAAA (IPv6)" },
] as const;

function DnsLookup() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gate = useLoopGate(rootRef);
  const reduced = useReducedMotion();
  const [cache, setCache] = useState<CacheState>("cold");
  const [rec, setRec] = useState<RecordType>("A");
  const [ttl, setTtl] = useState(TTL_START.cold);

  const steps = scenario(cache, rec);
  const player = useStepPlayer({
    count: steps.length,
    waitMs: (i) => (reduced ? 1400 : tripSeconds(steps[i].trip) * 1000 + HOLD_MS),
    active: gate,
    onStep: (i) => {
      if (steps[i]?.final) setTtl(TTL_START[cache]);
    },
  });
  const { index, last } = player;
  const step = steps[index];
  const resolved = Boolean(step.final);

  useInterval(() => setTtl((t) => Math.max(0, t - 1)), resolved && gate && ttl > 0 ? 1000 : null);

  const seen = steps.slice(0, index + 1);
  const ms = seen.reduce((sum, s) => sum + s.ms, 0);
  const queries = seen.reduce((sum, s) => sum + s.queries, 0);

  const changeCache = (next: CacheState) => {
    setCache(next);
    const nextSteps = scenario(next, rec);
    if (reduced) {
      setTtl(TTL_START[next]);
      player.jump(nextSteps.length - 1, { play: false });
    } else {
      player.jump(0, { play: true });
      if (nextSteps.length === 1) setTtl(TTL_START[next]);
    }
  };

  const expired = resolved && ttl === 0;
  const note = expired
    ? "The TTL ran out, so this cached answer is gone. The next lookup has to ask the resolver again. Before a planned migration, teams lower the TTL days in advance so changes spread quickly."
    : step.note;

  return (
    <WidgetFrame
      title={`Resolve ${DOMAIN}`}
      hint="Step through a lookup, then switch the cache state to see why most lookups never leave your machine."
      note={note}
    >
      <div ref={rootRef} className="flex flex-col gap-4">
        <ControlRow>
          <SegmentedControl label="Cache state" size="sm" options={CACHE_OPTIONS} value={cache} onChange={changeCache} />
          <SegmentedControl label="Record type" size="sm" options={RECORD_OPTIONS} value={rec} onChange={setRec} />
        </ControlRow>

        <WidgetScroll>
          <DnsDiagram steps={steps} index={index} packetKey={player.forward && !reduced ? player.seq : null} />
        </WidgetScroll>

        <RecordCard rec={rec} ttl={ttl} resolved={resolved} />

        <ControlRow>
          <Button size="sm" onClick={player.back} disabled={index === 0}>
            <ChevronLeft size={16} aria-hidden="true" />
            Back
          </Button>
          <Button size="sm" variant="primary" onClick={player.next} disabled={index === last}>
            Next step
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
          <Button size="sm" variant="ghost" onClick={player.togglePlay} disabled={last === 0}>
            {player.playing ? <Pause size={16} aria-hidden="true" /> : index >= last ? <RotateCcw size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {player.playing ? "Pause" : index >= last ? "Replay" : "Play"}
          </Button>
          <span className="font-mono text-[0.78rem] tabular-nums text-ink-3">
            Step {index + 1} of {steps.length}
          </span>
        </ControlRow>

        <StatGrid>
          <Stat label="Queries sent" value={queries} tone={queries > 1 ? "amber" : "good"} />
          <Stat label="Lookup time" value={ms === 0 ? "≈0 ms" : `≈${ms} ms`} tone="accent" />
          <Stat label="Cached for" value={resolved ? (ttl > 0 ? `${ttl} s` : "expired") : "–"} tone={expired ? "bad" : "neutral"} />
        </StatGrid>
      </div>
    </WidgetFrame>
  );
}

export default DnsLookup satisfies ComponentType<InteractiveProps>;
