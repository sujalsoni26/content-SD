# Content Index — system-design-content-pack

Date: 2026-11-22. Authoritative list of every deliverable in this package, its exact relative path and format. Paths under `content/`, `data/` and `types/` **mirror the repository** so files can be copied over directly; `data/*` files are delivered as merged supersets of the repository files (existing entries preserved verbatim, new entries appended). Everything else is supporting documentation. Status lives in `CONTENT_STATUS.md`.

## A. Project documents

| Deliverable | Path | Format | Phase |
| --- | --- | --- | --- |
| Repository audit | `REPOSITORY_AUDIT.md` | md | 0 |
| Existing content index | `EXISTING_CONTENT_INDEX.md` | md | 0 |
| Content gaps | `CONTENT_GAPS.md` | md | 0 |
| Simulation and static diagram audit | `SIMULATION_AUDIT.md` | md | 0 |
| Curriculum roadmap | `CURRICULUM_ROADMAP.md` | md | 1 |
| Content index (this file) | `CONTENT_INDEX.md` | md | 1 |
| Content status | `CONTENT_STATUS.md` | md | 1 |
| Machine-readable plan | `plan/curriculum-plan.json` | json | 1 |
| Plan generator / validator | `plan/build_plan.py, plan/emit_docs.py, plan/status.json` | py/json | 1 |
| Apply-to-repository script | `tools/apply.sh` | sh | 2 |
| Deferred forward links register | `plan/deferred-links.md` | md | 2 |
| Recommended application changes | `recommendations/APP_CHANGES.md` | md | 1→7 |
| Source manifest (URLs, access dates) | `SOURCE_MANIFEST.md` | md | 2→7 |
| Research notes | `research/phase2-core-lessons.md (one file per phase)` | md | 2→5 |
| Technical QA report | `qa/TECHNICAL_QA.md` | md | 7 |
| Educational QA report | `qa/EDUCATIONAL_QA.md` | md | 7 |
| Integration notes for Claude Enterprise | `INTEGRATION_NOTES.md` | md | 7 |
| Package README | `README.md` | md | 7 |

## B. Structured data files (merged supersets, repository paths)

| File | Path in pack = path in repo | Format | What changes | Phase |
| --- | --- | --- | --- | --- |
| Curriculum metadata | `data/curriculum.ts` | ts | 10 new modules appended to `modules[]`; 101 new `lessonMeta` entries; 2 level reclassifications; otherwise verbatim | 2–5 |
| Lesson guides | `data/lesson-guides.ts` | ts | 101 new entries; existing entries verbatim unless an improvement changes a fact | 2–5 |
| Cat meow lines | `data/cat-meows.ts` | ts | 101 new entries | 2–5 |
| Knowledge checks | `data/quizzes.ts` | ts | existing checks extended (ids kept); new checks appended | 2–6 |
| Recall decks | `data/recall.ts` | ts | cards appended (`test`) and/or new decks `advanced`, `hld`, `lld` (needs type change) | 6 |
| Glossary | `data/glossary.json` | json | new short forms inserted in alphabetical order; existing entries verbatim | 2–6 |
| Curriculum types | `types/curriculum.ts` | ts | `ModuleId` union extended (approved application change, drop-in file) | 2 |
| Content validator | `scripts/validate-content.mjs` | mjs | recall-card variants `advanced`/`hld`/`lld` and Mermaid `classDiagram` allowed (approved application change, drop-in file) | 2 |
| Recall cards component | `components/diagrams/interactive/recall-cards.tsx` | tsx | `deckId()` accepts any registered deck; copy for the new decks (approved application change, drop-in file) | 2 |

## C. Lessons (existing 42 + new 101)

One `.mdx` per lesson at the repository path, plus the metadata triple in the data files above. Status key in `CONTENT_STATUS.md`.

### Module 1: Foundations (`foundations`) — existing

| # | Slug | Title | Level | Plan | Paths (format) |
| --- | --- | --- | --- | --- | --- |
| 1.1 | `big-idea` | The big idea | basic | polish | `content/lessons/big-idea.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 1.2 | `client-server` | Client–server architecture | basic | keep | `content/lessons/client-server.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 1.3 | `dns` | DNS | basic | keep | `content/lessons/dns.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 1.4 | `tcp-udp` | IP, TCP and UDP | basic | polish | `content/lessons/tcp-udp.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 1.5 | `http` | HTTP and HTTPS | basic | polish | `content/lessons/http.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 1.6 | `latency` | Latency, throughput and the numbers to know | intermediate | polish | `content/lessons/latency.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |

