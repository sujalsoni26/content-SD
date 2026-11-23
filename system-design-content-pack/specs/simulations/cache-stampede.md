# Simulation spec: `cache-stampede`

## 1. Identity

- Registry name: `cache-stampede`. Files: `components/diagrams/interactive/cache-stampede.tsx`, pure logic in `_cache-stampede-sim.ts` (reducer + seeded PRNG, as `_token-bucket-sim.ts` does).
- Embedded by `content/lessons/caching.mdx` directly under the "Taming a stampede" section (`<Interactive name="cache-stampede" />`), and reusable in `design-pastebin` and `design-instagram` where hot keys are discussed.
- Kicker **"Break it"**. Title **"Cache stampede"**. Hint: "A hot key expires while hundreds of requests a second want it. Compare what each strategy does to the database."

## 2. Learning objective

The learner can explain why a single expiring hot key can overload a database, and can name and compare three defences: request coalescing (single-flight), TTL jitter and early (probabilistic) refresh.

## 3. Initial state

- Simulated clock at 0.0 s; 8 cache keys loaded at t = 0 with TTL 10 s (so they expire together), one **hot key** receiving 60% of traffic, the other seven sharing 40%.
- Traffic 200 requests/s; database capacity 50 queries/s with a base latency of 100 ms; a database queue that grows when demand exceeds capacity and times out requests after 2 s (counted as errors).
- Strategy **Naive**. Run paused; the first click on Run starts the clock so the learner sees the expiry at t = 10 s.

## 4. User controls

| Control | Type | Options / range | Default | Effect |
| --- | --- | --- | --- | --- |
| Strategy | `SegmentedControl` | Naive · Single-flight · TTL jitter · Early refresh | Naive | Changes the miss-handling rule (§5) without resetting counters, so strategies can be compared on the same run |
| Traffic | `RangeField` | 50–500 req/s, step 50 | 200 | Requests generated per simulated second |
| TTL | `RangeField` | 5–30 s, step 5 | 10 | Expiry applied when a key is (re)loaded |
| Expire hot key now | `Button` | — | — | Forces the hot key to expire at the current tick |
| Run / Pause | `Button` | — | paused | Starts or stops the simulated clock |
| Reset | `Button` | — | — | §9 |

## 5. State model and transitions

Tick = 0.1 s of simulated time. Per tick:

1. Generate `traffic × 0.1` requests (fractional accumulation), each assigned to a key by weight (hot 60%).
2. For each request: if the key is cached and `now < expiry`, count a **hit** (1 ms). Otherwise apply the strategy:
   - **Naive:** every miss enqueues one database query. The database serves 5 queries per tick (50/s); queued queries older than 2 s time out as **errors**; a completed query stores the key with a fresh TTL and answers every request that was waiting on it.
   - **Single-flight:** the first miss for a key enqueues one query and marks the key *in flight*; later misses for that key join a waiting list instead of querying. When the query completes, all waiters are answered (latency = their wait). Database load for the stampede is exactly one query per key.
   - **TTL jitter:** behaves like Naive, but every (re)load sets `expiry = now + TTL × uniform(0.8, 1.2)`, so keys loaded together do not expire together. The initial load applies the jitter too.
   - **Early refresh:** behaves like Single-flight for misses, and additionally on each hit evaluates `now − Δ × β × ln(rand) ≥ expiry` with Δ = 0.1 s (database latency), β = 1, `rand` uniform in (0, 1]; if true and no refresh is in flight for the key, it enqueues one background refresh while continuing to serve the cached value. (Vattani, Chierichetti and Lowenstein, 2015.)
3. Record per-tick counters: hits, misses, database queries issued, queue length, errors, p50 and max latency of requests completed this tick.

Randomness uses a seeded `mulberry32` so Replay reproduces a run. A run never ends; the learner pauses or resets.

## 6. Visual representation

