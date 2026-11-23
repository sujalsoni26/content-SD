# Simulation spec: `cdn-cache`

## 1. Identity

- Registry name: `cdn-cache`. Files: `components/diagrams/interactive/cdn-cache.tsx`, pure logic in `_cdn-cache-sim.ts` (reducer + seeded PRNG).
- Embedded by `content/lessons/cdn-internals.mdx` directly under "The cache key" (`<Interactive name="cdn-cache" />`) once implemented, and reusable in `design-youtube` where hot segments and origin shielding are discussed.
- Kicker **"Tune it"**. Title **"CDN cache key and TTL"**. Hint: "Requests from three cities hit the edges. Change what goes into the cache key and how long copies live, and watch the hit ratio, the origin and the one bug you must never ship."

## 2. Learning objective

The learner can explain how the cache key decides what counts as the same object and why adding headers or cookies to it divides the hit ratio, how TTL trades origin load against staleness, what an origin shield does at expiry, what `stale-while-revalidate` and `stale-if-error` buy during an origin outage, and why a personalised response that is not marked `private` leaks between users.

## 3. Initial state

- Three edges (Mumbai 50% of traffic, Frankfurt 30%, São Paulo 20%), an optional origin shield (off), one origin with capacity 100 requests/s and 120 ms latency; requests queued longer than 2 s fail.
- Catalogue of 20 objects: 10 static assets (content-hashed names), 8 HTML pages each available in three languages, 2 personalised pages (an account page and a cart).
- Traffic 300 requests/s; 30% of asset requests carry a tracking query string; `Accept-Language` arrives in four spellings per language; every user has a unique session cookie.
- Cache key **Path only**; TTL 60 s; stale directives **None**; personalised pages **Marked private**; shield **Off**. Clock at 0, run paused.

## 4. User controls

| Control | Type | Options / range | Default | Effect |
| --- | --- | --- | --- | --- |
| Cache key | `SegmentedControl` | Path only · Path + query string · Path + Accept-Language · Path + cookies | Path only | What the edge hashes to find a stored copy |
| TTL | `RangeField` | 10–600 s, step 10 | 60 | `max-age` applied when a copy is stored |
| Origin shield | `SegmentedControl` | Off · On | Off | Adds the shield tier between edges and origin (§5) |
| Stale directives | `SegmentedControl` | None · stale-while-revalidate=30 · plus stale-if-error=600 | None | Behaviour after expiry and during origin errors |
| Personalised pages | `SegmentedControl` | Marked private · Not marked | Marked private | Whether the two personalised pages carry `Cache-Control: private` |
| Origin outage | `Button` (toggle) | — | off | Origin answers 503 for 60 simulated seconds |
| Purge /news | `Button` | — | — | Removes every key under `/news` at every tier |
| Run / Pause, Step 1 s, Reset | `Button` | — | paused | Clock control; Reset per §9 |

## 5. State model and transitions

Tick = 0.1 s; 30 requests per tick are assigned to edges by weight and to objects by a fixed popularity (two hot pages take 40%). Each request has a path, an optional query string, an `Accept-Language` spelling and a cookie. The **key** is composed per the control: path; path + query (so tracking parameters create a fresh key per spelling); path + the raw `Accept-Language` value (four variants per language); path + cookies (a key per user).

Lookup at the edge: a stored copy with `now < expiry` is a **hit** (served in 20 ms). Otherwise the request goes to the shield if enabled, else to the origin. The **shield** is one more cache with the same key and TTL; concurrent misses for one key at the shield are **collapsed** into a single origin request (edges also collapse concurrent misses for a key). The **origin** serves 10 requests per tick, queues the rest, fails requests queued over 2 s, and during an outage returns 503 to everything. A response marked `private` is never stored at any tier. **stale-while-revalidate=30:** a copy expired less than 30 s ago is served at once and one background revalidation is issued per key. **stale-if-error=600:** when the origin returns 5xx, a copy expired less than 600 s ago is served instead. **Purge** deletes matching keys at edges and shield, stale copies included. Personalised pages **not marked private** are stored under the composed key, so with Path only the first user's page is served to every later user of that path: each such hit increments **leaked pages**.

Counters per tick: hits, misses, origin requests, origin errors, stale served, variants stored (distinct keys across tiers), leaked pages, age of the oldest copy served. Randomness is seeded `mulberry32`. A run never ends.

