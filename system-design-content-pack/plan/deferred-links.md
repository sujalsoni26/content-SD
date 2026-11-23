# Deferred forward links

Links from existing (modules 1–6) lessons to lessons that do not exist yet. The validator rejects links to unknown slugs, so each is added in the phase that creates its target, then the source lesson is re-validated. Checked off when done.

| Source lesson | Link to add | Where in the lesson | Target phase |
| --- | --- | --- | --- |
| `http` | `authentication`, `encryption` | after "Stateless" bullet / HTTPS section | 3 (security) |
| `dns` | `cdn-internals`, `service-discovery` | "Caching cuts both ways" | 3 (infrastructure) |
| `proxy` | `api-gateway`, `service-mesh` | "What a reverse proxy does" | 3 (architecture) |
| `scaling` | `autoscaling`, `capacity-planning` | "Elasticity (autoscaling)" | 3 (infrastructure, operations) |
| `cdn` | `cdn-internals` | after the Callout | 3 (infrastructure) |
| `rest` | `api-security` | "Errors a client can act on" | 3 (security) |
| `microservices` | `modular-monolith-soa`, `api-gateway`, `service-mesh`, `strangler-fig` | bullets and DeepDive | 3 (architecture) |
| `sql-nosql` | `distributed-sql` | "The line is blurring" | 3 (internals, P2) |
| `acid` | `wal`, `mvcc-isolation` | Durability paragraph; isolation DeepDive | 3 (internals) |
| `indexing` | `query-execution`, `btree-vs-lsm` | "Kinds of index"; B-tree DeepDive | 3 (internals) |
| `replication` | `replication-internals`, `quorums` | Callout "The limit"; semi-sync DeepDive | 3 (internals, distributed) |
| `sharding` | `partitioning-internals` | "What gets hard" | 3 (internals) |
| `consistency` | `linearizability` | closing sentence | 3 (distributed) |
| `cap` | `consensus`, `quorums` | after the simulation clause | 3 (distributed) |
| `object-storage` | `design-file-storage` | Callout | 4 (hld) |
| `caching` | (none; stampede simulation is a spec) | — | 6 |
| `message-queues` | `kafka-architecture`, `brokers-compared` | Examples bullet | 3 (streaming) |
| `pubsub` | `eda-patterns`, `cqrs`, `event-sourcing` | EDA section | 3 (streaming, architecture) |
| `availability` | `slos-error-budgets`, `disaster-recovery` | SLI/SLO/SLA; RPO/RTO | 3 (operations) |
| `circuit-breaker` | `bulkheads-degradation` | bulkheads DeepDive | 3 (operations) |
| `rate-limiting` | `design-rate-limiter`, `api-security` | DeepDive; Callout | 3–4 |
| `idempotency` | `delivery-semantics`, `sagas` | Steps; Callout | 3 (streaming, distributed) |
| `estimation-examples` | `design-pastebin`, `design-file-storage` | section headings | 4 (hld) |
| `url-shortener` | `design-pastebin`, `design-notification-system`, `design-key-value-store` | closing Callout | 4 (hld) |
| `grpc` | — | — | — |
