# Existing Content Index — Box by Box (System Design)

Generated on 2026-11-22 from the repository `sujalsoni26/box-by-box-system-design` (branch `main`, commit `e508232`).
Every row was produced by parsing `data/curriculum.ts`, `data/quizzes.ts`, `data/recall.ts`, `data/glossary.json`, `data/lesson-guides.ts`, `data/cat-meows.ts` and `content/lessons/*.mdx` directly, so the numbers reflect the code rather than the README.

## Totals

| Item | Count | Source |
| --- | --- | --- |
| Modules | 6 | `data/curriculum.ts` → `modules` |
| Lessons | 42 | `data/curriculum.ts` → `lessonMeta`; one `content/lessons/<slug>.mdx` each |
| Lessons by level | basic 19 · intermediate 18 · advanced 5 | `level` field |
| Total reading minutes | 248 (≈ 4 h) | `minutes` field |
| Lesson guides (breaks / tradeoffs / explainSimply / hint) | 42 | `data/lesson-guides.ts` |
| Cat meow lines | 42 | `data/cat-meows.ts` |
| Knowledge checks | 10 (29 questions) | `data/quizzes.ts` |
| Recall decks | 2 (`test` 20 cards · `revision` 32 cards) | `data/recall.ts` |
| Glossary entries | 73 (all short forms / acronyms) | `data/glossary.json` |
| Interactive simulations | 25 registered, 28 embeds in lessons | `components/diagrams/interactive-registry.tsx` |
| Static SVG diagrams | 16 registered, 16 embeds | `components/diagrams/static/index.ts` |
| Mermaid diagrams | 8 (inline in MDX) | `<Mermaid chart={`…`} />` |

Legend for the lesson tables: **Sim** = `<Interactive>` names (variant in brackets); **Diag** = `<Diagram>` static SVG names; **Mmd** = number of `<Mermaid>` charts; **Call/DD** = `<Callout>` and `<DeepDive>` counts; **Words** = whitespace-separated tokens in the MDX source (includes markup); **Quiz Qs** = questions in `data/quizzes.ts` whose `lessonSlug` points at this lesson; **Check after** = the knowledge check rendered at the end of this lesson; **Recall t/r** = cards in the `test` / `revision` decks pointing at this lesson (every lesson also has its own `recall` prompt in `curriculum.ts`, used by the end-of-lesson card and by Cache); **Glossary** = number of terms whose `lessonSlug` is this lesson.

## Module 1: Foundations (`foundations`)

- **Tagline:** How a client talks to a server
- **Stage:** 1 user · 1 server
- **Description:** Addresses, packets, protocols and the numbers that explain where time goes. One app, one server, one database.
- **Lessons:** 6 · 34 min · basic 5 · intermediate 1
- **Knowledge checks in this module:** `check-foundations` after `latency` (3 Qs)

| # | Slug | Title | Level | Min | archNodes | Sim | Diag | Mmd | Call/DD | Words | Quiz Qs | Check after | Recall t/r | Glossary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1 | `big-idea` | The big idea | basic | 4 | — | — | — | — | 3/0 | 451 | — | — | 0/0 | 0 |
| 1.2 | `client-server` | Client–server architecture | basic | 3 | users | — | — | — | 0/1 | 198 | — | — | 0/0 | 0 |
| 1.3 | `dns` | DNS | basic | 5 | dns | dns-lookup | — | 1 | 1/1 | 417 | — | — | 0/1 | 7 |
| 1.4 | `tcp-udp` | IP, TCP and UDP | basic | 6 | users | tcp-udp | — | 1 | 1/1 | 407 | 1 | — | 0/1 | 6 |
| 1.5 | `http` | HTTP and HTTPS | basic | 6 | users | request-journey | — | — | 0/1 | 339 | — | — | 0/1 | 3 |
| 1.6 | `latency` | Latency, throughput and the numbers to know | intermediate | 10 | users | tail-latency, littles-law, latency-scale | bottleneck-chain | — | 2/0 | 483 | 2 | `check-foundations` | 2/2 | 4 |

Problem statements (the `problem` field, shown in the teaching strip and roadmap):