- **Stage (SVG, `viewBox 0 0 760 300`):** a row of 8 key cards (`dg-box`, hot key `dg-box--accent`) each with a TTL bar that shrinks toward expiry (`dg-line--accent` → `dg-line--bad` in the last 20%), an "in flight" dashed ring (`dg-box--ghost`) while a query is outstanding, and a waiting-count badge in Single-flight mode. Below, a 20-second rolling bar chart of **database queries per 0.5 s** with a horizontal capacity line (50/s) and the timed-out portion of each bar in `dg-box--bad`.
- **Stats (plain grid, not aria-live, because they change every tick):** Hit ratio · DB queries / s (current) · Peak DB queries in a second · Errors (timeouts) · p99 latency (last 2 s).
- **Note (aria-live):** state-dependent sentences: on a naive stampede "The hot key expired and every miss became a database query: N queries in one second against a capacity of 50."; in Single-flight "One query refilled the key; M requests waited for it instead of hitting the database."; in TTL jitter "Expiries are spread out; the worst second had N queries."; in Early refresh "The key was refreshed R ms before expiry by one background query; nobody saw a miss."
- **EventLog** "Cache events" (last 20): "t=10.0 hot-post expired", "t=10.0 stampede: 118 misses in 0.5 s", "t=10.1 refill complete", "t=9.6 early refresh started (rand=0.07)".

## 7. Expected output

| Setting | What the learner sees |
| --- | --- |
| Naive, 200 req/s, TTL 10 | At t = 10 s all keys expire; ~120 queries hit the database in the first 0.5 s; the queue grows past 2 s and errors appear; recovery takes several seconds |
| Single-flight | At t = 10 s eight queries (one per key); waiting requests see ~100–300 ms latency; no errors |
| TTL jitter | Expiries spread over 8–12 s; several small bumps instead of one spike; each bump can still exceed capacity for the hot key alone at high traffic (the note says so) |
| Early refresh | A single background refresh per key shortly before expiry; the hit ratio stays near 100%; the bar chart never approaches the capacity line |
| Traffic 50 req/s (any strategy) | The stampede is harmless: the note says "Below capacity, a stampede is just a few extra queries. The defences matter when traffic exceeds what the database can absorb." |

## 8. Edge cases

- Traffic below database capacity: see the last row above; the widget must not pretend there is a problem.
- TTL 5 s with 500 req/s in Naive mode: continuous churn; cap the queue at 1,000 entries and the log at 20 lines so the widget stays responsive.
- "Expire hot key now" while a refill is in flight: ignored with a note ("A refill is already running").
- Switching strategy mid-run: applies from the next tick; counters are kept so the learner can compare; the note says "Strategy changed at t = …".

## 9. Reset and reduced motion

- Reset restores §3 (clock 0, keys loaded, counters zero, log cleared) and keeps the chosen strategy, traffic and TTL.
- Reduced motion: the loop does not auto-run; a **"Advance 1 s"** button applies ten ticks at once and the chart updates without transitions. The loop also pauses when the widget is off-screen or the tab is hidden (`useLoopActive`).

## 10. Companion events

- Once, on the first second in which naive-mode database queries exceed capacity by 2×: `{ type: "diagram", mood: "confused", message: "Hundreds of requests hit the database for one key. That is a stampede." }`
- Once, on the first Single-flight refill that served ten or more waiters: `{ type: "diagram", mood: "happy", message: "One refill, and everyone else waited for it. That is single-flight." }`

## 11. Concept explanation

When a hot key expires, every request that misses tries to rebuild it, and a cache that was absorbing 60% of traffic suddenly forwards all of it to the database at once. The fix is to make sure one key costs one database query no matter how many requests want it: let the first miss do the work while the others wait (single-flight), spread expiries so keys do not fall together (TTL jitter), or refresh a little early with a probability that rises as expiry nears so the key is replaced before anyone misses (probabilistic early expiration).

## 12. Accessibility

Stage `role="img"` with an `aria-label` summarising the current state ("8 keys, hot key expires in 3 s, database at 12 queries per second"); the note is the single `aria-live="polite"` region; every control is a real button or input reachable by keyboard; colours come from theme tokens and the stage also encodes state with dashes and badges, not colour alone.
