// State machine for the idempotency widget: one tap of "Pay ₹500" becomes a scripted exchange of messages.

export type NoteTone = "neutral" | "good" | "bad" | "warn";

export type Row =
  | { id: number; kind: "msg"; dir: "out" | "back"; text: string; detail?: string; lost: boolean }
  | { id: number; kind: "note"; side: "client" | "server"; text: string; tone: NoteTone };

export interface Charge {
  order: number;
  duplicate: boolean;
}

export interface StoredKey {
  key: string;
  order: number;
  hits: number;
}

type Step = "request" | "process" | "reply" | "timeout" | "giveUp" | "retry" | "processRetry" | "replyRetry" | "summary";

export interface RunConfig {
  key: string | null;
  lost: boolean;
  autoRetry: boolean;
}

interface Run extends RunConfig {
  id: number;
  steps: Step[];
  index: number;
  chargesBefore: number;
  firstOrder: number;
  retryOrder: number;
}

export type OutcomeKind = "double" | "safe" | "clean" | "unknown";

export interface Outcome {
  runId: number;
  kind: OutcomeKind;
  quiet: boolean;
}

export interface FlowState {
  rows: Row[];
  charges: Charge[];
  store: StoredKey[];
  requests: number;
  nextOrder: number;
  nextId: number;
  run: Run | null;
  outcome: Outcome | null;
  /** Key the server just found in its store (highlighted). */
  hitKey: string | null;
  cleared: boolean;
}

export type FlowAction = { type: "pay"; config: RunConfig; instant: boolean } | { type: "step" } | { type: "clear" };

export const AMOUNT = 500;

function stepsFor(c: RunConfig): Step[] {
  if (!c.lost) return ["request", "process", "reply", "summary"];
  if (!c.autoRetry) return ["request", "process", "reply", "giveUp", "summary"];
  return ["request", "process", "reply", "timeout", "retry", "processRetry", "replyRetry", "summary"];
}

type RowInput = Omit<Extract<Row, { kind: "msg" }>, "id"> | Omit<Extract<Row, { kind: "note" }>, "id">;

function addRow(s: FlowState, row: RowInput): FlowState {
  return { ...s, nextId: s.nextId + 1, rows: [...s.rows, { ...row, id: s.nextId }] };
}

function keyLine(key: string | null): string {
  return key ? `Idempotency-Key: ${key}` : "no Idempotency-Key";
}

function charge(s: FlowState, duplicate: boolean): [FlowState, number] {
  const order = s.nextOrder;
  return [{ ...s, nextOrder: order + 1, charges: [{ order, duplicate }, ...s.charges] }, order];
}

function applyStep(state: FlowState, run: Run, step: Step, quiet: boolean): FlowState {
  let s = state;
  switch (step) {
    case "request":
      return addRow({ ...s, requests: s.requests + 1 }, { kind: "msg", dir: "out", text: `POST /payments · ₹${AMOUNT}`, detail: keyLine(run.key), lost: false });
    case "process": {
      let order: number;
      [s, order] = charge(s, false);
      s = { ...s, run: { ...run, firstOrder: order } };
      if (run.key) {
        s = { ...s, store: [{ key: run.key, order, hits: 0 }, ...s.store] };
        return addRow(s, { kind: "note", side: "server", text: `New key: charge ₹${AMOUNT}, save ${run.key} → order #${order} in the same transaction`, tone: "warn" });
      }
      return addRow(s, { kind: "note", side: "server", text: `Charge ₹${AMOUNT} · create order #${order}`, tone: "warn" });
    }
    case "reply":
      return addRow(s, { kind: "msg", dir: "back", text: `201 Created · order #${run.firstOrder}`, lost: run.lost });
    case "timeout":
      return addRow(s, {
        kind: "note",
        side: "client",
        text: `No reply within the 2 s timeout → retry${run.key ? " with the same key" : ""}`,
        tone: "neutral",
      });
    case "giveUp":
      return addRow(s, { kind: "note", side: "client", text: "No reply within 2 s → show “Payment failed?”", tone: "bad" });
    case "retry":
      return addRow({ ...s, requests: s.requests + 1 }, {
        kind: "msg",
        dir: "out",
        text: `POST /payments · ₹${AMOUNT} (retry)`,
        detail: keyLine(run.key),
        lost: false,
      });
    case "processRetry": {
      if (run.key) {
        const key = run.key;
        s = { ...s, hitKey: key, store: s.store.map((k) => (k.key === key ? { ...k, hits: k.hits + 1 } : k)) };
        return addRow(s, { kind: "note", side: "server", text: `Key ${key} seen: skip the charge, return the saved result`, tone: "good" });
      }
      let order: number;
      [s, order] = charge(s, true);
      s = { ...s, run: { ...run, retryOrder: order } };
      return addRow(s, { kind: "note", side: "server", text: `Looks like a new payment: charge ₹${AMOUNT} again · order #${order}`, tone: "bad" });
    }
    case "replyRetry":
      return addRow(s, { kind: "msg", dir: "back", text: `201 Created · order #${run.key ? run.firstOrder : run.retryOrder}`, lost: false });
    case "summary": {
      const n = s.charges.length - run.chargesBefore;
      const kind: OutcomeKind = n > 1 ? "double" : !run.lost ? "clean" : run.autoRetry ? "safe" : "unknown";
      const text =
        kind === "double"
          ? `Charged twice: ₹${(AMOUNT * n).toLocaleString("en-IN")} for one tap`
          : kind === "unknown"
            ? `Charged ₹${AMOUNT}, but the app does not know`
            : `Charged once: ₹${AMOUNT}`;
      s = addRow(s, { kind: "note", side: "client", text, tone: kind === "double" || kind === "unknown" ? "bad" : "good" });
      return { ...s, run: null, outcome: { runId: run.id, kind, quiet } };
    }
  }
}

function stepOnce(s: FlowState, quiet = false): FlowState {
  const run = s.run;
  if (!run) return s;
  const step = run.steps[run.index];
  const advanced: FlowState = { ...s, run: { ...run, index: run.index + 1 } };
  return applyStep(advanced, { ...run, index: run.index + 1 }, step, quiet);
}

function start(s: FlowState, config: RunConfig): FlowState {
  const run: Run = {
    ...config,
    id: s.nextId,
    steps: stepsFor(config),
    index: 0,
    chargesBefore: s.charges.length,
    firstOrder: 0,
    retryOrder: 0,
  };
  return { ...s, nextId: s.nextId + 1, rows: [], run, outcome: null, hitKey: null, cleared: false };
}

function runAll(s: FlowState, quiet: boolean): FlowState {
  let next = s;
  for (let guard = 0; next.run && guard < 20; guard++) next = stepOnce(next, quiet);
  return next;
}

export function flowReducer(s: FlowState, a: FlowAction): FlowState {
  switch (a.type) {
    case "pay":
      if (s.run) return s;
      return a.instant ? runAll(start(s, a.config), false) : start(s, a.config);
    case "step":
      return stepOnce(s);
    case "clear":
      if (s.run) return s;
      return { ...s, rows: [], charges: [], store: [], requests: 0, outcome: null, hitKey: null, cleared: true };
  }
}

/** Opens with the failure case already played out: reply lost, no key, double charge. */
export function initialFlow(): FlowState {
  const empty: FlowState = {
    rows: [],
    charges: [],
    store: [],
    requests: 0,
    nextOrder: 1042,
    nextId: 1,
    run: null,
    outcome: null,
    hitKey: null,
    cleared: false,
  };
  return runAll(start(empty, { key: null, lost: true, autoRetry: true }), true);
}
