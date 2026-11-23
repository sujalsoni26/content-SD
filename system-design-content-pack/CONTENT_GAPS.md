# Content Gaps — Box by Box (System Design)

Date: 2026-11-22 · Repository: `sujalsoni26/box-by-box-system-design` @ `e508232` · Companion documents: `REPOSITORY_AUDIT.md`, `EXISTING_CONTENT_INDEX.md`.

This document compares what the repository teaches today with the coverage the master brief asks for, and records every place where the current content, data or schema falls short. It is an inventory of gaps, not yet a plan: ordering, module placement and difficulty decisions belong to Phase 1 (`CURRICULUM_ROADMAP.md`).

Each gap is tagged:

- **Verified** — confirmed by reading the code or content named.
- **Judgement** — my assessment of quality or priority; open to revision.
- **Blocked by schema** — cannot be delivered as content alone; needs an application change (listed in `REPOSITORY_AUDIT.md` §10 as a recommendation).

---

## 1. Summary of the biggest gaps

| # | Gap | Size | Tag |
| --- | --- | --- | --- |
| 1 | **No Low-Level Design (LLD) track at all.** No OOP, SOLID, design patterns, UML, concurrency-in-code or any of the 14 LLD problems. | Entire track | Verified |
| 2 | **Only one HLD case study** (`url-shortener`). Pastebin, rate limiter, notifications, file storage, KV store, Instagram, WhatsApp, YouTube, Uber, Netflix, e-commerce are absent. The course's own Instagram-like narrative is never assembled as a case study. | 11 of 12 priority case studies | Verified |
| 3 | **Advanced tier is nearly empty**: 5 of 42 lessons are `advanced`, and two of those (`circuit-breaker`, `idempotency`) read as intermediate. Consensus, distributed transactions, quorums, distributed locks, clocks/ordering, MVCC, WAL, LSM trees, Kafka internals, stream processing are not taught. | Most of the brief's Phase 3 list | Verified |
| 4 | **Security is almost absent**: TLS (in `http`) and rate limiting are the only security topics. No authentication/authorisation, OAuth 2.0/JWT, encryption at rest, API security, secrets, threat modelling. | Whole area | Verified |
| 5 | **Observability is absent**: no lesson on monitoring, logging, metrics, tracing, alerting or capacity planning beyond estimation. SLI/SLO/SLA get one table in `availability`. | Whole area | Verified |
| 6 | **Cloud and infrastructure** has only CDN, DNS, reverse proxy, object storage and a paragraph on autoscaling. No containers, Kubernetes, service discovery depth, multi-region, IaC. | Most of the area | Verified |
| 7 | **Architecture patterns** beyond monolith-vs-microservices and pub/sub are missing: CQRS, event sourcing, strangler, service mesh, serverless, SOA, API gateway as its own topic. | Most of the area | Verified |
| 8 | **Assessment coverage is thin**: 29 quiz questions in total, 2–3 per check; 19 lessons have no question; no scenario/debugging-style questions beyond a handful. | 19 of 42 lessons | Verified |
| 9 | **Glossary is acronym-only** (73 short forms). Concept terms (idempotency, quorum, consensus, saga, backpressure…) cannot be added without over-matching ordinary prose, and the schema has no related-terms field. | Schema limit | Blocked by schema |
| 10 | **Ten lessons have no visual at all** (no `<Interactive>`, `<Diagram>` or `<Mermaid>`), including conceptually visual topics such as `consistency`, `acid`, `normalization`, `rest`, `grpc`, `sql-nosql`. | 10 lessons | Verified |

---

## 2. Topic coverage versus the brief (Phase 3 areas)

Status key: ✅ covered adequately · 🟡 mentioned or partial (a line, a table row or a DeepDive) · ❌ absent. "Where" names the lesson(s) that touch the topic today.

### 2.1 Distributed systems

