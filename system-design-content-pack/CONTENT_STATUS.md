# Content Status — system-design-content-pack

Last updated: 2026-11-22 (end of Phase 7). Status values: **complete** (Phase 0/1 documents), **planned** (not started), **in progress**, **drafted** (file saved, not yet QA'd), **reviewed** (technical + educational QA done), **integration-ready** (passes the repository validator on a scratch copy), **blocked** (needs an application change named in `recommendations/APP_CHANGES.md`), **superseded** (a planned static diagram replaced by a Mermaid chart authored in the lesson; nothing to build). Wave = delivery order from `CURRICULUM_ROADMAP.md` §10.

## Summary

| Group | Items | complete | planned | in progress | drafted | reviewed | integration-ready | blocked | superseded |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Existing lessons (modules 1–6 + moved) | 42 | 0 | 0 | 0 | 0 | 0 | 42 | 0 | 0 |
| New lessons | 101 | 0 | 0 | 0 | 0 | 0 | 101 | 0 | 0 |
| Data and app-change files | 9 | 0 | 0 | 0 | 0 | 0 | 9 | 0 | 0 |
| Simulation specs | 9 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Static diagram specs | 24 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 24 |
| Project, research and QA documents | 18 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Project documents

| Path | Phase | Status | Notes |
| --- | --- | --- | --- |
| `REPOSITORY_AUDIT.md` | 0 | complete |  |
| `EXISTING_CONTENT_INDEX.md` | 0 | complete |  |
| `CONTENT_GAPS.md` | 0 | complete |  |
| `SIMULATION_AUDIT.md` | 0 | complete |  |
| `CURRICULUM_ROADMAP.md` | 1 | complete |  |
| `CONTENT_INDEX.md` | 1 | complete |  |
| `CONTENT_STATUS.md` | 1 | complete |  |
| `plan/curriculum-plan.json` | 1 | complete |  |
| `plan/build_plan.py, plan/emit_docs.py, plan/status.json` | 1 | complete |  |
| `tools/apply.sh` | 2 | complete |  |
| `plan/deferred-links.md` | 2 | complete |  |
| `recommendations/APP_CHANGES.md` | 1→7 | complete | rows 1–13; three approved and delivered, the rest optional with fallbacks |
| `SOURCE_MANIFEST.md` | 2→7 | complete | regenerated from every bundle's sources by the merge |
| `research/phase2-core-lessons.md (one file per phase)` | 2→5 | complete | phase2 core lessons; phase3-advanced-modules, phase4-hld, phase5-lld notes written |
| `qa/TECHNICAL_QA.md` | 7 | complete | repo checks, Mermaid parse and render checks, progress compatibility, links, generation |
| `qa/EDUCATIONAL_QA.md` | 7 | complete | coverage, sequencing, structure and voice, accuracy, assessment, companion |
| `INTEGRATION_NOTES.md` | 7 | complete | final integration notes: apply, what changes, hand edits, verification, open items |
| `README.md` | 7 | complete | package README: layout, pipeline, conventions, approved changes |

## Data files

| Path | Phase | Status | Notes |
| --- | --- | --- | --- |
| `data/curriculum.ts` | 2–5 | integration-ready | generated from the bundles by the merge; npm run check and npm run build passed on the scratch checkout |
| `data/lesson-guides.ts` | 2–5 | integration-ready | byte-identical to repository so far; grows in Phases 3–5 |
| `data/cat-meows.ts` | 2–5 | integration-ready | byte-identical to repository so far; grows in Phases 3–5 |
| `data/quizzes.ts` | 2–6 | integration-ready | generated from the bundles by the merge; npm run check and npm run build passed on the scratch checkout |
| `data/recall.ts` | 6 | integration-ready | generated from the bundles by the merge; npm run check and npm run build passed on the scratch checkout |
| `data/glossary.json` | 2–6 | integration-ready | generated from the bundles by the merge; npm run check and npm run build passed on the scratch checkout |
| `types/curriculum.ts` | 2 | integration-ready | approved application change; npm run check and npm run build passed on the scratch checkout |
| `scripts/validate-content.mjs` | 2 | integration-ready | approved application change; npm run check and npm run build passed on the scratch checkout |
| `components/diagrams/interactive/recall-cards.tsx` | 2 | integration-ready | approved application change; npm run check and npm run build passed on the scratch checkout |

### Module 1: Foundations (`foundations`) — existing

| # | Slug | Plan | Wave | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 1.1 | `big-idea` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 1.2 | `client-server` | keep | A | integration-ready | byte-identical to repository |
| 1.3 | `dns` | keep | A | integration-ready | byte-identical to repository |
| 1.4 | `tcp-udp` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 1.5 | `http` | polish | A | integration-ready | byte-identical to repository |
| 1.6 | `latency` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 2: Scaling and Traffic (`scaling`) — existing

| # | Slug | Plan | Wave | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 2.1 | `proxy` | polish | A | integration-ready | byte-identical to repository |
| 2.2 | `load-balancing` | keep | A | integration-ready | byte-identical to repository |
| 2.3 | `scaling` | polish | A | integration-ready | byte-identical to repository |
| 2.4 | `cdn` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 3: Communication (`communication`) — existing

| # | Slug | Plan | Wave | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 3.1 | `rest` | improve | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 3.2 | `grpc` | improve | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 3.3 | `websockets` | keep | A | integration-ready | byte-identical to repository |
| 3.4 | `microservices` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 3.5 | `sync-async` | keep | A | integration-ready | byte-identical to repository |

### Module 4: Data (`data`) — existing

| # | Slug | Plan | Wave | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 4.1 | `sql-nosql` | improve | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 4.2 | `acid` | improve | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 4.3 | `indexing` | keep | A | integration-ready | byte-identical to repository |
| 4.4 | `normalization` | improve | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 4.5 | `replication` | polish | A | integration-ready | byte-identical to repository |
| 4.6 | `sharding` | keep | A | integration-ready | byte-identical to repository |
| 4.7 | `consistency` | improve | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 4.8 | `cap` | keep | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 4.9 | `object-storage` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 5: Performance and Reliability (`reliability`) — existing

| # | Slug | Plan | Wave | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 5.1 | `caching` | improve | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 5.2 | `message-queues` | polish | A | integration-ready | byte-identical to repository |
| 5.3 | `pubsub` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 5.4 | `availability` | keep | A | integration-ready | byte-identical to repository |
| 5.5 | `timeouts-retries` | keep | A | integration-ready | byte-identical to repository |
| 5.6 | `circuit-breaker` | improve | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 5.7 | `backpressure` | keep | A | integration-ready | byte-identical to repository |
| 5.8 | `rate-limiting` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 5.9 | `idempotency` | polish | A | integration-ready | byte-identical to repository |

### Module 6: System Design Practice (`practice`) — existing

| # | Slug | Plan | Wave | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 6.1 | `estimation-numbers` | keep | A | integration-ready | byte-identical to repository |
| 6.2 | `estimation-formulas` | improve | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 6.3 | `estimation-examples` | keep | A | integration-ready | byte-identical to repository |
| 6.4 | `system-shapes` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 6.5 | `final-architecture` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 6.6 | `revision-map` | keep | A | integration-ready | byte-identical to repository |
| 6.7 | `playbook` | polish | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 6.8 | `test-yourself` | keep | A | integration-ready | Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 7: Distributed Systems (`distributed`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 7.1 | `distributed-fundamentals` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 7.2 | `time-and-ordering` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 7.3 | `quorums` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 7.4 | `consensus` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 7.5 | `leader-election` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 7.6 | `distributed-locks` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 7.7 | `distributed-transactions` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 7.8 | `sagas` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 7.9 | `linearizability` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 8: Database Internals (`internals`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 8.1 | `storage-engines` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 8.2 | `wal` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 8.3 | `btree-vs-lsm` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 8.4 | `mvcc-isolation` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 8.5 | `query-execution` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 8.6 | `replication-internals` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 8.7 | `partitioning-internals` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 8.8 | `distributed-sql` | advanced | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 9: Messaging and Streaming (`streaming`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 9.1 | `kafka-architecture` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 9.2 | `partitions-consumer-groups` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 9.3 | `delivery-semantics` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 9.4 | `cdc` | intermediate | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 9.5 | `brokers-compared` | intermediate | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 9.6 | `stream-processing` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 9.7 | `eda-patterns` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 10: Reliability and Observability (`operations`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 10.1 | `failure-modes` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 10.2 | `bulkheads-degradation` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 10.3 | `slos-error-budgets` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 10.4 | `metrics-monitoring` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 10.5 | `logging` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 10.6 | `tracing` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 10.7 | `disaster-recovery` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 10.8 | `capacity-planning` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 10.9 | `incident-response` | intermediate | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 11: Security (`security`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 11.1 | `security-fundamentals` | basic | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 11.2 | `authentication` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 11.3 | `authorization` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 11.4 | `oauth-jwt` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 11.5 | `encryption` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 11.6 | `api-security` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 11.7 | `secrets-management` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 11.8 | `threat-modelling` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 12: Cloud and Infrastructure (`infrastructure`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 12.1 | `containers` | basic | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 12.2 | `kubernetes` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 12.3 | `service-discovery` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 12.4 | `autoscaling` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 12.5 | `multi-region` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 12.6 | `cdn-internals` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 12.7 | `cloud-networking` | intermediate | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 12.8 | `iac` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 13: Architecture Patterns (`architecture`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 13.1 | `modular-monolith-soa` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 13.2 | `api-gateway` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 13.3 | `service-mesh` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 13.4 | `cqrs` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 13.5 | `event-sourcing` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 13.6 | `strangler-fig` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 13.7 | `serverless` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 13.8 | `multi-tenancy` | advanced | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 13.9 | `advanced-revision` | basic | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 14: High-Level Design Case Studies (`hld`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 14.1 | `case-study-method` | basic | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.2 | `url-shortener` | intermediate | — | A | integration-ready | moved from module 6; Phase 2 edit; npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.3 | `design-pastebin` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.4 | `design-rate-limiter` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.5 | `design-notification-system` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.6 | `design-key-value-store` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.7 | `design-file-storage` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.8 | `design-instagram` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.9 | `design-whatsapp` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.10 | `design-youtube` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.11 | `design-uber` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.12 | `design-netflix` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.13 | `design-ecommerce` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.14 | `design-ticket-booking` | intermediate | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.15 | `design-payment-system` | advanced | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 14.16 | `design-search-autocomplete` | intermediate | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 15: Low-Level Design: Foundations (`lld`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 15.1 | `lld-intro` | basic | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.2 | `oop-pillars` | basic | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.3 | `class-relationships-uml` | basic | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.4 | `composition-over-inheritance` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.5 | `solid` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.6 | `interfaces-abstractions-di` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.7 | `design-patterns-creational` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.8 | `design-patterns-structural` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.9 | `design-patterns-behavioural` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.10 | `concurrency-basics` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.11 | `error-handling` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.12 | `clean-code` | basic | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 15.13 | `testing-extensibility` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

### Module 16: Low-Level Design: Case Studies (`lld-practice`) — new

| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |
| --- | --- | --- | --- | --- | --- | --- |
| 16.1 | `lld-parking-lot` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.2 | `lld-vending-machine` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.3 | `lld-elevator` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.4 | `lld-library-management` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.5 | `lld-movie-ticket-booking` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.6 | `lld-splitwise` | intermediate | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.7 | `lld-snake-and-ladder` | basic | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.8 | `lld-chess` | advanced | P1 | A | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.9 | `lld-in-memory-cache` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.10 | `lld-logging-framework` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.11 | `lld-rate-limiter` | intermediate | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.12 | `lld-task-scheduler` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.13 | `lld-ride-booking` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.14 | `lld-food-ordering` | advanced | P1 | B | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |
| 16.15 | `lld-revision` | basic | P2 | C | integration-ready | content review passed (accuracy, sources, voice, validator); npm run check, npm run build, Mermaid parse and render checks passed in Phase 7 |

## Specifications (Phase 6)

| Path | Status | For lesson(s) |
| --- | --- | --- |
| `specs/simulations/quorum-reads-writes.md` | complete | `quorums` |
| `specs/simulations/raft-election.md` | complete | `consensus` |
| `specs/simulations/distributed-lock.md` | complete | `distributed-locks` |
| `specs/simulations/btree-vs-lsm.md` | complete | `btree-vs-lsm` |
| `specs/simulations/kafka-partitions.md` | complete | `partitions-consumer-groups` |
| `specs/simulations/trace-waterfall.md` | complete | `tracing` |
| `specs/simulations/jwt-inspector.md` | complete | `oauth-jwt` |
| `specs/simulations/cdn-cache.md` | complete | `cdn-internals` |
| `specs/simulations/cache-stampede.md` | complete | `caching` |
| `specs/diagrams/vector-clock-example.md` | superseded | `time-and-ordering` |
| `specs/diagrams/consistency-model-map.md` | superseded | `linearizability` |
| `specs/diagrams/page-and-buffer-pool.md` | superseded | `storage-engines` |
| `specs/diagrams/lsm-levels.md` | superseded | `btree-vs-lsm` |
| `specs/diagrams/distributed-sql-architecture.md` | superseded | `distributed-sql` |
| `specs/diagrams/kafka-cluster.md` | superseded | `kafka-architecture` |
| `specs/diagrams/windows-and-watermarks.md` | superseded | `stream-processing` |
| `specs/diagrams/failure-domains.md` | superseded | `failure-modes` |
| `specs/diagrams/bulkheads-and-cells.md` | superseded | `bulkheads-degradation` |
| `specs/diagrams/metrics-pipeline.md` | superseded | `metrics-monitoring` |
| `specs/diagrams/dr-tiers.md` | superseded | `disaster-recovery` |
| `specs/diagrams/trust-boundaries.md` | superseded | `security-fundamentals` |
| `specs/diagrams/authz-enforcement-points.md` | superseded | `authorization` |
| `specs/diagrams/envelope-encryption.md` | superseded | `encryption` |
| `specs/diagrams/dfd-with-boundaries.md` | superseded | `threat-modelling` |
| `specs/diagrams/container-vs-vm.md` | superseded | `containers` |
| `specs/diagrams/kubernetes-objects.md` | superseded | `kubernetes` |
| `specs/diagrams/multi-region-active-active.md` | superseded | `multi-region` |
| `specs/diagrams/vpc-layout.md` | superseded | `cloud-networking` |
| `specs/diagrams/api-gateway-bff.md` | superseded | `api-gateway` |
| `specs/diagrams/service-mesh-sidecars.md` | superseded | `service-mesh` |
| `specs/diagrams/serverless-event-flow.md` | superseded | `serverless` |
| `specs/diagrams/tenancy-models.md` | superseded | `multi-tenancy` |
| `specs/diagrams/normalized-vs-denormalized.md` | superseded | `normalization` |

