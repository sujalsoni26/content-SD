"use client";

import { useEffect, useReducer, useRef, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleArrowUp, Minus, Plus, Power, RotateCcw } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { Button } from "@/components/ui/button";
import { RangeField } from "@/components/ui/range-field";
import { WidgetFrame } from "@/components/ui/widget-frame";
import { emitCompanionEvent } from "@/lib/companion-events";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { cn } from "@/lib/utils";
import { useLoopGate } from "./_wa-shared";
import {
  LB_COST,
  MAX_NODES,
  NODE,
  TIERS,
  fmt,
  horizontalMetrics,
  initialScaleState,
  money,
  nextDue,
  scaleReducer,
  verticalMetrics,
  type NodeState,
  type VerticalState,
} from "./_scaling-compare-model";

/* ------------------------------------------------------------------ shared SVG bits (viewBox 300 × 190) */

const compact = (n: number) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}k/s` : `${Math.round(n)}/s`);
const flowWidth = (served: number) => 1.5 + 3.5 * Math.min(1, served / 20000);
const MID_Y = 95;

function Users({ load }: { load: number }) {
  return (
    <g>
      <rect x={4} y={70} width={60} height={50} rx={9} className="dg-box" />
      <text x={34} y={91} textAnchor="middle" className="dg-text text-[13px]">
        Users
      </text>
      <text x={34} y={108} textAnchor="middle" className="dg-sub font-mono text-[11px]">
        {compact(load)}
      </text>
    </g>
  );
}

function Dropped({ dropped }: { dropped: number }) {
  if (dropped <= 0.5) return null;
  return (
    <g>
      <path d="M34 122 V150" className="dg-line dg-line--bad dg-line--dash" markerEnd="url(#ah-bad)" />
      <text x={34} y={166} textAnchor="middle" className="dg-text dg-text--bad font-mono text-[12px]">
        −{compact(dropped)}
      </text>
      <text x={34} y={181} textAnchor="middle" className="dg-label dg-text--bad">
        dropped
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ vertical stage */

const BOX_X = 112;
const BOX_BOTTOM = 172;
const MAX_W = 182;
const MAX_H = 150;

const V_STATUS_TEXT: Record<VerticalState["status"], string> = {
  up: "",
  down: "DOWN",
  resizing: "resizing…",
  restarting: "restarting…",
};

function VerticalStage({ v, load, flowing, reduced }: { v: VerticalState; load: number; flowing: boolean; reduced: boolean }) {
  const m = verticalMetrics(v, load);
  const f = v.tier / (TIERS.length - 1);
  const w = 60 + (MAX_W - 60) * f;
  const h = 50 + (MAX_H - 50) * f;
  const fillH = v.status === "up" ? h * Math.min(1, m.utilisation) : 0;
  const over = m.utilisation > 1;
  const t = { duration: reduced ? 0 : 0.6, ease: [0.2, 0.8, 0.2, 1] as const };
  const boxClass = v.status === "up" ? (over ? "dg-box--bad" : "dg-box--accent") : v.status === "down" ? "dg-box--bad" : "dg-box--ghost";

  return (
    <svg
      viewBox="0 0 300 190"
      className="mx-auto h-auto w-full max-w-[420px]"
      role="img"
      aria-label={`One ${m.tier.name} machine with ${m.tier.cores} cores serving ${fmt(m.served)} of ${fmt(load)} requests per second.`}
    >
      <rect x={BOX_X} y={BOX_BOTTOM - MAX_H} width={MAX_W} height={MAX_H} rx={10} className="dg-box dg-box--ghost" />
      <text x={BOX_X + MAX_W - 8} y={BOX_BOTTOM - MAX_H + 15} textAnchor="end" className="dg-label">
        largest you can buy
      </text>
      <Users load={load} />
      <motion.path
        initial={false}
        animate={{ d: `M64 ${MID_Y} L${BOX_X} ${BOX_BOTTOM - h / 2}` }}
        transition={t}
        strokeWidth={flowWidth(m.served)}
        className={cn("dg-line", m.served > 0 ? "dg-line--accent" : "dg-line--dash", flowing && m.served > 0 && "dg-flow")}
      />
      <motion.rect
        x={BOX_X}
        rx={10}
        initial={false}
        animate={{ width: w, height: h, attrY: BOX_BOTTOM - h }}
        transition={t}
        className={cn("dg-box", boxClass)}
      />
      <motion.rect
        x={BOX_X + 2}
        initial={false}
        animate={{ width: Math.max(0, w - 4), height: Math.max(0, fillH - 2), attrY: BOX_BOTTOM - fillH }}
        transition={t}
        rx={8}
        className={over ? "fill-bad/25" : "fill-accent/20"}
      />
      {v.status !== "up" ? (
        <text x={BOX_X + 8} y={BOX_BOTTOM - 40} className={cn("dg-text text-[12px]", v.status === "down" ? "dg-text--bad" : "fill-ink-2")}>
          {V_STATUS_TEXT[v.status]}
        </text>
      ) : null}
      <text x={BOX_X + 8} y={BOX_BOTTOM - 24} className="dg-text text-[13px]">
        {m.tier.name}
      </text>
      <text x={BOX_X + 8} y={BOX_BOTTOM - 10} className="dg-label">
        {m.tier.cores} cores
      </text>
      <Dropped dropped={m.dropped} />
    </svg>
  );
}

/* ------------------------------------------------------------------ horizontal stage */

const COLS = 6;
const CELL_W = 22;
const CELL_H = 24;
const GAP_X = 5;
const GAP_Y = 6;
const GRID_X = 134 + (162 - (COLS * CELL_W + (COLS - 1) * GAP_X)) / 2;

function nodeLayout(count: number) {
  const rows = Math.max(1, Math.ceil(count / COLS));
  const gridH = rows * CELL_H + (rows - 1) * GAP_Y;
  const top = MID_Y - gridH / 2;
  return {
    rows,
    rowCenter: (r: number) => top + r * (CELL_H + GAP_Y) + CELL_H / 2,
    at: (i: number) => ({ x: GRID_X + (i % COLS) * (CELL_W + GAP_X), y: top + Math.floor(i / COLS) * (CELL_H + GAP_Y) }),
  };
}

function NodeBox({ node, share, reduced }: { node: NodeState; share: number; reduced: boolean }) {
  const u = node.status === "up" ? share / NODE.capacity : 0;
  const fillH = CELL_H * Math.min(1, u);
  return (
    <>
      <rect
        width={CELL_W}
        height={CELL_H}
        rx={4}
        className={cn(
          "dg-box",
          node.status === "down" && "dg-box--bad",
          node.status === "booting" && cn("dg-box--ghost", !reduced && "animate-pulse"),
          node.status === "up" && u > 1 && "dg-box--bad",
        )}
      />
      {fillH > 0 ? <rect x={1.5} y={CELL_H - fillH + 0.5} width={CELL_W - 3} height={Math.max(0, fillH - 2)} rx={3} className={u > 1 ? "fill-bad/40" : "fill-accent/45"} /> : null}
      {node.status === "down" ? <path d={`M6 6 L${CELL_W - 6} ${CELL_H - 6} M${CELL_W - 6} 6 L6 ${CELL_H - 6}`} className="dg-line dg-line--bad" /> : null}
    </>
  );
}

function HorizontalStage({ nodes, load, flowing, reduced }: { nodes: readonly NodeState[]; load: number; flowing: boolean; reduced: boolean }) {
  const m = horizontalMetrics(nodes, load);
  const layout = nodeLayout(nodes.length);
  const t = { duration: reduced ? 0 : 0.45, ease: [0.2, 0.8, 0.2, 1] as const };
  return (
    <svg
      viewBox="0 0 300 190"
      className="mx-auto h-auto w-full max-w-[420px]"
      role="img"
      aria-label={`${m.up} servers up behind a load balancer${m.down ? `, ${m.down} dead` : ""}${m.booting ? `, ${m.booting} booting` : ""}, serving ${fmt(m.served)} of ${fmt(load)} requests per second.`}
    >
      <rect x={130} y={8} width={166} height={174} rx={12} className="dg-zone" />
      <Users load={load} />
      <path d={`M64 ${MID_Y} H78`} strokeWidth={flowWidth(m.served)} className={cn("dg-line dg-line--accent", flowing && m.served > 0 && "dg-flow")} />
      <rect x={78} y={MID_Y - 19} width={40} height={38} rx={8} className="dg-box dg-box--accent" />
      <text x={98} y={MID_Y + 5} textAnchor="middle" className="dg-text text-[13px]">
        LB
      </text>
      {Array.from({ length: layout.rows }, (_, r) => (
        <motion.path
          key={r}
          initial={false}
          animate={{ d: `M118 ${MID_Y} L${GRID_X - 3} ${layout.rowCenter(r)}` }}
          transition={t}
          className={cn("dg-line", m.served > 0 ? "dg-line--accent" : "dg-line--dash", flowing && m.served > 0 && "dg-flow")}
        />
      ))}
      <AnimatePresence initial={false}>
        {nodes.map((node, i) => {
          const p = layout.at(i);
          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, x: p.x, y: p.y }}
              animate={{ opacity: 1, x: p.x, y: p.y }}
              exit={{ opacity: 0 }}
              transition={t}
            >
              <NodeBox node={node} share={m.share} reduced={reduced} />
            </motion.g>
          );
        })}
      </AnimatePresence>
      <Dropped dropped={m.dropped} />
    </svg>
  );
}

/* ------------------------------------------------------------------ panels */

function Figures({ rows }: { rows: { label: string; value: ReactNode; tone?: "bad" | "good" }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[0.8rem]">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-ink-3">{r.label}</dt>
          <dd className={cn("text-right font-mono tabular-nums", r.tone === "bad" ? "font-bold text-bad" : r.tone === "good" ? "text-good" : "text-ink")}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Panel({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-line p-3" aria-label={title}>
      <header>
        <h4 className="font-display text-base font-bold text-ink">{title}</h4>
        <p className="text-[0.8rem] text-ink-2">{sub}</p>
      </header>
      {children}
    </section>
  );
}

function TradeOffs({ v, nodes, load }: { v: VerticalState; nodes: readonly NodeState[]; load: number }) {
  const vm = verticalMetrics(v, load);
  const hm = horizontalMetrics(nodes, load);
  const rows: { label: string; up: string; out: string }[] = [
    { label: "Cost per month", up: money(vm.cost), out: `${money(hm.cost)} (incl. ${money(LB_COST)} LB)` },
    {
      label: "Cost per 1,000 req/s",
      up: money(vm.cost / (vm.capacity / 1000)),
      out: nodes.length ? money(hm.cost / ((nodes.length * NODE.capacity) / 1000)) : "–",
    },
    { label: "Ceiling", up: `${fmt(TIERS[TIERS.length - 1].capacity)} req/s, the largest box`, out: `none: +${fmt(NODE.capacity)} req/s per server` },
    { label: "One machine dies", up: "100% down", out: hm.up > 0 ? `−${Math.round(100 / Math.max(1, hm.up + hm.down))}% capacity` : "already down" },
    { label: "Growing", up: "downtime for each resize", out: "no downtime; new servers join live" },
    { label: "Needs", up: "nothing new", out: "a load balancer and stateless servers" },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[280px] table-fixed border-collapse text-[0.8rem]">
        <caption className="sr-only">Trade-offs of scaling up versus scaling out, for the current settings</caption>
        <thead>
          <tr className="border-b border-line text-left font-mono text-[0.68rem] uppercase tracking-[0.08em] text-ink-3">
            <th scope="col" className="w-[30%] py-1.5 pr-2 font-semibold" />
            <th scope="col" className="py-1.5 pr-2 font-semibold">Scale up</th>
            <th scope="col" className="py-1.5 font-semibold">Scale out</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-dashed border-line align-top last:border-b-0">
              <th scope="row" className="py-1.5 pr-2 text-left font-normal text-ink-3">
                {r.label}
              </th>
              <td className="py-1.5 pr-2 text-ink">{r.up}</td>
              <td className="py-1.5 text-ink">{r.out}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ widget */

function ScalingCompare() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gate = useLoopGate(rootRef);
  const reduced = useReducedMotion();
  const [state, dispatch] = useReducer(scaleReducer, undefined, initialScaleState);
  const { load, vertical, nodes } = state;
  const vm = verticalMetrics(vertical, load);
  const hm = horizontalMetrics(nodes, load);
  const flowing = gate && !reduced;

  // Finish resizes, boots and health-check removals when they fall due.
  const due = nextDue(state);
  useEffect(() => {
    if (due === null) return;
    const id = window.setTimeout(() => dispatch({ type: "settle", now: Date.now() }), Math.max(0, due - Date.now()));
    return () => window.clearTimeout(id);
  }, [due]);

  const ceilingHit = vm.atCeiling && vertical.status === "up" && vm.dropped > 0;
  const announced = useRef(false);
  useEffect(() => {
    if (ceilingHit && !announced.current) {
      announced.current = true;
      emitCompanionEvent({ type: "diagram", mood: "thinking", message: "Even the biggest machine can't keep up. Time to scale out." });
    }
  }, [ceilingHit]);

  const next = TIERS[vertical.tier + 1];
  const upCount = hm.up;

  return (
    <WidgetFrame
      kicker="Compare"
      title="Scale up or scale out?"
      hint="Raise the traffic. Grow the single machine on the left, add servers on the right, then kill a machine on each side."
      note={state.note}
    >
      <div ref={rootRef} className="@container flex flex-col gap-4">
        <RangeField
          label="Traffic"
          value={load}
          min={500}
          max={30000}
          step={500}
          onChange={(v) => dispatch({ type: "load", load: v })}
          display={`${fmt(load)} req/s`}
        />

        <div className="grid gap-3 @xl:grid-cols-2">
          <Panel title="Vertical: scale up" sub="One machine; buy a bigger one when it fills up.">
            <VerticalStage v={vertical} load={load} flowing={flowing} reduced={reduced} />
            <Figures
              rows={[
                { label: "Capacity", value: `${fmt(vm.capacity)} req/s` },
                { label: "Serving", value: `${fmt(vm.served)} req/s` },
                { label: "Dropped", value: `${fmt(vm.dropped)} req/s`, tone: vm.dropped > 0 ? "bad" : "good" },
                { label: "Busy", value: vertical.status === "up" ? `${Math.round(vm.utilisation * 100)}%` : "–", tone: vm.utilisation > 1 ? "bad" : undefined },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => dispatch({ type: "resize", now: Date.now() })}
                disabled={!next || vertical.status !== "up"}
              >
                <CircleArrowUp size={16} aria-hidden="true" />
                {next ? `Upgrade to ${next.cores} cores` : "No bigger machine"}
              </Button>
              {vertical.status === "down" ? (
                <Button size="sm" variant="success" onClick={() => dispatch({ type: "restart-vertical", now: Date.now() })}>
                  <RotateCcw size={16} aria-hidden="true" />
                  Restart it
                </Button>
              ) : (
                <Button size="sm" variant="danger" onClick={() => dispatch({ type: "kill-vertical" })} disabled={vertical.status !== "up"}>
                  <Power size={16} aria-hidden="true" />
                  Kill the machine
                </Button>
              )}
            </div>
          </Panel>

          <Panel title="Horizontal: scale out" sub={`Many ${NODE.cores}-core servers (${fmt(NODE.capacity)} req/s each) behind a load balancer.`}>
            <HorizontalStage nodes={nodes} load={load} flowing={flowing} reduced={reduced} />
            <Figures
              rows={[
                { label: "Capacity", value: `${fmt(hm.capacity)} req/s` },
                { label: "Serving", value: `${fmt(hm.served)} req/s` },
                { label: "Dropped", value: `${fmt(hm.dropped)} req/s`, tone: hm.dropped > 0.5 ? "bad" : "good" },
                { label: "Servers", value: `${hm.up} up${hm.booting ? ` + ${hm.booting} booting` : ""}${hm.down ? ` + ${hm.down} dead` : ""}` },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={() => dispatch({ type: "add-node", now: Date.now() })} disabled={nodes.length >= MAX_NODES}>
                <Plus size={16} aria-hidden="true" />
                Add server
              </Button>
              <Button size="sm" onClick={() => dispatch({ type: "remove-node" })} disabled={upCount <= 1}>
                <Minus size={16} aria-hidden="true" />
                Remove
              </Button>
              <Button size="sm" variant="danger" onClick={() => dispatch({ type: "kill-node", now: Date.now() })} disabled={upCount === 0}>
                <Power size={16} aria-hidden="true" />
                Kill a server
              </Button>
            </div>
          </Panel>
        </div>

        <TradeOffs v={vertical} nodes={nodes} load={load} />
        <p className="text-[0.76rem] text-ink-3">
          Illustrative prices and capacities. Times are compressed: a real resize or boot takes minutes, a health check a few seconds.
        </p>
      </div>
    </WidgetFrame>
  );
}

export default ScalingCompare satisfies ComponentType<InteractiveProps>;