- **1.1 The big idea** — A system-design diagram full of boxes is easy to draw and hard to defend.
- **1.2 Client–server architecture** — A phone can't hold everyone's photos or run the logic for millions of people, so the work has to live somewhere shared.
- **1.3 DNS** — Computers find each other by IP address (203.0.113.10), but people type names (instagram.com).
- **1.4 IP, TCP and UDP** — The network only promises best effort: packets can be lost, duplicated or arrive out of order.
- **1.5 HTTP and HTTPS** — Client and server need a shared message format, and on a public network anyone in between could read or change the bytes.
- **1.6 Latency, throughput and the numbers to know** — You can't make a system fast until you know where time goes and which part sets the pace.

## Module 2: Scaling and Traffic (`scaling`)

- **Tagline:** Handling more traffic
- **Stage:** 10k users
- **Description:** One server is no longer enough. Proxies, load balancers, horizontal scaling and CDNs turn one machine into many.
- **Lessons:** 4 · 21 min · basic 4
- **Knowledge checks in this module:** `check-scaling` after `cdn` (3 Qs)

| # | Slug | Title | Level | Min | archNodes | Sim | Diag | Mmd | Call/DD | Words | Quiz Qs | Check after | Recall t/r | Glossary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2.1 | `proxy` | Proxy and reverse proxy | basic | 4 | gateway | — | forward-reverse-proxy | — | 1/0 | 177 | — | — | 0/1 | 0 |
| 2.2 | `load-balancing` | Load balancing | basic | 6 | gateway | lb-sim | — | — | 1/1 | 303 | 1 | — | 0/1 | 5 |
| 2.3 | `scaling` | Vertical vs horizontal scaling | basic | 6 | gateway | scaling-compare | scale-up-vs-out | — | 2/0 | 317 | 1 | — | 1/1 | 1 |
| 2.4 | `cdn` | CDN | basic | 5 | cdn | — | cdn-edges | — | 0/1 | 225 | 1 | `check-scaling` | 0/1 | 6 |

Problem statements (the `problem` field, shown in the teaching strip and roadmap):

- **2.1 Proxy and reverse proxy** — Clients shouldn't talk to your servers directly: you need one front door for routing, security and caching.
- **2.2 Load balancing** — One server can't take all the traffic, and if it dies the whole app goes down.
- **2.3 Vertical vs horizontal scaling** — Load keeps growing until latency climbs into seconds, connections time out and the server returns 503.
- **2.4 CDN** — Every user fetching the same images and scripts from one faraway origin is slow for them and expensive for you.

## Module 3: Communication (`communication`)

- **Tagline:** How components talk
- **Stage:** Many services
- **Description:** REST for clients, gRPC inside, WebSockets for real time, and when to stop waiting for an answer.
- **Lessons:** 5 · 26 min · basic 2 · intermediate 3
- **Knowledge checks in this module:** `check-communication` after `websockets` (2 Qs)

| # | Slug | Title | Level | Min | archNodes | Sim | Diag | Mmd | Call/DD | Words | Quiz Qs | Check after | Recall t/r | Glossary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3.1 | `rest` | REST APIs | basic | 5 | feed | — | — | — | 0/1 | 256 | — | — | 0/1 | 4 |
| 3.2 | `grpc` | gRPC | intermediate | 5 | feed | — | — | — | 1/1 | 235 | 1 | — | 0/1 | 2 |
| 3.3 | `websockets` | WebSockets (real-time) | intermediate | 6 | chat | polling-vs-ws | — | — | 1/0 | 269 | 1 | `check-communication` | 0/1 | 1 |
| 3.4 | `microservices` | Monolith vs microservices | intermediate | 6 | feed | — | monolith-vs-microservices | — | 1/1 | 349 | 1 | — | 0/1 | 0 |
| 3.5 | `sync-async` | Synchronous vs asynchronous communication | basic | 4 | post | — | sync-vs-async-timeline | 1 | 2/0 | 299 | 1 | — | 1/0 | 0 |

Problem statements (the `problem` field, shown in the teaching strip and roadmap):