### Module 2: Scaling and Traffic (`scaling`) — existing

| # | Slug | Title | Level | Plan | Paths (format) |
| --- | --- | --- | --- | --- | --- |
| 2.1 | `proxy` | Proxy and reverse proxy | basic | polish | `content/lessons/proxy.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 2.2 | `load-balancing` | Load balancing | basic | keep | `content/lessons/load-balancing.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 2.3 | `scaling` | Vertical vs horizontal scaling | basic | polish | `content/lessons/scaling.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 2.4 | `cdn` | CDN | basic | polish | `content/lessons/cdn.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |

### Module 3: Communication (`communication`) — existing

| # | Slug | Title | Level | Plan | Paths (format) |
| --- | --- | --- | --- | --- | --- |
| 3.1 | `rest` | REST APIs | basic | improve | `content/lessons/rest.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 3.2 | `grpc` | gRPC | intermediate | improve | `content/lessons/grpc.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 3.3 | `websockets` | WebSockets (real-time) | intermediate | keep | `content/lessons/websockets.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 3.4 | `microservices` | Monolith vs microservices | intermediate | polish | `content/lessons/microservices.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 3.5 | `sync-async` | Synchronous vs asynchronous communication | basic | keep | `content/lessons/sync-async.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |

### Module 4: Data (`data`) — existing

| # | Slug | Title | Level | Plan | Paths (format) |
| --- | --- | --- | --- | --- | --- |
| 4.1 | `sql-nosql` | SQL vs NoSQL | basic | improve | `content/lessons/sql-nosql.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 4.2 | `acid` | Transactions and ACID | intermediate | improve | `content/lessons/acid.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 4.3 | `indexing` | Database indexing | basic | keep | `content/lessons/indexing.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 4.4 | `normalization` | Normalization vs denormalization | basic | improve | `content/lessons/normalization.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 4.5 | `replication` | Database replication | intermediate | polish | `content/lessons/replication.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 4.6 | `sharding` | Sharding and partitioning | advanced | keep | `content/lessons/sharding.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 4.7 | `consistency` | Consistency: strong vs eventual | intermediate | improve | `content/lessons/consistency.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 4.8 | `cap` | CAP and PACELC | advanced | keep | `content/lessons/cap.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 4.9 | `object-storage` | Object storage | basic | polish | `content/lessons/object-storage.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |

### Module 5: Performance and Reliability (`reliability`) — existing

| # | Slug | Title | Level | Plan | Paths (format) |
| --- | --- | --- | --- | --- | --- |
| 5.1 | `caching` | Caching | intermediate | improve | `content/lessons/caching.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 5.2 | `message-queues` | Message queues | intermediate | polish | `content/lessons/message-queues.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 5.3 | `pubsub` | Pub/sub and event-driven architecture | intermediate | polish | `content/lessons/pubsub.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 5.4 | `availability` | Availability and the nines | intermediate | keep | `content/lessons/availability.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 5.5 | `timeouts-retries` | Timeouts and retries | intermediate | keep | `content/lessons/timeouts-retries.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 5.6 | `circuit-breaker` | Circuit breaker | advanced → intermediate | improve | `content/lessons/circuit-breaker.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 5.7 | `backpressure` | Backpressure and load shedding | advanced | keep | `content/lessons/backpressure.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 5.8 | `rate-limiting` | Rate limiting | intermediate | polish | `content/lessons/rate-limiting.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 5.9 | `idempotency` | Idempotency | advanced → intermediate | polish | `content/lessons/idempotency.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |

### Module 6: System Design Practice (`practice`) — existing

| # | Slug | Title | Level | Plan | Paths (format) |
| --- | --- | --- | --- | --- | --- |
| 6.1 | `estimation-numbers` | Numbers to memorize | basic | keep | `content/lessons/estimation-numbers.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 6.2 | `estimation-formulas` | The formulas | basic | improve | `content/lessons/estimation-formulas.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 6.3 | `estimation-examples` | Worked examples | intermediate | keep | `content/lessons/estimation-examples.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 6.4 | `system-shapes` | Three system shapes | intermediate | polish | `content/lessons/system-shapes.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 6.5 | `final-architecture` | The final architecture | intermediate | polish | `content/lessons/final-architecture.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 6.6 | `revision-map` | Revision: problem to building block | basic | keep | `content/lessons/revision-map.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 6.7 | `playbook` | The interview playbook | basic | polish | `content/lessons/playbook.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |
| 6.8 | `test-yourself` | Test yourself | intermediate | keep | `content/lessons/test-yourself.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) |

### Module 7: Distributed Systems (`distributed`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 7.1 | `distributed-fundamentals` | What makes a system distributed | intermediate | P1 | A | `content/lessons/distributed-fundamentals.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 7.2 | `time-and-ordering` | Clocks, time and ordering | advanced | P1 | A | `content/lessons/time-and-ordering.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 7.3 | `quorums` | Quorums and leaderless replication | advanced | P1 | A | `content/lessons/quorums.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 7.4 | `consensus` | Consensus: Raft in one picture | advanced | P1 | A | `content/lessons/consensus.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 7.5 | `leader-election` | Leader election, split-brain and fencing | advanced | P1 | A | `content/lessons/leader-election.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 7.6 | `distributed-locks` | Distributed locking | advanced | P1 | A | `content/lessons/distributed-locks.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 7.7 | `distributed-transactions` | Distributed transactions and two-phase commit | advanced | P1 | A | `content/lessons/distributed-transactions.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 7.8 | `sagas` | Sagas and compensating actions | intermediate | P1 | A | `content/lessons/sagas.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 7.9 | `linearizability` | Linearizability, serializability and the consistency zoo | advanced | P1 | A | `content/lessons/linearizability.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

