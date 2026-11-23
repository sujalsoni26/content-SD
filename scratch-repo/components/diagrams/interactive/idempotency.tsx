"use client";
import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { CreditCard, Server, Smartphone, X } from "lucide-react";
import { ControlRow, WidgetFrame } from "@/components/ui/widget-frame";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Chip } from "@/components/ui/chip";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";
import { useLoopActive } from "./_wc-frame-loop";
import { AMOUNT, flowReducer, initialFlow, type FlowState, type NoteTone, type Outcome, type Row } from "./_idempotency-flow";

const STEP_MS = 750;

const REPLY_OPTIONS = [
  { value: "ok", label: "Delivered" },
  { value: "lost", label: "Lost" },
] as const;
const ON_OFF = [
  { value: "off", label: "Off" },
  { value: "on", label: "On" },
] as const;
type OnOff = (typeof ON_OFF)[number]["value"];

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** A short random key like "kqz-482": one per tap, reused by every retry of that tap. */
function newKey(): string {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 3; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return `${s}-${100 + Math.floor(Math.random() * 900)}`;
}

/* ---------------- sequence diagram ---------------- */

const NOTE_TONE: Record<NoteTone, string> = {
  neutral: "border-line bg-surface text-ink-2",
  good: "border-good bg-good-soft text-good",
  bad: "border-bad bg-bad-soft text-bad",
  warn: "border-amber bg-amber-soft text-amber-ink",
};

function Arrow({ row, reduced }: { row: Extract<Row, { kind: "msg" }>; reduced: boolean }) {
  const out = row.dir === "out";
  const color = row.lost ? "bg-bad" : out ? "bg-accent" : "bg-good";
  const head = row.lost ? "" : out ? "border-l-accent" : "border-r-good";
  return (
    <div className="relative mx-[25%] h-3">
      <motion.div
        className={cn("absolute top-1/2 h-0.5 -translate-y-1/2", color, row.lost ? "w-1/2" : "w-full", out ? "left-0" : "right-0")}
        style={{ transformOrigin: out ? "left center" : "right center" }}
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
      {row.lost ? (
        <motion.span
          className="absolute left-1/2 top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bad text-accent-ink"
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: reduced ? 0 : 0.4, duration: 0.2 }}
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      ) : (
        <motion.span
          className={cn(
            "absolute top-1/2 h-0 w-0 -translate-y-1/2 border-y-[5px] border-y-transparent",
            out ? "right-0 border-l-[8px]" : "left-0 border-r-[8px]",
            head,
          )}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 0.4, duration: 0.1 }}
        />
      )}
    </div>
  );
}

function SequenceRow({ row, reduced }: { row: Row; reduced: boolean }) {
  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative"
    >
      {row.kind === "msg" ? (
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className={cn("rounded bg-surface-2 px-1 font-mono text-[0.78rem] font-semibold", row.lost ? "text-bad" : "text-ink")}>
            {row.text}
            {row.lost ? <span className="font-sans font-bold"> · lost on the network</span> : null}
          </span>
          {row.detail ? (
            <span className={cn("rounded bg-surface-2 px-1 font-mono text-[0.72rem]", row.detail.startsWith("no ") ? "text-ink-3" : "text-accent")}>{row.detail}</span>
          ) : null}
          <span className="sr-only">{row.dir === "out" ? "Client to server" : "Server to client"}</span>
          <div className="w-full">
            <Arrow row={row} reduced={reduced} />
          </div>
        </div>
      ) : (
        <div className={cn("flex", row.side === "client" ? "justify-start" : "justify-end")}>
          <p className={cn("max-w-[78%] rounded-lg border px-2.5 py-1.5 text-[0.8rem] leading-snug", NOTE_TONE[row.tone])}>
            <span className="sr-only">{row.side === "client" ? "Client: " : "Server: "}</span>
            {row.text}
          </p>
        </div>
      )}
    </motion.li>
  );
}