- **3.1 REST APIs** — Separate pieces of software need a clear contract: what you can ask, in what format, and what comes back.
- **3.2 gRPC** — Inside your system, services call each other thousands of times per second, and verbose JSON wastes time and bytes.
- **3.3 WebSockets (real-time)** — In plain HTTP only the client can start a conversation, so how does a chat app learn about a new message the moment it arrives?
- **3.4 Monolith vs microservices** — As the app and the team grow, one codebase deployed as one unit means teams step on each other, and one bug can take everything down.
- **3.5 Synchronous vs asynchronous communication** — If every service call waits for the reply, one slow or dead service slows or fails everything that calls it, and the delays add up along the chain.

## Module 4: Data (`data`)

- **Tagline:** Storing, copying and splitting data
- **Stage:** Millions of rows
- **Description:** Choose the right store, keep it correct, make it fast, then copy and split it when one machine is not enough.
- **Lessons:** 9 · 55 min · advanced 2 · basic 4 · intermediate 3
- **Knowledge checks in this module:** `check-data-modeling` after `normalization` (3 Qs), `check-distributed-data` after `cap` (3 Qs)

| # | Slug | Title | Level | Min | archNodes | Sim | Diag | Mmd | Call/DD | Words | Quiz Qs | Check after | Recall t/r | Glossary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4.1 | `sql-nosql` | SQL vs NoSQL | basic | 6 | db | — | — | — | 2/0 | 226 | — | — | 0/1 | 3 |
| 4.2 | `acid` | Transactions and ACID | intermediate | 6 | db | — | — | — | 1/1 | 323 | 1 | — | 0/1 | 1 |
| 4.3 | `indexing` | Database indexing | basic | 5 | db | index-scan | — | — | 2/1 | 241 | 1 | — | 0/1 | 0 |
| 4.4 | `normalization` | Normalization vs denormalization | basic | 4 | db | — | — | — | 1/0 | 165 | 1 | `check-data-modeling` | 0/1 | 0 |
| 4.5 | `replication` | Database replication | intermediate | 7 | db | replication-lag | primary-replicas | — | 1/1 | 311 | — | — | 1/1 | 0 |
| 4.6 | `sharding` | Sharding and partitioning | advanced | 8 | db | shard-router | shard-routing | 1 | 1/1 | 416 | 1 | — | 1/1 | 0 |
| 4.7 | `consistency` | Consistency: strong vs eventual | intermediate | 5 | db | — | — | — | 2/0 | 251 | — | — | 0/1 | 0 |
| 4.8 | `cap` | CAP and PACELC | advanced | 10 | db | cap-partition | pacelc-tree | — | 3/0 | 601 | 2 | `check-distributed-data` | 3/0 | 4 |
| 4.9 | `object-storage` | Object storage | basic | 4 | storage | — | presigned-upload | — | 0/1 | 313 | 1 | — | 0/1 | 1 |

Problem statements (the `problem` field, shown in the teaching strip and roadmap):

- **4.1 SQL vs NoSQL** — Different data has different shapes and access patterns, and no single database is best at all of them.
- **4.2 Transactions and ACID** — Moving ₹500 from A to B is two writes. If the server crashes between them, money disappears.
- **4.3 Database indexing** — On 500M rows, WHERE email = … without an index reads every single row.
- **4.4 Normalization vs denormalization** — Storing each fact once keeps data correct, but hot read paths then need slow joins.
- **4.5 Database replication** — One database can't serve every read, and if it dies, everything stops.
- **4.6 Sharding and partitioning** — The data outgrows one machine (say 50 TB), or writes overwhelm a single primary.
- **4.7 Consistency: strong vs eventual** — Once data has copies, they can briefly disagree: your profile update reached the primary but not yet a replica.
- **4.8 CAP and PACELC** — With copies in several places, a broken or slow network forces a choice between correct answers and any answer.
- **4.9 Object storage** — Images, videos and PDFs are large binary blobs that bloat a relational database and clog the app servers that relay them.

## Module 5: Performance and Reliability (`reliability`)