### Module 8: Database Internals (`internals`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 8.1 | `storage-engines` | How a database stores data | intermediate | P1 | A | `content/lessons/storage-engines.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 8.2 | `wal` | Write-ahead logging and crash recovery | intermediate | P1 | A | `content/lessons/wal.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 8.3 | `btree-vs-lsm` | B-trees vs LSM trees | advanced | P1 | A | `content/lessons/btree-vs-lsm.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 8.4 | `mvcc-isolation` | MVCC and isolation levels | advanced | P1 | A | `content/lessons/mvcc-isolation.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 8.5 | `query-execution` | Indexes and query execution | intermediate | P1 | A | `content/lessons/query-execution.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 8.6 | `replication-internals` | Replication strategies in depth | advanced | P1 | A | `content/lessons/replication-internals.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 8.7 | `partitioning-internals` | Partitioning and rebalancing | advanced | P1 | A | `content/lessons/partitioning-internals.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 8.8 | `distributed-sql` | Distributed SQL and NewSQL | advanced | P2 | C | `content/lessons/distributed-sql.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

### Module 9: Messaging and Streaming (`streaming`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 9.1 | `kafka-architecture` | Kafka: a distributed log | intermediate | P1 | A | `content/lessons/kafka-architecture.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 9.2 | `partitions-consumer-groups` | Partitions, consumer groups and ordering | intermediate | P1 | A | `content/lessons/partitions-consumer-groups.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 9.3 | `delivery-semantics` | Delivery semantics and exactly-once | advanced | P1 | A | `content/lessons/delivery-semantics.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 9.4 | `cdc` | Change data capture | intermediate | P2 | C | `content/lessons/cdc.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 9.5 | `brokers-compared` | Choosing a broker | intermediate | P2 | C | `content/lessons/brokers-compared.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 9.6 | `stream-processing` | Stream processing | advanced | P1 | A | `content/lessons/stream-processing.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 9.7 | `eda-patterns` | Event-driven architecture in practice | intermediate | P1 | A | `content/lessons/eda-patterns.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

### Module 10: Reliability and Observability (`operations`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 10.1 | `failure-modes` | Fault tolerance: how systems fail | intermediate | P1 | A | `content/lessons/failure-modes.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 10.2 | `bulkheads-degradation` | Bulkheads and graceful degradation | intermediate | P1 | A | `content/lessons/bulkheads-degradation.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 10.3 | `slos-error-budgets` | SLIs, SLOs and error budgets | intermediate | P1 | A | `content/lessons/slos-error-budgets.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 10.4 | `metrics-monitoring` | Metrics and monitoring | intermediate | P1 | A | `content/lessons/metrics-monitoring.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 10.5 | `logging` | Logging at scale | intermediate | P1 | A | `content/lessons/logging.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 10.6 | `tracing` | Distributed tracing | intermediate | P1 | A | `content/lessons/tracing.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 10.7 | `disaster-recovery` | Disaster recovery and backups | advanced | P1 | A | `content/lessons/disaster-recovery.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 10.8 | `capacity-planning` | Capacity planning and load testing | intermediate | P1 | A | `content/lessons/capacity-planning.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 10.9 | `incident-response` | Incidents, postmortems and chaos engineering | intermediate | P2 | C | `content/lessons/incident-response.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

