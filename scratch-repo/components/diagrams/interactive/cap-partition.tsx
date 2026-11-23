"use client";

import { useEffect, useReducer } from "react";
import type { ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Scissors, Cable, RotateCcw } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { WidgetFrame, WidgetScroll, ControlRow } from "@/components/ui/widget-frame";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat, StatGrid } from "@/components/ui/stat";
import { EventLog, type LogEntry } from "@/components/ui/event-log";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Model                                                               */
/* ------------------------------------------------------------------ */

type Side = "mumbai" | "virginia";
type Mode = "CP" | "AP";
type Op = "withdraw" | "read";

const START = 5000;
const AMOUNT = 3000;
const CP_TIMEOUT_MS = 2500;
const NAME: Record<Side, string> = { mumbai: "Mumbai", virginia: "Virginia" };
const SIDES: Side[] = ["mumbai", "virginia"];
const other = (s: Side): Side => (s === "mumbai" ? "virginia" : "mumbai");

function rupee(n: number): string {
  return `${n < 0 ? "−₹" : "₹"}${Math.abs(n).toLocaleString("en-IN")}`;
}

interface Pending {
  id: number;
  side: Side;
  op: Op;
}

type Flash =
  | { id: number; kind: "replicate"; from: Side }
  | { id: number; kind: "payout"; side: Side }
  | { id: number; kind: "reconcile" }
  | null;

interface CapState {
  mode: Mode;
  partitioned: boolean;
  balance: Record<Side, number>;
  /** Last balance both sides agreed on. */
  base: number;
  /** Money paid out locally during the partition (AP only). */
  spent: Record<Side, number>;
  paidOut: number;
  errors: number;
  staleReads: number;
  pending: Pending | null;
  flash: Flash;
  log: LogEntry[];
  seq: number;
  message: string;
}

type Action =
  | { type: "toggle-link" }
  | { type: "withdraw"; side: Side }
  | { type: "read"; side: Side }
  | { type: "timeout"; id: number }
  | { type: "mode"; mode: Mode }
  | { type: "reset" };

function idleMessage(mode: Mode, partitioned: boolean): string {
  if (!partitioned) {
    return mode === "CP"
      ? "No partition: every write replicates and every read sees it. Cut the network to force the choice."
      : "No partition: AP behaves just like CP while the link is up. Cut the network to see the difference.";
  }
  return mode === "CP"
    ? "Partitioned, CP: anything that might be wrong waits for the other side, then fails. Correct, but not available."
    : "Partitioned, AP: both sides keep answering from their own copy. Available, but possibly wrong.";
}

function initialState(mode: Mode): CapState {
  return {
    mode,
    partitioned: false,
    balance: { mumbai: START, virginia: START },
    base: START,
    spent: { mumbai: 0, virginia: 0 },
    paidOut: 0,
    errors: 0,
    staleReads: 0,
    pending: null,
    flash: null,
    log: [{ id: 0, text: `One account, ${rupee(START)}, copied to Mumbai and Virginia.`, tone: "neutral" }],
    seq: 1,
    message: idleMessage(mode, false),
  };
}

function withLog(s: CapState, text: string, tone: LogEntry["tone"]): CapState {
  return { ...s, log: [{ id: s.seq, text, tone }, ...s.log].slice(0, 8), seq: s.seq + 1 };
}

/** A withdrawal or read while the link is up: always consistent. */
function connectedOp(s: CapState, side: Side, op: Op, prefix = ""): CapState {
  const name = NAME[side];
  if (op === "read") {
    return { ...withLog(s, `${prefix}${name} read: ${rupee(s.balance[side])} (latest).`, "good"), message: `${name} returned the latest balance.` };
  }
  if (s.balance[side] < AMOUNT) {
    return {
      ...withLog(s, `${prefix}${name}: declined, balance is only ${rupee(s.balance[side])}.`, "neutral"),
      message: `Declined: both copies agree there is only ${rupee(s.balance[side])}. Consistency protects the account.`,
    };
  }
  const next = s.balance[side] - AMOUNT;
  return {
    ...withLog(s, `${prefix}${name}: paid out ${rupee(AMOUNT)}. Replicated, both sides show ${rupee(next)}.`, "good"),
    balance: { mumbai: next, virginia: next },
    base: next,
    paidOut: s.paidOut + AMOUNT,
    flash: { id: s.seq, kind: "replicate", from: side },
    message: `Paid out and replicated: both copies now say ${rupee(next)}.`,
  };
}

