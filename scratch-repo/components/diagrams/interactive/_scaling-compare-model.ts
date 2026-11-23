/**
 * Model for the scaling-compare diagram: one machine that grows (vertical) vs many small
 * machines behind a load balancer (horizontal). Prices and capacities are illustrative but
 * internally consistent: a 4-core server handles 1,000 req/s and costs $150/month.
 */

export interface Tier {
  name: string;
  cores: number;
  ramGb: number;
  /** Requests per second it can serve. Grows sub-linearly: more cores contend for locks and memory. */
  capacity: number;
  /** Dollars per month. The biggest boxes carry a premium. */
  cost: number;
}

export const TIERS: readonly Tier[] = [
  { name: "Small", cores: 4, ramGb: 16, capacity: 1000, cost: 150 },
  { name: "Medium", cores: 8, ramGb: 32, capacity: 2000, cost: 300 },
  { name: "Large", cores: 16, ramGb: 64, capacity: 3800, cost: 600 },
  { name: "XL", cores: 32, ramGb: 128, capacity: 7000, cost: 1200 },
  { name: "2XL", cores: 64, ramGb: 256, capacity: 12000, cost: 2400 },
  { name: "Largest", cores: 128, ramGb: 1024, capacity: 20000, cost: 6000 },
];

export const NODE = { cores: 4, ramGb: 16, capacity: 1000, cost: 150 } as const;
export const LB_COST = 25;
export const MAX_NODES = 30;
/** Compressed times: a real resize takes minutes, a real boot 1–3 minutes, a health check a few seconds. */
export const RESIZE_MS = 2500;
export const BOOT_MS = 2000;
export const DETECT_MS = 1200;

export type VerticalStatus = "up" | "down" | "resizing" | "restarting";
export type NodeStatus = "up" | "booting" | "down";

export interface VerticalState {
  tier: number;
  status: VerticalStatus;
  /** When a resize or restart finishes (ms timestamp). */
  until: number | null;
}

export interface NodeState {
  id: number;
  status: NodeStatus;
  /** Booting: when it joins. Down: when the LB's health check pulls it. */
  until: number | null;
}

export interface ScaleState {
  load: number;
  vertical: VerticalState;
  nodes: NodeState[];
  nextId: number;
  note: string;
}

export type ScaleAction =
  | { type: "load"; load: number }
  | { type: "resize"; now: number }
  | { type: "kill-vertical" }
  | { type: "restart-vertical"; now: number }
  | { type: "add-node"; now: number }
  | { type: "remove-node" }
  | { type: "kill-node"; now: number }
  | { type: "settle"; now: number };

/* ------------------------------------------------------------------ metrics */

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const money = (n: number) => `$${fmt(n)}`;

export function verticalMetrics(v: VerticalState, load: number) {
  const tier = TIERS[v.tier];
  const live = v.status === "up" ? tier.capacity : 0;
  const served = Math.min(load, live);
  return {
    tier,
    capacity: tier.capacity,
    served,
    dropped: load - served,
    utilisation: load / tier.capacity,
    cost: tier.cost,
    atCeiling: v.tier === TIERS.length - 1,
  };
}

export function horizontalMetrics(nodes: readonly NodeState[], load: number) {
  const up = nodes.filter((n) => n.status === "up").length;
  const down = nodes.filter((n) => n.status === "down").length;
  const booting = nodes.filter((n) => n.status === "booting").length;
  // Until the health check notices, the LB keeps sending a share to dead servers.
  const receiving = up + down;
  const share = receiving > 0 ? load / receiving : 0;
  const served = up * Math.min(share, NODE.capacity);
  return {
    up,
    down,
    booting,
    share,
    capacity: up * NODE.capacity,
    served,
    dropped: load - served,
    utilisation: up > 0 ? load / (up * NODE.capacity) : Infinity,
    cost: nodes.length * NODE.cost + LB_COST,
  };
}

export function nextDue(state: ScaleState): number | null {
  const times = [state.vertical.until, ...state.nodes.map((n) => n.until)].filter((t): t is number => t !== null);
  return times.length ? Math.min(...times) : null;
}

/* ------------------------------------------------------------------ notes */

function loadNote(state: ScaleState): string {
  const v = verticalMetrics(state.vertical, state.load);
  const h = horizontalMetrics(state.nodes, state.load);
  const vText =
    v.dropped > 0
      ? `scale-up drops ${fmt(v.dropped)} req/s${v.atCeiling ? " and there is no bigger machine to buy: that is the hard ceiling" : ": upgrade it"}`
      : `scale-up runs at ${Math.round(v.utilisation * 100)}%`;
  const hText =
    h.dropped > 0 ? `scale-out drops ${fmt(h.dropped)} req/s: add ${Math.ceil(h.dropped / NODE.capacity)} more servers` : `scale-out runs at ${Math.round(h.utilisation * 100)}%`;
  return `At ${fmt(state.load)} req/s, ${vText}; ${hText}.`;
}