### Module 11: Security (`security`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 11.1 | `security-fundamentals` | Security fundamentals for system design | basic | P1 | A | `content/lessons/security-fundamentals.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 11.2 | `authentication` | Authentication: sessions, tokens and passwords | intermediate | P1 | A | `content/lessons/authentication.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 11.3 | `authorization` | Authorisation: RBAC, ABAC and policy | intermediate | P1 | A | `content/lessons/authorization.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 11.4 | `oauth-jwt` | OAuth 2.0, OpenID Connect and JWT | intermediate | P1 | A | `content/lessons/oauth-jwt.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 11.5 | `encryption` | Encryption in transit and at rest | intermediate | P1 | A | `content/lessons/encryption.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 11.6 | `api-security` | API security | intermediate | P1 | A | `content/lessons/api-security.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 11.7 | `secrets-management` | Secrets management | intermediate | P1 | A | `content/lessons/secrets-management.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 11.8 | `threat-modelling` | Threat modelling and security boundaries | advanced | P1 | A | `content/lessons/threat-modelling.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

### Module 12: Cloud and Infrastructure (`infrastructure`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 12.1 | `containers` | Containers and images | basic | P1 | B | `content/lessons/containers.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 12.2 | `kubernetes` | Kubernetes fundamentals | intermediate | P1 | B | `content/lessons/kubernetes.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 12.3 | `service-discovery` | Service discovery and internal DNS | intermediate | P1 | B | `content/lessons/service-discovery.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 12.4 | `autoscaling` | Autoscaling | intermediate | P1 | B | `content/lessons/autoscaling.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 12.5 | `multi-region` | Multi-region deployment | advanced | P1 | B | `content/lessons/multi-region.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 12.6 | `cdn-internals` | CDN architecture in depth | intermediate | P1 | B | `content/lessons/cdn-internals.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 12.7 | `cloud-networking` | Cloud networking: VPCs, subnets and load balancers | intermediate | P2 | C | `content/lessons/cloud-networking.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 12.8 | `iac` | Infrastructure as Code and delivery pipelines | intermediate | P1 | B | `content/lessons/iac.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

### Module 13: Architecture Patterns (`architecture`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 13.1 | `modular-monolith-soa` | Monolith, modular monolith, SOA and microservices | intermediate | P1 | B | `content/lessons/modular-monolith-soa.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 13.2 | `api-gateway` | API gateway and backend-for-frontend | intermediate | P1 | B | `content/lessons/api-gateway.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 13.3 | `service-mesh` | Service mesh | advanced | P1 | B | `content/lessons/service-mesh.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 13.4 | `cqrs` | CQRS | intermediate | P1 | B | `content/lessons/cqrs.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 13.5 | `event-sourcing` | Event sourcing | advanced | P1 | B | `content/lessons/event-sourcing.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 13.6 | `strangler-fig` | Migrating safely: strangler fig and friends | intermediate | P1 | B | `content/lessons/strangler-fig.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 13.7 | `serverless` | Serverless architecture | intermediate | P1 | B | `content/lessons/serverless.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 13.8 | `multi-tenancy` | Multi-tenant architecture | advanced | P2 | C | `content/lessons/multi-tenancy.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 13.9 | `advanced-revision` | Revision: the advanced tracks | basic | P2 | C | `content/lessons/advanced-revision.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