- **Tagline:** Fast, and still standing when things fail
- **Stage:** Failure is normal
- **Description:** Serve hot reads from memory, smooth spikes with queues, and stop one failure from spreading.
- **Lessons:** 9 · 53 min · advanced 3 · intermediate 6
- **Knowledge checks in this module:** `check-caching` after `caching` (3 Qs), `check-async` after `pubsub` (3 Qs), `check-reliability` after `idempotency` (3 Qs)

| # | Slug | Title | Level | Min | archNodes | Sim | Diag | Mmd | Call/DD | Words | Quiz Qs | Check after | Recall t/r | Glossary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5.1 | `caching` | Caching | intermediate | 7 | cache | cache-aside | cache-aside-flow | — | 1/1 | 637 | 2 | `check-caching` | 1/1 | 2 |
| 5.2 | `message-queues` | Message queues | intermediate | 5 | queue | queue-leveling | — | — | 1/1 | 341 | — | — | 0/1 | 1 |
| 5.3 | `pubsub` | Pub/sub and event-driven architecture | intermediate | 5 | post | pubsub-fanout | queue-vs-pubsub | — | 0/1 | 264 | 1 | `check-async` | 0/1 | 1 |
| 5.4 | `availability` | Availability and the nines | intermediate | 6 | gateway | nines | rpo-rto-timeline | — | 1/1 | 432 | 1 | — | 2/2 | 6 |
| 5.5 | `timeouts-retries` | Timeouts and retries | intermediate | 5 | workers | backoff-jitter | — | — | 1/1 | 325 | 1 | — | 1/1 | 0 |
| 5.6 | `circuit-breaker` | Circuit breaker | advanced | 5 | workers | circuit-breaker | — | 1 | 1/1 | 259 | — | — | 0/1 | 0 |
| 5.7 | `backpressure` | Backpressure and load shedding | advanced | 7 | queue | littles-law | — | — | 2/1 | 471 | 1 | — | 1/1 | 3 |
| 5.8 | `rate-limiting` | Rate limiting | intermediate | 7 | gateway | token-bucket | rate-limit-vs-shedding | — | 0/1 | 600 | — | — | 1/1 | 0 |
| 5.9 | `idempotency` | Idempotency | advanced | 6 | post | idempotency | — | 1 | 1/1 | 408 | — | `check-reliability` | 1/1 | 1 |

Problem statements (the `problem` field, shown in the teaching strip and roadmap):

- **5.1 Caching** — Millions of people open the same celebrity post, and re-querying the database for every one of them wastes work and slows everyone down.
- **5.2 Message queues** — A burst of a million photo uploads would crash the workers that process them, and a worker that crashes mid-job would lose its work.
- **5.3 Pub/sub and event-driven architecture** — When a post is created, notifications, analytics, moderation and recommendations all care, and calling each one directly couples them all to the post service.
- **5.4 Availability and the nines** — At scale something is always broken, so you need a number for how much downtime is acceptable and a plan to stay up anyway.
- **5.5 Timeouts and retries** — A call to a stuck service can hang forever, and naive retries turn a small blip into a flood that finishes off the struggling service.
- **5.6 Circuit breaker** — When a dependency is dead, every caller waiting on timeouts and retries ties up threads and spreads the outage: a cascading failure.
- **5.7 Backpressure and load shedding** — If producers outpace consumers for long, a queue only delays the crash: an unbounded queue grows until memory runs out.
- **5.8 Rate limiting** — Bots, buggy scripts, brute-force logins, scrapers and one greedy tenant can starve everyone else and run up your bill.
- **5.9 Idempotency** — The server creates an order, the response is lost, the app retries, and now there are two orders or a double charge.

## Module 6: System Design Practice (`practice`)

- **Tagline:** Estimate, assemble, interview
- **Stage:** Design it yourself
- **Description:** Size a system with back-of-the-envelope maths, assemble the full architecture, then design a URL shortener end to end.
- **Lessons:** 9 · 59 min · basic 4 · intermediate 5
- **Knowledge checks in this module:** `check-estimation` after `system-shapes` (3 Qs), `check-url-shortener` after `url-shortener` (3 Qs)

