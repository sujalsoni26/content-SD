# Curriculum Roadmap — Box by Box (System Design)

Date: 2026-11-22 · Repository `sujalsoni26/box-by-box-system-design` @ `e508232` · Phase 1 deliverable. Companion files: `CONTENT_INDEX.md` (every deliverable and its path), `CONTENT_STATUS.md` (progress), `plan/curriculum-plan.json` (machine-readable source of this document; `plan/build_plan.py` regenerates it and checks slugs and prerequisites).

## 1. Decisions this roadmap rests on

1. **New modules, not stuffing the existing six.** Confirmed by the project owner after Phase 0. The six core modules keep their ids, order, slugs and lesson order; ten new modules are appended (§3). This requires the `ModuleId` union in `types/curriculum.ts` to be extended, which is an application change; the exact edit is in §3.3 and in `recommendations/APP_CHANGES.md`.
2. **Approved application changes (2026-11-22):** `ModuleId` extension; recall deck ids `advanced`, `hld`, `lld`; Mermaid `classDiagram` in the validator (minimal change, `erDiagram` not included). All three are delivered as drop-in files in the pack. Not requested: `ConceptCard` in the validator, glossary/practice links, a concept glossary; content uses the fallbacks (Callouts for term cards, SQL blocks for data models, prose mentions instead of glossary links).
3. **Quality over quantity, in waves.** The brief's coverage lists and its 12 HLD and 14 LLD problems imply about a hundred new lessons. They are planned here in full so the structure is coherent, but delivered in three waves (§10) so the most valuable material lands first and nothing is shipped half-written to hit a count.
4. **Existing lessons are improved only where Phase 0 found a reason.** 42 lessons: improve 9, keep 16, polish 17 (§5). Two are reclassified.
5. **The `url-shortener` case study moves into module 14** (owner decision after Phase 1), keeping its slug so saved progress survives. Module 6 keeps `playbook` as the method introduction with a cross-reference; `check-url-shortener` moves to module `hld` with it. Nothing is duplicated.

## 2. Summary

| Measure | Today | After this roadmap |
| --- | --- | --- |
| Modules | 6 | 16 |
| Lessons | 42 | 143 (42 existing + 101 new) |
| Level mix | basic 19 · intermediate 18 · advanced 5 | basic 29 · intermediate 77 · advanced 37 |
| Reading time | 248 min (≈ 4 h) | 1272 min (≈ 21 h) |
| HLD case studies | 1 | 15 |
| LLD lessons | 0 | 28 (13 foundations + 14 case studies + 1 revision) |
| Knowledge checks | 10 (29 Qs) | 43 (existing 10 extended by 14 questions; 33 new checks, target 4–5 questions each) |
| New simulation specifications | — | 9 (§9.4) |
| New static diagram specifications | — | 24 (§9.5) |
| New glossary short forms | — | about 61 (§9.3) |
| Priority of new lessons | — | P1 90 · P2 11 · P3 0 |
| Delivery waves (new lessons) | — | A 64 · B 26 · C 11 |

## 3. Module structure

### 3.1 All sixteen modules

Modules 1–6 are unchanged ("the core course": one app grown box by box). Modules 7–13 are **advanced tracks** that can be read in any order after the core, though the listed order is the recommended one. Modules 14–16 are **design practice** (HLD case studies, LLD foundations, LLD case studies). The UI has no grouping concept; the `stage` field carries the group label ("Advanced track", "Design practice", "Code level") so the roadmap page shows it under each module.

| # | id | Title | Tagline | Stage | Lessons | Levels | Minutes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `foundations` | Foundations | How a client talks to a server | 1 user · 1 server | 6 (existing) | B 5 · I 1 | 34 |
| 2 | `scaling` | Scaling and Traffic | Handling more traffic | 10k users | 4 (existing) | B 4 | 21 |
| 3 | `communication` | Communication | How components talk | Many services | 5 (existing) | B 2 · I 3 | 26 |
| 4 | `data` | Data | Storing, copying and splitting data | Millions of rows | 9 (existing) | A 2 · B 4 · I 3 | 55 |
| 5 | `reliability` | Performance and Reliability | Fast, and still standing when things fail | Failure is normal | 9 (existing) | A 1 · I 8 | 53 |
| 6 | `practice` | System Design Practice | Estimate, assemble, interview | Design it yourself | 8 (existing) | B 4 · I 4 | 47 |
| 7 | `distributed` | Distributed Systems | Many machines, one truth | Advanced track | 9 new | A 7 · I 2 | 85 |
| 8 | `internals` | Database Internals | Inside the box labelled DB | Advanced track | 8 new | A 5 · I 3 | 75 |
| 9 | `streaming` | Messaging and Streaming | Data in motion | Advanced track | 7 new | A 2 · I 5 | 60 |
| 10 | `operations` | Reliability and Observability | Running it in production | Advanced track | 9 new | A 1 · I 8 | 73 |
| 11 | `security` | Security | Keeping it safe | Advanced track | 8 new | A 1 · B 1 · I 6 | 67 |
| 12 | `infrastructure` | Cloud and Infrastructure | The platform underneath | Advanced track | 8 new | A 1 · B 1 · I 6 | 65 |
| 13 | `architecture` | Architecture Patterns | Shapes of systems | Advanced track | 9 new | A 3 · B 1 · I 5 | 72 |
| 14 | `hld` | High-Level Design Case Studies | Design it end to end | Design practice | 15 new + 1 moved | A 9 · B 1 · I 6 | 249 |
| 15 | `lld` | Low-Level Design: Foundations | Down to the code | Code level | 13 new | A 1 · B 4 · I 8 | 107 |
| 16 | `lld-practice` | Low-Level Design: Case Studies | Model it in code | Code level | 15 new | A 4 · B 2 · I 9 | 183 |

Level key: B basic · I intermediate · A advanced. Levels use the exact existing `Level` union; the roadmap page's level highlight filter and the `LevelChip` need no change.

### 3.2 Why these ten modules

- **7 Distributed Systems, 8 Database Internals, 9 Messaging and Streaming** are the three "how it really works" tracks the brief's Phase 3 list is built around. They are kept separate because each has its own prerequisite chain (consensus needs quorums needs clocks; LSM needs storage engines; exactly-once needs partitions) and each is 7–9 lessons, the size of the existing modules.
- **10 Reliability and Observability** continues module 5 at production depth and adds the observability topics the course lacks entirely.
- **11 Security** is its own module because the course has nothing on it today and it has an internal progression (identity → authorisation → tokens → encryption → API hardening → secrets → threat modelling).
- **12 Cloud and Infrastructure** and **13 Architecture Patterns** are separated so that "where it runs" and "what shape it has" do not blur; several lessons cross-link (Kubernetes ↔ service mesh, autoscaling ↔ capacity planning).
- **14 HLD Case Studies** holds the twelve priority systems plus three P2 extras. **15 LLD Foundations** and **16 LLD Case Studies** are split because 27 lessons in one module would overflow the sidebar and because the foundations are reusable without the problems.

Alternatives considered: merging 10 and 12 (operations and infrastructure) would give one 17-lesson module; merging 15 and 16 likewise. Both were rejected for sidebar length and because the existing modules average seven lessons. Three to four fewer modules would be possible only by merging unrelated tracks.

### 3.3 The application change this needs (recommendation, not performed)

`types/curriculum.ts` — extend the union (existing members unchanged):

```ts
export type ModuleId =
  | "foundations" | "scaling" | "communication" | "data" | "reliability" | "practice"
  | "distributed" | "internals" | "streaming" | "operations" | "security"
  | "infrastructure" | "architecture" | "hld" | "lld" | "lld-practice";
```