function heal(s: CapState): CapState {
  let next: CapState = { ...s, partitioned: false };
  const totalSpent = s.spent.mumbai + s.spent.virginia;
  if (totalSpent > 0) {
    const final = s.base - totalSpent;
    next = withLog(
      next,
      `Network healed. Replicas reconcile: ${rupee(s.base)} − ${rupee(totalSpent)} = ${rupee(final)}.`,
      final < 0 ? "bad" : "good",
    );
    next = {
      ...next,
      balance: { mumbai: final, virginia: final },
      base: final,
      spent: { mumbai: 0, virginia: 0 },
      flash: { id: next.seq, kind: "reconcile" },
      message:
        final < 0
          ? `Overdrawn by ${rupee(-final)}. Both ATMs paid out during the partition, each sure it was fine. This is why money, bookings and inventory choose CP.`
          : "Healed. The copies reconcile and agree again. AP traded a window of disagreement for staying up.",
    };
  } else {
    next = { ...withLog(next, "Network healed. Nothing diverged.", "good"), message: idleMessage(s.mode, false) };
  }
  if (s.pending) {
    next = connectedOp({ ...next, pending: null }, s.pending.side, s.pending.op, "Link back in time → ");
  }
  return next;
}

function reducer(s: CapState, a: Action): CapState {
  switch (a.type) {
    case "toggle-link":
      if (s.partitioned) return heal(s);
      return {
        ...withLog(s, "Network partition: Mumbai and Virginia can't talk.", "bad"),
        partitioned: true,
        message: idleMessage(s.mode, true),
      };

    case "withdraw":
    case "read": {
      if (s.pending) return s;
      const { side } = a;
      const name = NAME[side];
      if (!s.partitioned) return connectedOp(s, side, a.type);
      if (s.mode === "CP") {
        return {
          ...withLog(s, `${name}: asks ${NAME[other(side)]} to confirm the balance… waiting.`, "accent"),
          pending: { id: s.seq, side, op: a.type },
          message: `CP: ${name} won't answer until ${NAME[other(side)]} confirms. It waits; if the link stays down it gives up with an error. Heal the network within 2.5 s and it goes through.`,
        };
      }
      if (a.type === "read") {
        const unseen = s.spent[other(side)];
        if (unseen > 0) {
          return {
            ...withLog(s, `${name} read: ${rupee(s.balance[side])}, stale. ${NAME[other(side)]} already paid out ${rupee(unseen)} it can't see.`, "bad"),
            staleReads: s.staleReads + 1,
            message: `AP answered with what ${name} has. Fine for a bio or a like count, dangerous for money.`,
          };
        }
        return {
          ...withLog(s, `${name} read: ${rupee(s.balance[side])} (no writes on the other side yet, so still correct).`, "good"),
          message: "AP answered from the local copy. It happens to be right, but nothing guarantees it during a partition.",
        };
      }
      if (s.balance[side] < AMOUNT) {
        return {
          ...withLog(s, `${name}: declined, local balance is ${rupee(s.balance[side])}.`, "neutral"),
          message: `${name}'s own copy is too low, so even AP declines. The other side may still pay out.`,
        };
      }
      const local = s.balance[side] - AMOUNT;
      const spent = { ...s.spent, [side]: s.spent[side] + AMOUNT };
      const both = spent.mumbai > 0 && spent.virginia > 0;
      return {
        ...withLog(s, `${name}: paid out ${rupee(AMOUNT)} from its local copy (${rupee(local)} left here).`, "accent"),
        balance: { ...s.balance, [side]: local },
        spent,
        paidOut: s.paidOut + AMOUNT,
        flash: { id: s.seq, kind: "payout", side },
        message: both
          ? `Both ATMs paid out ${rupee(AMOUNT)} from a ${rupee(s.base)} balance. Each side thought it was fine. Heal the network to see the damage.`
          : "AP stays available: the payout succeeds locally, but the two copies now disagree. Try withdrawing on the other side too.",
      };
    }

    case "timeout": {
      if (!s.pending || s.pending.id !== a.id) return s;
      const { side, op } = s.pending;
      const name = NAME[side];
      return {
        ...withLog(s, `${name}: timed out waiting for ${NAME[other(side)]} → error, ${op === "withdraw" ? "nothing paid out" : "no balance shown"}.`, "bad"),
        pending: null,
        errors: s.errors + 1,
        message: `CP refused rather than risk a wrong answer. The ATM shows "service unavailable" instead of a possible double payout.`,
      };
    }

    case "mode": {
      if (a.mode === s.mode) return s;
      let next = s.pending ? withLog({ ...s, pending: null }, `Pending request at ${NAME[s.pending.side]} cancelled.`, "neutral") : s;
      next = withLog({ ...next, mode: a.mode }, `Switched to ${a.mode}.`, "neutral");
      return { ...next, message: idleMessage(a.mode, s.partitioned) };
    }

    case "reset":
      return initialState(s.mode);
  }
}