| Topic | Status | Where today | Notes |
| --- | --- | --- | --- |
| Distributed coordination | ❌ | — | ZooKeeper/etcd named only as PC/EC examples in `cap`. |
| Consensus and leader election | ❌ | `cap` (one table row) | No Raft/Paxos intuition, no leader election, no failover mechanics beyond "promote a replica". |
| Distributed transactions | ❌ | `acid` (one sentence: "harder once data spans several machines") | |
| Two-phase commit and alternatives | ❌ | — | |
| Sagas | ❌ | — | |
| Eventual vs strong consistency | ✅ | `consistency`, `cap`, `replication` | `consistency` is only 20 lines and has no visual; worth deepening rather than adding a new lesson. |
| Quorum-based systems | 🟡 | `replication` DeepDive (semi-sync "or a quorum") | No R + W > N reasoning, no sloppy quorums / hinted handoff. |
| Split-brain | ❌ | — | Natural partner to leader election and fencing. |
| Distributed locking | ❌ | — | `idempotency` Callout points at row locks only (single-DB). |
| Clock synchronisation and ordering | 🟡 | `cap` (Spanner TrueTime row) | No logical clocks, no happens-before, no why-wall-clocks-lie. |
| Idempotency and deduplication | ✅ | `idempotency`, `message-queues` | Good lesson; dedup on the consumer side is a sentence. |

### 2.2 Database internals

| Topic | Status | Where today | Notes |
| --- | --- | --- | --- |
| B-trees | 🟡 | `indexing` (DeepDive) + `index-scan` sim | Lookup only; no splits, fill factor, clustered vs secondary. |
| LSM trees | 🟡 | `latency` table row, `system-shapes` DeepDive | Named, never explained. |
| Indexing and query execution | 🟡 | `indexing` | No `EXPLAIN` walk-through, no covering indexes, no query planner. |
| Write-ahead logging | ❌ | `acid` ("it is on disk or in a log") | |
| MVCC | ❌ | — | Isolation levels are listed in `acid` DeepDive without the mechanism. |
| Transactions and isolation | ✅ (basic) | `acid` | Anomalies table is correct; no snapshot isolation, write skew, or locking vs MVCC. |
| Replication strategies | ✅ | `replication` | Single-leader only in depth; multi-leader/leaderless get one Callout. |
| Partitioning and sharding | ✅ | `sharding` | Consistent hashing is a DeepDive paragraph; no simulation. |
| Compaction | ❌ | — | |
| Storage engines | ❌ | — | |

### 2.3 Messaging and streaming

| Topic | Status | Where today | Notes |
| --- | --- | --- | --- |
| Message brokers | ✅ | `message-queues` | |
| Kafka architecture | ❌ | `message-queues` ("a distributed log that also does pub/sub"), `system-shapes` | Named four times, never explained. |
| Partitions and consumer groups | 🟡 | `pubsub` (one bullet) | |
| Delivery semantics | ✅ | `message-queues` DeepDive | |
| Ordering guarantees | 🟡 | `message-queues` ("Ordering isn't always guaranteed") | No per-key ordering, no partition-ordering explanation. |
| Event-driven architecture | ✅ | `pubsub` | Outbox pattern is a DeepDive. |
| Backpressure | ✅ | `backpressure`, `queue-leveling` sim | |
| Stream processing | ❌ | — | |

### 2.4 Reliability and observability

| Topic | Status | Where today | Notes |
| --- | --- | --- | --- |
| Fault tolerance | 🟡 | spread across `availability`, `scaling`, `load-balancing` | No single lesson that defines failure modes (crash, omission, byzantine-lite, grey failure). |
| Circuit breakers | ✅ | `circuit-breaker` + sim | Short lesson (259 words) tagged `advanced`; see §5. |
| Retries and exponential backoff | ✅ | `timeouts-retries` + sim | |
| Bulkheads | 🟡 | `circuit-breaker` DeepDive | |
| Graceful degradation | 🟡 | `availability`, `backpressure` | |
| Disaster recovery | 🟡 | `availability` (RPO/RTO) | No backup strategies, multi-region failover, DR tiers. |
| SLI, SLO, SLA | ✅ (brief) | `availability` | Error budgets in DeepDive. |
| Monitoring, logging, tracing | ❌ | — | Mentioned as "ops overhead" in `microservices`. Largest single reliability gap. |
| Capacity planning | 🟡 | estimation lessons | Estimation is strong; no headroom/utilisation targets, no load testing. |

### 2.5 Security