`data/curriculum.ts` — append ten `CourseModule` entries (delivered in the pack's merged `data/curriculum.ts`):

```ts
  { id: "distributed", number: 7, title: "Distributed Systems", tagline: "Many machines, one truth", stage: "Advanced track",
    description: "How independent machines agree, order events and share state when the network lies: clocks, quorums, consensus, locks and transactions across services.",
    lessons: ["distributed-fundamentals", "time-and-ordering", "quorums", "consensus", "leader-election", "distributed-locks", "distributed-transactions", "sagas", "linearizability"] },
  { id: "internals", number: 8, title: "Database Internals", tagline: "Inside the box labelled DB", stage: "Advanced track",
    description: "What happens between a query and a disk: storage engines, logs, trees, versions, planners, and how replication and partitioning are really implemented.",
    lessons: ["storage-engines", "wal", "btree-vs-lsm", "mvcc-isolation", "query-execution", "replication-internals", "partitioning-internals", "distributed-sql"] },
  { id: "streaming", number: 9, title: "Messaging and Streaming", tagline: "Data in motion", stage: "Advanced track",
    description: "From a queue to a distributed log: Kafka's design, partitions and consumer groups, delivery guarantees, change data capture and processing streams while they flow.",
    lessons: ["kafka-architecture", "partitions-consumer-groups", "delivery-semantics", "cdc", "brokers-compared", "stream-processing", "eda-patterns"] },
  { id: "operations", number: 10, title: "Reliability and Observability", tagline: "Running it in production", stage: "Advanced track",
    description: "Failure is normal; knowing is optional. How systems fail, how to contain it, how to measure what users feel, and how to recover when a region disappears.",
    lessons: ["failure-modes", "bulkheads-degradation", "slos-error-budgets", "metrics-monitoring", "logging", "tracing", "disaster-recovery", "capacity-planning", "incident-response"] },
  { id: "security", number: 11, title: "Security", tagline: "Keeping it safe", stage: "Advanced track",
    description: "Who is asking, what are they allowed to do, and who else can see it: identity, tokens, encryption, API hardening, secrets and threat modelling for the systems you have built so far.",
    lessons: ["security-fundamentals", "authentication", "authorization", "oauth-jwt", "encryption", "api-security", "secrets-management", "threat-modelling"] },
  { id: "infrastructure", number: 12, title: "Cloud and Infrastructure", tagline: "The platform underneath", stage: "Advanced track",
    description: "Where the boxes actually run: containers, Kubernetes, discovery, autoscaling, regions, networks, CDN internals and infrastructure described as code.",
    lessons: ["containers", "kubernetes", "service-discovery", "autoscaling", "multi-region", "cdn-internals", "cloud-networking", "iac"] },
  { id: "architecture", number: 13, title: "Architecture Patterns", tagline: "Shapes of systems", stage: "Advanced track",
    description: "Named shapes you will be asked about: from modular monoliths to meshes, from CQRS to event sourcing, and how to migrate between them without a big bang.",
    lessons: ["modular-monolith-soa", "api-gateway", "service-mesh", "cqrs", "event-sourcing", "strangler-fig", "serverless", "multi-tenancy", "advanced-revision"] },
  { id: "hld", number: 14, title: "High-Level Design Case Studies", tagline: "Design it end to end", stage: "Design practice",
    description: "Systems designed with the playbook, from a URL shortener to an e-commerce platform. Each follows the same template, states its assumptions and argues every box.",
    lessons: ["case-study-method", "url-shortener", "design-pastebin", "design-rate-limiter", "design-notification-system", "design-key-value-store", "design-file-storage", "design-instagram", "design-whatsapp", "design-youtube", "design-uber", "design-netflix", "design-ecommerce", "design-ticket-booking", "design-payment-system", "design-search-autocomplete"] },
  { id: "lld", number: 15, title: "Low-Level Design: Foundations", tagline: "Down to the code", stage: "Code level",
    description: "How to turn requirements into classes that are correct, testable and easy to change: object-oriented principles, UML, SOLID, design patterns, dependency injection, concurrency and clean code.",
    lessons: ["lld-intro", "oop-pillars", "class-relationships-uml", "composition-over-inheritance", "solid", "interfaces-abstractions-di", "design-patterns-creational", "design-patterns-structural", "design-patterns-behavioural", "concurrency-basics", "error-handling", "clean-code", "testing-extensibility"] },
  { id: "lld-practice", number: 16, title: "Low-Level Design: Case Studies", tagline: "Model it in code", stage: "Code level",
    description: "Fourteen classic problems worked from requirements to classes, interactions, edge cases and extensibility, each with UML and pseudocode.",
    lessons: ["lld-parking-lot", "lld-vending-machine", "lld-elevator", "lld-library-management", "lld-movie-ticket-booking", "lld-splitwise", "lld-snake-and-ladder", "lld-chess", "lld-in-memory-cache", "lld-logging-framework", "lld-rate-limiter", "lld-task-scheduler", "lld-ride-booking", "lld-food-ordering", "lld-revision"] },
```

Copy that hard-codes the module count must change: `app/learn/page.tsx` line 52 ("six modules"), `app/page.tsx` line 45 ("6 modules" and "25 interactive diagrams"), `README.md` lines 6–9, `docs/architecture.md` lines 5 and 12. The validator's module-id regex (`[a-z0-9-]+`) already accepts `lld-practice`. Nothing else in the application keys on the number of modules; progress, wardrobe unlocks and the sidebar all iterate `modules[]`.

## 4. Progression principles

1. **Core first.** Modules 1–6 remain the on-ramp; every new lesson's prerequisites resolve to core lessons or to earlier lessons in its own track. `plan/build_plan.py` asserts that every prerequisite appears earlier in the overall order.
2. **Within a track, mechanism before pattern.** Clocks → quorums → consensus → election → locks → transactions → sagas; storage engine → WAL → trees → MVCC → planner → replication → partitioning; Kafka → partitions → semantics → processing.
3. **Difficulty follows prerequisites, not length.** A lesson is `advanced` only if it needs two or more intermediate ideas at once or reasons about failure across machines. `sagas`, `kafka-architecture`, `cqrs`, `authentication` and most observability lessons are therefore `intermediate` even though they sit in advanced tracks. `basic` is reserved for lessons a newcomer can read first (`security-fundamentals`, `containers`, `lld-intro`, `oop-pillars`, `class-relationships-uml`, `clean-code`, `lld-snake-and-ladder`, revision lessons).
4. **Case studies name their prerequisites explicitly** so a learner can jump straight to "Design WhatsApp" and be sent to `websockets`, `message-queues` and `consistency` first.
5. **Reuse before build.** Every new lesson that can embed an existing simulation or static diagram does (§9.4 lists reuse); new simulations are specified only where nothing exists (consistent hashing, for example, is already in `shard-router`).
6. **One recall prompt and one companion set per lesson**, written in the existing register, so Cache's Explain / Hint / Summary / Quick revision work on every new lesson from day one.

## 5. Existing modules 1–6: improvement plan (Phase 2)

Status key: **keep** = no content change (links and companion fields verified); **polish** = small, local edits; **improve** = substantive additions. "Level" shows a reclassification as `old → new`.

### Module 1: Foundations (`foundations`)

| # | Slug | Title | Level | Plan | Phase 2 actions | Supporting resources | Done? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1 | `big-idea` | The big idea | basic | polish | Reword step 6 of the 'growing up' list (microservices is taught in module 3); add one paragraph introducing the advanced tracks (modules 7–16) and the HLD/LLD practice. | — | integration-ready |
| 1.2 | `client-server` | Client–server architecture | basic | keep | None beyond a quiz question. | quiz +1 (check-foundations) | integration-ready |
| 1.3 | `dns` | DNS | basic | keep | Add a quiz question; link forward to cdn-internals and service-discovery once they exist. | quiz +1 (check-foundations) | integration-ready |
| 1.4 | `tcp-udp` | IP, TCP and UDP | basic | polish | DeepDive: mention fast retransmit on duplicate ACKs (the sim shows duplicate ACKs but retransmits on RTO only). | — | integration-ready |
| 1.5 | `http` | HTTP and HTTPS | basic | polish | Add a quiz question; link forward to authentication (cookies/tokens) and encryption lessons. | quiz +1 (check-foundations) | integration-ready |
| 1.6 | `latency` | Latency, throughput and the numbers to know | intermediate | polish | Fix the RAM-vs-SSD inconsistency (table says ~1,000×, latency-scale preset computes ≈1,500×): quote both and keep 'ratios matter'. Note the index-scan sim's pessimistic disk-per-level assumption where linked. | — | integration-ready |

### Module 2: Scaling and Traffic (`scaling`)

| # | Slug | Title | Level | Plan | Phase 2 actions | Supporting resources | Done? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2.1 | `proxy` | Proxy and reverse proxy | basic | polish | Add a quiz question; link forward to api-gateway and service-mesh. | quiz +1 (check-scaling) | integration-ready |
| 2.2 | `load-balancing` | Load balancing | basic | keep | None. | — | integration-ready |
| 2.3 | `scaling` | Vertical vs horizontal scaling | basic | polish | Link the Elasticity section to autoscaling and capacity-planning. | — | integration-ready |
| 2.4 | `cdn` | CDN | basic | polish | Add a Callout (none today); link to cdn-internals. | — | integration-ready |

### Module 3: Communication (`communication`)

| # | Slug | Title | Level | Plan | Phase 2 actions | Supporting resources | Done? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3.1 | `rest` | REST APIs | basic | improve | Add status-code design, versioning, PUT vs POST idempotency, error payloads; add a Callout and a quiz question; link to api-security. | Mermaid: flowchart of resource/verb mapping (optional), quiz +1 (check-communication) | integration-ready |
| 3.2 | `grpc` | gRPC | intermediate | improve | Add the four call types (unary, server/client/bidi streaming), deadlines and cancellation, status codes; keep the protobuf DeepDive. | Mermaid: sequence for deadline propagation | integration-ready |
| 3.3 | `websockets` | WebSockets (real-time) | intermediate | keep | None. | — | integration-ready |
| 3.4 | `microservices` | Monolith vs microservices | intermediate | polish | Link to modular-monolith-soa, api-gateway, service-mesh, strangler-fig; verify the Prime Video citation. | source check | integration-ready |
| 3.5 | `sync-async` | Synchronous vs asynchronous communication | basic | keep | None. | — | integration-ready |

### Module 4: Data (`data`)

| # | Slug | Title | Level | Plan | Phase 2 actions | Supporting resources | Done? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4.1 | `sql-nosql` | SQL vs NoSQL | basic | improve | Add an access-pattern-first worked example (design the table for the query), a NewSQL/distributed SQL note, and a quiz question; link to distributed-sql. | Mermaid: flowchart decision tree, quiz +1 (check-data-modeling) | integration-ready |
| 4.2 | `acid` | Transactions and ACID | intermediate | improve | Name the write-ahead log under Durability; add a lost-update example under Isolation; link to wal and mvcc-isolation. | Mermaid: sequence of a lost update | integration-ready |
| 4.3 | `indexing` | Database indexing | basic | keep | Link to query-execution and btree-vs-lsm. | — | integration-ready |
| 4.4 | `normalization` | Normalization vs denormalization | basic | improve | Add section headings, the actual feed JOIN, the measurement-first rule, and how denormalised copies are kept in sync (async fan-out of renames); add a diagram. | static diagram spec: normalized-vs-denormalized, quiz exists | integration-ready |
| 4.5 | `replication` | Database replication | intermediate | polish | Add a quiz question; link to replication-internals and quorums. | quiz +1 (check-distributed-data) | integration-ready |
| 4.6 | `sharding` | Sharding and partitioning | advanced | keep | Link to partitioning-internals. | — | integration-ready |
| 4.7 | `consistency` | Consistency: strong vs eventual | intermediate | improve | Deepen: add monotonic reads, a timeline example for causal vs eventual (Mermaid sequence), how read-your-writes and causal consistency are implemented (sticky routing, version tracking), and a quiz question; link to linearizability. | Mermaid: sequence timeline, quiz +1 (check-distributed-data) | integration-ready |
| 4.8 | `cap` | CAP and PACELC | advanced | keep | Link to consensus and quorums; note the two-replica limitation of the simulation in one clause. | — | integration-ready |
| 4.9 | `object-storage` | Object storage | basic | polish | Add a Callout (none today); link to design-file-storage. | — | integration-ready |

### Module 5: Performance and Reliability (`reliability`)

| # | Slug | Title | Level | Plan | Phase 2 actions | Supporting resources | Done? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5.1 | `caching` | Caching | intermediate | improve | Add a short section on stampede mechanics (request coalescing / single-flight, TTL jitter, early refresh) and on cache topologies (local + distributed tiers); reference the cache-stampede simulation spec. | new sim spec: cache-stampede | integration-ready |
| 5.2 | `message-queues` | Message queues | intermediate | polish | Add a quiz question; link to kafka-architecture and brokers-compared. | quiz +1 (check-async) | integration-ready |
| 5.3 | `pubsub` | Pub/sub and event-driven architecture | intermediate | polish | Add a Callout (none today); link to eda-patterns, cqrs, event-sourcing. | — | integration-ready |
| 5.4 | `availability` | Availability and the nines | intermediate | keep | Link to slos-error-budgets and disaster-recovery. | — | integration-ready |
| 5.5 | `timeouts-retries` | Timeouts and retries | intermediate | keep | None. | — | integration-ready |
| 5.6 | `circuit-breaker` | Circuit breaker | advanced → **intermediate** | improve | Reclassify to intermediate. Add failure-rate windows vs consecutive-count thresholds, per-endpoint breakers, and a quiz question; keep the bulkheads DeepDive but link to bulkheads-degradation. | quiz +1 (check-reliability) | integration-ready |
| 5.7 | `backpressure` | Backpressure and load shedding | advanced | keep | Verify the Facebook and Google SRE citations. | source check | integration-ready |
| 5.8 | `rate-limiting` | Rate limiting | intermediate | polish | Add a Callout (none today) and a quiz question; link to design-rate-limiter and api-security. | quiz +1 (check-reliability) | integration-ready |
| 5.9 | `idempotency` | Idempotency | advanced → **intermediate** | polish | Reclassify to intermediate; add a quiz question; link to delivery-semantics and sagas. | quiz +1 (check-reliability) | integration-ready |

### Module 6: System Design Practice (`practice`)

| # | Slug | Title | Level | Plan | Phase 2 actions | Supporting resources | Done? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6.1 | `estimation-numbers` | Numbers to memorize | basic | keep | Add a quiz question. | quiz +1 (check-estimation) | integration-ready |
| 6.2 | `estimation-formulas` | The formulas | basic | improve | Explain why cache ≈ 20% of daily reads, where the peak multipliers come from, and narrate one example end to end before the estimator. | — | integration-ready |
| 6.3 | `estimation-examples` | Worked examples | intermediate | keep | Link to design-file-storage and design-pastebin. | — | integration-ready |
| 6.4 | `system-shapes` | Three system shapes | intermediate | polish | Add a 'classify these systems' exercise (list of ten systems with answers in a DeepDive) and a quiz question. | quiz +1 (check-estimation) | integration-ready |
| 6.5 | `final-architecture` | The final architecture | intermediate | polish | Fix the prose/behaviour mismatch ('click any box to jump there' → 'select a box to see its lessons'). | — | integration-ready |
| 6.6 | `revision-map` | Revision: problem to building block | basic | keep | None. | — | integration-ready |
| 6.7 | `playbook` | The interview playbook | basic | polish | Add a pointer to the HLD case-study module and the 18-section case-study template. | — | integration-ready |
| 6.8 | `test-yourself` | Test yourself | intermediate | keep | None (deck is append-only). | — | integration-ready |

Across the six modules Phase 2 also: adds the 19 missing quiz questions by extending the existing checks (ids preserved, new questions appended with the next index), writes no new recall cards for existing lessons except where a deck gap matters (`client-server`, `big-idea` are deliberately uncovered), verifies the six external citations listed in `CONTENT_GAPS.md` §9 and starts `SOURCE_MANIFEST.md`.

## 6. New modules 7–16: lesson plan

Each row carries every field the brief asks for. **Prereqs** are slugs. **Objectives** are what the learner can do afterwards. **Resources** name the diagrams, simulations (new spec or reuse), knowledge check, recall cards and glossary short forms the lesson ships with; every lesson additionally ships `lessonMeta`, `lessonGuides` and `catMeows` entries. **Wave** is the delivery order (§10).

### Module 7: Distributed Systems (`distributed`) — Many machines, one truth

*How independent machines agree, order events and share state when the network lies: clocks, quorums, consensus, locks and transactions across services.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7.1 | `distributed-fundamentals` | What makes a system distributed | intermediate | 8 | P1 | A | `cap`, `replication`, `timeouts-retries` | Name the failure modes a distributed system must tolerate (crash, omission, partition, grey failure); Explain why there is no global clock and why timeouts are a guess; Recognise the fallacies of distributed computing in a design | unreliable network, partial failure, failure detectors, fallacies of distributed computing, two generals | Mermaid: sequence showing an ambiguous timeout, quiz: check-distributed-1, recall ×2, glossary: P2P (if used) |
| 7.2 | `time-and-ordering` | Clocks, time and ordering | advanced | 10 | P1 | A | `distributed-fundamentals`, `consistency` | Distinguish wall clocks, monotonic clocks and logical clocks; Order events with Lamport and vector clocks; Explain what Spanner's TrueTime buys and costs | NTP drift, monotonic vs wall clock, happens-before, Lamport clock, vector clock, hybrid logical clock, TrueTime | Mermaid: sequence with Lamport timestamps, static diagram spec: vector-clock-example, quiz: check-distributed-1, recall ×2, glossary: NTP, HLC |
| 7.3 | `quorums` | Quorums and leaderless replication | advanced | 10 | P1 | A | `replication`, `consistency`, `time-and-ordering` | Apply R + W > N and explain when it still returns stale data; Describe sloppy quorums, hinted handoff, read repair and anti-entropy; Compare last-write-wins with version vectors for conflict resolution | N/R/W, strict vs sloppy quorum, hinted handoff, read repair, anti-entropy (Merkle trees), LWW, version vectors, Dynamo | new sim spec: quorum-reads-writes, Mermaid: flowchart of a quorum write, quiz: check-distributed-1, recall ×2, glossary: LWW |
| 7.4 | `consensus` | Consensus: Raft in one picture | advanced | 12 | P1 | A | `distributed-fundamentals`, `quorums` | State the consensus problem and why a majority is needed; Walk through Raft leader election and log replication; Explain where ZooKeeper, etcd and Kafka's controller use consensus | consensus, Raft terms and heartbeats, log replication, majority commit, Paxos (named), ZooKeeper/etcd, Zab | Mermaid: stateDiagram-v2 follower/candidate/leader, Mermaid: sequence of an election, new sim spec: raft-election, quiz: check-distributed-2, recall ×2, glossary: Raft (not an acronym; prose only) |
| 7.5 | `leader-election` | Leader election, split-brain and fencing | advanced | 9 | P1 | A | `consensus` | Implement leader election with a lease in a coordination service; Explain how split-brain arises and how fencing tokens prevent damage; Choose between single-leader, multi-leader and leaderless designs | lease, session/ephemeral node, split-brain, fencing token, STONITH (named), failover automation | Mermaid: sequence of a fenced write, quiz: check-distributed-2, recall ×2 |
| 7.6 | `distributed-locks` | Distributed locking | advanced | 9 | P1 | A | `leader-election`, `idempotency` | Build a lock with Redis SET NX PX and explain its failure cases; Summarise the Redlock debate and what a correct lock needs; Replace locks with idempotency or unique constraints where possible | mutual exclusion, TTL and lock expiry, Redlock controversy, ZooKeeper ephemeral sequential nodes, fencing, lock-free alternatives | new sim spec: distributed-lock, Mermaid: sequence of an expired lock causing a double write, quiz: check-distributed-2, recall ×2 |
| 7.7 | `distributed-transactions` | Distributed transactions and two-phase commit | advanced | 10 | P1 | A | `acid`, `consensus` | Explain atomic commit across services and why it is hard; Trace a two-phase commit including coordinator failure; Describe how Spanner-style systems combine 2PC with consensus | atomic commitment, 2PC prepare/commit, blocking on coordinator failure, 3PC (named), XA, Percolator/Spanner 2PC over Paxos groups | Mermaid: sequence of 2PC with a coordinator crash, quiz: check-distributed-3, recall ×2, glossary: 2PC, XA |
| 7.8 | `sagas` | Sagas and compensating actions | intermediate | 8 | P1 | A | `distributed-transactions`, `pubsub`, `idempotency` | Model a multi-service business transaction as a saga; Compare choreography and orchestration; Design compensations and handle partial failure | saga, compensating transaction, choreography vs orchestration, semantic lock, outbox, idempotent steps | Mermaid: sequence of an order saga with compensation, quiz: check-distributed-3, recall ×2 |
| 7.9 | `linearizability` | Linearizability, serializability and the consistency zoo | advanced | 9 | P1 | A | `consistency`, `acid`, `time-and-ordering` | Define linearizability and distinguish it from serializability; Place strong, causal, eventual and snapshot models on one map; Decide which guarantee a feature actually needs and what it costs | linearizability, serializability, strict serializability, sequential consistency, causal, Jepsen (named) | static diagram spec: consistency-model-map, quiz: check-distributed-3, recall ×2 |

### Module 8: Database Internals (`internals`) — Inside the box labelled DB

*What happens between a query and a disk: storage engines, logs, trees, versions, planners, and how replication and partitioning are really implemented.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 8.1 | `storage-engines` | How a database stores data | intermediate | 8 | P1 | A | `indexing`, `latency` | Describe pages, heap files and the buffer pool; Contrast row and column stores and when each wins; Name the storage engine beneath common databases | page, heap file, buffer pool, row store vs column store, storage engine abstraction, InnoDB, RocksDB | static diagram spec: page-and-buffer-pool, quiz: check-internals-1, recall ×2, glossary: OLTP, OLAP |
| 8.2 | `wal` | Write-ahead logging and crash recovery | intermediate | 8 | P1 | A | `acid`, `storage-engines` | Explain why writes go to a log before data pages; Trace crash recovery with redo and checkpoints; Connect the WAL to replication streams and change data capture | WAL, fsync, checkpoint, redo/undo, group commit, durability vs latency | Mermaid: sequence of commit → WAL → ack, quiz: check-internals-1, recall ×2, glossary: WAL |
| 8.3 | `btree-vs-lsm` | B-trees vs LSM trees | advanced | 11 | P1 | A | `storage-engines`, `indexing` | Explain B-tree page splits and in-place updates; Trace an LSM write through memtable, SSTables and compaction; Compare read, write and space amplification and pick an engine for a workload | B-tree, write amplification, memtable, SSTable, compaction (size-tiered vs leveled), bloom filter, read/write/space amplification | new sim spec: btree-vs-lsm, static diagram spec: lsm-levels, quiz: check-internals-1, recall ×2, glossary: SSTable |
| 8.4 | `mvcc-isolation` | MVCC and isolation levels | advanced | 10 | P1 | A | `acid`, `wal` | Explain how multi-version concurrency control lets readers avoid blocking writers; Map read committed, repeatable read, snapshot isolation and serializable to the anomalies they allow; Recognise write skew and choose SSI or locks to prevent it | MVCC, snapshot, visibility rules, write skew, phantoms, serializable snapshot isolation, vacuum/garbage collection | Mermaid: sequence showing write skew, quiz: check-internals-2, recall ×2, glossary: MVCC, SSI |
| 8.5 | `query-execution` | Indexes and query execution | intermediate | 9 | P1 | A | `indexing`, `storage-engines` | Read an EXPLAIN plan and identify scans, index scans and joins; Design composite and covering indexes for real queries; Spot the N+1 problem and selectivity traps | planner/optimiser, EXPLAIN, seq scan vs index scan vs index-only, covering index, selectivity, nested loop / hash / merge join, N+1 | reuse sim: index-scan, quiz: check-internals-2, recall ×2 |
| 8.6 | `replication-internals` | Replication strategies in depth | advanced | 10 | P1 | A | `replication`, `wal`, `quorums` | Compare statement-based, WAL-shipping and logical replication; Explain failover mechanics and the data-loss window; Describe multi-leader conflict handling and CDC | statement vs physical vs logical replication, replication slot, failover and promotion, multi-leader conflicts, CRDT (named), change data capture | reuse sim: replication-lag, Mermaid: flowchart of replication modes, quiz: check-internals-2, recall ×2, glossary: CDC, CRDT |
| 8.7 | `partitioning-internals` | Partitioning and rebalancing | advanced | 10 | P1 | A | `sharding`, `quorums` | Compare local and global secondary indexes in a partitioned store; Choose a rebalancing strategy (fixed, dynamic, proportional) and explain its data movement; Explain how requests find the right partition | local vs global secondary index, rebalancing, fixed vs dynamic partitions, request routing, coordination service vs gossip, hot spots | reuse sim: shard-router, quiz: check-internals-3, recall ×2 |
| 8.8 | `distributed-sql` | Distributed SQL and NewSQL | advanced | 9 | P2 | C | `consensus`, `distributed-transactions`, `partitioning-internals` | Explain how Spanner, CockroachDB and TiDB combine ranges, Raft and 2PC; State what they give up and what they cost; Decide when a single PostgreSQL still wins | range-partitioned Raft groups, distributed 2PC, clock-based ordering, Vitess/Citus-style sharding middleware, NewSQL | static diagram spec: distributed-sql-architecture, quiz: check-internals-3, recall ×2 |

### Module 9: Messaging and Streaming (`streaming`) — Data in motion

*From a queue to a distributed log: Kafka's design, partitions and consumer groups, delivery guarantees, change data capture and processing streams while they flow.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9.1 | `kafka-architecture` | Kafka: a distributed log | intermediate | 10 | P1 | A | `message-queues`, `pubsub` | Describe topics, partitions, offsets, brokers and replication; Explain producer acks and in-sync replicas; Contrast a log with a traditional queue (retention, replay, consumers) | topic, partition, offset, broker, leader/follower and ISR, acks=all, retention and log compaction, controller | static diagram spec: kafka-cluster, Mermaid: sequence of a produce with acks=all, quiz: check-streaming-1, recall ×2, glossary: ISR |
| 9.2 | `partitions-consumer-groups` | Partitions, consumer groups and ordering | intermediate | 9 | P1 | A | `kafka-architecture` | Explain why a partition is the unit of both parallelism and ordering; Predict what happens when consumers join or leave a group; Pick a partition key that keeps order where it matters and avoids hot partitions | partition key, consumer group, rebalance, consumer lag, max parallelism = partitions, per-key ordering, hot partition | new sim spec: kafka-partitions, quiz: check-streaming-1, recall ×2 |
| 9.3 | `delivery-semantics` | Delivery semantics and exactly-once | advanced | 9 | P1 | A | `partitions-consumer-groups`, `idempotency`, `message-queues` | Define at-most-once, at-least-once and exactly-once in terms of what can go wrong; Explain the idempotent producer, transactions and offset-commit strategies; Build effectively-once end to end with outbox and idempotent consumers | commit before vs after processing, idempotent producer, transactional outbox, consumer dedup, effectively once, Kafka transactions | Mermaid: sequence of commit-after-processing with a crash, quiz: check-streaming-2, recall ×2 |
| 9.4 | `cdc` | Change data capture | intermediate | 7 | P2 | C | `wal`, `kafka-architecture` | Explain log-based CDC and why it beats dual writes; Use CDC for cache invalidation, search indexing and analytics feeds; Handle schema changes and initial snapshots | dual-write problem, log-based CDC (Debezium), snapshot + stream, downstream consumers, schema evolution | Mermaid: flowchart DB → CDC → consumers, quiz: check-streaming-2, recall ×1 |
| 9.5 | `brokers-compared` | Choosing a broker | intermediate | 7 | P2 | C | `message-queues`, `kafka-architecture` | Compare queue semantics (RabbitMQ, SQS) with log semantics (Kafka, Pulsar); Match delivery, ordering, retention and routing needs to a broker; Explain push vs pull consumption | AMQP routing, visibility timeout, FIFO queues, log vs queue, push vs pull, Pulsar tiered storage | comparison table, quiz: check-streaming-2, recall ×1 |
| 9.6 | `stream-processing` | Stream processing | advanced | 10 | P1 | A | `delivery-semantics` | Distinguish event time from processing time and explain watermarks; Choose tumbling, sliding or session windows for a metric; Explain state, checkpointing and stream-table joins | event time vs processing time, watermark, windows, stateful operators, checkpointing, Kafka Streams / Flink, lambda vs kappa | static diagram spec: windows-and-watermarks, quiz: check-streaming-3, recall ×2 |
| 9.7 | `eda-patterns` | Event-driven architecture in practice | intermediate | 8 | P1 | A | `pubsub`, `kafka-architecture` | Distinguish events from commands and design event payloads; Evolve schemas safely with a registry and compatibility rules; Avoid the common failure modes of choreography | event vs command, thin vs fat events, event-carried state transfer, schema registry, backward/forward compatibility, choreography pitfalls | Mermaid: flowchart of an event flow, quiz: check-streaming-3, recall ×2 |

### Module 10: Reliability and Observability (`operations`) — Running it in production

*Failure is normal; knowing is optional. How systems fail, how to contain it, how to measure what users feel, and how to recover when a region disappears.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10.1 | `failure-modes` | Fault tolerance: how systems fail | intermediate | 8 | P1 | A | `availability`, `timeouts-retries` | Distinguish faults from failures and list the common fault classes; Explain correlated failure and failure domains (host, zone, region); Choose redundancy shapes and reason about blast radius | fault vs failure, crash/omission/timing faults, grey failure, failure domain, active-active vs active-passive, blast radius | static diagram spec: failure-domains, quiz: check-operations-1, recall ×2 |
| 10.2 | `bulkheads-degradation` | Bulkheads and graceful degradation | intermediate | 8 | P1 | A | `circuit-breaker`, `backpressure` | Isolate dependencies with pools, cells and shuffle sharding; Design degraded modes and kill switches; Tier features by criticality and decide what fails first | bulkhead, cell-based architecture, shuffle sharding, feature flag / kill switch, fallback, dependency tiers | static diagram spec: bulkheads-and-cells, quiz: check-operations-1, recall ×2 |
| 10.3 | `slos-error-budgets` | SLIs, SLOs and error budgets | intermediate | 8 | P1 | A | `availability`, `latency` | Choose SLIs that reflect user experience; Set an SLO window and target and derive the error budget; Alert on burn rate instead of raw thresholds | SLI types (availability, latency, correctness), SLO window, error budget, burn rate alerting, error budget policy | reuse sim: nines, quiz: check-operations-1, recall ×2 |
| 10.4 | `metrics-monitoring` | Metrics and monitoring | intermediate | 9 | P1 | A | `latency`, `slos-error-budgets` | Use counters, gauges and histograms correctly; Apply the RED and USE methods to a service and a resource; Avoid cardinality explosions and alert on symptoms | counter/gauge/histogram, percentiles from histograms, RED method, USE method, cardinality, pull vs push (Prometheus), alerting on symptoms | static diagram spec: metrics-pipeline, quiz: check-operations-2, recall ×2, glossary: RED, USE |
| 10.5 | `logging` | Logging at scale | intermediate | 7 | P1 | A | `metrics-monitoring` | Design structured logs with correlation ids; Build a log pipeline and control its cost with sampling and retention; Keep secrets and personal data out of logs | structured logging, log levels, correlation id, agents → broker → store, sampling, retention and cost, PII | Mermaid: flowchart of a log pipeline, quiz: check-operations-2, recall ×1, glossary: PII |
| 10.6 | `tracing` | Distributed tracing | intermediate | 8 | P1 | A | `metrics-monitoring`, `microservices` | Explain spans, traces and context propagation; Read a trace waterfall to find the slow hop; Choose a sampling strategy | span, trace context (W3C traceparent), head vs tail sampling, OpenTelemetry, waterfall view | new sim spec: trace-waterfall, Mermaid: sequence with propagated trace id, quiz: check-operations-2, recall ×2, glossary: OTel |
| 10.7 | `disaster-recovery` | Disaster recovery and backups | advanced | 10 | P1 | A | `availability`, `replication`, `dns` | Map RPO/RTO targets to DR tiers (backup-restore, pilot light, warm standby, active-active); Design backups that can actually be restored; Run a region failover and know what breaks | DR tiers, backup types and testing, region failover, DNS/global LB switch, data residency, runbooks | reuse diagram: rpo-rto-timeline, static diagram spec: dr-tiers, quiz: check-operations-3, recall ×2, glossary: DR |
| 10.8 | `capacity-planning` | Capacity planning and load testing | intermediate | 8 | P1 | A | `estimation-formulas`, `latency`, `scaling` | Set utilisation targets and headroom per resource; Plan a load test and read its results; Translate forecasts into autoscaling policies and cost | utilisation target, headroom, Little's Law revisited, load/stress/soak tests, forecasting, cost per request | reuse sim: littles-law, quiz: check-operations-3, recall ×2 |
| 10.9 | `incident-response` | Incidents, postmortems and chaos engineering | intermediate | 7 | P2 | C | `slos-error-budgets` | Run an incident with roles and a timeline; Write a blameless postmortem that produces fixes; Use chaos experiments and game days to find weaknesses early | on-call, runbook, incident commander, blameless postmortem, chaos engineering, game day | quiz: check-operations-3, recall ×1 |

### Module 11: Security (`security`) — Keeping it safe

*Who is asking, what are they allowed to do, and who else can see it: identity, tokens, encryption, API hardening, secrets and threat modelling for the systems you have built so far.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11.1 | `security-fundamentals` | Security fundamentals for system design | basic | 7 | P1 | A | `http` | State the CIA triad and defence in depth; Identify trust boundaries and attack surface in an architecture; Apply least privilege to services and data | confidentiality/integrity/availability, defence in depth, least privilege, trust boundary, attack surface | static diagram spec: trust-boundaries, quiz: check-security-1, recall ×2, glossary: CIA |
| 11.2 | `authentication` | Authentication: sessions, tokens and passwords | intermediate | 9 | P1 | A | `http`, `scaling` | Store passwords safely (salted adaptive hashing); Compare session cookies with bearer tokens for stateless servers; Add MFA and SSO without breaking the design | password hashing (bcrypt/argon2), session vs token, cookie flags (HttpOnly, Secure, SameSite), MFA, SSO | Mermaid: sequence of login and session, quiz: check-security-1, recall ×2, glossary: MFA, SSO |
| 11.3 | `authorization` | Authorisation: RBAC, ABAC and policy | intermediate | 8 | P1 | A | `authentication` | Model permissions with roles, attributes and relationships; Place enforcement at the gateway versus inside services; Handle multi-tenant data access | RBAC, ABAC, ReBAC, policy decision vs enforcement point, OPA (named), tenant isolation | static diagram spec: authz-enforcement-points, quiz: check-security-1, recall ×2, glossary: RBAC, ABAC |
| 11.4 | `oauth-jwt` | OAuth 2.0, OpenID Connect and JWT | intermediate | 10 | P1 | A | `authentication` | Walk through the authorization-code flow with PKCE; Read a JWT and validate it correctly; Handle refresh, expiry and revocation trade-offs | OAuth roles, authorization code + PKCE, client credentials, refresh token, OIDC id token, JWT header/payload/signature, JWKS, revocation problem | Mermaid: sequence of authorization code + PKCE, new sim spec: jwt-inspector, quiz: check-security-2, recall ×2, glossary: OAuth, OIDC, JWT, PKCE, JWKS |
| 11.5 | `encryption` | Encryption in transit and at rest | intermediate | 8 | P1 | A | `http` | Explain certificates, PKI and mutual TLS; Choose disk, database or field-level encryption at rest; Use envelope encryption with a key management service and rotate keys | PKI and certificates, mTLS, encryption at rest layers, envelope encryption, KMS, key rotation | static diagram spec: envelope-encryption, quiz: check-security-2, recall ×2, glossary: PKI, mTLS, KMS |
| 11.6 | `api-security` | API security | intermediate | 9 | P1 | A | `rest`, `rate-limiting`, `oauth-jwt` | Validate input and prevent injection, CSRF and CORS mistakes; Apply authentication, scopes, rate limits and idempotency to an API; Sign webhooks and handle replay | input validation, injection, CSRF, CORS, API keys vs tokens, scopes, webhook signing and replay protection, OWASP API Top 10 (named) | quiz: check-security-2, recall ×2, glossary: CSRF, CORS, OWASP |
| 11.7 | `secrets-management` | Secrets management | intermediate | 7 | P1 | A | `encryption` | Explain why secrets must not live in code, images or env files; Use a secrets manager with dynamic, short-lived credentials; Rotate secrets and give workloads an identity | secret sprawl, vault / cloud secret manager, dynamic secrets, rotation, workload identity | Mermaid: sequence of a service fetching a dynamic credential, quiz: check-security-3, recall ×1 |
| 11.8 | `threat-modelling` | Threat modelling and security boundaries | advanced | 9 | P1 | A | `security-fundamentals`, `authorization`, `api-security`, `encryption` | Draw a data-flow diagram and mark trust boundaries; Apply STRIDE to each boundary; Combine network segmentation, zero trust and DDoS layers into a defence plan | data-flow diagram, STRIDE, zero trust, network segmentation, DDoS layers (link to cdn, rate-limiting), abuse cases | static diagram spec: dfd-with-boundaries, quiz: check-security-3, recall ×2, glossary: STRIDE |

### Module 12: Cloud and Infrastructure (`infrastructure`) — The platform underneath

*Where the boxes actually run: containers, Kubernetes, discovery, autoscaling, regions, networks, CDN internals and infrastructure described as code.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12.1 | `containers` | Containers and images | basic | 7 | P1 | B | `scaling` | Explain what a container isolates and how it differs from a VM; Describe images, layers and registries; Explain why immutable images make deployments repeatable | namespaces and cgroups, image and layers, registry, container vs VM, immutable deployment | static diagram spec: container-vs-vm, quiz: check-infrastructure-1, recall ×2, glossary: OCI |
| 12.2 | `kubernetes` | Kubernetes fundamentals | intermediate | 10 | P1 | B | `containers`, `load-balancing` | Name the core objects (Pod, Deployment, Service, Ingress, ConfigMap, Secret) and what each solves; Explain scheduling, health probes and rolling updates; Connect Services and Ingress to the load-balancing lessons | Pod, Deployment and ReplicaSet, Service (ClusterIP/NodePort/LoadBalancer), Ingress, liveness/readiness probes, rolling update, HPA (named) | static diagram spec: kubernetes-objects, quiz: check-infrastructure-1, recall ×2, glossary: K8s, HPA |
| 12.3 | `service-discovery` | Service discovery and internal DNS | intermediate | 7 | P1 | B | `microservices`, `dns`, `kubernetes` | Compare client-side and server-side discovery; Explain registries, health-based membership and DNS-based discovery; Describe how Kubernetes Services implement it | service registry (Consul, etcd), client-side vs server-side discovery, health checks and membership, Kubernetes DNS, gossip (named) | Mermaid: flowchart of both discovery styles, quiz: check-infrastructure-1, recall ×2 |
| 12.4 | `autoscaling` | Autoscaling | intermediate | 8 | P1 | B | `scaling`, `kubernetes`, `capacity-planning` | Pick scaling signals (CPU, RPS, queue depth, latency) and explain their lag; Configure cooldowns and limits to avoid flapping; Explain horizontal, vertical and cluster autoscaling and scale-to-zero | reactive vs predictive scaling, scaling signals, cooldown, flapping, HPA/VPA/cluster autoscaler, scale to zero | reuse sim: scaling-compare, quiz: check-infrastructure-2, recall ×2 |
| 12.5 | `multi-region` | Multi-region deployment | advanced | 10 | P1 | B | `cap`, `disaster-recovery`, `cdn` | Compare active-passive and active-active across regions; Choose data replication and consistency per data class; Route users with GeoDNS, anycast or a global load balancer | region vs availability zone, active-active vs active-passive, data replication across regions, GeoDNS / anycast / global LB, latency vs consistency, cost | static diagram spec: multi-region-active-active, quiz: check-infrastructure-2, recall ×2 |
| 12.6 | `cdn-internals` | CDN architecture in depth | intermediate | 8 | P1 | B | `cdn`, `dns` | Explain anycast routing, edge tiers and origin shields; Design cache keys, TTLs, purges and the Vary header; Use signed URLs and edge compute safely | anycast, edge / mid-tier / origin shield, cache key, Vary, purge vs TTL, signed URL, edge compute | new sim spec: cdn-cache, reuse diagram: cdn-edges, quiz: check-infrastructure-2, recall ×2 |
| 12.7 | `cloud-networking` | Cloud networking: VPCs, subnets and load balancers | intermediate | 8 | P2 | C | `tcp-udp`, `load-balancing`, `proxy` | Lay out a VPC with public and private subnets; Use security groups, NAT and private endpoints; Pick between managed L4 and L7 load balancers | VPC, public/private subnet, security group, NAT gateway, private link / endpoint, managed L4 vs L7 LB | static diagram spec: vpc-layout, quiz: check-infrastructure-3, recall ×1, glossary: VPC, NAT |
| 12.8 | `iac` | Infrastructure as Code and delivery pipelines | intermediate | 7 | P1 | B | `containers` | Explain declarative infrastructure, state and drift; Structure environments and modules; Connect IaC to CI/CD and GitOps | declarative vs imperative, Terraform/CloudFormation/Pulumi (named), state and drift, environments, CI/CD pipeline, GitOps | Mermaid: flowchart of a deploy pipeline, quiz: check-infrastructure-3, recall ×2, glossary: IaC, CI/CD |

### Module 13: Architecture Patterns (`architecture`) — Shapes of systems

*Named shapes you will be asked about: from modular monoliths to meshes, from CQRS to event sourcing, and how to migrate between them without a big bang.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13.1 | `modular-monolith-soa` | Monolith, modular monolith, SOA and microservices | intermediate | 8 | P1 | B | `microservices` | Place SOA in history and extract what survived into microservices; Define bounded contexts and module boundaries; Decide when and how to split a monolith | SOA and the ESB, bounded context, module boundary, decomposition by capability vs subdomain, shared database anti-pattern | reuse diagram: monolith-vs-microservices, quiz: check-architecture-1, recall ×2, glossary: SOA, ESB |
| 13.2 | `api-gateway` | API gateway and backend-for-frontend | intermediate | 8 | P1 | B | `proxy`, `microservices`, `rate-limiting` | List what belongs at the gateway (TLS, auth, rate limits, routing) and what does not; Use the BFF pattern for different clients; Avoid turning the gateway into a monolith | API gateway responsibilities, aggregation, BFF, gateway vs reverse proxy vs mesh, gateway as a bottleneck | static diagram spec: api-gateway-bff, quiz: check-architecture-1, recall ×2, glossary: BFF |
| 13.3 | `service-mesh` | Service mesh | advanced | 8 | P1 | B | `api-gateway`, `circuit-breaker`, `kubernetes` | Explain the sidecar model and what it moves out of application code; Configure retries, timeouts, breakers and mTLS at the mesh; Weigh the operational cost | sidecar proxy (Envoy), control plane vs data plane, mTLS by default, traffic shifting / canary, observability for free, cost and complexity | static diagram spec: service-mesh-sidecars, quiz: check-architecture-1, recall ×2 |
| 13.4 | `cqrs` | CQRS | intermediate | 7 | P1 | B | `normalization`, `pubsub` | Separate the write model from read models; Build read projections that are eventually consistent; Recognise when CQRS is overkill | command vs query, write model, read model / projection, eventual consistency of reads, when not to | Mermaid: flowchart of command → event → projection, quiz: check-architecture-2, recall ×2, glossary: CQRS |
| 13.5 | `event-sourcing` | Event sourcing | advanced | 9 | P1 | B | `cqrs`, `kafka-architecture` | Store state as an append-only sequence of events and rebuild it; Use snapshots and projections for performance; Handle event versioning and the hard parts | event store, replay, snapshot, projection, upcasting / versioning, pitfalls (deletes, GDPR, schema drift) | Mermaid: sequence of append → project, quiz: check-architecture-2, recall ×2 |
| 13.6 | `strangler-fig` | Migrating safely: strangler fig and friends | intermediate | 8 | P1 | B | `modular-monolith-soa` | Route traffic incrementally from an old system to a new one; Use branch by abstraction, parallel run and feature flags; Migrate data with expand/contract instead of dual writes | strangler fig, branch by abstraction, parallel run / shadow traffic, feature flags, expand/contract schema migration, dual-write hazard | Mermaid: flowchart of a strangler migration, quiz: check-architecture-2, recall ×2 |
| 13.7 | `serverless` | Serverless architecture | intermediate | 8 | P1 | B | `scaling`, `message-queues`, `containers` | Explain the FaaS execution model, cold starts and limits; Compose functions with queues and events; Decide when serverless is cheaper and when it is a trap | FaaS, cold start, event triggers, statelessness and limits, cost model, BaaS, vendor lock-in | static diagram spec: serverless-event-flow, quiz: check-architecture-3, recall ×2, glossary: FaaS, BaaS |
| 13.8 | `multi-tenancy` | Multi-tenant architecture | advanced | 8 | P2 | C | `sharding`, `rate-limiting`, `authorization` | Compare silo, pool and bridge tenancy models; Prevent noisy neighbours with per-tenant limits and sharding; Keep tenant data isolated at every layer | silo / pool / bridge, noisy neighbour, tenant-aware sharding, per-tenant quotas, tenant isolation in data and auth | static diagram spec: tenancy-models, quiz: check-architecture-3, recall ×1 |
| 13.9 | `advanced-revision` | Revision: the advanced tracks | basic | 8 | P2 | C | `linearizability`, `stream-processing`, `threat-modelling`, `service-mesh` | Recall the building block behind each advanced problem; Identify which track to reread | flashcards for modules 7–13 | recall-cards variant `advanced` (needs RecallDeckId extension) or reuse `test` deck, no quiz |

### Module 14: High-Level Design Case Studies (`hld`) — Design it end to end

*Systems designed with the playbook, from a URL shortener to an e-commerce platform. Each follows the same template, states its assumptions and argues every box.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 14.1 | `case-study-method` | How to work a case study | basic | 6 | P1 | A | `playbook` | Use the 18-section case-study template; Reuse the shortener as the worked example; Practise saying assumptions before numbers | template sections, assumption-first, evolution as scale grows | recall ×1, no quiz |
| 14.2 | `url-shortener` | Design a URL shortener | intermediate | 12 | — | A | — | *Existing lesson moved here from module 6; see §5* | — | Reference lesson for every HLD case study; add a 'what the other case studies change' closing Callout. |
| 14.3 | `design-pastebin` | Design Pastebin | intermediate | 14 | P1 | A | `url-shortener`, `object-storage`, `caching` | Adapt the shortener design for larger, expiring text objects; Decide where paste bodies live (database vs object storage) and why; Design expiry, cleanup and abuse controls | read-heavy, object storage for bodies, metadata DB, expiry and TTL cleanup, hot pastes and caching, abuse prevention | Mermaid: flowchart architecture, Mermaid: sequence create/read, reuse sim: estimator, quiz: check-hld-1, recall ×2 |
| 14.4 | `design-rate-limiter` | Design a distributed rate limiter | intermediate | 14 | P1 | A | `rate-limiting`, `caching`, `api-gateway` | Specify limits per client, per endpoint and per tenant; Compare local, gateway-centralised and Redis-backed designs; Handle Redis failure, clock skew and race conditions | token bucket / sliding window counter in Redis, Lua atomicity, local + global limiter, fail-open vs fail-closed, headers and 429 | reuse sim: token-bucket, Mermaid: sequence of a limited request, quiz: check-hld-1, recall ×2 |
| 14.5 | `design-notification-system` | Design a notification system | intermediate | 15 | P1 | A | `message-queues`, `pubsub`, `idempotency` | Fan notifications out across push, SMS and email via providers; Dedupe, rate-limit and respect user preferences; Make retries safe and track delivery | event ingestion, priority queues, provider adapters, template rendering, dedup and preference checks, delivery tracking and DLQ | Mermaid: flowchart architecture, Mermaid: sequence of a push notification, quiz: check-hld-1, recall ×2 |
| 14.6 | `design-key-value-store` | Design a distributed key-value store | advanced | 18 | P1 | A | `quorums`, `consensus`, `partitioning-internals`, `btree-vs-lsm` | Partition keys with consistent hashing and replicate with quorums; Choose a storage engine and handle tombstones and compaction; Detect failures with gossip and heal with hinted handoff and Merkle trees | consistent hashing ring, N/R/W tuning, LSM storage, gossip membership, hinted handoff, read repair / Merkle trees, versioning | reuse sim: shard-router, reuse sim: cap-partition, Mermaid: flowchart, quiz: check-hld-2, recall ×2 |
| 14.7 | `design-file-storage` | Design Google Drive / Dropbox | advanced | 17 | P1 | A | `object-storage`, `estimation-examples`, `sync-async` | Design chunked, resumable, deduplicated uploads; Keep metadata, versions and sharing consistent; Sync changes across devices with conflict handling | chunking and content hashing, dedup, resumable upload, metadata DB and versioning, notification/sync service, conflict resolution | reuse sim: estimator (drive), reuse diagram: presigned-upload, Mermaid: sequence upload, quiz: check-hld-2, recall ×2 |
| 14.8 | `design-instagram` | Design Instagram | advanced | 18 | P1 | A | `final-architecture`, `caching`, `sharding`, `pubsub` | Design the post, feed and media paths that the core course grew; Choose fan-out on write vs read for the feed and handle celebrities; Shard users and posts and keep counters cheap | media upload via pre-signed URL + CDN, feed fan-out on write vs read, hybrid for celebrities, feed cache, sharding by user, like/follow counters, ranking service | reuse sim: architecture-map, Mermaid: flowchart, Mermaid: sequence post → fan-out, quiz: check-hld-2, recall ×2 |
| 14.9 | `design-whatsapp` | Design WhatsApp | advanced | 18 | P1 | B | `websockets`, `message-queues`, `consistency` | Keep millions of persistent connections and route messages between servers; Guarantee ordering and delivery receipts per chat; Handle offline users, group chat fan-out and end-to-end encryption at the design level | connection gateways, presence, message ids and per-chat ordering, store-and-forward for offline, group fan-out, receipts, E2E encryption (design level) | reuse sim: polling-vs-ws, Mermaid: sequence of a message, quiz: check-hld-3, recall ×2, glossary: E2E |
| 14.10 | `design-youtube` | Design YouTube | advanced | 18 | P1 | B | `object-storage`, `cdn`, `message-queues` | Design upload, transcoding pipeline and adaptive streaming; Serve video through a CDN and handle hot videos; Model metadata, views and recommendations at scale | upload and chunking, transcoding DAG, adaptive bitrate (HLS/DASH), CDN and origin shield, view counting, metadata sharding | Mermaid: flowchart pipeline, Mermaid: sequence upload → playback, quiz: check-hld-3, recall ×2, glossary: HLS, DASH, ABR |
| 14.11 | `design-uber` | Design Uber | advanced | 18 | P1 | B | `websockets`, `sharding`, `consistency` | Ingest driver locations and match riders at scale; Index locations with geohash / H3 and query nearby drivers; Design trip state, pricing and payments with the right consistency | location ingestion, geospatial index (geohash, H3, quadtree), matching service, trip state machine, surge pricing, payments and idempotency | Mermaid: stateDiagram-v2 of a trip, Mermaid: flowchart, quiz: check-hld-3, recall ×2 |
| 14.12 | `design-netflix` | Design Netflix | advanced | 17 | P1 | B | `cdn-internals`, `multi-region`, `stream-processing` | Separate the control plane (catalogue, auth, recommendations) from the data plane (video delivery); Explain Open Connect-style CDN placement; Design for region failure and A/B experimentation | control vs data plane, custom CDN appliances at ISPs, multi-region active-active, chaos engineering, recommendation pipeline, A/B platform | Mermaid: flowchart, quiz: check-hld-4, recall ×2 |
| 14.13 | `design-ecommerce` | Design an e-commerce platform | advanced | 18 | P1 | B | `sagas`, `distributed-transactions`, `caching`, `idempotency` | Model catalogue, cart, inventory, order and payment as services; Keep inventory correct under flash sales; Run checkout as a saga with idempotent payments | catalogue search, cart (session store), inventory reservation and oversell, order saga, payment idempotency, flash-sale protections (queue, shedding) | Mermaid: sequence checkout saga, Mermaid: flowchart, quiz: check-hld-4, recall ×2 |
| 14.14 | `design-ticket-booking` | Design a ticket booking system | intermediate | 15 | P2 | C | `idempotency`, `acid`, `caching` | Prevent double booking with locks, holds and constraints; Handle a ticket drop (flash traffic) with queues and virtual waiting rooms; Model seats, holds and payments | seat hold with TTL, unique constraint / row lock, virtual waiting room, payment timeout and release, read-heavy seat map caching | Mermaid: sequence hold → pay → confirm, quiz: check-hld-4, recall ×1 |
| 14.15 | `design-payment-system` | Design a payment system | advanced | 17 | P2 | C | `idempotency`, `distributed-transactions`, `sagas` | Design a ledger with double-entry and exactly-once effects; Integrate with external PSPs using idempotency and reconciliation; Handle retries, timeouts and partial failures without losing money | double-entry ledger, idempotency keys end to end, PSP integration, reconciliation, retry with backoff, exactly-once effects | Mermaid: sequence of a payment, quiz: check-hld-4, recall ×1, glossary: PSP |
| 14.16 | `design-search-autocomplete` | Design search autocomplete | intermediate | 14 | P2 | C | `caching`, `cdn`, `stream-processing` | Serve prefix suggestions in under 100 ms; Build the trie / top-k pipeline from query logs; Refresh rankings and handle trending terms | trie / prefix index, top-k per prefix, offline aggregation pipeline, cache and CDN for hot prefixes, trending detection | Mermaid: flowchart, quiz: check-hld-4, recall ×1 |

### Module 15: Low-Level Design: Foundations (`lld`) — Down to the code

*How to turn requirements into classes that are correct, testable and easy to change: object-oriented principles, UML, SOLID, design patterns, dependency injection, concurrency and clean code.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 15.1 | `lld-intro` | What low-level design is | basic | 6 | P1 | A | — | Distinguish low-level design from high-level design; Follow the LLD workflow: requirements → entities → classes → interactions; Know what an LLD interviewer looks for | HLD vs LLD, entities and responsibilities, class diagram, sequence of interactions, trade-offs at code level | recall ×1, no quiz |
| 15.2 | `oop-pillars` | OOP: encapsulation, abstraction, inheritance, polymorphism | basic | 8 | P1 | A | `lld-intro` | Explain each pillar with a small example; Spot broken encapsulation and leaky abstractions; Use polymorphism to remove conditionals | encapsulation, abstraction, inheritance, polymorphism, interfaces vs abstract classes | code: Java/TypeScript snippets, quiz: check-lld-1, recall ×2, glossary: OOP |
| 15.3 | `class-relationships-uml` | Class relationships and UML | basic | 8 | P1 | A | `oop-pillars` | Read and draw class diagrams with association, aggregation, composition and dependency; Use multiplicity and visibility correctly; Draw a sequence diagram for one use case | association, aggregation vs composition, dependency, multiplicity, class diagram, sequence diagram | Mermaid: classDiagram (needs validator change) else flowchart boxes, Mermaid: sequenceDiagram, quiz: check-lld-1, recall ×2, glossary: UML |
| 15.4 | `composition-over-inheritance` | Composition over inheritance | intermediate | 7 | P1 | A | `class-relationships-uml` | Explain the fragile base class problem; Replace deep hierarchies with composed behaviours; Know when inheritance is still right | fragile base class, is-a vs has-a, delegation, strategy as composition, when inheritance fits | code: before/after refactor, quiz: check-lld-1, recall ×2 |
| 15.5 | `solid` | SOLID principles | intermediate | 10 | P1 | A | `composition-over-inheritance` | State each SOLID principle and the smell it prevents; Refactor a violating class for each principle; Avoid over-applying SOLID | single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion | code: five small refactors, quiz: check-lld-2, recall ×3, glossary: SOLID, SRP, LSP |
| 15.6 | `interfaces-abstractions-di` | Interfaces, abstractions and dependency injection | intermediate | 8 | P1 | A | `solid` | Program to interfaces and own them at the right layer; Inject dependencies by constructor and explain inversion of control; Use a DI container without hiding the object graph | interface ownership, dependency injection, inversion of control, constructor injection, composition root, DI container | code: constructor injection example, quiz: check-lld-2, recall ×2, glossary: DI, IoC |
| 15.7 | `design-patterns-creational` | Design patterns I: creational | intermediate | 9 | P1 | A | `interfaces-abstractions-di` | Apply Factory Method, Abstract Factory, Builder and Singleton appropriately; Explain why Singleton is often a smell; Choose a pattern from the problem, not the catalogue | Factory Method, Abstract Factory, Builder, Singleton (and its problems), Prototype (named) | code snippets, Mermaid: classDiagram/flowchart for Builder, quiz: check-lld-2, recall ×2 |
| 15.8 | `design-patterns-structural` | Design patterns II: structural | intermediate | 9 | P1 | A | `design-patterns-creational` | Apply Adapter, Decorator, Facade, Proxy and Composite; Distinguish Decorator from Proxy and Adapter; Use Composite for tree-shaped domains | Adapter, Decorator, Facade, Proxy, Composite | code snippets, quiz: check-lld-3, recall ×2 |
| 15.9 | `design-patterns-behavioural` | Design patterns III: behavioural | intermediate | 10 | P1 | A | `design-patterns-structural` | Apply Strategy, Observer, Command, State, Template Method and Chain of Responsibility; Model a workflow as a state machine; Decouple senders and receivers with Command and Observer | Strategy, Observer, Command, State, Template Method, Iterator, Chain of Responsibility | code snippets, Mermaid: stateDiagram-v2 for State pattern, quiz: check-lld-3, recall ×3 |
| 15.10 | `concurrency-basics` | Concurrency and thread safety | advanced | 10 | P1 | A | `design-patterns-behavioural` | Identify race conditions and shared mutable state; Use locks, atomics and immutability correctly; Design producer-consumer and thread pools; avoid deadlock | race condition, mutex / synchronized, atomic operations, immutability, thread pool, producer-consumer, deadlock and lock ordering | code: thread-safe counter and bounded queue, Mermaid: sequence of a race, quiz: check-lld-3, recall ×2 |
| 15.11 | `error-handling` | Error handling and resilience in code | intermediate | 7 | P1 | A | `concurrency-basics` | Choose between exceptions and result types; Validate at boundaries and fail fast; Make retries and timeouts explicit in code | exceptions vs result types, checked vs unchecked (named), validation at boundaries, fail fast, retry/timeout in code, logging context | code snippets, quiz: check-lld-4, recall ×2 |
| 15.12 | `clean-code` | Clean code and maintainability | basic | 7 | P1 | A | `oop-pillars` | Name things so the code explains itself; Keep functions small and cohesive; reduce coupling; Recognise common code smells and refactor them | naming, small functions, cohesion and coupling, code smells, refactoring | code: before/after, quiz: check-lld-4, recall ×2 |
| 15.13 | `testing-extensibility` | Unit testing and designing for extensibility | intermediate | 8 | P1 | A | `interfaces-abstractions-di`, `error-handling` | Write unit tests with test doubles; Design for testability with DI and pure functions; Extend behaviour without modifying tested code | unit test, test double (stub, mock, fake), testability via DI, open/closed in practice, API evolution | code: test with a fake, quiz: check-lld-4, recall ×2 |

### Module 16: Low-Level Design: Case Studies (`lld-practice`) — Model it in code

*Fourteen classic problems worked from requirements to classes, interactions, edge cases and extensibility, each with UML and pseudocode.*

| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 16.1 | `lld-parking-lot` | LLD: Parking lot | intermediate | 13 | P1 | A | `solid`, `design-patterns-creational` | Model vehicles, spots, floors and tickets; Assign spots with a strategy and handle payments; Extend to new vehicle types without rewriting | entities, Strategy for spot allocation, Factory for vehicles, ticket lifecycle, payment, extensibility | Mermaid: classDiagram/flowchart, Mermaid: sequence park → pay → exit, pseudocode, quiz: check-lld-practice-1, recall ×1 |
| 16.2 | `lld-vending-machine` | LLD: Vending machine | intermediate | 12 | P1 | B | `design-patterns-behavioural` | Model states (idle, has money, dispensing, out of stock) with the State pattern; Handle change, refunds and failures; Keep inventory consistent | State pattern, inventory, payment and change, error states, transactions at code level | Mermaid: stateDiagram-v2, Mermaid: classDiagram/flowchart, pseudocode, quiz: check-lld-practice-1, recall ×1 |
| 16.3 | `lld-elevator` | LLD: Elevator system | intermediate | 13 | P1 | A | `design-patterns-behavioural`, `concurrency-basics` | Model elevators, requests and a dispatcher; Implement a scheduling strategy (SCAN/LOOK) and swap it; Handle concurrency of requests and safety states | request queue, dispatcher Strategy, SCAN/LOOK, direction state machine, concurrency, safety and maintenance mode | Mermaid: classDiagram/flowchart, Mermaid: sequence, pseudocode, quiz: check-lld-practice-1, recall ×1 |
| 16.4 | `lld-library-management` | LLD: Library management system | intermediate | 12 | P1 | A | `solid` | Model books, copies, members, loans and reservations; Enforce borrowing rules and fines; Design search and notifications | book vs copy, loan lifecycle, reservation queue, fines policy (Strategy), Observer for notifications | Mermaid: classDiagram/flowchart, Mermaid: sequence borrow/return, pseudocode, quiz: check-lld-practice-1, recall ×1 |
| 16.5 | `lld-movie-ticket-booking` | LLD: Movie ticket booking | intermediate | 13 | P1 | A | `concurrency-basics`, `lld-library-management` | Model theatres, screens, shows, seats and bookings; Prevent double booking with locks or holds; Handle payment timeout and release | seat lock with TTL, optimistic vs pessimistic locking, booking state machine, payment integration, idempotent confirm | Mermaid: sequence hold → pay, Mermaid: classDiagram/flowchart, pseudocode, quiz: check-lld-practice-2, recall ×1 |
| 16.6 | `lld-splitwise` | LLD: Splitwise | intermediate | 12 | P1 | A | `solid` | Model users, groups, expenses and splits (equal, exact, percent); Compute balances and simplify debts; Validate splits and handle rounding | expense split Strategy, balance sheet, debt simplification (greedy), rounding, validation | Mermaid: classDiagram/flowchart, pseudocode, quiz: check-lld-practice-2, recall ×1 |
| 16.7 | `lld-snake-and-ladder` | LLD: Snake and Ladder | basic | 10 | P1 | A | `oop-pillars`, `class-relationships-uml` | Model board, cells, snakes, ladders, dice and players; Run the game loop and detect the winner; Make board size and rules configurable | board and entities, dice abstraction (testable randomness), game loop, configurable rules | Mermaid: classDiagram/flowchart, pseudocode, quiz: check-lld-practice-2, recall ×1 |
| 16.8 | `lld-chess` | LLD: Chess | advanced | 15 | P1 | A | `design-patterns-behavioural`, `lld-snake-and-ladder` | Model pieces with polymorphic move validation; Implement turn, check, checkmate and special moves; Record moves for undo and replay (Command) | Piece hierarchy and polymorphism, move validation, game state, Command for undo, special moves (castling, en passant, promotion) | Mermaid: classDiagram/flowchart, Mermaid: sequence of a move, pseudocode, quiz: check-lld-practice-2, recall ×1 |
| 16.9 | `lld-in-memory-cache` | LLD: In-memory cache | intermediate | 12 | P1 | B | `concurrency-basics`, `caching` | Design get/put with LRU eviction in O(1); Add TTL expiry and pluggable eviction policies; Make it thread-safe without killing throughput | hash map + doubly linked list, eviction Strategy (LRU/LFU), TTL, thread safety (locks, striping), generics | Mermaid: classDiagram/flowchart, pseudocode, quiz: check-lld-practice-3, recall ×1 |
| 16.10 | `lld-logging-framework` | LLD: Logging framework | intermediate | 11 | P1 | B | `design-patterns-structural`, `design-patterns-behavioural` | Model loggers, levels, formatters and appenders; Use Chain of Responsibility / Strategy for level filtering and output; Make logging asynchronous and safe | log levels, appender abstraction, formatter, Chain of Responsibility, async queue, Singleton debate | Mermaid: classDiagram/flowchart, pseudocode, quiz: check-lld-practice-3, recall ×1 |
| 16.11 | `lld-rate-limiter` | LLD: Rate limiter | intermediate | 11 | P1 | B | `rate-limiting`, `concurrency-basics` | Implement token bucket and sliding window as interchangeable strategies; Key limits per client and make them thread-safe; Expose a clean interface for middleware | RateLimiter interface, token bucket implementation, sliding window log/counter, Strategy, concurrency, clock abstraction for tests | reuse sim: token-bucket, Mermaid: classDiagram/flowchart, pseudocode, quiz: check-lld-practice-3, recall ×1 |
| 16.12 | `lld-task-scheduler` | LLD: Task scheduler | advanced | 13 | P1 | B | `concurrency-basics`, `lld-rate-limiter` | Schedule one-off and recurring tasks with a priority queue; Run tasks on a worker pool with retries and timeouts; Handle cancellation and missed schedules | priority queue by next run, worker pool, recurring schedules (cron-like), retry policy, cancellation, clock abstraction | Mermaid: classDiagram/flowchart, Mermaid: sequence schedule → run, pseudocode, quiz: check-lld-practice-4, recall ×1 |
| 16.13 | `lld-ride-booking` | LLD: Ride booking | advanced | 14 | P1 | B | `design-patterns-behavioural`, `lld-task-scheduler` | Model riders, drivers, rides and a matching strategy; Drive the ride through a state machine with notifications; Compute fares with pluggable pricing | matching Strategy, ride state machine (State), Observer notifications, pricing Strategy, location abstraction | Mermaid: stateDiagram-v2, Mermaid: classDiagram/flowchart, pseudocode, quiz: check-lld-practice-4, recall ×1 |
| 16.14 | `lld-food-ordering` | LLD: Food ordering system | advanced | 14 | P1 | B | `lld-ride-booking`, `error-handling` | Model restaurants, menus, carts, orders and delivery; Handle order state, payment and cancellation; Separate concerns so new payment or delivery partners plug in | cart and order aggregate, order state machine, payment abstraction, delivery assignment Strategy, Observer for status updates, error handling | Mermaid: classDiagram/flowchart, Mermaid: sequence place order, pseudocode, quiz: check-lld-practice-4, recall ×1 |
| 16.15 | `lld-revision` | Revision: low-level design | basic | 8 | P2 | C | `lld-food-ordering` | Recall the pattern behind each LLD problem; Identify which case study to redo | flashcards for modules 15–16 | recall-cards variant `lld` (needs RecallDeckId extension) or reuse `test` deck, no quiz |

## 7. Duplicates, splits and combinations

| Topic | Decision | Reason |
| --- | --- | --- |
| Rate limiting | Three lessons: existing `rate-limiting` (concept), `design-rate-limiter` (HLD), `lld-rate-limiter` (LLD) | Different angles the brief asks for separately; each links to the others and reuses the `token-bucket` simulation. |
| Consistent hashing | Stays inside `sharding` (DeepDive) and the existing `shard-router` sim; deepened in `partitioning-internals` and applied in `design-key-value-store` | Already simulated; a separate lesson would duplicate. |
| Bulkheads | Promoted from a `circuit-breaker` DeepDive to `bulkheads-degradation` | The brief lists bulkheads and graceful degradation as topics; the DeepDive stays as a teaser. |
| Consistency models | `consistency` improved in Phase 2; `linearizability` added as the advanced follow-up | Beginner lesson keeps its four-model table; formal definitions need clocks and transactions first. |
| CDN | `cdn` unchanged; `cdn-internals` added | Core lesson is correct at its level; internals (anycast, shields, cache keys) are a separate step. |
| Object storage / file storage | `object-storage` unchanged; `design-file-storage` is the case study | The estimation example for Drive already exists and is linked. |
| Monolith vs microservices | `microservices` unchanged; `modular-monolith-soa` adds SOA history and decomposition | Overlap limited to one definition; the new lesson is about boundaries and splitting. |
| Replication | `replication` + `replication-internals`; `quorums` separate | Leader-based mechanics vs leaderless reasoning are distinct prerequisite chains. |
| Backpressure | No new lesson; `queue-leveling` is the backpressure sim; stream-processing covers backpressure in pipelines in one section | Existing lesson is strong. |
| API gateway | One new lesson `api-gateway` (with BFF); `microservices` keeps its paragraph | Brief lists it as its own topic. |
| Serverless | `serverless` (architecture) only; infrastructure module mentions scale-to-zero in `autoscaling` | One lesson is enough; the infra angle is a paragraph. |
| Disaster recovery vs multi-region | `disaster-recovery` (recovery, backups, tiers) and `multi-region` (serving, routing, data placement) | Different questions; heavy cross-linking. |
| Design patterns | Split into creational / structural / behavioural | One lesson would exceed 2,000 words; three keep the 8–10 minute rhythm. |
| Revision lessons | `advanced-revision`, `lld-revision` (P2) | Mirror `revision-map` / `test-yourself`; depend on new recall deck ids or append to `test`. |
| Twitter/X, Spotify, distributed cache, message broker, analytics, ad serving, object storage design | Not planned (P3 backlog) | Instagram covers the social-feed shape; KV store covers the distributed-store shape; capacity is better spent on depth. |

## 8. Difficulty classification after the plan

- Before: basic 19 · intermediate 18 · advanced 5 (advanced 12%).
- After: basic 29 · intermediate 77 · advanced 37 (advanced 26%).
- Reclassified existing lessons: `circuit-breaker` advanced → intermediate; `idempotency` advanced → intermediate (reasons in `CONTENT_GAPS.md` §5).
- Rules applied to every new lesson: (1) `basic` needs no system-design prerequisite beyond module 1; (2) `intermediate` assumes the core course; (3) `advanced` needs two or more intermediate concepts at once or reasons about partial failure across machines. HLD case studies are `advanced` when they combine three or more tracks (feed fan-out + sharding + CDN), `intermediate` when they extend one existing design (Pastebin, rate limiter, notifications, ticket booking, autocomplete).
- Metadata consistency: the level lives only in `lessonMeta.level`; the roadmap filter, chip and recently-studied list read it from there, so no second source exists to drift.

## 9. Supporting resources plan

### 9.1 Knowledge checks

Existing checks are extended in place (ids kept, new question ids continue the sequence):

| Existing check | Extended with a question on |
| --- | --- |
| `check-async` | `message-queues` |
| `check-communication` | `rest` |
| `check-data-modeling` | `sql-nosql` |
| `check-distributed-data` | `replication`, `consistency` |
| `check-estimation` | `estimation-numbers`, `system-shapes` |
| `check-foundations` | `client-server`, `dns`, `http` |
| `check-reliability` | `circuit-breaker`, `rate-limiting`, `idempotency` |
| `check-scaling` | `proxy` |

New checks (33), one per two to four lessons, shown after the last lesson they cover (the layout renders at most one check per `afterLesson`):

| Check id | Module | Shown after | Lessons tested | Target questions |
| --- | --- | --- | --- | --- |
| `check-distributed-1` | `distributed` | `quorums` | `distributed-fundamentals`, `time-and-ordering`, `quorums` | 4 |
| `check-distributed-2` | `distributed` | `distributed-locks` | `consensus`, `leader-election`, `distributed-locks` | 4 |
| `check-distributed-3` | `distributed` | `linearizability` | `distributed-transactions`, `sagas`, `linearizability` | 4 |
| `check-internals-1` | `internals` | `btree-vs-lsm` | `storage-engines`, `wal`, `btree-vs-lsm` | 4 |
| `check-internals-2` | `internals` | `replication-internals` | `mvcc-isolation`, `query-execution`, `replication-internals` | 4 |
| `check-internals-3` | `internals` | `distributed-sql` | `partitioning-internals`, `distributed-sql` | 4 |
| `check-streaming-1` | `streaming` | `partitions-consumer-groups` | `kafka-architecture`, `partitions-consumer-groups` | 4 |
| `check-streaming-2` | `streaming` | `brokers-compared` | `delivery-semantics`, `cdc`, `brokers-compared` | 4 |
| `check-streaming-3` | `streaming` | `eda-patterns` | `stream-processing`, `eda-patterns` | 4 |
| `check-operations-1` | `operations` | `slos-error-budgets` | `failure-modes`, `bulkheads-degradation`, `slos-error-budgets` | 4 |
| `check-operations-2` | `operations` | `tracing` | `metrics-monitoring`, `logging`, `tracing` | 4 |
| `check-operations-3` | `operations` | `incident-response` | `disaster-recovery`, `capacity-planning`, `incident-response` | 4 |
| `check-security-1` | `security` | `authorization` | `security-fundamentals`, `authentication`, `authorization` | 4 |
| `check-security-2` | `security` | `api-security` | `oauth-jwt`, `encryption`, `api-security` | 4 |
| `check-security-3` | `security` | `threat-modelling` | `secrets-management`, `threat-modelling` | 4 |
| `check-infrastructure-1` | `infrastructure` | `service-discovery` | `containers`, `kubernetes`, `service-discovery` | 4 |
| `check-infrastructure-2` | `infrastructure` | `cdn-internals` | `autoscaling`, `multi-region`, `cdn-internals` | 4 |
| `check-infrastructure-3` | `infrastructure` | `iac` | `cloud-networking`, `iac` | 4 |
| `check-architecture-1` | `architecture` | `service-mesh` | `modular-monolith-soa`, `api-gateway`, `service-mesh` | 4 |
| `check-architecture-2` | `architecture` | `strangler-fig` | `cqrs`, `event-sourcing`, `strangler-fig` | 4 |
| `check-architecture-3` | `architecture` | `multi-tenancy` | `serverless`, `multi-tenancy` | 4 |
| `check-hld-1` | `hld` | `design-notification-system` | `design-pastebin`, `design-rate-limiter`, `design-notification-system` | 4 |
| `check-hld-2` | `hld` | `design-instagram` | `design-key-value-store`, `design-file-storage`, `design-instagram` | 4 |
| `check-hld-3` | `hld` | `design-uber` | `design-whatsapp`, `design-youtube`, `design-uber` | 4 |
| `check-hld-4` | `hld` | `design-search-autocomplete` | `design-netflix`, `design-ecommerce`, `design-ticket-booking`, `design-payment-system`, `design-search-autocomplete` | 5 |
| `check-lld-1` | `lld` | `composition-over-inheritance` | `oop-pillars`, `class-relationships-uml`, `composition-over-inheritance` | 4 |
| `check-lld-2` | `lld` | `design-patterns-creational` | `solid`, `interfaces-abstractions-di`, `design-patterns-creational` | 4 |
| `check-lld-3` | `lld` | `concurrency-basics` | `design-patterns-structural`, `design-patterns-behavioural`, `concurrency-basics` | 4 |
| `check-lld-4` | `lld` | `testing-extensibility` | `error-handling`, `clean-code`, `testing-extensibility` | 4 |
| `check-lld-practice-1` | `lld-practice` | `lld-library-management` | `lld-parking-lot`, `lld-vending-machine`, `lld-elevator`, `lld-library-management` | 5 |
| `check-lld-practice-2` | `lld-practice` | `lld-chess` | `lld-movie-ticket-booking`, `lld-splitwise`, `lld-snake-and-ladder`, `lld-chess` | 5 |
| `check-lld-practice-3` | `lld-practice` | `lld-rate-limiter` | `lld-in-memory-cache`, `lld-logging-framework`, `lld-rate-limiter` | 4 |
| `check-lld-practice-4` | `lld-practice` | `lld-food-ordering` | `lld-task-scheduler`, `lld-ride-booking`, `lld-food-ordering` | 4 |

Question mix per check: at least one scenario, one trade-off or architecture-decision question and, where the topic has failure modes, one debugging question; four plausible options; explanation names why the distractors are wrong.

### 9.2 Recall decks

- Every new lesson has its own `recall {q, a}` in `lessonMeta` (used by the end-of-lesson card and Cache). The "recall ×N" entries above are additional flashcards.
- Preferred: three new decks `advanced` (modules 7–13), `hld` (14) and `lld` (15–16), each embedded by its revision lesson and on `/practice`. This needs `RecallDeckId` extended in `data/recall.ts`, the `VARIANTS` map in `scripts/validate-content.mjs` extended, and `recall-cards.tsx` `deckId()` generalised (three small edits, listed in `recommendations/APP_CHANGES.md`).
- Fallback that needs no app change: append the cards to the `test` deck (append-only; indices of existing cards unchanged). The pack will deliver the cards in a form that works either way.

### 9.3 Glossary short forms to add

Kept to acronyms and abbreviations so the first-mention plugin stays precise. Each lands with the lesson that introduces it (`lessonSlug`):

| Term | Introduced in |
| --- | --- |
| NTP | `time-and-ordering` |
| HLC | `time-and-ordering` |
| LWW | `quorums` |
| 2PC | `distributed-transactions` |
| XA | `distributed-transactions` |
| OLTP | `storage-engines` |
| OLAP | `storage-engines` |
| WAL | `wal` |
| SSTable | `btree-vs-lsm` |
| MVCC | `mvcc-isolation` |
| SSI | `mvcc-isolation` |
| CDC | `replication-internals` |
| CRDT | `replication-internals` |
| ISR | `kafka-architecture` |
| RED | `metrics-monitoring` |
| USE | `metrics-monitoring` |
| PII | `logging` |
| OTel | `tracing` |
| DR | `disaster-recovery` |
| CIA | `security-fundamentals` |
| MFA | `authentication` |
| SSO | `authentication` |
| RBAC | `authorization` |
| ABAC | `authorization` |
| OAuth | `oauth-jwt` |
| OIDC | `oauth-jwt` |
| JWT | `oauth-jwt` |
| PKCE | `oauth-jwt` |
| JWKS | `oauth-jwt` |
| PKI | `encryption` |
| mTLS | `encryption` |
| KMS | `encryption` |
| CSRF | `api-security` |
| CORS | `api-security` |
| OWASP | `api-security` |
| STRIDE | `threat-modelling` |
| OCI | `containers` |
| K8s | `kubernetes` |
| HPA | `kubernetes` |
| VPC | `cloud-networking` |
| NAT | `cloud-networking` |
| IaC | `iac` |
| CI/CD | `iac` |
| SOA | `modular-monolith-soa` |
| ESB | `modular-monolith-soa` |
| BFF | `api-gateway` |
| CQRS | `cqrs` |
| FaaS | `serverless` |
| BaaS | `serverless` |
| E2E | `design-whatsapp` |
| HLS | `design-youtube` |
| DASH | `design-youtube` |
| ABR | `design-youtube` |
| PSP | `design-payment-system` |
| OOP | `oop-pillars` |
| UML | `class-relationships-uml` |
| SOLID | `solid` |
| SRP | `solid` |
| LSP | `solid` |
| DI | `interfaces-abstractions-di` |
| IoC | `interfaces-abstractions-di` |

Concept definitions (quorum, saga, idempotency…) are **not** added to `glossary.json`; see `recommendations/APP_CHANGES.md` for the concept-glossary proposal and `CONTENT_GAPS.md` §7.3 for why.

### 9.4 Simulations

Reused in new lessons (no work beyond embedding): `index-scan` → `query-execution`, `replication-lag` → `replication-internals`, `shard-router` → `partitioning-internals`, `design-key-value-store`, `nines` → `slos-error-budgets`, `littles-law` → `capacity-planning`, `scaling-compare` → `autoscaling`, `estimator` → `design-pastebin`, `design-file-storage`, `token-bucket` → `design-rate-limiter`, `lld-rate-limiter`, `cap-partition` → `design-key-value-store`, `architecture-map` → `design-instagram`, `polling-vs-ws` → `design-whatsapp`.

New simulation specifications to write in Phase 6 (9), each following the conventions in `SIMULATION_AUDIT.md` §1:

| Spec | For lesson(s) | One-line learning objective |
| --- | --- | --- |
| `quorum-reads-writes` | `quorums` | Tune N, R, W; see when a read misses the latest write and what sloppy quorums change. |
| `raft-election` | `consensus` | Watch heartbeats stop, a candidate win a majority, and a partitioned old leader get fenced by a higher term. |
| `distributed-lock` | `distributed-locks` | Hold a Redis lock, pause the holder past its TTL, and watch a second worker write; add a fencing token. |
| `btree-vs-lsm` | `btree-vs-lsm` | Race random writes and point reads through a B-tree and an LSM tree; see write amplification and compaction. |
| `kafka-partitions` | `partitions-consumer-groups` | Produce keyed messages into partitions, add/remove consumers in a group, see rebalancing, lag and per-key order. |
| `trace-waterfall` | `tracing` | Click a slow request and read its span waterfall across four services; change sampling and see what you lose. |
| `jwt-inspector` | `oauth-jwt` | Decode a JWT, tamper with a claim, see the signature fail; expire it and see the refresh flow. |
| `cdn-cache` | `cdn-internals` | Send requests from three regions; watch edge hits/misses, TTL expiry, a purge, and a Vary mistake. |
| `cache-stampede` | `caching` | Expire a hot key under load and compare naive refill, request coalescing and TTL jitter. |

### 9.5 Static diagram specifications

24 static diagrams were planned here in Phase 1. While drafting, every lesson expressed its structural diagram as a Mermaid chart authored directly in the MDX, or reused a diagram already registered in `components/diagrams/static/`, so no new static SVG components are required and none are specified; `specs/diagrams/README.md` records the resolution per planned diagram (status *superseded*, or *planned* for Wave C lessons not yet drafted).

| Diagram spec | For lesson(s) |
| --- | --- |
| `vector-clock-example` | `time-and-ordering` |
| `consistency-model-map` | `linearizability` |
| `page-and-buffer-pool` | `storage-engines` |
| `lsm-levels` | `btree-vs-lsm` |
| `distributed-sql-architecture` | `distributed-sql` |
| `kafka-cluster` | `kafka-architecture` |
| `windows-and-watermarks` | `stream-processing` |
| `failure-domains` | `failure-modes` |
| `bulkheads-and-cells` | `bulkheads-degradation` |
| `metrics-pipeline` | `metrics-monitoring` |
| `dr-tiers` | `disaster-recovery` |
| `trust-boundaries` | `security-fundamentals` |
| `authz-enforcement-points` | `authorization` |
| `envelope-encryption` | `encryption` |
| `dfd-with-boundaries` | `threat-modelling` |
| `container-vs-vm` | `containers` |
| `kubernetes-objects` | `kubernetes` |
| `multi-region-active-active` | `multi-region` |
| `vpc-layout` | `cloud-networking` |
| `api-gateway-bff` | `api-gateway` |
| `service-mesh-sidecars` | `service-mesh` |
| `serverless-event-flow` | `serverless` |
| `tenancy-models` | `multi-tenancy` |
| `normalized-vs-denormalized` | `normalization` |

### 9.6 Companion (Cache) data

For each of the 101 new lessons: `catTip` (lesson-open nudge), `recall {q, a}` (end card and Quick revision), `breaks`, `tradeoffs`, `explainSimply` (2–3 sentences, everyday analogy, no jargon), `hint` (points at the answer's shape), and one `catMeows` line. Register and length follow the 42 existing entries (`REPOSITORY_AUDIT.md` §3.1). No new companion capability is assumed.

## 10. Delivery waves and phase mapping

| Wave | Content | Lessons | Rationale |
| --- | --- | --- | --- |
| A | Phase 2 improvements to modules 1–6; modules 7–11 (distributed, internals, streaming, operations, security) P1 lessons; HLD method + Pastebin, rate limiter, notifications, file storage, KV store, Instagram; LLD foundations; LLD problems 1–7 | 64 new + 42 existing | Covers the brief's Phase 3 core, half the priority HLD list in increasing complexity, and the complete LLD foundation. |
| B | Modules 12–13 (infrastructure, architecture) P1 lessons; HLD WhatsApp, YouTube, Uber, Netflix, e-commerce; LLD problems 8–14 | 26 | Builds on wave A (meshes need Kubernetes; Netflix needs CDN internals and multi-region; later LLD problems reuse earlier patterns). |
| C | All P2 lessons: `distributed-sql`, `cdc`, `brokers-compared`, `incident-response`, `cloud-networking`, `multi-tenancy`, `advanced-revision`, `design-ticket-booking`, `design-payment-system`, `design-search-autocomplete`, `lld-revision` | 11 | Valuable but not required for coherence. |

Phase mapping: Phase 2 = wave A existing-lesson work; Phase 3 = modules 7–13 (wave A then B); Phase 4 = module 14; Phase 5 = modules 15–16; Phase 6 = specifications, checks, recall, glossary for everything written; Phase 7 = QA and export. If capacity runs short, wave C is dropped first and `CONTENT_STATUS.md` says so explicitly; nothing is shipped as a stub.

## 11. Items needing a decision or carrying risk

1. **`ModuleId` extension** (§3.3) is required for new modules. Chosen by the owner; the pack will deliver `data/curriculum.ts` as a merged superset plus the one-line type change as a recommendation.
2. **Recall deck ids** (§9.2): approved; decks exist (empty) in `data/recall.ts` and fill in Phases 3–6.
3. **Mermaid `classDiagram`**: approved (minimal); `erDiagram` was not approved, so HLD data models stay as SQL/text blocks.
4. **`url-shortener` now lives in module 14** (decided 2026-11-22); module 6 has eight lessons and `test-yourself` is 6.8.
5. **Sixteen modules lengthen the roadmap page and the dashboard grid.** No code change is needed, but the owner may want to group modules visually later; that is outside this project.
6. **Hard-coded counts** ("6 modules", "25 interactive diagrams", "42 lessons", "73 terms") must be edited at integration; `INTEGRATION_NOTES.md` will list every occurrence.

**Approval record.** Roadmap approved 2026-11-22 with the decisions above; Phase 2 completed the same day (see `CONTENT_STATUS.md`).
