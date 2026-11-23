"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/** Props every interactive diagram accepts. `variant` picks a preset (e.g. estimator "chat", recall deck "test"). */
export interface InteractiveProps {
  variant?: string;
}

function Loading() {
  return (
    <div
      role="status"
      className="my-8 flex h-56 items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-2 text-sm text-ink-3"
    >
      Loading the simulation…
    </div>
  );
}

const load = (importer: () => Promise<{ default: ComponentType<InteractiveProps> }>) =>
  dynamic(importer, { ssr: false, loading: Loading });

/**
 * Every interactive diagram, code-split so a lesson only downloads what it uses.
 * Use in MDX as <Interactive name="lb-sim" />.
 */
export const interactiveRegistry = {
  "request-journey": load(() => import("./interactive/request-journey")),
  "dns-lookup": load(() => import("./interactive/dns-lookup")),
  "tcp-udp": load(() => import("./interactive/tcp-udp")),
  "latency-scale": load(() => import("./interactive/latency-scale")),
  "tail-latency": load(() => import("./interactive/tail-latency")),
  "littles-law": load(() => import("./interactive/littles-law")),
  "lb-sim": load(() => import("./interactive/lb-sim")),
  "scaling-compare": load(() => import("./interactive/scaling-compare")),
  "polling-vs-ws": load(() => import("./interactive/polling-vs-ws")),
  "index-scan": load(() => import("./interactive/index-scan")),
  "replication-lag": load(() => import("./interactive/replication-lag")),
  "shard-router": load(() => import("./interactive/shard-router")),
  "cap-partition": load(() => import("./interactive/cap-partition")),
  "cache-aside": load(() => import("./interactive/cache-aside")),
  "queue-leveling": load(() => import("./interactive/queue-leveling")),
  "pubsub-fanout": load(() => import("./interactive/pubsub-fanout")),
  nines: load(() => import("./interactive/nines")),
  "backoff-jitter": load(() => import("./interactive/backoff-jitter")),
  "circuit-breaker": load(() => import("./interactive/circuit-breaker")),
  "token-bucket": load(() => import("./interactive/token-bucket")),
  idempotency: load(() => import("./interactive/idempotency")),
  estimator: load(() => import("./interactive/estimator")),
  base62: load(() => import("./interactive/base62")),
  "recall-cards": load(() => import("./interactive/recall-cards")),
  "architecture-map": load(() => import("./interactive/architecture-map")),
} satisfies Record<string, ComponentType<InteractiveProps>>;

export type InteractiveName = keyof typeof interactiveRegistry;

export const interactiveNames = Object.keys(interactiveRegistry) as InteractiveName[];