| Topic | Status | Where today | Notes |
| --- | --- | --- | --- |
| Authentication and authorisation | ❌ | `http` ("your login travels with it as a cookie or token") | |
| OAuth 2.0 and JWT | ❌ | — | |
| Encryption in transit | ✅ | `http` (TLS table) | |
| Encryption at rest | ❌ | — | |
| API security | ❌ | — | |
| Secrets management | ❌ | — | |
| Rate limiting and abuse prevention | ✅ | `rate-limiting` | |
| Security boundaries and threat modelling | ❌ | — | |

### 2.6 Cloud and infrastructure

| Topic | Status | Where today | Notes |
| --- | --- | --- | --- |
| Containers and orchestration | ❌ | — | |
| Kubernetes fundamentals | ❌ | — | |
| CDN architecture | ✅ | `cdn` | No simulation (see §6). |
| DNS | ✅ | `dns` + sim | |
| Service discovery | 🟡 | `microservices` (one bullet) | |
| Reverse proxies | ✅ | `proxy` | |
| Autoscaling | 🟡 | `scaling` ("Elasticity" section) | |
| Multi-region deployment | 🟡 | `cap`, `replication` mentions | No lesson on active-active vs active-passive, data residency, routing. |
| Cloud storage | ✅ | `object-storage` | |
| Infrastructure as Code | ❌ | — | |

### 2.7 Architecture patterns

| Topic | Status | Where today | Notes |
| --- | --- | --- | --- |
| Microservices and monoliths | ✅ | `microservices` | |
| Service-oriented architecture | ❌ | — | |
| CQRS | ❌ | — | |
| Event sourcing | ❌ | — | |
| Strangler pattern | ❌ | — | `microservices` DeepDive discusses "the way back" but not incremental migration. |
| API gateway | 🟡 | `microservices`, `final-architecture` | Named as "a specialized reverse proxy"; no lesson of its own. |
| Service mesh | 🟡 | `circuit-breaker` ("Istio/Envoy") | |
| Serverless architecture | 🟡 | `backpressure` (Lambda scales fast) | |

---

## 3. HLD case studies (Phase 4)

| Priority case study | Status | Notes |
| --- | --- | --- |
| URL shortener | ✅ | `url-shortener` (1,290 words, 10 sections, 4 deep dives, one static diagram, one Mermaid sequence, `base62` sim, 3-question check). The strongest lesson in the course and the template to follow. |
| Pastebin | ❌ | Natural sibling to the shortener (same shape, bigger objects). |
| Rate limiter | 🟡 | `rate-limiting` teaches algorithms and a Redis DeepDive but is not a full design (no API, data model, deployment, failure modes). |
| Notification system | ❌ | `sync-async`, `pubsub` set it up but never design it. |
| File storage | 🟡 | Google Drive appears only as an estimation example and estimator preset. |
| Distributed key-value store | ❌ | |
| Instagram | 🟡 | The whole course grows "an Instagram-like app" and `final-architecture` shows the result, but there is no requirements → estimation → API → data model → deep-dive write-up. This is the most natural first new case study. |
| WhatsApp | ❌ | Chat appears as an estimation drill and in `websockets`. |
| YouTube | ❌ | |
| Uber | ❌ | |
| Netflix | ❌ | |
| E-commerce platform | ❌ | |

Supporting observations (Verified): `playbook` defines a seven-step framework and `estimation-examples` already models the shortener and Drive, so new case studies can reuse those lessons by link instead of repeating the method. The `practice` module currently holds both the method lessons and the one case study; where new case studies live is a Phase 1 decision (see §8).

---

## 4. LLD track (Phase 5)

Status: **nothing exists** (Verified). No lesson touches OOP, SOLID, UML, design patterns, dependency injection, concurrency primitives, error handling or testing. The 14 LLD problems in the brief are all absent.

Schema consequences (details in `REPOSITORY_AUDIT.md` §9–10):

- A separate LLD track needs one or more new modules. `ModuleId` is a closed TypeScript union (`types/curriculum.ts`), so adding a module requires a type change plus a new `modules[]` entry, and the roadmap/dashboard copy that says "six modules" must be updated. **Blocked by schema** for the module; the lesson `.mdx` files and metadata entries themselves fit the existing shapes.
- UML class diagrams: the validator only accepts Mermaid `sequenceDiagram`, `flowchart <dir>` and `stateDiagram-v2`. `classDiagram` is rejected. Class structure must be drawn as a `flowchart` with labelled boxes, as a code block, or the validator regex must be extended (one-line change, recommended). **Blocked by schema** for proper UML.
- Code samples: Shiki is configured with `fallbackLanguage: "text"`, so `java`, `python`, `typescript`, `kotlin`, `go` fences will highlight correctly without configuration changes. ✅
- `archNodes` for LLD lessons would be `[]`, which 10 existing lessons already use. ✅
- A new recall deck for LLD would need `RecallDeckId` and the validator's `VARIANTS["recall-cards"]` list extended. **Blocked by schema**; alternative is to append LLD cards to the existing `test` deck.