| # | Slug | Title | Level | Min | archNodes | Sim | Diag | Mmd | Call/DD | Words | Quiz Qs | Check after | Recall t/r | Glossary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6.1 | `estimation-numbers` | Numbers to memorize | basic | 4 | — | — | estimation-flow | — | 1/0 | 330 | — | — | 0/0 | 3 |
| 6.2 | `estimation-formulas` | The formulas | basic | 5 | — | estimator | — | — | 1/0 | 252 | 1 | — | 1/1 | 5 |
| 6.3 | `estimation-examples` | Worked examples | intermediate | 6 | — | — | — | — | 2/0 | 363 | 2 | — | 0/0 | 0 |
| 6.4 | `system-shapes` | Three system shapes | intermediate | 3 | — | — | — | — | 1/1 | 160 | — | `check-estimation` | 0/0 | 0 |
| 6.5 | `final-architecture` | The final architecture | intermediate | 4 | — | architecture-map | — | — | 1/0 | 152 | — | — | 0/0 | 0 |
| 6.6 | `revision-map` | Revision: problem to building block | basic | 6 | — | recall-cards (revision) | — | — | 1/1 | 425 | — | — | 0/0 | 0 |
| 6.7 | `playbook` | The interview playbook | basic | 4 | — | — | — | 1 | 1/1 | 291 | — | — | 0/0 | 0 |
| 6.8 | `url-shortener` | Design a URL shortener | intermediate | 12 | — | base62 | url-shortener-architecture | 1 | 2/0 | 1290 | 3 | `check-url-shortener` | 3/0 | 3 |
| 6.9 | `test-yourself` | Test yourself | intermediate | 15 | — | recall-cards (test), estimator (chat) | — | — | 1/1 | 216 | — | — | 0/0 | 0 |

Problem statements (the `problem` field, shown in the teaching strip and roadmap):

- **6.1 Numbers to memorize** — Without rough numbers you draw boxes by guesswork: you cannot tell whether you need a cache, sharding or a CDN.
- **6.2 The formulas** — You have users and actions; you need QPS, storage, bandwidth, cache size and a server count, said out loud in about a minute.
- **6.3 Worked examples** — Formulas only stick once you run them on real systems and see which number dominates.
- **6.4 Three system shapes** — Different systems are dominated by different numbers, and the dominant number decides the design.
- **6.5 The final architecture** — Thirty-odd building blocks are easy to learn one at a time and hard to see as one system.
- **6.6 Revision: problem to building block** — You know each block; now you need to recall the right one the moment a problem is named.
- **6.7 The interview playbook** — In an interview, a blank whiteboard and 45 minutes invite you to draw boxes in random order.
- **6.8 Design a URL shortener** — Long URLs are ugly to share; people want a short link that redirects fast and never breaks.
- **6.9 Test yourself** — Reading feels like learning; recalling is what actually makes it stick.

## Cross-reference: internal links between lessons

Links use the only forms the validator accepts: `/learn/<slug>`, `/learn#<moduleId>` or `/learn`.