### Module 14: High-Level Design Case Studies (`hld`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 14.1 | `case-study-method` | How to work a case study | basic | P1 | A | `content/lessons/case-study-method.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.2 | `url-shortener` | Design a URL shortener | intermediate | — | A | `content/lessons/url-shortener.mdx` (.mdx); edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts) (moved from module 6) |
| 14.3 | `design-pastebin` | Design Pastebin | intermediate | P1 | A | `content/lessons/design-pastebin.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.4 | `design-rate-limiter` | Design a distributed rate limiter | intermediate | P1 | A | `content/lessons/design-rate-limiter.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.5 | `design-notification-system` | Design a notification system | intermediate | P1 | A | `content/lessons/design-notification-system.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.6 | `design-key-value-store` | Design a distributed key-value store | advanced | P1 | A | `content/lessons/design-key-value-store.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.7 | `design-file-storage` | Design Google Drive / Dropbox | advanced | P1 | A | `content/lessons/design-file-storage.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.8 | `design-instagram` | Design Instagram | advanced | P1 | A | `content/lessons/design-instagram.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.9 | `design-whatsapp` | Design WhatsApp | advanced | P1 | B | `content/lessons/design-whatsapp.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.10 | `design-youtube` | Design YouTube | advanced | P1 | B | `content/lessons/design-youtube.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.11 | `design-uber` | Design Uber | advanced | P1 | B | `content/lessons/design-uber.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.12 | `design-netflix` | Design Netflix | advanced | P1 | B | `content/lessons/design-netflix.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.13 | `design-ecommerce` | Design an e-commerce platform | advanced | P1 | B | `content/lessons/design-ecommerce.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.14 | `design-ticket-booking` | Design a ticket booking system | intermediate | P2 | C | `content/lessons/design-ticket-booking.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.15 | `design-payment-system` | Design a payment system | advanced | P2 | C | `content/lessons/design-payment-system.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 14.16 | `design-search-autocomplete` | Design search autocomplete | intermediate | P2 | C | `content/lessons/design-search-autocomplete.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

### Module 15: Low-Level Design: Foundations (`lld`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 15.1 | `lld-intro` | What low-level design is | basic | P1 | A | `content/lessons/lld-intro.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.2 | `oop-pillars` | OOP: encapsulation, abstraction, inheritance, polymorphism | basic | P1 | A | `content/lessons/oop-pillars.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.3 | `class-relationships-uml` | Class relationships and UML | basic | P1 | A | `content/lessons/class-relationships-uml.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.4 | `composition-over-inheritance` | Composition over inheritance | intermediate | P1 | A | `content/lessons/composition-over-inheritance.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.5 | `solid` | SOLID principles | intermediate | P1 | A | `content/lessons/solid.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.6 | `interfaces-abstractions-di` | Interfaces, abstractions and dependency injection | intermediate | P1 | A | `content/lessons/interfaces-abstractions-di.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.7 | `design-patterns-creational` | Design patterns I: creational | intermediate | P1 | A | `content/lessons/design-patterns-creational.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.8 | `design-patterns-structural` | Design patterns II: structural | intermediate | P1 | A | `content/lessons/design-patterns-structural.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.9 | `design-patterns-behavioural` | Design patterns III: behavioural | intermediate | P1 | A | `content/lessons/design-patterns-behavioural.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.10 | `concurrency-basics` | Concurrency and thread safety | advanced | P1 | A | `content/lessons/concurrency-basics.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.11 | `error-handling` | Error handling and resilience in code | intermediate | P1 | A | `content/lessons/error-handling.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.12 | `clean-code` | Clean code and maintainability | basic | P1 | A | `content/lessons/clean-code.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 15.13 | `testing-extensibility` | Unit testing and designing for extensibility | intermediate | P1 | A | `content/lessons/testing-extensibility.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

### Module 16: Low-Level Design: Case Studies (`lld-practice`) — new

| # | Slug | Title | Level | Pri | Wave | Paths (format) |
| --- | --- | --- | --- | --- | --- | --- |
| 16.1 | `lld-parking-lot` | LLD: Parking lot | intermediate | P1 | A | `content/lessons/lld-parking-lot.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.2 | `lld-vending-machine` | LLD: Vending machine | intermediate | P1 | B | `content/lessons/lld-vending-machine.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.3 | `lld-elevator` | LLD: Elevator system | intermediate | P1 | A | `content/lessons/lld-elevator.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.4 | `lld-library-management` | LLD: Library management system | intermediate | P1 | A | `content/lessons/lld-library-management.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.5 | `lld-movie-ticket-booking` | LLD: Movie ticket booking | intermediate | P1 | A | `content/lessons/lld-movie-ticket-booking.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.6 | `lld-splitwise` | LLD: Splitwise | intermediate | P1 | A | `content/lessons/lld-splitwise.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.7 | `lld-snake-and-ladder` | LLD: Snake and Ladder | basic | P1 | A | `content/lessons/lld-snake-and-ladder.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.8 | `lld-chess` | LLD: Chess | advanced | P1 | A | `content/lessons/lld-chess.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.9 | `lld-in-memory-cache` | LLD: In-memory cache | intermediate | P1 | B | `content/lessons/lld-in-memory-cache.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.10 | `lld-logging-framework` | LLD: Logging framework | intermediate | P1 | B | `content/lessons/lld-logging-framework.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.11 | `lld-rate-limiter` | LLD: Rate limiter | intermediate | P1 | B | `content/lessons/lld-rate-limiter.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.12 | `lld-task-scheduler` | LLD: Task scheduler | advanced | P1 | B | `content/lessons/lld-task-scheduler.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.13 | `lld-ride-booking` | LLD: Ride booking | advanced | P1 | B | `content/lessons/lld-ride-booking.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.14 | `lld-food-ordering` | LLD: Food ordering system | advanced | P1 | B | `content/lessons/lld-food-ordering.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |
| 16.15 | `lld-revision` | Revision: low-level design | basic | P2 | C | `content/lessons/lld-revision.mdx` (.mdx); entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts) |