---

## 5. Difficulty classification concerns

Current distribution: basic 19 · intermediate 18 · advanced 5 (Verified). The brief's definition of Advanced ("complex distributed behaviour, internals, large-scale architecture, failure handling") fits `cap`, `backpressure` and `sharding`. The remaining two are questionable (Judgement):

| Lesson | Current | Suggested | Reason |
| --- | --- | --- | --- |
| `circuit-breaker` | advanced | intermediate | 259 words; a three-state machine with one sim and no distributed nuance. Prerequisite is only `timeouts-retries`. |
| `idempotency` | advanced | intermediate | Single-service pattern; well explained but needs only HTTP and queues as prerequisites. The DeepDive edge cases are advanced; the lesson is not. |
| `latency` | intermediate | keep | Correct: percentiles and Little's Law need some maths. |
| `indexing` | basic | keep | B-tree intuition is basic; internals can be a separate intermediate/advanced lesson. |
| `test-yourself` | intermediate | keep | A revision deck; level only affects the chip. |

Prerequisite chain gaps (Verified by reading link targets): `cap` is placed after `consistency` (good) but `replication` links forward to `consistency` only implicitly; `message-queues` assumes `idempotency` which comes five lessons later (it links to it, so acceptable); `backpressure` embeds `littles-law`, taught in `latency` (linked, acceptable).

The practical consequence: with real advanced material added in Phase 3, the advanced tier will grow from 5 to perhaps 20+ lessons, and the level filter on `/learn` becomes meaningful. No change to the `Level` type or `LevelChip` is needed.

---

## 6. Visuals, simulations and diagrams

### 6.1 Lessons with no visual at all (Verified)

`acid`, `big-idea`, `client-server`, `consistency`, `estimation-examples`, `grpc`, `normalization`, `rest`, `sql-nosql`, `system-shapes`.

Of these, `consistency` (four models), `acid` (anomalies / isolation), `normalization` (join vs duplication) and `rest` (resource/verb mapping, pagination) would benefit most from a static SVG or Mermaid diagram; `big-idea` and `system-shapes` are fine as prose.

### 6.2 Simulations requested by the brief versus what exists (Verified against the registry and the per-simulation audit in `SIMULATION_AUDIT.md`)

| Brief's suggestion | Existing sim | Status |
| --- | --- | --- |
| Consistent hashing | `shard-router` has a "Consistent hashing" strategy with a ring (8 virtual nodes per shard) and shows keys moved on 3 → 4 shards (18% vs 75% for modulo/hash) | ✅ covered; no new sim needed |
| Database sharding | `shard-router` (modulo, hash, range, ring; hot newest shard under range) | ✅ |
| Database replication | `replication-lag` (async/sync, lag slider, read-your-writes) | ✅ |
| CAP theorem | `cap-partition` (two ATMs, CP vs AP, heal and reconcile) | ✅ (two-replica model; a quorum/majority sim would be a distinct addition) |
| Kafka partitions | — | ❌ gap |
| Message queues | `queue-leveling` (burst, workers, bounded/unbounded buffer, poison → DLQ) | ✅ |
| Cache stampede | `cache-aside` models TTL expiry, LRU eviction, stale hits, hot key and cold start, but **not** a stampede or request coalescing | ❌ gap confirmed |
| Circuit breakers | `circuit-breaker` | ✅ |
| Backpressure | `queue-leveling` (bounded buffer sheds with 503; unbounded crashes the broker) | ✅ |
| CDN behaviour | — (`cdn-edges` static diagram only) | ❌ gap |
| Distributed locks | — | ❌ gap |
| B-tree vs LSM tree | `index-scan` (B-tree lookup vs full scan only) | ❌ gap for the LSM write path and compaction |