## 6. Visual representation

- **Stage (SVG, `viewBox 0 0 760 320`):** three edge boxes across the top, each with a hit-ratio sparkline (`dg-line--accent`) and a stored-variants count; the shield box in the middle (dimmed when off); the origin at the bottom with a load gauge against a capacity line that turns `dg-box--bad` when the queue grows, and a 503 badge during an outage. Misses animate as dots travelling downward; collapsed misses merge into one dot at the shield. Leaked pages flash the receiving edge red.
- **Stats (plain grid):** Edge hit ratio · Origin requests/s · Origin errors · Variants stored · Stale served · Oldest copy served (s) · **Leaked personalised pages**.
- **Note (aria-live):** key with cookies: "Every user has a different cookie, so every user is a different object: the hit ratio collapsed to N%."; key with Accept-Language: "Four spellings of the same language made four copies of each page. Normalise the header or put the language in the path."; shield at an expiry: "Three edges missed at once; the origin saw one request."; outage without stale-if-error: "The origin is down and so is every page whose copy expired."; outage with it: "Expired copies are being served because the origin returned 503: stale beats an error."; leak: "A personalised page was stored under a key that does not include the user. Mark it private."
- **EventLog** "Cache events" (last 20): "t=60.0 /news/top expired on 3 edges", "t=60.0 shield collapsed 3 misses into 1", "t=61.2 origin queue 2.1 s: request failed", "t=75.0 purge /news removed 12 keys", "t=90.4 /account served to another user: leak".

## 7. Expected output

| Setting | What the learner sees |
| --- | --- |
| Path only, private marked | Hit ratio about 90%, origin around 30 requests/s, no leaks |
| Path + cookies | Hit ratio near 10%, origin over capacity, errors appear |
| Path + Accept-Language | Variants stored quadruple, hit ratio falls to about 70%; the note suggests normalising |
| TTL 10 s vs 600 s | Origin load falls as TTL rises; "oldest copy served" rises with it: the trade in one glance |
| Shield On | At each expiry the origin sees one request per key instead of three |
| Outage, directives None | Errors spike for every expired object |
| Outage, with stale-if-error | Stale served climbs, errors stay at zero |
| Personalised not marked, Path only | Leaked pages climb within seconds; the stage flashes red |
| Purge /news | A brief miss burst, collapsed by the shield when it is on |

## 8. Edge cases

- Traffic 300 requests/s is above the origin's 100 requests/s capacity by design; if the learner drives the hit ratio down the origin fails, which is the lesson. A future control for traffic should keep the note honest below capacity ("the CDN is saving latency here, not the origin").
- Purge during an outage removes the stale copies that `stale-if-error` would have served; the note says "a purge removes the stale copy too, so stale-if-error cannot serve what you purged".
- Outage toggled off: the first revalidations succeed and the stale counter stops rising within one TTL.

## 9. Reset and reduced motion

- Reset restores §3 and keeps the chosen controls.
- Reduced motion: no travelling dots and no auto-run; **Step 1 s** applies ten ticks and updates numbers and sparklines without transitions. The loop pauses off-screen or in a hidden tab (`useLoopActive`).

## 10. Companion events

- Once, when leaked pages first exceed zero: `{ type: "diagram", mood: "confused", message: "One user's page was served to another. The cache key did not know they were different people." }`
- Once, on the first collapsed expiry with the shield on: `{ type: "diagram", mood: "happy", message: "Three edges missed, the origin saw one request. That is the shield." }`

## 11. Concept explanation

An edge stores responses under a key it computes from the request, and everything added to that key multiplies the copies and divides the hits, so variation belongs in the path or in a normalised value, never in raw headers or cookies. The TTL decides how long a copy may be served without asking the origin, and `stale-while-revalidate` and `stale-if-error` let a cache serve an expired copy while it refreshes or while the origin is failing. An origin shield puts one more cache in front of the origin so that an object expiring everywhere costs one fetch. The worst CDN bug is a personalised response stored under a key that does not include the user, which is why such responses carry `private` or `no-store`.

## 12. Accessibility

- Stage `role="img"` with an `aria-label` summarising hit ratio, origin load and leaks; the note is `aria-live="polite"`; the leak counter is also announced in text; all controls are native and keyboard reachable; the event log is a list.