function Sequence({ rows, reduced }: { rows: Row[]; reduced: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface-2 px-2 pb-3 pt-2 sm:px-3">
      <div className="relative">
        {/* Lifelines sit in the same box as the rows, so arrows (inset 25%) start and end on them. */}
        <span aria-hidden="true" className="absolute bottom-0 left-1/4 top-7 border-l-2 border-dashed border-line-strong" />
        <span aria-hidden="true" className="absolute bottom-0 left-3/4 top-7 border-l-2 border-dashed border-line-strong" />
        <div className="relative mb-2 grid grid-cols-2 text-center text-[0.8rem] font-bold text-ink">
          <span className="inline-flex items-center justify-center gap-1.5">
            <Smartphone aria-hidden="true" className="h-4 w-4 text-ink-3" />
            Client app
          </span>
          <span className="inline-flex items-center justify-center gap-1.5">
            <Server aria-hidden="true" className="h-4 w-4 text-ink-3" />
            Payment server
          </span>
        </div>
        <ol aria-label="Messages between the app and the payment server" className="relative flex min-h-48 flex-col gap-2.5">
          {rows.map((r) => (
            <SequenceRow key={r.id} row={r} reduced={reduced} />
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---------------- server side: statement and key store ---------------- */

function Panel({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-xl border border-line p-3">
      <h4 className="flex flex-wrap items-baseline justify-between gap-x-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-3">
        {title}
        {aside ? <span className="normal-case tracking-normal">{aside}</span> : null}
      </h4>
      {children}
    </section>
  );
}

function Statement({ charges, reduced }: { charges: FlowState["charges"]; reduced: boolean }) {
  return (
    <Panel title="Card statement">
      <ul className="flex max-h-44 flex-col gap-1 overflow-y-auto text-[0.84rem]">
        {charges.length === 0 ? <li className="text-ink-3">No charges yet.</li> : null}
        {charges.map((c) => (
          <motion.li
            key={c.order}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-2 py-1",
              c.duplicate ? "bg-bad-soft text-bad" : "bg-surface-2 text-ink",
            )}
          >
            <CreditCard aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="font-bold tabular-nums">{rupees(AMOUNT)}</span>
            <span className="font-mono text-[0.76rem]">order #{c.order}</span>
            {c.duplicate ? <Chip tone="bad">duplicate</Chip> : null}
          </motion.li>
        ))}
      </ul>
    </Panel>
  );
}

function KeyStore({ store, hitKey }: { store: FlowState["store"]; hitKey: string | null }) {
  return (
    <Panel title="Idempotency store" aside="keys expire after 24 h">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-[0.8rem]">
          <thead className="text-ink-3">
            <tr>
              <th scope="col" className="py-1 pr-2 font-semibold">
                Key
              </th>
              <th scope="col" className="py-1 pr-2 font-semibold">
                Saved result
              </th>
              <th scope="col" className="py-1 text-right font-semibold">
                Replays
              </th>
            </tr>
          </thead>
          <tbody>
            {store.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-1 text-ink-3">
                  Empty: no request has carried a key yet.
                </td>
              </tr>
            ) : null}
            {store.map((k) => (
              <tr key={k.key} className={cn("border-t border-line transition-colors duration-500", k.key === hitKey && "bg-good-soft")}>
                <td className="py-1 pr-2 font-mono text-accent">{k.key}</td>
                <td className="py-1 pr-2 font-mono">201 · order #{k.order}</td>
                <td className={cn("py-1 text-right tabular-nums", k.hits > 0 && "font-bold text-good")}>{k.hits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function explain(s: FlowState) {
  if (s.run) return <>Paying… watch the messages.</>;
  if (s.cleared) {
    return (
      <>
        Statement cleared. Press <strong>Pay ₹500</strong>.
      </>
    );
  }
  switch (s.outcome?.kind) {
    case "double":
      return (
        <>
          <strong>Double charge.</strong> POST is not idempotent: the server could not tell the retry from a new payment. Turn
          the Idempotency-Key on and pay again.
        </>
      );
    case "safe":
      return (
        <>
          <strong>Safe retry.</strong> The retry carried the same key, so the server returned the saved result instead of charging
          again. Stripe’s payment API works this way.
        </>
      );
    case "unknown":
      return (
        <>
          <strong>Charged, but the app doesn’t know.</strong> Without a retry the user sees an error after ₹500 has left their
          account, and may well tap Pay again. That is why clients retry, and why retries must be safe.
        </>
      );
    case "clean":
      return (
        <>
          <strong>No retry needed.</strong> The reply arrived, so the client never retried. Set Reply to Lost to see why keys matter.
        </>
      );
    default:
      return null;
  }
}

function useOutcomeCompanion(outcome: Outcome | null) {
  const said = useRef({ double: false, safe: false });
  useEffect(() => {
    if (!outcome || outcome.quiet) return;
    if (outcome.kind === "double" && !said.current.double) {
      said.current.double = true;
      emitCompanionEvent({ type: "diagram", mood: "confused", message: "Charged twice for one tap! Turn on the Idempotency-Key and pay again." });
    } else if (outcome.kind === "safe" && !said.current.safe) {
      said.current.safe = true;
      emitCompanionEvent({ type: "diagram", mood: "happy", message: "One tap, one charge, even with a retry." });
    }
  }, [outcome]);
}

export default function Idempotency() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const active = useLoopActive(ref);
  const [state, dispatch] = useReducer(flowReducer, undefined, initialFlow);
  const [lost, setLost] = useState(true);
  const [useKey, setUseKey] = useState(false);
  const [autoRetry, setAutoRetry] = useState(true);

  // Play the scripted exchange one step at a time; it pauses off-screen.
  const run = state.run;
  useEffect(() => {
    if (!run || !active) return;
    const id = window.setTimeout(() => dispatch({ type: "step" }), STEP_MS);
    return () => window.clearTimeout(id);
  }, [run, active]);

  useOutcomeCompanion(state.outcome);

  const pay = () =>
    dispatch({ type: "pay", config: { key: useKey ? newKey() : null, lost, autoRetry }, instant: reduced });

  return (
    <WidgetFrame
      title="Retry a payment safely"
      hint="The server charges the card, the reply gets lost, and the app retries. Compare the run with and without an idempotency key."
      note={explain(state)}
    >
      <div ref={ref} className="flex flex-col gap-4">
        <ControlRow>
          <span className="text-sm font-bold text-ink-2">Reply</span>
          <SegmentedControl label="Server reply" size="sm" options={REPLY_OPTIONS} value={lost ? "lost" : "ok"} onChange={(v) => setLost(v === "lost")} />
          <span className="text-sm font-bold text-ink-2">Auto-retry</span>
          <SegmentedControl
            label="Client auto-retry"
            size="sm"
            options={ON_OFF}
            value={autoRetry ? "on" : "off"}
            onChange={(v: OnOff) => setAutoRetry(v === "on")}
          />
          <span className="text-sm font-bold text-ink-2">Idempotency-Key</span>
          <SegmentedControl label="Idempotency key" size="sm" options={ON_OFF} value={useKey ? "on" : "off"} onChange={(v: OnOff) => setUseKey(v === "on")} />
        </ControlRow>
        <ControlRow>
          <Button variant="primary" onClick={pay} disabled={state.run !== null}>
            Pay {rupees(AMOUNT)}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "clear" })} disabled={state.run !== null}>
            Clear statement
          </Button>
        </ControlRow>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Sequence rows={state.rows} reduced={reduced} />
          <div className="flex min-w-0 flex-col gap-3">
            <Statement charges={state.charges} reduced={reduced} />
            <KeyStore store={state.store} hitKey={state.hitKey} />
          </div>
        </div>
        <StatGrid>
          <Stat label="Total charged" value={rupees(state.charges.length * AMOUNT)} tone={state.charges.some((c) => c.duplicate) ? "bad" : "neutral"} />
          <Stat label="Charges" value={state.charges.length} />
          <Stat label="Requests sent" value={state.requests} />
        </StatGrid>
      </div>
    </WidgetFrame>
  );
}