Additional simulation candidates that fall out of the Phase 3 topic list: leader election / quorum voting, two-phase commit vs saga, token/JWT flow, rate-limit algorithm comparison (fixed vs sliding window vs token bucket), consumer-group rebalancing, trace waterfall.

### 6.3 Static diagram candidates for new lessons

Any new HLD case study needs at least one architecture diagram. The existing static set has one architecture diagram (`url-shortener-architecture`); the rest are concept diagrams. Static SVGs are React components (application code), so new ones can only be **specified** in this project (SVG spec + optional ready-to-paste `.tsx` offered as a recommendation), while Mermaid `flowchart` diagrams can be authored directly in MDX. Mermaid `erDiagram` for data models is **not** allowed by the validator; data models should stay as SQL/text code blocks as `url-shortener` does.

---

### 6.4 Page-level inconsistencies between lessons and their widgets (Verified in `SIMULATION_AUDIT.md` §5; fixable on the lesson side in Phase 2 unless marked app)

| Lesson | Inconsistency | Fix side |
| --- | --- | --- |
| `latency` | Table says RAM vs SSD "~1,000×"; `latency-scale` preset directly above computes ≈1,500× (150 µs ÷ 100 ns). The recall card in `recall.ts` also says 1,000×. | Lesson: say "about 1,000–1,500×" or quote the two numbers; keep "the ratios are what matter" |
| `final-architecture` | Prose: "click any box to jump there"; `architecture-map` selects a box and shows its lessons in a side panel. | Lesson: reword to "select a box to see its lessons" |
| `pubsub` | Static diagram labels the topic "PostCreated"; the sim names it `post-events` with a `PostCreated` payload. | App (sim or SVG) |
| `scaling` | Static diagram "64 cores · 512 GB" vs sim tier "64 cores, 256 GB". | App (SVG) |
| `caching` | Static diagram "~10–20 ms" miss vs sim 21 ms / note "about 20 ms". | App (sim note) or accept |
| `indexing` | DeepDive says top B-tree levels sit in RAM; sim charges a disk read per level (it states its assumption). | Lesson: one clause noting the sim's pessimistic assumption |
| `tcp-udp` | Sim shows duplicate ACKs but retransmits only on RTO. | Lesson DeepDive could mention fast retransmit; sim change is app |

## 7. Assessments, recall and glossary

### 7.1 Knowledge checks (Verified)

- 10 checks, 29 questions, 2–3 questions each. All are four-option multiple choice; the component supports up to five options.
- 19 lessons have no question: `big-idea`, `client-server`, `dns`, `http`, `proxy`, `rest`, `sql-nosql`, `replication`, `consistency`, `message-queues`, `circuit-breaker`, `rate-limiting`, `idempotency`, `estimation-numbers`, `system-shapes`, `final-architecture`, `revision-map`, `playbook`, `test-yourself`.
- Mix: most questions are already scenario-flavoured ("a video-call app…", "two users request the same alias…"), which matches the brief. There are no failure-analysis/debugging questions beyond the replication-lag recall card, and no architecture-decision questions outside the shortener check.
- Structural limit: `knowledgeCheckAfter(slug)` returns the **first** check whose `afterLesson` matches, so at most one check can appear at the end of a given lesson. Extra questions should extend existing checks (keeping existing question ids) or attach to lessons that have none.

### 7.2 Recall / flashcards (Verified)

- `test` deck: 20 cards; `revision` deck: 32 cards (one per building block). Nine lessons have no card in either deck (mostly meta lessons, which is reasonable).
- Every lesson has its own `recall` prompt used by the end-of-lesson card and by Cache's Quick Revision, so per-lesson recall exists everywhere.
- Gap versus the brief: no cards on failure scenarios or "common interview questions" as a category; no cards for any Phase 3 topic (because the lessons do not exist).
- Constraint: cards are identified by **index** in persisted progress; only append.

### 7.3 Glossary (Verified)