## D. Specifications (Phase 6)

| Spec | Path | Format | For lesson(s) |
| --- | --- | --- | --- |
| Simulation `quorum-reads-writes` | `specs/simulations/quorum-reads-writes.md` | md | `quorums` |
| Simulation `raft-election` | `specs/simulations/raft-election.md` | md | `consensus` |
| Simulation `distributed-lock` | `specs/simulations/distributed-lock.md` | md | `distributed-locks` |
| Simulation `btree-vs-lsm` | `specs/simulations/btree-vs-lsm.md` | md | `btree-vs-lsm` |
| Simulation `kafka-partitions` | `specs/simulations/kafka-partitions.md` | md | `partitions-consumer-groups` |
| Simulation `trace-waterfall` | `specs/simulations/trace-waterfall.md` | md | `tracing` |
| Simulation `jwt-inspector` | `specs/simulations/jwt-inspector.md` | md | `oauth-jwt` |
| Simulation `cdn-cache` | `specs/simulations/cdn-cache.md` | md | `cdn-internals` |
| Simulation `cache-stampede` | `specs/simulations/cache-stampede.md` | md | `caching` |
| Static diagram `vector-clock-example` | `specs/diagrams/vector-clock-example.md` (+ optional `specs/diagrams/tsx/vector-clock-example.tsx` draft) | md (+tsx) | `time-and-ordering` |
| Static diagram `consistency-model-map` | `specs/diagrams/consistency-model-map.md` (+ optional `specs/diagrams/tsx/consistency-model-map.tsx` draft) | md (+tsx) | `linearizability` |
| Static diagram `page-and-buffer-pool` | `specs/diagrams/page-and-buffer-pool.md` (+ optional `specs/diagrams/tsx/page-and-buffer-pool.tsx` draft) | md (+tsx) | `storage-engines` |
| Static diagram `lsm-levels` | `specs/diagrams/lsm-levels.md` (+ optional `specs/diagrams/tsx/lsm-levels.tsx` draft) | md (+tsx) | `btree-vs-lsm` |
| Static diagram `distributed-sql-architecture` | `specs/diagrams/distributed-sql-architecture.md` (+ optional `specs/diagrams/tsx/distributed-sql-architecture.tsx` draft) | md (+tsx) | `distributed-sql` |
| Static diagram `kafka-cluster` | `specs/diagrams/kafka-cluster.md` (+ optional `specs/diagrams/tsx/kafka-cluster.tsx` draft) | md (+tsx) | `kafka-architecture` |
| Static diagram `windows-and-watermarks` | `specs/diagrams/windows-and-watermarks.md` (+ optional `specs/diagrams/tsx/windows-and-watermarks.tsx` draft) | md (+tsx) | `stream-processing` |
| Static diagram `failure-domains` | `specs/diagrams/failure-domains.md` (+ optional `specs/diagrams/tsx/failure-domains.tsx` draft) | md (+tsx) | `failure-modes` |
| Static diagram `bulkheads-and-cells` | `specs/diagrams/bulkheads-and-cells.md` (+ optional `specs/diagrams/tsx/bulkheads-and-cells.tsx` draft) | md (+tsx) | `bulkheads-degradation` |
| Static diagram `metrics-pipeline` | `specs/diagrams/metrics-pipeline.md` (+ optional `specs/diagrams/tsx/metrics-pipeline.tsx` draft) | md (+tsx) | `metrics-monitoring` |
| Static diagram `dr-tiers` | `specs/diagrams/dr-tiers.md` (+ optional `specs/diagrams/tsx/dr-tiers.tsx` draft) | md (+tsx) | `disaster-recovery` |
| Static diagram `trust-boundaries` | `specs/diagrams/trust-boundaries.md` (+ optional `specs/diagrams/tsx/trust-boundaries.tsx` draft) | md (+tsx) | `security-fundamentals` |
| Static diagram `authz-enforcement-points` | `specs/diagrams/authz-enforcement-points.md` (+ optional `specs/diagrams/tsx/authz-enforcement-points.tsx` draft) | md (+tsx) | `authorization` |
| Static diagram `envelope-encryption` | `specs/diagrams/envelope-encryption.md` (+ optional `specs/diagrams/tsx/envelope-encryption.tsx` draft) | md (+tsx) | `encryption` |
| Static diagram `dfd-with-boundaries` | `specs/diagrams/dfd-with-boundaries.md` (+ optional `specs/diagrams/tsx/dfd-with-boundaries.tsx` draft) | md (+tsx) | `threat-modelling` |
| Static diagram `container-vs-vm` | `specs/diagrams/container-vs-vm.md` (+ optional `specs/diagrams/tsx/container-vs-vm.tsx` draft) | md (+tsx) | `containers` |
| Static diagram `kubernetes-objects` | `specs/diagrams/kubernetes-objects.md` (+ optional `specs/diagrams/tsx/kubernetes-objects.tsx` draft) | md (+tsx) | `kubernetes` |
| Static diagram `multi-region-active-active` | `specs/diagrams/multi-region-active-active.md` (+ optional `specs/diagrams/tsx/multi-region-active-active.tsx` draft) | md (+tsx) | `multi-region` |
| Static diagram `vpc-layout` | `specs/diagrams/vpc-layout.md` (+ optional `specs/diagrams/tsx/vpc-layout.tsx` draft) | md (+tsx) | `cloud-networking` |
| Static diagram `api-gateway-bff` | `specs/diagrams/api-gateway-bff.md` (+ optional `specs/diagrams/tsx/api-gateway-bff.tsx` draft) | md (+tsx) | `api-gateway` |
| Static diagram `service-mesh-sidecars` | `specs/diagrams/service-mesh-sidecars.md` (+ optional `specs/diagrams/tsx/service-mesh-sidecars.tsx` draft) | md (+tsx) | `service-mesh` |
| Static diagram `serverless-event-flow` | `specs/diagrams/serverless-event-flow.md` (+ optional `specs/diagrams/tsx/serverless-event-flow.tsx` draft) | md (+tsx) | `serverless` |
| Static diagram `tenancy-models` | `specs/diagrams/tenancy-models.md` (+ optional `specs/diagrams/tsx/tenancy-models.tsx` draft) | md (+tsx) | `multi-tenancy` |
| Static diagram `normalized-vs-denormalized` | `specs/diagrams/normalized-vs-denormalized.md` (+ optional `specs/diagrams/tsx/normalized-vs-denormalized.tsx` draft) | md (+tsx) | `normalization` |