/* ------------------------------------------------------------------ */
/* Diagram                                                             */
/* ------------------------------------------------------------------ */

const BOX = { mumbai: { x: 8, edge: 132 }, virginia: { x: 228, edge: 228 } } as const;
const LINK_Y = 80;

function DataCenter({ side, s }: { side: Side; s: CapState }) {
  const x = BOX[side].x;
  const bal = s.balance[side];
  const diverged = s.partitioned && (s.spent.mumbai > 0 || s.spent.virginia > 0);
  const waiting = s.pending?.side === side;
  const status = waiting ? "waiting…" : bal < 0 ? "overdrawn" : diverged ? "copies disagree" : "in agreement";
  return (
    <g>
      <rect
        x={x}
        y={36}
        width={124}
        height={88}
        rx={12}
        className={cn(
          "dg-box transition-[fill,stroke] duration-300",
          bal < 0 ? "dg-box--bad" : diverged ? "fill-warn-soft stroke-warn" : "dg-box--store",
        )}
      />
      <text x={x + 62} y={58} textAnchor="middle" className="dg-sub">
        {NAME[side]}
      </text>
      <text x={x + 62} y={88} textAnchor="middle" className={cn("dg-text text-[19px]", bal < 0 && "dg-text--bad")}>
        {rupee(bal)}
      </text>
      <text x={x + 62} y={112} textAnchor="middle" className={cn("dg-label", bal < 0 && "dg-text--bad")}>
        {status}
      </text>
    </g>
  );
}

