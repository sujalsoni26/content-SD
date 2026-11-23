// Flashcard decks for active recall (Practice page and the "Test yourself" / "Revision" lessons).
import type { RecallCard } from "@/types/quiz";

export type RecallDeckId = "test" | "revision" | "advanced" | "hld" | "lld";

export interface RecallDeck { id: RecallDeckId; title: string; description: string; cards: RecallCard[] }

export const recallDecks: Record<RecallDeckId, RecallDeck> = {
  test: { id: "test", title: "Test yourself", description: "Twenty questions from across the course, including the estimation drill.", cards: [
    { q: "Why does horizontal scaling require stateless servers?", a: "So any server can serve any request. If server A keeps your session in memory and your next request lands on server B, you are logged out. Keep state in a shared store (Redis, the database) or a token.", lessonSlug: "scaling" },
    { q: "Your comment appears, then vanishes on refresh. What's happening, and what's the fix?", a: "Replication lag: the refresh read hit an asynchronous replica that has not caught up yet. Fix it with read-your-own-writes: send that user’s reads to the primary for a short time after they write.", lessonSlug: "replication" },
    { q: "Replication or sharding: which helps when the data is too big for one machine?", a: "Sharding. Replication copies the same data (scales reads, availability); sharding splits different data across machines (scales size and writes).", lessonSlug: "sharding" },
    { q: "During a partition, what does a CP system do with a read? An AP system?", a: "CP refuses or delays any read that might be wrong (an error or a timeout). AP answers with possibly stale data and reconciles later.", lessonSlug: "cap" },
    { q: "Why can retries make an outage worse, and what makes them safe?", a: "Each retry adds load to a service that is already struggling: 3 retries mean up to 4× the traffic, multiplied at every layer. Safe retries use exponential backoff plus jitter, a retry budget, only transient errors, and only idempotent operations or idempotency keys.", lessonSlug: "timeouts-retries" },
    { q: "When should services talk synchronously, and when through a queue?", a: "Synchronously when the answer is needed now (login check, loading the feed, payment authorization). Through a queue for side effects (notifications, emails, image resizing, analytics, search indexing).", lessonSlug: "sync-async" },
    { q: "Does an idempotency key stop two users from booking the same seat? Why or why not?", a: "No. It deduplicates the same request repeated. Two different users competing is a concurrency problem: row locks (SELECT … FOR UPDATE), a unique constraint on (show_id, seat_id), optimistic locking or temporary holds.", lessonSlug: "idempotency" },
    { q: "Two 99.9% services called in series: what is the combined availability?", a: "About 99.8% (0.999 × 0.999 ≈ 0.998). Dependencies in series multiply; redundant copies in parallel raise availability.", lessonSlug: "availability" },
    { q: "How does the RAM-vs-SSD gap justify a cache?", a: "RAM is about 1,000–1,500× faster than an SSD random read (~100 ns vs ~150 µs), so keeping hot data in memory (Redis) answers most reads without touching the slower database.", lessonSlug: "caching" },
    { q: "An app server handles 200 req/s and its database 80 req/s. What is the system’s throughput, and what should you scale?", a: "80 req/s: the bottleneck sets the pace. Scale the database (cache, indexes, read replicas), not the app servers.", lessonSlug: "latency" },
    { q: "A service receives 2,000 req/s at a 300 ms average latency. How many requests are in flight, and why does that number matter?", a: "Little's Law: 2,000 × 0.3 s = 600 in flight. Each holds a thread, memory and often a DB connection, so the number sizes thread pools and connection pools.", lessonSlug: "latency" },
    { q: "What is the difference between RPO and RTO, and which one does synchronous replication improve?", a: "RPO is how much data you can lose (back to the last good copy); RTO is how long you can be down. Synchronous replication improves RPO, pushing it toward zero. Automated failover improves RTO.", lessonSlug: "availability" },
    { q: "Why doesn't CAP apply to one server with one database?", a: "There is a single source of truth and nothing to partition: no second copy can disagree. The trade-off appears once data lives in more than one place (replicas, regions).", lessonSlug: "cap" },
    { q: "Classify a social feed and a payment ledger with PACELC, and explain why strong consistency adds latency even when nothing is broken.", a: "Social feed: PA/EL. Payment ledger: PC/EC. A strongly consistent write must reach the replicas and wait for their acknowledgments before confirming; one cross-continent round trip alone is about 150 ms.", lessonSlug: "cap" },
    { q: "Traffic jumps faster than autoscaling can add servers. Slow down for everyone or shed load? Which status code, and what goes first?", a: "Shed load with a fast 503 Service Unavailable, so the work you accept stays fast. Drop the least critical work first: SHEDDABLE (logging, batch jobs), then SHEDDABLE_PLUS (recommendations, like counts).", lessonSlug: "backpressure" },
    { q: "One client gets a 429 and another gets a 503. What does each mean, and how should each client retry?", a: "429: that client used up its quota; wait until Retry-After (retrying sooner earns more 429s). 503: the server is overloaded; retry with exponential backoff and jitter.", lessonSlug: "rate-limiting" },
    { q: "Why do truncated hashes collide so early, and how does a counter encoded in base 62 avoid collisions?", a: "The birthday paradox: collisions become likely after about √N codes (~300k URLs for 62⁶, ~5k for 6 hex characters). A counter gives every URL a distinct number, and base 62 of a distinct number is a distinct code.", lessonSlug: "url-shortener" },
    { q: "Why might a URL shortener return 302 instead of 301?", a: "Browsers cache a 301, so later clicks never reach you. With 302 every click hits the server, so expiry, edits and analytics remain possible; a cache keeps the load cheap.", lessonSlug: "url-shortener" },
    { q: "How do you stop two users from claiming the same custom alias at the same moment?", a: "Not with check-then-insert, which races. Insert and let the database’s UNIQUE constraint decide; return 409 Conflict to the loser.", lessonSlug: "url-shortener" },
    { q: "Estimation drill: 100 billion chat messages a day, 100 B each, reads:writes = 1:1, replication 3. Write QPS and peak, total QPS, 30-day storage, bandwidth, shape, vs Google Search?", a: "Writes 10¹¹ ÷ 10⁵ = 1M QPS (peak ~3M); total 2M (peak ~6M); 10 TB/day × 30 × 3 ≈ 900 TB; ingress = egress ≈ 100 MB/s; write-heavy stream; about 20× Google Search’s ~100k QPS.", lessonSlug: "estimation-formulas" },
  ] },
  revision: { id: "revision", title: "Problem to building block", description: "Name the building block that solves each problem.", cards: [
    { q: "How big must it be?", a: "Back-of-the-envelope estimation", lessonSlug: "estimation-formulas" },
    { q: "Finding the server", a: "DNS", lessonSlug: "dns" },
    { q: "Moving bytes", a: "TCP (reliable), UDP (fast)", lessonSlug: "tcp-udp" },
    { q: "Message format and security", a: "HTTP / HTTPS (TLS)", lessonSlug: "http" },
    { q: "Where time goes", a: "Latency numbers, percentiles", lessonSlug: "latency" },
    { q: "Hiding and routing to backends", a: "Reverse proxy", lessonSlug: "proxy" },
    { q: "Spreading traffic, surviving server loss", a: "Load balancer + horizontal scaling (stateless servers)", lessonSlug: "load-balancing" },
    { q: "Slow global delivery of static files", a: "CDN", lessonSlug: "cdn" },
    { q: "Client ↔ backend API", a: "REST", lessonSlug: "rest" },
    { q: "Fast internal calls", a: "gRPC", lessonSlug: "grpc" },
    { q: "Real-time push", a: "WebSockets (or SSE)", lessonSlug: "websockets" },
    { q: "Choosing storage", a: "SQL / NoSQL by data model and access pattern", lessonSlug: "sql-nosql" },
    { q: "All-or-nothing writes", a: "Transactions / ACID", lessonSlug: "acid" },
    { q: "Slow lookups", a: "Indexes", lessonSlug: "indexing" },
    { q: "Joins vs duplication", a: "Normalization / denormalization", lessonSlug: "normalization" },
    { q: "Too many reads, one DB failing", a: "Replication", lessonSlug: "replication" },
    { q: "Too much data or too many writes", a: "Sharding", lessonSlug: "sharding" },
    { q: "Copies disagreeing", a: "Consistency models, CAP, PACELC", lessonSlug: "consistency" },
    { q: "Repeated identical reads", a: "Caching", lessonSlug: "caching" },
    { q: "Large files", a: "Object storage", lessonSlug: "object-storage" },
    { q: "Huge codebase, many teams", a: "Microservices + API gateway", lessonSlug: "microservices" },
    { q: "Slow dependencies, traffic spikes", a: "Async communication + message queues", lessonSlug: "message-queues" },
    { q: "Many systems reacting to one event", a: "Pub/sub, event-driven architecture", lessonSlug: "pubsub" },
    { q: "How much downtime is acceptable?", a: "Availability target (the nines)", lessonSlug: "availability" },
    { q: "Hanging calls, transient errors", a: "Timeouts, retries with backoff + jitter", lessonSlug: "timeouts-retries" },
    { q: "A dead dependency spreading failure", a: "Circuit breaker", lessonSlug: "circuit-breaker" },
    { q: "Sustained overload", a: "Backpressure, load shedding", lessonSlug: "backpressure" },
    { q: "Abusive clients", a: "Rate limiting (per-client quotas)", lessonSlug: "rate-limiting" },
    { q: "Duplicate requests", a: "Idempotency keys", lessonSlug: "idempotency" },
    { q: "Which part limits the system?", a: "The bottleneck: the slowest component, usually the database", lessonSlug: "latency" },
    { q: "Load swings up and down", a: "Elasticity (autoscaling)", lessonSlug: "scaling" },
    { q: "Data loss and downtime after a disaster", a: "RPO / RTO targets, automatic failover", lessonSlug: "availability" },
  ] },
  advanced: { id: "advanced", title: "Advanced tracks", description: "Flashcards from the distributed systems, database internals, streaming, operations, security, infrastructure and architecture modules.", cards: [
  ] },
  hld: { id: "hld", title: "High-level design", description: "One card per design decision from the case studies: the problem, the chosen approach and why.", cards: [
  ] },
  lld: { id: "lld", title: "Low-level design", description: "Principles, patterns and the classic problems: name the pattern or the responsibility.", cards: [
  ] },
};