## E. Knowledge checks and recall (inside the data files)

| Check id | Module | Shown after | Lessons tested |
| --- | --- | --- | --- |
| `check-async` (extend) | existing | unchanged | +`message-queues` |
| `check-communication` (extend) | existing | unchanged | +`rest` |
| `check-data-modeling` (extend) | existing | unchanged | +`sql-nosql` |
| `check-distributed-data` (extend) | existing | unchanged | +`replication`, `consistency` |
| `check-estimation` (extend) | existing | unchanged | +`estimation-numbers`, `system-shapes` |
| `check-foundations` (extend) | existing | unchanged | +`client-server`, `dns`, `http` |
| `check-reliability` (extend) | existing | unchanged | +`circuit-breaker`, `rate-limiting`, `idempotency` |
| `check-scaling` (extend) | existing | unchanged | +`proxy` |
| `check-distributed-1` (new) | `distributed` | `quorums` | `distributed-fundamentals`, `time-and-ordering`, `quorums` |
| `check-distributed-2` (new) | `distributed` | `distributed-locks` | `consensus`, `leader-election`, `distributed-locks` |
| `check-distributed-3` (new) | `distributed` | `linearizability` | `distributed-transactions`, `sagas`, `linearizability` |
| `check-internals-1` (new) | `internals` | `btree-vs-lsm` | `storage-engines`, `wal`, `btree-vs-lsm` |
| `check-internals-2` (new) | `internals` | `replication-internals` | `mvcc-isolation`, `query-execution`, `replication-internals` |
| `check-internals-3` (new) | `internals` | `distributed-sql` | `partitioning-internals`, `distributed-sql` |
| `check-streaming-1` (new) | `streaming` | `partitions-consumer-groups` | `kafka-architecture`, `partitions-consumer-groups` |
| `check-streaming-2` (new) | `streaming` | `brokers-compared` | `delivery-semantics`, `cdc`, `brokers-compared` |
| `check-streaming-3` (new) | `streaming` | `eda-patterns` | `stream-processing`, `eda-patterns` |
| `check-operations-1` (new) | `operations` | `slos-error-budgets` | `failure-modes`, `bulkheads-degradation`, `slos-error-budgets` |
| `check-operations-2` (new) | `operations` | `tracing` | `metrics-monitoring`, `logging`, `tracing` |
| `check-operations-3` (new) | `operations` | `incident-response` | `disaster-recovery`, `capacity-planning`, `incident-response` |
| `check-security-1` (new) | `security` | `authorization` | `security-fundamentals`, `authentication`, `authorization` |
| `check-security-2` (new) | `security` | `api-security` | `oauth-jwt`, `encryption`, `api-security` |
| `check-security-3` (new) | `security` | `threat-modelling` | `secrets-management`, `threat-modelling` |
| `check-infrastructure-1` (new) | `infrastructure` | `service-discovery` | `containers`, `kubernetes`, `service-discovery` |
| `check-infrastructure-2` (new) | `infrastructure` | `cdn-internals` | `autoscaling`, `multi-region`, `cdn-internals` |
| `check-infrastructure-3` (new) | `infrastructure` | `iac` | `cloud-networking`, `iac` |
| `check-architecture-1` (new) | `architecture` | `service-mesh` | `modular-monolith-soa`, `api-gateway`, `service-mesh` |
| `check-architecture-2` (new) | `architecture` | `strangler-fig` | `cqrs`, `event-sourcing`, `strangler-fig` |
| `check-architecture-3` (new) | `architecture` | `multi-tenancy` | `serverless`, `multi-tenancy` |
| `check-hld-1` (new) | `hld` | `design-notification-system` | `design-pastebin`, `design-rate-limiter`, `design-notification-system` |
| `check-hld-2` (new) | `hld` | `design-instagram` | `design-key-value-store`, `design-file-storage`, `design-instagram` |
| `check-hld-3` (new) | `hld` | `design-uber` | `design-whatsapp`, `design-youtube`, `design-uber` |
| `check-hld-4` (new) | `hld` | `design-search-autocomplete` | `design-netflix`, `design-ecommerce`, `design-ticket-booking`, `design-payment-system`, `design-search-autocomplete` |
| `check-lld-1` (new) | `lld` | `composition-over-inheritance` | `oop-pillars`, `class-relationships-uml`, `composition-over-inheritance` |
| `check-lld-2` (new) | `lld` | `design-patterns-creational` | `solid`, `interfaces-abstractions-di`, `design-patterns-creational` |
| `check-lld-3` (new) | `lld` | `concurrency-basics` | `design-patterns-structural`, `design-patterns-behavioural`, `concurrency-basics` |
| `check-lld-4` (new) | `lld` | `testing-extensibility` | `error-handling`, `clean-code`, `testing-extensibility` |
| `check-lld-practice-1` (new) | `lld-practice` | `lld-library-management` | `lld-parking-lot`, `lld-vending-machine`, `lld-elevator`, `lld-library-management` |
| `check-lld-practice-2` (new) | `lld-practice` | `lld-chess` | `lld-movie-ticket-booking`, `lld-splitwise`, `lld-snake-and-ladder`, `lld-chess` |
| `check-lld-practice-3` (new) | `lld-practice` | `lld-rate-limiter` | `lld-in-memory-cache`, `lld-logging-framework`, `lld-rate-limiter` |
| `check-lld-practice-4` (new) | `lld-practice` | `lld-food-ordering` | `lld-task-scheduler`, `lld-ride-booking`, `lld-food-ordering` |

Recall: cards appended to `data/recall.ts` (deck `test`, or decks `advanced` / `hld` / `lld` if the type change is accepted). Glossary: short forms listed in `CURRICULUM_ROADMAP.md` §9.3 go into `data/glossary.json`.

## F. Conventions for every path above

- `.mdx` files follow the authoring contract in `REPOSITORY_AUDIT.md` §4 and must pass `node scripts/validate-content.mjs` when copied into the repository together with the merged data files.
- `.ts` data files are full files, not fragments, so `tsc --noEmit` can be run on the repository after copying. Entries that already exist in the repository are byte-identical unless `CURRICULUM_ROADMAP.md` §5 names a change.
- `.md` files are documentation and are never copied into the repository.
