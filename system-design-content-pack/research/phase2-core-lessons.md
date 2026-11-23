# Research notes — Phase 2 (core modules 1–6)

Date: 2026-11-22. Supporting notes for the lesson improvements in `CURRICULUM_ROADMAP.md` §5. Sources are numbered as in `SOURCE_MANIFEST.md`.

## What was checked and what changed

| Lesson | Claim or addition | Source | Outcome |
| --- | --- | --- | --- |
| `latency` | RAM vs SSD ratio | S13 | Classic list: 100 ns vs 150 µs (4K random SSD read) = 1,500×; lesson table said ~1,000× while the `latency-scale` widget computes ≈1,500×. Table now says "~1,000–1,500× (100 ns vs 150 µs)"; the recall card was aligned; the "Common slips" Callout notes that NVMe drives are faster than the classic figure. |
| `tcp-udp` | Fast retransmit | S18 (RFC 5681, named, not fetched) | Added one paragraph: three duplicate ACKs trigger retransmission before the timer. |
| `rest` | Safe vs idempotent methods; Problem Details; status codes | S6, S7 | Added sections. RFC 9110 §9.2.2 wording confirmed; 429 lives in RFC 6585. |
| `grpc` | Four call types; deadlines; cancellation semantics | S8 | Added sections; "changes made before a cancellation are not rolled back" and independent success determination are quoted in sense, not verbatim. |
| `circuit-breaker` | Window types and defaults | S9 | Added table; defaults quoted from the Resilience4j page. Reclassified to intermediate. |
| `consistency` | Session guarantees | S15 | Four guarantees named after Terry et al. 1994 (Bayou); implementation mechanisms follow Kleppmann, DDIA ch. 5 (read-from-leader window; version tracking; sticky routing; same-partition causality). |
| `acid` | WAL; defaults for isolation | S10, S11 | WAL paragraph added; PostgreSQL READ COMMITTED and InnoDB REPEATABLE READ defaults confirmed. |
| `sql-nosql` | Distributed SQL / NewSQL | S16 | CockroachDB: ranges, Raft per range, 3 replicas by default. MongoDB multi-document transactions (4.0+) and DynamoDB transactions (2018) are general knowledge, stated without numbers. |
| `caching` | Stampede prevention | S12 | XFetch rule stated as in the paper/Wikipedia: recompute when `now − Δ·β·ln(rand) ≥ expiry`. |
| `microservices` | Prime Video 2023 | S17 (dead), S20 | Primary post removed; wording now attributes the figure to "Prime Video's engineering blog" and adds the mechanism (Step Functions + Lambda via S3 → one process). |
| `backpressure` | Criticality names; Fail at Scale | S5, S3 | Verified; no text change. |
| `rate-limiting` | Cloudflare sliding window | S2 | Verified; no text change (the DeepDive's description matches the post). |
| `object-storage` | S3 durability/availability | S4 | Verified; no text change. |
| `timeouts-retries` | Full-jitter formula | S1, S19 | Primary blog body not retrievable by the tool; Builders' Library article confirms the guidance; formula kept as widely quoted. |
| `estimation-formulas` | Worked example | arithmetic | 50M DAU × 20 views = 10⁹ reads/day → 10k QPS (30k peak); 2 GB/s egress; 500 writes/s; 10 TB/day; ≈11 PB/year ×3; 40 TB cache bound. |

## Decisions recorded

- Only `classDiagram` was added to the validator (owner asked for the minimal change); `erDiagram` stays out, so data models remain SQL/text blocks.
- Recall deck ids `advanced`, `hld`, `lld` were added with empty card lists; `recall-cards.tsx` falls back to `test` for unknown variants, so existing embeds behave exactly as before. Known-card state is keyed by deck id and index; existing decks were not reordered.
- `url-shortener` moved to module `hld` with its slug unchanged; `check-url-shortener.moduleId` updated; module 6 keeps `playbook` with a cross-reference and `test-yourself` now points to the case studies.
- Forward links to lessons that do not exist yet are tracked in `plan/deferred-links.md` and added when their targets land.