| Lesson | Links out to |
| --- | --- |
| `big-idea` | `/learn/caching`, `/learn/cdn`, `/learn/circuit-breaker`, `/learn/dns`, `/learn/estimation-numbers`, `/learn/final-architecture`, `/learn/grpc`, `/learn/http`, `/learn/idempotency`, `/learn/indexing`, `/learn/load-balancing`, `/learn/message-queues`, `/learn/microservices`, `/learn/object-storage`, `/learn/pubsub`, `/learn/rate-limiting`, `/learn/replication`, `/learn/rest`, `/learn/scaling`, `/learn/sharding`, `/learn/tcp-udp`, `/learn/timeouts-retries`, `/learn/websockets` |
| `client-server` | — |
| `dns` | `/learn/cdn` |
| `tcp-udp` | `/learn/http` |
| `http` | `/learn/scaling` |
| `latency` | — |
| `proxy` | `/learn/load-balancing` |
| `load-balancing` | — |
| `scaling` | `/learn#data`, `/learn/backpressure` |
| `cdn` | `/learn/dns` |
| `rest` | — |
| `grpc` | — |
| `websockets` | — |
| `microservices` | `/learn#reliability`, `/learn/proxy` |
| `sync-async` | `/learn/message-queues`, `/learn/timeouts-retries` |
| `sql-nosql` | `/learn/acid`, `/learn/estimation-numbers` |
| `acid` | `/learn/cap` |
| `indexing` | — |
| `normalization` | — |
| `replication` | — |
| `sharding` | — |
| `consistency` | — |
| `cap` | — |
| `object-storage` | `/learn/cdn` |
| `caching` | `/learn/estimation-formulas`, `/learn/latency` |
| `message-queues` | `/learn/backpressure`, `/learn/idempotency` |
| `pubsub` | — |
| `availability` | `/learn/replication` |
| `timeouts-retries` | `/learn/idempotency`, `/learn/latency`, `/learn/rate-limiting` |
| `circuit-breaker` | — |
| `backpressure` | `/learn/rate-limiting` |
| `rate-limiting` | — |
| `idempotency` | — |
| `estimation-numbers` | — |
| `estimation-formulas` | — |
| `estimation-examples` | `/learn/estimation-formulas`, `/learn/url-shortener` |
| `system-shapes` | `/learn/latency` |
| `final-architecture` | `/learn#reliability`, `/learn/caching`, `/learn/cdn`, `/learn/dns`, `/learn/message-queues`, `/learn/microservices`, `/learn/object-storage`, `/learn/rate-limiting` |
| `revision-map` | `/learn/acid`, `/learn/availability`, `/learn/backpressure`, `/learn/caching`, `/learn/cdn`, `/learn/circuit-breaker`, `/learn/consistency`, `/learn/dns`, `/learn/estimation-formulas`, `/learn/grpc`, `/learn/http`, `/learn/idempotency`, `/learn/indexing`, `/learn/latency`, `/learn/load-balancing`, `/learn/message-queues`, `/learn/microservices`, `/learn/normalization`, `/learn/object-storage`, `/learn/proxy`, `/learn/pubsub`, `/learn/rate-limiting`, `/learn/replication`, `/learn/rest`, `/learn/scaling`, `/learn/sharding`, `/learn/sql-nosql`, `/learn/tcp-udp`, `/learn/timeouts-retries`, `/learn/websockets` |
| `playbook` | `/learn/cap`, `/learn/estimation-formulas` |
| `url-shortener` | `/learn/caching`, `/learn/estimation-examples`, `/learn/idempotency`, `/learn/indexing`, `/learn/message-queues`, `/learn/playbook` |
| `test-yourself` | `/learn/playbook`, `/learn/system-shapes` |

## Knowledge checks (data/quizzes.ts)

| Check id | Title | Module | Shown after lesson | Questions | Lessons tested |
| --- | --- | --- | --- | --- | --- |
| `check-foundations` | Foundations check | `foundations` | `latency` | 3 | `latency`, `tcp-udp` |
| `check-scaling` | Scaling and traffic check | `scaling` | `cdn` | 3 | `cdn`, `load-balancing`, `scaling` |
| `check-communication` | APIs and real-time check | `communication` | `websockets` | 2 | `grpc`, `websockets` |
| `check-data-modeling` | Data modelling check | `data` | `normalization` | 3 | `acid`, `indexing`, `normalization` |
| `check-distributed-data` | Distributed data check | `data` | `cap` | 3 | `cap`, `sharding` |
| `check-caching` | Caching and storage check | `reliability` | `caching` | 3 | `caching`, `object-storage` |
| `check-async` | Services and async check | `reliability` | `pubsub` | 3 | `microservices`, `pubsub`, `sync-async` |
| `check-reliability` | Failure and overload check | `reliability` | `idempotency` | 3 | `availability`, `backpressure`, `timeouts-retries` |
| `check-estimation` | Estimation check | `practice` | `system-shapes` | 3 | `estimation-examples`, `estimation-formulas` |
| `check-url-shortener` | URL shortener check | `practice` | `url-shortener` | 3 | `url-shortener` |