- 73 entries, all acronyms/abbreviations, each with `term`, `full`, `note`, `lessonSlug`.
- The remark plugin auto-wraps first mentions by exact, case-sensitive, whole-word match, so adding a concept term such as `Quorum` or `Saga` would be wrapped wherever the word appears, and multi-word phrases would need to appear verbatim. The glossary page is titled "short forms, spelled out". **The brief's concept glossary does not fit this schema.** Options are in `REPOSITORY_AUDIT.md` §10 (recommendation: keep `glossary.json` for short forms, propose a separate concept-glossary data file and page as an application change, and in the meantime put concept definitions in `ConceptCard`-style lesson content once `ConceptCard` is allowed by the validator).
- Missing short forms that Phase 3 content will introduce and that should be added in the existing schema: e.g. 2PC, WAL, MVCC, LSM (exists), SSTable, CQRS, JWT, OAuth, RBAC, mTLS, IaC, K8s, SLO (exists), OTel, RTT, P2P, CRDT, HLC, NTP, DR, RTO/RPO (exist), DI, UML, OOP, SRP… Each needs a `lessonSlug` that exists, so these land together with their lessons.
- `PoP` and `PoPs` are both entries (plural handled by a duplicate entry) — a convention to follow if a plural form appears in prose.

---

## 8. Structural and schema gaps that affect content delivery

All of these are **Verified** against the code and expanded in `REPOSITORY_AUDIT.md` §9–10.

| Gap | Impact on this project | Content-only workaround | Recommended app change |
| --- | --- | --- | --- |
| `ModuleId` and `ArchNodeId` are closed unions | New modules (Advanced, HLD, LLD) cannot be added by data alone | Place new lessons inside the six existing modules | Extend the unions; update "six modules" copy in `app/learn/page.tsx`, `app/page.tsx`, README |
| `ConceptCard` is registered in `mdx-components.tsx` but **not** in the validator's `COMPONENTS` allowlist | Using it fails `npm run validate:content` | Do not use it | Add `ConceptCard: ["title"]` to `scripts/validate-content.mjs` |
| Mermaid types limited to `sequenceDiagram`, `flowchart`, `stateDiagram-v2` | No `classDiagram` (LLD UML), no `erDiagram` (HLD data models), no `gantt`/`timeline` | Flowchart boxes for classes; SQL code blocks for schemas | Extend `MERMAID_TYPES` regex |
| Links limited to `/learn/<slug>`, `/learn#<module>`, `/learn`, `http(s)://` | Lessons cannot link to `/glossary#term-X` or `/practice` | Mention the glossary in prose | Allow `/glossary…` and `/practice` in the link check |
| `RecallDeckId` is `"test" \| "revision"` and the validator hard-codes those variants | No new flashcard deck (e.g. LLD, advanced) | Append to `test` | Extend the union and `VARIANTS` |
| Only one knowledge check per `afterLesson` | Cannot add a second check at the end of a lesson | Extend the existing check or attach to a lesson without one | — |
| `knownCards` keyed by card index | Reordering cards corrupts learner state | Append-only | Key cards by a stable id (schema change) |
| Interactive `variant` is validated only for `estimator` and `recall-cards` | New presets cannot be added without touching `VARIANTS` | — | — (new sims are app code anyway) |
| Hard-coded "25 interactive diagrams" (`app/page.tsx`, README) and "42 lessons"/"73 terms" (README, docs) | Counts drift when content grows | Note in integration instructions | Compute from registries |
| No tests, no CI workflow, no LICENSE file in the repo | QA relies on `npm run check` only; licence of the original content is unstated | Run `npm run check` on every content change | Add a LICENSE; consider a CI job running `npm run check` |

---

## 9. Lesson-level quality notes (candidates for Phase 2 improvement)

Judgement unless marked. Thin lessons are measured by MDX tokens in `EXISTING_CONTENT_INDEX.md`.