function Movers({ s, reduced }: { s: CapState; reduced: boolean }) {
  if (reduced) {
    return s.pending ? (
      <circle cx={s.pending.side === "mumbai" ? 166 : 194} cy={LINK_Y} r={6} className="dg-dot dg-dot--accent" />
    ) : null;
  }
  const f = s.flash;
  return (
    <>
      {s.pending ? (
        <motion.circle
          key={`p${s.pending.id}`}
          r={6}
          className="dg-dot dg-dot--accent"
          initial={{ cx: BOX[s.pending.side].edge, cy: LINK_Y, opacity: 1 }}
          animate={{ cx: s.pending.side === "mumbai" ? 166 : 194, opacity: [1, 1, 0.35, 1] }}
          transition={{ cx: { duration: 0.45, ease: "easeOut" }, opacity: { duration: 1, repeat: Infinity, delay: 0.45 } }}
        />
      ) : null}
      <AnimatePresence>
        {f?.kind === "replicate" ? (
          <motion.circle
            key={`r${f.id}`}
            r={6}
            className="dg-dot dg-dot--good"
            initial={{ cx: BOX[f.from].edge, cy: LINK_Y, opacity: 1 }}
            animate={{ cx: BOX[other(f.from)].edge, opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
        ) : null}
        {f?.kind === "reconcile"
          ? SIDES.map((side) => (
              <motion.circle
                key={`c${f.id}-${side}`}
                r={6}
                className="dg-dot dg-dot--good"
                initial={{ cx: BOX[side].edge, cy: LINK_Y, opacity: 1 }}
                animate={{ cx: BOX[other(side)].edge, opacity: [1, 1, 0] }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            ))
          : null}
        {f?.kind === "payout" ? (
          <motion.text
            key={`o${f.id}`}
            x={BOX[f.side].x + 62}
            textAnchor="middle"
            className="dg-text dg-text--bad"
            initial={{ y: 30, opacity: 1 }}
            animate={{ y: 10, opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          >
            −{rupee(AMOUNT)}
          </motion.text>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function PartitionDiagram({ s, reduced }: { s: CapState; reduced: boolean }) {
  const caption = s.partitioned
    ? s.mode === "CP"
      ? "CP: refuse (or wait) rather than risk a wrong answer"
      : "AP: answer from the local copy, reconcile later"
    : "Link up: one consistent balance";
  return (
    <svg
      viewBox="0 0 360 160"
      className="block h-auto w-full max-w-[34rem]"
      role="img"
      aria-label={`Mumbai shows ${rupee(s.balance.mumbai)}, Virginia shows ${rupee(s.balance.virginia)}. The link is ${s.partitioned ? "cut" : "up"}.`}
    >
      <path
        d={`M132 ${LINK_Y} H228`}
        className={cn("dg-line", s.partitioned ? "dg-line--bad dg-line--dash" : "dg-line--good")}
        strokeWidth={2.5}
      />
      <text x={180} y={LINK_Y - 12} textAnchor="middle" className={cn("dg-label", s.partitioned && "dg-text--bad")}>
        {s.partitioned ? "partition!" : "replication"}
      </text>
      {s.partitioned ? <path d={`M172 ${LINK_Y - 9} L188 ${LINK_Y + 9} M188 ${LINK_Y - 9} L172 ${LINK_Y + 9}`} className="dg-line dg-line--bad" strokeWidth={3} /> : null}
      {SIDES.map((side) => (
        <DataCenter key={side} side={side} s={s} />
      ))}
      <Movers s={s} reduced={reduced} />
      <text x={180} y={150} textAnchor="middle" className="dg-label">
        {caption}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

function AtmPanel({
  side,
  s,
  reduced,
  onWithdraw,
  onRead,
}: {
  side: Side;
  s: CapState;
  reduced: boolean;
  onWithdraw: () => void;
  onRead: () => void;
}) {
  const waiting = s.pending?.side === side ? s.pending : null;
  return (
    <div role="group" aria-label={`${NAME[side]} ATM`} className="flex flex-col gap-2 rounded-lg border border-line bg-surface-2 p-2.5">
      <p className="text-[0.85rem] font-bold text-ink">{NAME[side]} ATM</p>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="primary" onClick={onWithdraw} disabled={s.pending !== null}>
          Withdraw {rupee(AMOUNT)}
        </Button>
        <Button size="sm" variant="secondary" onClick={onRead} disabled={s.pending !== null}>
          Check balance
        </Button>
      </div>
      {waiting ? (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.72rem] text-accent">
            waiting for {NAME[other(side)]} to confirm… (gives up after {CP_TIMEOUT_MS / 1000} s)
          </span>
          {reduced ? null : (
            <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-surface-3">
              <motion.span
                key={waiting.id}
                className="block h-full rounded-full bg-accent"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: CP_TIMEOUT_MS / 1000, ease: "linear" }}
              />
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

function CapPartition() {
  const reduced = useReducedMotion();
  const [s, dispatch] = useReducer(reducer, "CP", initialState);

  useEffect(() => {
    if (!s.pending) return;
    const id = s.pending.id;
    const t = window.setTimeout(() => dispatch({ type: "timeout", id }), CP_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [s.pending]);

  const toggleLink = () => {
    const spent = s.spent.mumbai + s.spent.virginia;
    if (s.partitioned && s.spent.mumbai > 0 && s.spent.virginia > 0 && s.base - spent < 0) {
      emitCompanionEvent({ type: "diagram", mood: "confused", message: "Both ATMs paid out. That's why money is CP!" });
    }
    dispatch({ type: "toggle-link" });
  };

  return (
    <WidgetFrame
      kicker="Break it"
      title="A network partition"
      hint={`One account, two data centers. Cut the link, then withdraw ${rupee(AMOUNT)} on both sides. Compare CP with AP.`}
      note={s.message}
    >
      <ControlRow>
        <SegmentedControl
          label="Consistency mode"
          size="sm"
          value={s.mode}
          onChange={(mode) => dispatch({ type: "mode", mode })}
          options={[
            { value: "CP", label: "CP: refuse or wait" },
            { value: "AP", label: "AP: answer locally" },
          ]}
        />
        <Button size="sm" variant={s.partitioned ? "success" : "danger"} onClick={toggleLink}>
          {s.partitioned ? <Cable size={15} aria-hidden="true" /> : <Scissors size={15} aria-hidden="true" />}
          {s.partitioned ? "Heal network" : "Cut network"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "reset" })}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </Button>
      </ControlRow>

      <WidgetScroll>
        <div className="min-w-[288px]">
          <PartitionDiagram s={s} reduced={reduced} />
        </div>
      </WidgetScroll>

      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
        {SIDES.map((side) => (
          <AtmPanel
            key={side}
            side={side}
            s={s}
            reduced={reduced}
            onWithdraw={() => dispatch({ type: "withdraw", side })}
            onRead={() => dispatch({ type: "read", side })}
          />
        ))}
      </div>

      <StatGrid>
        <Stat label="Mode" value={s.mode} tone="accent" />
        <Stat label="Paid out" value={rupee(s.paidOut)} tone={s.paidOut > START ? "bad" : "neutral"} />
        <Stat label="Errors" value={s.errors} tone={s.errors ? "warn" : "neutral"} />
        <Stat label="Stale reads" value={s.staleReads} tone={s.staleReads ? "bad" : "neutral"} />
      </StatGrid>
      <EventLog entries={s.log} label="Partition events" />
    </WidgetFrame>
  );
}

export default CapPartition satisfies ComponentType<InteractiveProps>;