Lessons with **no** quiz question pointing at them (19 of 42): `big-idea`, `client-server`, `dns`, `http`, `proxy`, `rest`, `sql-nosql`, `replication`, `consistency`, `message-queues`, `circuit-breaker`, `rate-limiting`, `idempotency`, `estimation-numbers`, `system-shapes`, `final-architecture`, `revision-map`, `playbook`, `test-yourself`.

## Recall decks (data/recall.ts)

- `test` — "Test yourself": 20 cards, embedded by `<Interactive name="recall-cards" variant="test" />` in `test-yourself.mdx` and on `/practice`.
- `revision` — "Problem to building block": 32 cards, embedded by `variant="revision"` in `revision-map.mdx` and on `/practice`.

Lessons with no card in either deck (9 of 42): `big-idea`, `client-server`, `estimation-numbers`, `estimation-examples`, `system-shapes`, `final-architecture`, `revision-map`, `playbook`, `test-yourself`.

**Compatibility note:** a learner's "known" state is stored per deck as an array of **card indices** (`progress-store.knownCards[deckId]: number[]`; see `components/diagrams/interactive/recall-cards.tsx` lines 208–266). Inserting or reordering cards shifts those indices and silently changes which cards a learner has marked known. New cards must be **appended** to the end of a deck, and existing cards must keep their position.

## Glossary (data/glossary.json)

All 73 entries are short forms (acronyms and abbreviations). Schema per entry: `term`, `full`, `note`, `lessonSlug`. The remark plugin wraps the **first** mention of each `term` in every lesson (case-sensitive whole-word match), so a `term` must be a string that should be hinted wherever it appears in prose.

| Introduced in lesson | Terms |
| --- | --- |
| `dns` | DNS, IPv4, IPv6, ISP, OS, TLD, TTL |
| `tcp-udp` | ACK, IP, QUIC, SYN, TCP, UDP |
| `http` | HTTP, HTTPS, TLS |
| `latency` | I/O, LSM, RAM, SSD |
| `load-balancing` | ELB, L4, L7, LB, SPOF |
| `scaling` | AWS |
| `cdn` | CDN, CSS, DDoS, JS, PoP, PoPs |
| `rest` | API, JSON, REST, URL |
| `grpc` | gRPC, RPC |
| `websockets` | SSE |
| `sql-nosql` | DB, NoSQL, SQL |
| `acid` | ACID |
| `cap` | AP, CAP, CP, PACELC |
| `object-storage` | S3 |
| `caching` | LFU, LRU |
| `message-queues` | DLQ |
| `pubsub` | EDA |
| `availability` | HA, RPO, RTO, SLA, SLI, SLO |
| `backpressure` | CPU, SRE, VM |
| `idempotency` | UUID |
| `estimation-numbers` | KB, PB, TB |
| `estimation-formulas` | DAU, MAU, QPS, RPS, TPS |
| `url-shortener` | AOF, MD5, SHA-256 |

Lessons that introduce no glossary term: `big-idea`, `client-server`, `proxy`, `microservices`, `sync-async`, `indexing`, `normalization`, `replication`, `sharding`, `consistency`, `timeouts-retries`, `circuit-breaker`, `rate-limiting`, `estimation-examples`, `system-shapes`, `final-architecture`, `revision-map`, `playbook`, `test-yourself`.

## Interactive simulations (components/diagrams/interactive-registry.tsx)

Registry name → lesson(s) that embed it. The per-simulation audit (controls, state model, companion events, concerns) is in `REPOSITORY_AUDIT.md`.

| Simulation | Embedded in |
| --- | --- |
| `request-journey` | `http` |
| `dns-lookup` | `dns` |
| `tcp-udp` | `tcp-udp` |
| `latency-scale` | `latency` |
| `tail-latency` | `latency` |
| `littles-law` | `latency`, `backpressure` |
| `lb-sim` | `load-balancing` |
| `scaling-compare` | `scaling` |
| `polling-vs-ws` | `websockets` |
| `index-scan` | `indexing` |
| `replication-lag` | `replication` |
| `shard-router` | `sharding` |
| `cap-partition` | `cap` |
| `cache-aside` | `caching` |
| `queue-leveling` | `message-queues` |
| `pubsub-fanout` | `pubsub` |
| `nines` | `availability` |
| `backoff-jitter` | `timeouts-retries` |
| `circuit-breaker` | `circuit-breaker` |
| `token-bucket` | `rate-limiting` |
| `idempotency` | `idempotency` |
| `estimator` | `estimation-formulas`, `test-yourself` · also `/practice` |
| `base62` | `url-shortener` |
| `recall-cards` | `revision-map`, `test-yourself` · also `/practice` |
| `architecture-map` | `final-architecture` · also the dashboard `/` (variant `dashboard`) |