/* ------------------------------------------------------------------ reducer */

export function initialScaleState(): ScaleState {
  const state: ScaleState = {
    load: 3000,
    vertical: { tier: 2, status: "up", until: null },
    nodes: [1, 2, 3, 4].map((id) => ({ id, status: "up" as const, until: null })),
    nextId: 5,
    note: "",
  };
  return { ...state, note: `${loadNote(state)} Push the traffic up, then try upgrading, adding servers and killing machines.` };
}

export function scaleReducer(state: ScaleState, action: ScaleAction): ScaleState {
  switch (action.type) {
    case "load": {
      const next = { ...state, load: action.load };
      return { ...next, note: loadNote(next) };
    }
    case "resize": {
      const target = TIERS[state.vertical.tier + 1];
      if (!target || state.vertical.status !== "up") return state;
      return {
        ...state,
        vertical: { ...state.vertical, status: "resizing", until: action.now + RESIZE_MS },
        note: `Resizing to ${target.name} (${target.cores} cores). A vertical upgrade usually means stopping the machine, so every request fails until it is back.`,
      };
    }
    case "kill-vertical": {
      if (state.vertical.status !== "up") return state;
      return {
        ...state,
        vertical: { ...state.vertical, status: "down", until: null },
        note: `The only machine died, so all ${fmt(state.load)} req/s fail. One big machine is a single point of failure.`,
      };
    }
    case "restart-vertical": {
      if (state.vertical.status !== "down") return state;
      return {
        ...state,
        vertical: { ...state.vertical, status: "restarting", until: action.now + BOOT_MS },
        note: "Restarting the machine. Nothing is served until it is back.",
      };
    }
    case "add-node": {
      if (state.nodes.length >= MAX_NODES) return state;
      return {
        ...state,
        nodes: [...state.nodes, { id: state.nextId, status: "booting", until: action.now + BOOT_MS }],
        nextId: state.nextId + 1,
        note: "A new server is booting. It joins once it passes a health check, and nobody else notices: no downtime.",
      };
    }
    case "remove-node": {
      const ups = state.nodes.filter((n) => n.status === "up");
      if (ups.length <= 1) return state;
      const victim = ups[ups.length - 1].id;
      const next = { ...state, nodes: state.nodes.filter((n) => n.id !== victim) };
      return { ...next, note: `Drained and removed a server to save ${money(NODE.cost)}/month. ${loadNote(next)}` };
    }
    case "kill-node": {
      const ups = state.nodes.filter((n) => n.status === "up");
      if (ups.length === 0) return state;
      const victim = ups[ups.length - 1].id;
      const receiving = ups.length + state.nodes.filter((n) => n.status === "down").length;
      return {
        ...state,
        nodes: state.nodes.map((n): NodeState => (n.id === victim ? { ...n, status: "down", until: action.now + DETECT_MS } : n)),
        note: `A server died. Until the LB's health check notices, 1 in ${receiving} requests is sent to it and fails.`,
      };
    }
    case "settle": {
      let note = state.note;
      let vertical = state.vertical;
      if (vertical.until !== null && vertical.until <= action.now) {
        if (vertical.status === "resizing") {
          const tier = vertical.tier + 1;
          const t = TIERS[tier];
          vertical = { tier, status: "up", until: null };
          note =
            tier === TIERS.length - 1
              ? `Back up on the ${t.name} machine: ${t.cores} cores, ${fmt(t.capacity)} req/s, ${money(t.cost)}/month. There is nothing bigger to buy: this is vertical scaling's ceiling.`
              : `Back up on ${t.name}: ${t.cores} cores, ${fmt(t.capacity)} req/s, ${money(t.cost)}/month.`;
        } else {
          vertical = { ...vertical, status: "up", until: null };
          note = "The machine is back up.";
        }
      }
      let joined = 0;
      let pulled = 0;
      const nodes = state.nodes.flatMap((n): NodeState[] => {
        if (n.until === null || n.until > action.now) return [n];
        if (n.status === "booting") {
          joined++;
          return [{ ...n, status: "up", until: null }];
        }
        pulled++;
        return [];
      });
      const next = { ...state, vertical, nodes };
      if (joined || pulled) {
        const h = horizontalMetrics(nodes, state.load);
        note = pulled
          ? `The LB pulled the dead server. ${h.up} servers now carry ${fmt(h.share)} req/s each${h.dropped > 0 ? `, more than they can take: add servers.` : `, within capacity: users never noticed.`}`
          : `New server joined: capacity is now ${fmt(h.capacity)} req/s.`;
      }
      return { ...next, note };
    }
  }
}