| Lesson | Observation | Suggested action |
| --- | --- | --- |
| `consistency` (251 tokens) | Correct but a single table; no mechanism for how read-your-writes or causal consistency is implemented; no visual. | Deepen: add linearizability vs sequential vs causal with an example timeline (Mermaid sequence), monotonic reads, and how session guarantees are implemented (sticky routing to primary, version vectors). |
| `normalization` (165 tokens) | No heading structure, one code block and a table. | Add a worked feed example with the actual join, when to denormalise, and the maintenance path (async fan-out of renames). |
| `system-shapes` (160 tokens) | Essentially a table. | Fine as a short lesson; could gain a "classify these ten systems" recall exercise. |
| `estimation-formulas` (252 tokens) | Table plus estimator; no explanation of why cache = 20% of daily reads or of the peak multipliers. | Add short reasoning and one fully narrated example. |
| `grpc` (235 tokens) | Good; lacks streaming types, deadlines, and status codes. | Add a DeepDive on deadlines/cancellation and the four call types. |
| `rest` (256 tokens) | Good basics; no status-code design, versioning, idempotent PUT vs POST, or HATEOAS-lite. | Extend with API design hygiene; links naturally to a future API-security lesson. |
| `sql-nosql` (226 tokens) | Good table; "default to relational" is well argued. | Add the access-pattern-first design example and a note on NewSQL. |
| `acid` (323 tokens) | Correct. Durability says "on disk or in a log"; WAL is never named. | Name WAL and link to a future storage-internals lesson; add a lost-update example. |
| `circuit-breaker` (259 tokens) | Correct and tight; level too high (see §5). | Reclassify; add failure-rate windows vs consecutive-count thresholds and per-endpoint breakers. |
| `big-idea` | The seven-step "growing up" list places microservices/queues/events at step 6 while the course teaches microservices in module 3. | Minor narrative mismatch; reword step 6 or leave as a story arc. |
| `latency` | Dense but excellent; numbers are from Dean/Norvig and the ratios check out (RAM vs SSD ~1,000×; DC round trip vs cross-continent ~300×; compress vs send ~7×). | Keep; consider splitting percentiles into their own short lesson if the module grows. |
| `url-shortener` | Arithmetic verified (62⁵≈0.9 B, 62⁶≈57 B, 62⁷≈3.5 T; 1,000,000 → `4C92`; ~3 writes/s; 500 GB). Strong. | Use as the template for all HLD case studies. |
| `estimation-examples`, `test-yourself` drill | Arithmetic verified (≈1 PB; ≈2 TB cache; 50 TB/day; ≈55 PB/yr; chat 1 M write QPS, 900 TB/30 days). | Keep. |
| `availability` | Downtime table and error-budget arithmetic verified. | Keep; add a multi-region/DR follow-up lesson rather than extending. |
| `caching` | Thorough; stampede, hot keys, cold start covered in bullets. | Add a short section on TTL jitter and request coalescing mechanics; good candidate for a stampede simulation spec. |
| `message-queues`, `pubsub` | Solid; Kafka named but never explained. | Add a Kafka/log-based-broker lesson in Phase 3 and link. |

Citations to verify in Phase 2 (not yet checked against sources in this phase): Amazon Prime Video 2023 cost figure (`microservices`), Cloudflare sliding-window post (`rate-limiting`), Facebook "Fail at Scale" (`backpressure`), AWS full-jitter formula (`timeouts-retries`), S3 durability/availability design targets (`object-storage`), Google SRE criticality names (`backpressure`).

---

## 10. Companion (Cache) guidance gaps

Verified: every lesson has the five companion fields; no lesson is missing data. Gaps are therefore about what **new** lessons must ship with, plus two observations:

- Each new lesson needs all of: `catTip`, `recall {q, a}` (in `lessonMeta`), `breaks`, `tradeoffs`, `explainSimply`, `hint` (in `lessonGuides`) and a `catMeows[slug]` line. Missing guide fields fall back to `problem` / `summary` / a generic hint (see `lib/curriculum.ts`), so omissions are silent; the content pack must supply all of them.
- Reactions to simulations are hard-coded strings inside each simulation's `.tsx` (14 of 25 emit `diagram` events; see the audit). "Topic-specific reactions" for new simulations can only be specified, not shipped, in this project.
- `explainSimply` lines are consistently 2–3 sentences with an everyday analogy; `hint` lines nudge toward `recall.a` without revealing it. New content should match that register and length.

---

## 11. What this means for the next phases

- **Phase 1** must decide module placement under the closed `ModuleId` union (or recommend extending it), set the target advanced tier, and order the ~40–60 new lessons implied above.
- **Phase 2** has a clear short list of thin lessons (§9) and two reclassifications (§5).
- **Phase 3** is the largest body of new work: seven areas, most of them currently at 0–20 % coverage.
- **Phase 4/5** start from one template case study and zero LLD content.
- **Phase 6** needs specifications for at least consistent hashing, Kafka partitions, CDN, distributed locks and B-tree vs LSM, plus a concept-glossary recommendation.