## Static SVG diagrams (components/diagrams/static/index.ts)

| Diagram | Lesson | Caption in lesson |
| --- | --- | --- |
| `bottleneck-chain` | `latency` | The slowest stage caps the whole chain. Adding app servers here changes nothing. |
| `cache-aside-flow` | `caching` | Cache-aside: the app checks the cache first and fills it only on a miss. |
| `cdn-edges` | `cdn` | Users hit the nearest edge. Only misses travel to the origin. |
| `estimation-flow` | `estimation-numbers` | Estimation flow in four steps. |
| `forward-reverse-proxy` | `proxy` | Same idea, opposite sides. The forward proxy hides clients; the reverse proxy hides servers. |
| `monolith-vs-microservices` | `microservices` | Monolith vs microservices behind an API gateway. |
| `pacelc-tree` | `cap` | Two questions, two cases. CAP covers the left branch; PACELC adds the right. |
| `presigned-upload` | `object-storage` | Big bytes go straight to storage; the database only remembers where they are. |
| `primary-replicas` | `replication` | Writes go to one primary; reads spread across replicas that copy its changes. |
| `queue-vs-pubsub` | `pubsub` | Message queue vs pub/sub. |
| `rate-limit-vs-shedding` | `rate-limiting` | Where each check sits: policy at the front door, survival inside each service. |
| `rpo-rto-timeline` | `availability` | RPO looks back to the last good copy; RTO looks forward to recovery. Not to scale. |
| `scale-up-vs-out` | `scaling` | Scaling up buys a bigger box; scaling out buys more boxes and a load balancer in front. |
| `shard-routing` | `sharding` | User 42 → 42 % 3 = 0 → Shard 1. Real systems hash the key instead of using raw modulo. |
| `sync-vs-async-timeline` | `sync-async` | Same work, different wait. Illustrative timings. |
| `url-shortener-architecture` | `url-shortener` | URL shortener, final design. |

## Mermaid charts

| Lesson | Chart type | Caption |
| --- | --- | --- |
| `dns` | `sequenceDiagram` | A cold lookup: the resolver walks the root, TLD and authoritative servers, then caches the answer. |
| `tcp-udp` | `sequenceDiagram` | The handshake: each side's starting sequence number is acknowledged before any data flows. |
| `sync-async` | `sequenceDiagram` | The asynchronous photo post: the user gets a reply once the post is saved; workers finish the rest. |
| `sharding` | `flowchart LR` | Replication copies the same data (reads, availability); sharding splits different data (size, writes). |
| `circuit-breaker` | `stateDiagram-v2` | Circuit-breaker states. Open fails fast; Half-open lets a few trial calls decide. |
| `idempotency` | `sequenceDiagram` | A retry after a lost response: the server recognises the key and returns the saved result instead of charging twice. |
| `playbook` | `flowchart LR` | The seven steps in order. Each step's output feeds the next. |
| `url-shortener` | `sequenceDiagram` | Write path: a Redis counter gives a unique ID, encoded in base 62. Read path: Redis first, PostgreSQL on a miss. |

## Companion (Cache) content per lesson

Every one of the 42 lessons has all of: `catTip` and `recall {q, a}` (in `curriculum.ts`), `breaks` / `tradeoffs` / `explainSimply` / `hint` (in `lesson-guides.ts`) and a meow line (in `cat-meows.ts`). These are the only per-lesson companion data the app reads; see `REPOSITORY_AUDIT.md` for how each field is used.

_Total MDX tokens across all 42 lessons: 14788._
