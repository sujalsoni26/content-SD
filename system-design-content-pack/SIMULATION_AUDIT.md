# Simulation and Static Diagram Audit — Box by Box

Date: 2026-11-22 · Repository `sujalsoni26/box-by-box-system-design` @ `e508232` · Supporting document for `REPOSITORY_AUDIT.md` §7.

**Provenance.** This file is the full report of a read-only code audit of every interactive simulation (`components/diagrams/interactive/*.tsx` and their `_*.ts` engines) and every static SVG diagram (`components/diagrams/static/*.tsx`), produced by a delegated audit pass and reviewed by me against my own reading of the registry, the validator and the lessons. Line numbers refer to the files named in each entry at the commit above. Numeric claims marked "recomputed" were re-derived with throwaway scripts rather than copied from code comments.

**Corrections applied on review.**

1. Section 1 of the original report says "17 of 25 sims emit" companion events. The per-simulation entries in the same report, and an independent `grep emitCompanionEvent components/diagrams`, both give **14**: `lb-sim`, `scaling-compare`, `index-scan`, `replication-lag`, `shard-router`, `cap-partition`, `cache-aside`, `queue-leveling`, `pubsub-fanout`, `backoff-jitter`, `circuit-breaker`, `token-bucket`, `idempotency`, `recall-cards`. The sentence below has been amended to 14.
2. Nothing else was changed. Judgements about UX (for example that opening a step-through on its last step is "potentially confusing") are the auditor's and are marked as concerns, not defects.

**How this feeds later phases.** Phase 2 fixes the lesson-side inconsistencies listed in §5 items 1, 7 and 8 (they are prose or table edits in MDX). Items that live inside simulation code (reduced-motion regressions, missing resets, companion once-guards, naming inside widgets) are application changes and are carried as recommendations in `REPOSITORY_AUDIT.md` §10.3. Phase 6 uses §1 ("Shared conventions") as the template every new simulation specification must match.

---

# Audit: interactive simulations and static diagrams

Scope: `components/diagrams/interactive/*.tsx` (25 sims + 10 `_*.ts` helpers), `components/diagrams/static/*.tsx` (16), their hosts (`components/diagrams/interactive.tsx`, `diagram.tsx`), the shared UI in `components/ui/`, `lib/companion-events.ts`, `lib/hooks/*`, `app/globals.css` (dg-* classes), and every `content/lessons/*.mdx` that embeds a sim or diagram. Nothing was modified. Line numbers below refer to the file named in each entry. Where a numeric claim mattered (IP-hash spread, shard-move percentages, base-62 arithmetic, nines, estimator presets) I recomputed it with a throwaway Node script in the scratchpad rather than trusting the comments.

---

## 1. Shared conventions (what a new sim must match)

**Registration and hosting**
- A sim is one file `components/diagrams/interactive/<kebab-name>.tsx`, `"use client"`, default-exporting a component typed `ComponentType<InteractiveProps>` (`{ variant?: string }`, `interactive-registry.tsx:6-8`). Two styles coexist: `export default X satisfies ComponentType<InteractiveProps>` (W-A family) and `export default function X()` (W-B/W-C families).
- Registered in `interactive-registry.tsx:28-54` as `"<name>": load(() => import("./interactive/<name>"))`; `load` wraps `next/dynamic` with `ssr: false` and a `Loading` placeholder ("Loading the simulation…"). Lessons embed with `<Interactive name="…" variant?="…" />`.
- The host `InteractiveDiagram` (`components/diagrams/interactive.tsx`) mounts the sim only once it is within 600 px of the viewport (`useInView(ref, "600px")`), shows "Simulation loads as you scroll here." before that, keeps it mounted afterwards, wraps it in `data-companion-avoid` + `data-interactive={name}`, and renders "Unknown interactive diagram “name”." for an unregistered name.
- Pure logic lives in a sibling `_<name>-sim.ts` / `_<name>-model.ts` / `_<name>-flow.ts` / `_<name>-math.ts` / `_<name>-codec.ts` (reducer or pure functions over a state object; randomness via a seeded mulberry32 kept in state so replays are reproducible). Eight sims have one: lb-sim, scaling-compare, backoff-jitter, circuit-breaker, token-bucket, idempotency, estimator, base62.

**Frame**
- `WidgetFrame` (`components/ui/widget-frame.tsx`): `title` (required, becomes the `<section aria-label>`), `hint` ("one line on what to do"), `kicker` (default "Try it"; also used: Explore, Calculate, Simulate, Compare, Race, Route it, Break it, Fan it out, Recall, Live blueprint), `note` (live explanation, rendered in an `aria-live="polite"` paragraph under the stage). `WidgetScroll` wraps wide SVGs so they scroll inside the widget; `ControlRow` is the flex-wrap control strip.
- Shared controls: `RangeField {label,value,min,max,step,onChange,display}`, `SegmentedControl {label, options[{value,label}], value, onChange, size "sm"|"md"}` (aria-pressed buttons), `Button` (variants primary/secondary/ghost/danger/success; sizes sm/md/lg), `Chip` (tones neutral/accent/good/bad/warn/amber/violet), `Stat` + `StatGrid` (grid is `aria-live="polite"` by default; sims whose numbers change every tick use a plain grid instead, e.g. queue-leveling:510-518, cache-aside:512-517), `EventLog {entries: LogEntry[{id,text,tone}], label}` (monospace, newest first, `max-h-40`).
- SVG stages use `viewBox`, `role="img"` + a descriptive `aria-label`, theme classes from `app/globals.css` (`dg-box[--accent|--bad|--good|--ghost|--store]`, `dg-line[--accent|--bad|--good|--dash]`, `dg-text[--accent|--bad|--good]`, `dg-sub`, `dg-label`, `dg-dot[--accent|--bad|--good|--muted]`, `dg-zone`, `dg-flow`), and arrowheads `url(#ah)`, `url(#ah-accent)`, `url(#ah-bad)` defined once by `components/ui/svg-markers.tsx` in the root layout. All 27 dg-* classes used across the diagrams are defined in `globals.css` (verified by grep).

**Loops, pausing off-screen, reduced motion**
- Gate: `useLoopGate(ref)` (`_wa-shared.ts:11`) and `useLoopActive(ref)` (`_wc-frame-loop.ts:8`) are identical: `useInView(ref)` (IntersectionObserver, 200 px rootMargin, `lib/hooks/use-in-view.ts`) AND `usePageVisible()` (`document.visibilityState`). A loop may run only while the gate is true; the sim puts `ref` on its root `<div>` inside the frame.
- Two frame-loop helpers with the same name but different units: `_wa-shared.useFrameLoop(onFrame(dtMs), running, maxStepMs=64)` (rAF only, dt in ms, capped 64 ms) and `_wc-frame-loop.useFrameLoop(onFrame(dtSeconds), running, intervalMs=0)` (dt in seconds, capped 0.25 s; `intervalMs > 0` switches to `setInterval`, used for reduced-motion ticking). Both use `useEffectEvent` so the callback never restarts the effect. The W-B family (index-scan, replication-lag, cache-aside, queue-leveling) hand-rolls the same pattern with `useInView` + `usePageVisible` + its own rAF/`setInterval` effect.
- `useInterval(onTick, delayMs | null)` and `useStepPlayer({count, waitMs(i), active, onStep})` live in `_wa-shared.ts`. The step player returns `index/last/forward/seq/playing/next/back/togglePlay/jump`; it **initialises at the last step** (`_wa-shared.ts:74`), auto-advances with one `setTimeout` per step only while `active`, and `seq` is meant as a React key to restart per-step animations.
- Reduced motion: `useReducedMotion()` (`lib/hooks/use-motion-level.ts`) is true when the OS prefers reduced motion OR the learner's companion Animations setting is "reduced"/"off". Observed patterns a new sim should pick from: show the finished state immediately (tcp-udp, polling-vs-ws, backoff-jitter, index-scan, tail-latency); no travelling packets and longer per-step hold (request-journey, dns-lookup, 1,400 ms); motion `initial={false}` / `duration: 0` / `MotionConfig reducedMotion="always"` (shard-router); do not auto-start traffic (lb-sim, circuit-breaker, queue-leveling start paused/manual); coarser clock via interval (cache-aside 1 s, replication-lag 250 ms, token-bucket 500 ms, circuit-breaker 200 ms); batch instead of loop ("Send 20 requests" in cache-aside; bursts land at once in token-bucket; scripted runs play instantly in idempotency/pubsub). `globals.css:214-228` additionally forces all CSS animations/transitions to ~0 under `prefers-reduced-motion` and `html[data-motion="reduced"|"off"]`, which is what silences `dg-flow` in the static diagrams and architecture-map.
- Timers that model one-off delays (scaling-compare settle, cap-partition CP timeout, replication-lag's wall clock) are **not** paused off-screen; only continuous loops are.

**Companion events**
- `emitCompanionEvent({ type: "diagram", mood: "happy" | "thinking" | "confused", message })` from `lib/companion-events.ts`; the convention is a `useRef` "said once" flag per message, fired from an effect on a state transition (or directly in a click handler). 14 of 25 sims emit (corrected from 17; see the header of this file); exact strings are listed per sim below.

**Static diagrams**
- One file per diagram in `components/diagrams/static/`, a pure function returning `<svg className="dg w-full h-auto min-w-[540px]" viewBox=… role="img" aria-label=…>` using dg-* classes and `#ah*` markers; header comment says they were generated by `scratchpad migrate/convert.py` from the original lesson. Registered in `static/index.ts`; hosted by `Diagram` (`figure` + `overflow-x-auto` + italic caption; "Missing diagram “name”." fallback). Lessons embed with `<Diagram name="…" caption="…" />`.

---

## 2. Interactive simulations (registry order)

### 1. `request-journey` — `interactive/request-journey.tsx` (397 lines, no engine)
- **Frame:** kicker "Try it"; title **"One request, end to end"**; hint "Step through an HTTPS request for /feed. Each arrow is a packet; the clock assumes a 40 ms round trip to the server."
- **Teaches:** the sequence and cost of one HTTPS request (DNS, TCP 3-way handshake, TLS 1.3 handshake, request, server work, response) and how DNS caching and connection reuse (keep-alive/HTTP/2) remove setup time.
- **Controls:** Scenario segmented: Cold start | DNS cached | Reused connection; Back / Next step / Play–Pause–Replay; "Step i of n" readout.
- **Model:** fixed 11-step table (lines 32-55) with ms per step: DNS 10+10, SYN 20, SYN-ACK 20, ACK 0, ClientHello 20, ServerHello+cert 20, Finished 0, GET 20, server work 30, 200 OK 20 → cold 170 ms, DNS-cached 150 ms, reused 70 ms. Sequence diagram (client / DNS resolver / server) + waterfall drawn on the cold-start scale with a red dashed "cold start would finish here" marker. Stats: Elapsed, Round trips, Now, Spent on setup.
- **Reset / log / loop:** no reset button (Replay restarts); no event log; step-player timeouts, no rAF; `motion` for packet travel.
- **Companion:** none.
- **Concerns:** (a) `useStepPlayer` opens on the **last** step (`_wa-shared.ts:74`), so on first view the learner sees "Step 11 of 11", a finished waterfall and a "Replay" button rather than step 1; intentional but potentially confusing. (b) "Round trips" counts every message that arrives at the client (line 314), so the DNS reply counts as a round trip (cold shows 4) although the hint frames round trips as trips to the server. (c) Changing scenario jumps to the last step without playing (line 329) whereas dns-lookup autoplays from step 0 on the same action — the two step-through sims behave differently. No technical inaccuracies noticed (TLS 1.3 one-RTT, ACK piggy-backing, totals all check out).
- **Used by:** `http.mdx:34`.

### 2. `dns-lookup` — `interactive/dns-lookup.tsx` (390 lines)
- **Frame:** "Try it"; title **"Resolve instagram.com"**; hint "Step through a lookup, then switch the cache state to see why most lookups never leave your machine."
- **Teaches:** recursive resolution (browser/OS cache → resolver → root → .com TLD → authoritative), referrals vs answers, TTL caching and expiry, A vs AAAA.
- **Controls:** Cache state: Cold cache | Resolver cached | Browser cached; Record type: A (IPv4) | AAAA (IPv6); Back / Next step / Play–Pause–Replay (Play disabled when the scenario has one step).
- **Model:** `scenario(cache, rec)` builds 6 / 2 / 1 steps with ms and query counts (cold ≈ 0+2+30+30+30+2 = 94 ms, resolver-cached 4 ms, browser-cached 0 ms); five-node SVG with status tags ("cache miss", "→ ask .com", "A record", "cached 300 s"); DNS answer record card (name/TTL/class/type/value); TTL countdown via `useInterval` 1 s while resolved and in view (TTL_START cold 300, resolver 214, browser 187), with an "expired" note (line 341). Stats: Queries sent, Lookup time, Cached for.
- **Reset / log / loop:** no reset (Replay); no log; step player + 1 s interval.
- **Companion:** none.
- **Concerns:** (a) line 143 hard-codes the resolver's status text "cached 300 s" while the live TTL stat counts down beside it. (b) Switching Record type (line 353 `onChange={setRec}`) swaps the IP in the record card immediately without restarting the lookup or the TTL. (c) The cold scenario assumes the resolver has *nothing* cached, not even the root/TLD referrals that real resolvers almost always hold — fine pedagogically but unstated. (d) `changeCache` behaves differently by motion level (lines 330-336: autoplay from 0 normally, jump to the end under reduced motion).
- **Used by:** `dns.mdx:41`.

### 3. `tcp-udp` — `interactive/tcp-udp.tsx` (365 lines)
- **Frame:** "Try it"; title **"TCP vs UDP packet race"**; hint "Both send six packets. On a lossy network, watch TCP hold, wait and resend while UDP just keeps going."
- **Teaches:** TCP handshake, cumulative ACKs, retransmission after timeout and in-order delivery (held packets) versus UDP's connectionless, lossy, possibly reordered delivery; why UDP suits real-time media.
- **Controls:** "Run race" (disabled while running); Network: Lossy network | Clean network; "t = N ms" readout.
- **Model:** scripted plan in animation ms (600 = 30 ms real, lines 16-24). TCP: SYN/SYN-ACK/ACK, 6 data packets 200 apart, packet 3 lost when lossy, RTO 1,400 → "3 again", ACKs labelled cumulatively ("ACK 2" repeated while 3 is missing). UDP: 6 datagrams, packet 3 lost, packet 4 slow (dur 1,000) so 5 overtakes it, 6 at 650. Per-lane status chips, "App receives" chips (dashed = held in TCP buffer), packets-on-wire / delivered counts, "done at N ms", "finished first".
- **Reset / log / loop:** "Run race" restarts; no log; `_wa-shared.useFrameLoop` while running && gate && !reduced; reduced motion shows the finished race.
- **Companion:** none.
- **Concerns:** (a) Retransmission is RTO-only (lines 66-70); with the repeated duplicate "ACK 2"s the sim itself draws, real TCP would fast-retransmit before the RTO — the note at line 302 ("No ACK for packet 3 before the retransmission timeout") presents the RTO as the only mechanism. (b) Line 299 "an ACK per packet" ignores delayed ACKs (simplification). (c) Under reduced motion the "Run race" button is enabled but produces no visible change because `shownT` is pinned to `race.end` (lines 317, 344). The lesson table (`tcp-udp.mdx:16-19`) is consistent with the sim.
- **Used by:** `tcp-udp.mdx:21`.

### 4. `latency-scale` — `interactive/latency-scale.tsx` (316 lines)
- **Frame:** kicker **"Explore"**; title **"Latency numbers, to scale"**; hint "Log scale: each faint gridline is 10× the last, each labelled one 1,000×. Click any two rows to compare them."
- **Teaches:** the Norvig/Dean latency numbers on a log axis, the ratios between them and the design rules they imply; a "human scale" (1 ns = 1 s) rendering.
- **Controls:** Units: Real time | Human scale: 1 ns = 1 s; Rows: All 14 | The 4 to memorise; "Classic gaps" presets: RAM vs SSD read, Data center vs continent, Disk seek vs 1 MB read, Compress vs send; clicking any row makes it pick B and demotes the previous B to A (line 265).
- **Model:** 14 operations with seconds (lines 24-39; 4 flagged "memorise"); log mapping from 0.25 ns to 1.4 s; comparison panel with ratio, both values and orders of magnitude.
- **Reset / log / loop:** none / none / none (no gate); `motion` bar transition (0 s when reduced).
- **Companion:** none.
- **Concerns:** (a) The preset "RAM vs SSD read" displays ≈1,500× (150 µs ÷ 100 ns) while the lesson table directly below the widget (`latency.mdx:54`) says "~1,000×" — the page contradicts itself by 50%. (b) "Compress vs send" compares compressing 1 KB with sending 2 KB (as the lesson table does), so the 6.7× is not like-for-like. (c) With the "4 to memorise" filter, the picked A/B rows can be hidden while the comparison still shows them (lines 268-279). Values themselves match the classic list.
- **Used by:** `latency.mdx:50`.

### 5. `tail-latency` — `interactive/tail-latency.tsx` (238 lines)
- **Frame:** "Try it"; title **"The tail at scale"**; hint "A page calls N backends in parallel and waits for the slowest. Slide N and watch how often a rare slow response hits."
- **Teaches:** fan-out amplifies tail latency: P(slow page) = 1 − p^N; the per-backend budget needed to keep 99% of pages fast.
- **Controls:** RangeField "Backends per page" 1–200 (default 100); "How often one backend is slow": slow 1 in 100 (p99) | slow 1 in 1,000 (p99.9); "Load 100 more pages" (reseeds and reveals 100 pages at 30 ms each).
- **Model:** analytic curve plus 100 seeded (mulberry32) page simulations; page strip, example-page backend grid, budget `1/(1−0.99^(1/n))`. Stats: Backends per page; Pages that wait on a slow one; "Each backend may be slow at most 1 in N".
- **Reset / log / loop:** no reset (re-run = new seed); no log; `useInterval` 30 ms gated; reduced motion reveals all at once.
- **Companion:** none.
- **Concerns:** (a) The button says "Load 100 more pages" (line 206) but replaces the 100 pages and restarts the count from 0 — "more" implies accumulation. Numbers match the lesson's 63% (`latency.mdx:34`).
- **Used by:** `latency.mdx:36`.

### 6. `littles-law` — `interactive/littles-law.tsx` (232 lines)
- **Frame:** kicker **"Calculate"**; title **"Little's Law"**; hint "Requests in flight = throughput × average latency. Size your thread and connection pools from it."
- **Teaches:** L = λW, pool utilisation, the pool's maximum sustainable throughput (pool ÷ W) and queue growth when λ exceeds it.
- **Controls:** sliders Throughput 10–10,000 req/s (step 10, default 5,000), Avg latency 10–2,000 ms (step 10, default 200), Pool size 50–5,000 threads (step 50, default 1,500); presets "5,000 req/s × 200 ms", "DB slows to 400 ms", "100 req/s × 500 ms".
- **Model:** `analyse()` (lines 27-32); flowing-pipe SVG with ≤60 dots whose crossing time scales with latency (1.2–5 s), red queue dots and "queue +N/s" when overloaded; pool meter. Stats: In flight (L), Pool busy %, Pool's max throughput, Queue growth.
- **Reset / log / loop:** none / none / `_wa-shared.useFrameLoop` clock while gate && !reduced && dots > 0.
- **Companion:** none.
- **Concerns:** (a) When overloaded, the headline "in flight (L)" still shows λ×W (e.g. 2,000 against a 1,500 pool, lines 28 and 187) although at most `pool` requests can be in service; the note explains the queue, but the big number is the arrival-rate product, not an achievable in-system count. Otherwise none; the 5,000 × 0.2 = 1,000 example matches `latency.mdx:42`.
- **Used by:** `latency.mdx:44`, `backpressure.mdx:22`.

### 7. `lb-sim` — `interactive/lb-sim.tsx` (379 lines) + `_lb-sim-engine.ts` (338)
- **Frame:** kicker **"Simulate"**; title **"Load balancer"**; hint "Pick an algorithm and watch traffic spread. Click a server to crash it: the health check pulls it out of rotation."
- **Teaches:** round robin, weighted round robin, least connections and IP hash; health checks removing and re-adding servers; 502s in the window before detection; client remapping under IP hash.
- **Controls:** Algorithm: Round robin | Weighted | Least conn. | IP hash; click a server card (S1–S4; S4 weight 2, capacity 12) to crash/restart; Traffic slider 1–10 req/s (default 4); Pause / Start traffic; Burst ×10. IP-hash panel lists six client IPs → server with "(was S*)" remaps.
- **Model:** pure reducer with seeded PRNG (engine); flights 450 ms, jobs short 0.5–1.5 s (70%) or long 3–5.5 s (30%), health check every 1.2 s, log capped at 7, pre-warmed with 26 served. Stats: Requests, Served, Failed, In rotation. `EventLog` "Load balancer log".
- **Reset / log / loop:** **no reset**; log yes; `_wa-shared.useFrameLoop` (dt ms) while flowing && gate. Reduced motion: traffic waits for an explicit Start, flightMs 0, no packets or 502 flashes.
- **Companion:** `happy` — "Health check caught the dead server. No more failed requests!" once, the first time `state.caught > 0` (lines 284-290).
- **Concerns:** (a) No way to reset counters/log short of reloading. (b) Engine note at line 247 "so no more requests fail" — packets already in flight to the dead server when the check pulls it still land and 502 (`land`, lines 226-233). (c) A single failed probe removes a server; real LBs require N consecutive failures (unstated simplification). (d) The comment "IP hash spreads them 2 / 2 / 1 / 1" (engine line 75) is correct — recomputed FNV-1a over the six IPs gives S1:2, S2:2, S3:1, S4:1.
- **Used by:** `load-balancing.mdx:16`.

### 8. `scaling-compare` — `interactive/scaling-compare.tsx` (420) + `_scaling-compare-model.ts` (238)
- **Frame:** kicker **"Compare"**; title **"Scale up or scale out?"**; hint "Raise the traffic. Grow the single machine on the left, add servers on the right, then kill a machine on each side."
- **Teaches:** vertical vs horizontal scaling: hard ceiling, cost per capacity, downtime for resizes, single point of failure vs partial loss, health-check detection lag.
- **Controls:** Traffic slider 500–30,000 req/s (step 500, default 3,000). Vertical: "Upgrade to N cores" / "No bigger machine", "Kill the machine" / "Restart it". Horizontal: "Add server" (max 30), "Remove" (needs >1 up), "Kill a server".
- **Model:** reducer; TIERS Small 4c/1,000 rps/$150 → Largest 128c/20,000 rps/$6,000 (sub-linear); NODE 4c/1,000 rps/$150; LB $25; compressed timings (resize 2.5 s, boot 2 s, detect 1.2 s) settled by one `setTimeout` at `nextDue` (wall clock). Per-side figures; Trade-offs table (cost/month, cost per 1,000 req/s, ceiling, one machine dies, growing, needs); disclaimer "Illustrative prices and capacities…" (line 413).
- **Reset / log / loop:** none / none / no frame loop (CSS `dg-flow` only while gate && !reduced; motion transitions 0 s when reduced).
- **Companion:** `thinking` — "Even the biggest machine can't keep up. Time to scale out." once, when at the Largest tier, up, and dropping requests (lines 319-326).
- **Concerns:** (a) Settle timers run on `Date.now()`/`setTimeout` and are not paused off-screen or in a hidden tab (lines 312-317) — a departure from the loop convention, though harmless. (b) "Cost per 1,000 req/s" for scale-out divides by `nodes.length × capacity`, counting booting and dead nodes as capacity (line 265), while "Capacity" counts only up nodes. (c) "Remove" always drains the last *up* node even if a booting one exists (model 182-187).
- **Used by:** `scaling.mdx:36`.

### 9. `polling-vs-ws` — `interactive/polling-vs-ws.tsx` (262)
- **Frame:** kicker **"Compare"**; title **"Polling vs WebSocket"**; hint "Chat messages arrive at random moments in a 30-second window. Change the polling interval, play it, and drop in your own message."
- **Teaches:** polling's request count, empty responses and delay-until-next-poll versus one HTTP Upgrade and instant pushes.
- **Controls:** "Poll every" slider 1–10 s (default 5); "Play 30 s" / Pause / Resume; "Send a message now" (only while playing); "New messages" (reshuffle).
- **Model:** 3 seeded messages in 1.5–28.5 s plus user-added; polls at k·interval; `deliveredAt` = first poll at/after the message; WS push after 0.05 s; plays at 5× (6 s real). Stats: Polling requests; Empty responses; Avg wait (polling); WebSocket requests "1 + N pushes"; Avg wait (WebSocket) "≈0.05 s".
- **Reset / log / loop:** Play-from-end restarts, "New messages" resets; no log; `_wa-shared.useFrameLoop` while live && gate; reduced motion shows the finished window.
- **Companion:** none.
- **Concerns:** (a) Under reduced motion "Send a message now" is permanently disabled and "Play 30 s" has no visible effect (lines 177-178, 191-195, 232) — the interactive half of this sim is unavailable to reduced-motion users. (b) Stat label "WebSocket requests: 1 + N pushes" conflates requests and pushed frames (line 251). (c) Polls are modelled as instantaneous (no request latency) — unstated.
- **Used by:** `websockets.mdx:10`.

### 10. `index-scan` — `interactive/index-scan.tsx` (394)
- **Frame:** kicker **"Race"**; title **"Full scan vs index"**; hint "Grow the users table, then race WHERE email = … with and without a B-tree index."
- **Teaches:** O(n) scan vs O(log n) B-tree lookup; depth = ⌈log₁₀₀ n⌉; the index's storage and write cost.
- **Controls:** log slider "Rows in users" 10³–10⁹ (exponent step 0.05, default 500M, rounded to 2 s.f.); presets 1k, 1M, 50M, 500M, 1B; "Race" / "Racing…" / "Race again".
- **Model:** `planFor(n)`: depth, tIdx = depth × 0.15 ms, tScan = n ÷ 5M rows/s; the index lane always animates for 0.7 s and the race is capped at 3.2 s; two progress lanes with result text; B-tree path SVG lights pages as they are "read". Stats: Rows; Scan checks; Index page reads; Comparisons (~log₂ n); Index size (~40 B/row). Assumptions footnote at line 385-388.
- **Reset / log / loop:** slider change resets to idle; no log; hand-rolled rAF effect gated on `inView && visible` (lines 267-278); reduced motion jumps straight to "done".
- **Companion:** `happy` — "The index found it in {depth} page reads." once, emitted when Race is pressed and tScan/tIdx > 1,000 (lines 283-286).
- **Concerns:** (a) The companion announces the result at race *start*, before the animation finishes (line 283). (b) Every B-tree level, including the root, is charged a 0.15 ms SSD read, whereas the lesson's own deep-dive (`indexing.mdx:34`) says the top levels usually sit in RAM — consistent with the sim's stated assumptions but pessimistic for the index. (c) "Comparisons ~log₂ n" (line 98) is a loose proxy whose relation to page reads is not explained. The ≤1,000-rows case correctly notes the planner may skip the index (line 325).
- **Used by:** `indexing.mdx:7`.

### 11. `replication-lag` — `interactive/replication-lag.tsx` (489)
- **Frame:** kicker "Try it"; title **"The vanishing comment"**; hint "Post a comment, then refresh. Your read goes to a replica that may not have caught up yet."
- **Teaches:** async replication lag → stale reads; sync replication's write latency; read-your-own-writes; eventual consistency.
- **Controls:** "Post comment" (becomes "Waiting for replicas… N s" in sync mode); "Refresh feed"; slider "Replication lag" 0–5 s (step 0.5, default 2); Replication mode: Async | Sync; Read-your-own-writes: "Read-your-writes off" | "Read-your-writes on".
- **Model:** reducer on `performance.now()`; Replica A (lag × 1) and Replica B (lag × 1.6); comments carry per-replica arrival times; a refresh reads a random replica, or the primary within a 10 s RYW window after confirmation; stale when the last write is missing. Feed card with chips ("your comment is missing" / "read-your-writes" / "up to date"). Stats: Reads, Stale reads, Write confirmed in.
- **Reset / log / loop:** none / none / rAF (250 ms interval when reduced) only while something is in flight, waiting or in the RYW window, and only in view & visible (lines 384-401).
- **Companion:** `confused` — "Where did my comment go? Replication lag!" once, on a refresh that will be stale (lines 407-412).
- **Concerns:** (a) The clock is wall time, so pausing off-screen stops rendering but replicas still catch up while the tab is hidden (unlike the simulated-clock sims). (b) "Refresh feed" is disabled during a sync write's confirmation wait (line 431); a real system would still serve reads. (c) Replica choice is `Math.random()` (line 405), so a learner may need several refreshes before the stale read appears. (d) Line 417's `|| PRIMARY_WRITE_MS` papers over 4 ms rounding to 0 — works, but fragile.
- **Used by:** `replication.mdx:24`.

### 12. `shard-router` — `interactive/shard-router.tsx` (399)
- **Frame:** kicker **"Route it"**; title **"Which shard holds this user?"**; hint "Type a user_id, switch strategies, then add a fourth shard and count how many keys have to move."
- **Teaches:** modulo, hash, range and consistent-hashing placement; how many keys move when going 3 → 4 shards (≈75% vs the 25% ideal vs the ring's slices); range sharding's hot newest shard.
- **Controls:** text input user_id (digits, ≤9, default 42); Sharding strategy: Modulo | Hash | Range | Consistent hashing; "Add shard 4" / "Remove shard 4"; "+ 12 new sign-ups" (max 48); "Clear sign-ups".
- **Model:** deterministic (seeded rng 4242): 96 displayed dots and a 6,000-key sample for "% moved" and per-shard load; ring with 8 virtual nodes per shard; per-strategy route text; ring SVG when consistent hashing is selected. Recomputed outputs: moved mod 75%, hash 75%, range 0%, ring 18%; user 42 → S1 (mod), S2 (hash), S1 (range), S3 (ring). Stats: Shards; "3 → 4 shards moves X% of keys"; "Even split needs 25% moved"; "User lands on Shard N".
- **Reset / log / loop:** none / none / none (motion layout animations under `MotionConfig`, disabled when reduced).
- **Companion:** on the first "Add shard 4": `confused` "{pct} of keys had to move. Ouch." when MOVED > 50%, else `happy` "Only {pct} of keys moved." (lines 291-299).
- **Concerns:** (a) With Range selected, the first "Add shard 4" praises "Only 0% of keys moved." — true, but range's real problem (hot shard) is only in the note. (b) None numeric: the 18% ring figure and the line-308 explanation ("An even split would move exactly 25%; with just 8 points per shard the slices are uneven") agree with the data. (c) `h32(input | 0)` (line 42) would truncate ids ≥ 2³¹, but the input is capped at 999,999,999.
- **Used by:** `sharding.mdx:18`.

### 13. `cap-partition` — `interactive/cap-partition.tsx` (506)
- **Frame:** kicker **"Break it"**; title **"A network partition"**; hint "One account, two data centers. Cut the link, then withdraw ₹3,000 on both sides. Compare CP with AP."
- **Teaches:** CAP under a partition: CP waits then errors (correct but unavailable); AP answers from the local copy (stale reads, double payout) and reconciles on heal.
- **Controls:** Consistency mode: "CP: refuse or wait" | "AP: answer locally"; "Cut network" / "Heal network"; "Reset"; per ATM (Mumbai, Virginia): "Withdraw ₹3,000", "Check balance".
- **Model:** reducer; ₹5,000 on each side; CP pending op times out after 2.5 s (`setTimeout`) unless the link heals first (then it completes); AP tracks `spent` per side and heal reconciles `base − spent` (negative → "overdrawn by ₹1,000"). Stats: Mode, Paid out, Errors, Stale reads. `EventLog` "Partition events" (8 entries).
- **Reset / log / loop:** Reset yes (keeps mode); log yes; no loop (one timeout); reduced motion shows static dots.
- **Companion:** `confused` — "Both ATMs paid out. That's why money is CP!" on Heal when both sides paid and the reconciled balance is negative (lines 441-447); **not** once-guarded.
- **Concerns:** (a) CP is modelled with *both* sides unable to answer; correct for two replicas, but a learner may generalise it — a 3-node CP system keeps its majority side available. (b) The 2.5 s CP timeout is wall-clock and not paused off-screen (fine). Numbers check out (₹5,000 − 2×₹3,000 = −₹1,000) and match `cap.mdx:23`.
- **Used by:** `cap.mdx:19`.

### 14. `cache-aside` — `interactive/cache-aside.tsx` (524)
- **Frame:** "Try it"; title **"Cache-aside with Redis"**; hint "Request posts. A first read misses and goes to the database; repeats come from RAM until the TTL runs out."
- **Teaches:** cache-aside reads (hit 1 ms vs miss 21 ms), TTL expiry, LRU eviction at capacity 4, delete-on-write vs stale hits, hot keys, cold start, hit ratio.
- **Controls:** GET buttons for `virat-post` (hot, primary) and `post:1`…`post:5`; "Update virat-post (+likes)"; On update: "Delete cache key" | "Leave cache alone"; "Simulate traffic" / "Stop traffic" (reduced motion: "Send 20 requests"); "Restart Redis".
- **Model:** reducer with a simulated clock (0.25 s ticks; 1 s under reduced motion; only while in view & visible); warm start of 7 requests (3 hits, 4 misses); traffic one request per 800 ms with weights (45% hot key); log 30 entries. Stats: Hit ratio, Avg read, DB queries, Evictions, Last read (plain grid while traffic runs). `EventLog` "Request log".
- **Reset / log / loop:** "Restart Redis" flushes the cache only; counters/log persist. Loop as above.
- **Companion:** `confused` — "Stale cache! Delete the key when you write." once on the first stale hit; `happy` — "Hit ratio {N}%. The database can relax." once when total ≥ 25 and ratio ≥ 0.8 (lines 428-436).
- **Concerns:** (a) No full reset. (b) Staleness is detected omnisciently by comparing the cached value with the DB (line 100) and logged as "HIT (stale!)" — pedagogical, but a real cache cannot know. (c) Miss latency is 21 ms in the log (line 105) but "about 20 ms" in the note (line 126) and "~10–20 ms" in the static `cache-aside-flow` diagram on the same lesson. (d) The read-then-write race from the lesson's deep-dive is not modelled (fine).
- **Used by:** `caching.mdx:46`.

### 15. `queue-leveling` — `interactive/queue-leveling.tsx` (525)
- **Frame:** kicker **"Simulate"**; title **"Queue load leveling"**; hint "Fire a burst of photo uploads. The queue absorbs it and workers drain it at their own pace. Then break it."
- **Teaches:** queues absorb bursts; workers drain at 1 message / 0.6 s each; bounded buffer sheds with 503 (backpressure) vs unbounded growth → broker out-of-memory; poison messages, redelivery, dead-letter queue after 3 attempts.
- **Controls:** "Send burst of N"; Burst size slider 20–300 (step 10, default 80); "Send a poison message"; Workers −/+ (1–8, default 2); Buffer size slider 10–80 (step 5, default 40); When the buffer is full: "Bounded: shed with 503" | "Unbounded: keep everything"; Run / Pause; "Step 1 s" while paused; "Restart broker" after a crash.
- **Model:** reducer stepping 0.1 s via `setInterval` while running, not crashed, in view and visible; steady 2 msg/s; unbounded crash at cap × 4 queued; INITIAL opens with 26 queued, 184 processed and #97 in the DLQ. Stats (non-live grid): In queue, Processed, Shed (503), Dead-letter, Out vs in, Time to drain. `EventLog` "Queue events" (30).
- **Reset / log / loop:** no reset (only Restart broker after a crash); log yes; interval loop; reduced motion starts paused.
- **Companion:** `confused` — "The unbounded queue ate all the memory. Bound it and shed the excess." once on crash (lines 355-360); `thinking` — "Buffer full: the whole burst was shed. That's backpressure working." on **every** burst sent while the bounded buffer is full (lines 362-367, unguarded).
- **Concerns:** (a) The `thinking` event repeats on each full-buffer burst. (b) A failed poison message is re-queued at the *front* immediately (line 120), so one poison message monopolises a worker three times in a row; real brokers delay redelivery (visibility timeout). (c) The default burst (80) against a 40-slot buffer that already holds 26 sheds 66 of 80 on the very first click — intended ("then break it") but abrupt. (d) Counters cannot be reset.
- **Used by:** `message-queues.mdx:12`.

### 16. `pubsub-fanout` — `interactive/pubsub-fanout.tsx` (547)
- **Frame:** kicker **"Fan it out"**; title **"Queue vs pub/sub"**; hint "Publish a PostCreated event. In queue mode one worker takes it; in pub/sub every subscriber gets its own copy. Then add a subscriber."
- **Teaches:** competing consumers on a queue (round-robin, one handler per message) vs fan-out on a topic (one copy per subscriber, each with its own queue); offline consumers and backlog; adding subscribers without touching the producer.
- **Controls:** Delivery model: "Queue: one consumer" | "Pub/sub: every subscriber"; "Publish PostCreated"; "Publish 5 posts"; "Add Recommendations" / "Add Moderation" / "All subscribers added" (pub/sub) or "Add a worker" (max 4); per consumer card: "Take offline" / "Bring online", remove (×) for added ones.
- **Model:** reducer; flights animate 1.1 s (+0.2 s stagger) and land via `onAnimationComplete`; instant landing when reduced; per-subscriber backlog while offline, broker backlog when no worker is online; `joinedAfter` for late consumers ("joined after post #N"). Code line shows `publish("post-events", …)` vs `send("post-jobs", …)`. Stats: Posts published; Copies delivered / Messages handled; Copies per post / Handlers per post; Post service changes (0) / Workers online.
- **Reset / log / loop:** none / none / none (motion-driven).
- **Companion:** `happy` — "A new subscriber, and the post service never changed." once on the first Add in pub/sub mode (lines 464-470).
- **Concerns:** (a) Removing a consumer while a copy is in flight leaves the dot with no row: it stops in the broker and `land` silently drops it (lines 346-349, 101-111), slightly under-counting. (b) The static `queue-vs-pubsub` diagram on the same lesson labels the topic box "PostCreated" while this sim names the topic "post-events" — two names for the same thing on one page.
- **Used by:** `pubsub.mdx:9`.

### 17. `nines` — `interactive/nines.tsx` (437)
- **Frame:** kicker **"Calculate"**; title **"How much downtime does each nine allow?"**; hint "Pick a target. Each extra nine cuts the allowed downtime 10×. Then combine services below."
- **Teaches:** availability targets → downtime per year/month/week/day; a 365-square year strip; dependencies in series multiply, redundant copies in parallel (1 − Π(1−aᵢ)).
- **Controls:** four target rows (99%, 99.9%, 99.99%, 99.999%) as pressed buttons; Combiner: Arrangement "In series" | "In parallel (redundant)"; "Add service" (max 4; defaults A and B at 99.9); numeric inputs 50–100 step 0.01 with remove (×) when more than two.
- **Model:** pure arithmetic (365-day year, month = year/12); log-scale downtime bars (1 min … 1 wk). Stats: Per year, Per month, Per week, Per day. Combined result with formula, downtime/yr, "(N nines)", comparison with weakest/strongest.
- **Reset / log / loop / companion:** none.
- **Concerns:** None numeric — 3.65 d / 8.76 h / 52.6 min / 5.26 min match `availability.mdx:5-8`, series 0.999² = 99.8001% matches "about 99.8%". The parallel text correctly states the independence/instant-failover assumption (line 386). Cosmetic: `formatPct` prints up to six decimals.
- **Used by:** `availability.mdx:10`.

### 18. `backoff-jitter` — `interactive/backoff-jitter.tsx` (390) + `_backoff-jitter-sim.ts` (115)
- **Frame:** kicker **"Simulate"**; title **"Retry storms vs backoff + jitter"**; hint "20 clients fail at t = 0 and retry. The server serves 6 requests per half-second; past 12 it falls over and serves none."
- **Teaches:** synchronised retries overwhelm a recovering server; exponential backoff alone keeps clients in lockstep; full jitter spreads retries under capacity.
- **Controls:** Retry strategy: Immediate | Backoff | Backoff + jitter; "Replay" (new random seed). Formula line: "wait = 0.5 s, every time" / "wait = min(8, 2ⁿ⁻¹) s → 1, 2, 4, 8 s" / "wait = random(0, min(8, 2ⁿ⁻¹)) s (full jitter)".
- **Model:** pure seeded simulation over 16 s in 0.5 s buckets, 20 clients, ≤8 attempts, capacity 6 per bucket, collapse above 12 (serves none); timeline of attempts per client plus a retries-per-½-s histogram with capacity/collapse lines; playhead plays 16 s in 4.5 s; scoreboard for all three strategies (requests, served, peak ½ s, "all served by").
- **Reset / log / loop:** strategy change or Replay rewinds; no log; `_wc-frame-loop.useFrameLoop` (seconds) while active && !reduced && !finished; reduced motion shows the completed timeline.
- **Companion:** `happy` — "Jitter spread the retries out, and every client got through." once, when the jitter run finishes with all 20 served (lines 349-354).
- **Concerns:** (a) With these parameters pure Backoff serves 0 of 20 (all 20 retry together at 1, 3, 7 and 15 s and each bucket exceeds 12) — dramatic but intentional, and the explain text copes. (b) "Immediate" actually retries every 0.5 s (engine line 56); the formula line discloses this. (c) None in the jitter formula; it matches the AWS full-jitter formula quoted in `timeouts-retries.mdx:29`.
- **Used by:** `timeouts-retries.mdx:13`.

### 19. `circuit-breaker` — `interactive/circuit-breaker.tsx` (414) + `_circuit-breaker-sim.ts` (212)
- **Frame:** "Try it"; title **"Circuit breaker"**; hint "The feed service calls a ranking service. Make the ranking service fail and watch the breaker trip, wait, test and recover."
- **Teaches:** Closed → Open after 5 consecutive failures (1,000 ms timeouts), fail-fast with a fallback ("cached feed"), 5 s cooldown → Half-open, 2 trial successes close it, one failure reopens; threads held by hanging calls.
- **Controls:** Ranking service: Healthy | Failing; Traffic: Auto | Manual (auto sends every 0.7 s; manual is the default under reduced motion); "Send request"; "Reset".
- **Model:** discrete-event engine (`advance` applies due events in order: completions, cooldown, auto sends); request-flow SVG (dots travel caller → breaker → service, timer rings on hanging calls, queue of waiting threads), lever angle per state, state-machine SVG highlighting the hot edge; meter (failure pips / cooldown bar / trial pips); log 30 entries. Stats (non-live grid): State, Calls passed, Failed fast, Threads waiting. `EventLog` "Call log, newest first".
- **Reset / log / loop:** Reset yes; log yes; `_wc-frame-loop.useFrameLoop` while active && `isBusy`, 200 ms interval under reduced motion.
- **Companion:** `thinking` — "Breaker tripped: callers now fail fast instead of piling up." once on closed→open; `happy` — "The service is back and the breaker closed itself." once on half→closed after a trip (lines 355-366).
- **Concerns:** None noticed; the consecutive-failure model, half-open single-trial gating ("Trial already running → fallback") and cooldown match the lesson and its Mermaid state diagram (`circuit-breaker.mdx:9-16`).
- **Used by:** `circuit-breaker.mdx:7`.

### 20. `token-bucket` — `interactive/token-bucket.tsx` (300) + `_token-bucket-sim.ts` (198)
- **Frame:** "Try it"; title **"Rate limiter"**; hint "Send requests and watch the limiter answer 200 or 429. Then switch to a fixed window and try the boundary burst."
- **Teaches:** token bucket (capacity 10, refill 0.5–5 tokens/s) permits bursts within an average rate; fixed window (10 per 10 s) leaks 2× at a boundary; 429 with `Retry-After`.
- **Controls:** Algorithm: Token bucket | Fixed window; Refill rate slider 0.5–5 tokens/s (step 0.5, default 2) in bucket mode; "Run the boundary burst" in window mode (10 requests just before and 10 just after the next reset); "Send 1 request"; "Burst of 15".
- **Model:** pure limiter; clock starts at 1003.4 (deliberately off a boundary) with six pre-seeded requests; 20 s timeline of 200/429 dots and "reset" lines; "Last response" panel ("HTTP/1.1 200 OK" or "HTTP/1.1 429 Too Many Requests · Retry-After: N"). Stats (non-live grid): Allowed (200), Rejected (429), Allowed last 10 s (warn when > 10 in fixed mode).
- **Reset / log / loop:** no reset; no log; `_wc-frame-loop.useFrameLoop` while active (500 ms interval when reduced; bursts land all at once).
- **Companion:** `thinking` — "{N} requests slipped through in about a second. Fixed windows leak at the edges." once when the boundary demo result exceeds the limit (lines 248-257).
- **Concerns:** (a) `setMode` (engine lines 139-152) resets tokens/window/queue/demo but keeps `requests`, `allowed` and `rejected`, so dots from the other algorithm stay on the timeline and feed the "Allowed, last 10 s" stat after switching — mildly misleading. Otherwise consistent with `rate-limiting.mdx:10-12`.
- **Used by:** `rate-limiting.mdx:15`.

### 21. `idempotency` — `interactive/idempotency.tsx` (348) + `_idempotency-flow.ts` (201)
- **Frame:** "Try it"; title **"Retry a payment safely"**; hint "The server charges the card, the reply gets lost, and the app retries. Compare the run with and without an idempotency key."
- **Teaches:** lost reply + retry → double charge with plain POST; an Idempotency-Key makes the retry return the saved result; "charged but the app doesn't know" when the client gives up.
- **Controls:** Reply: Delivered | Lost (default Lost); Auto-retry: Off | On (default On); Idempotency-Key: Off | On (default Off); "Pay ₹500"; "Clear statement".
- **Model:** scripted step machine (750 ms per step, paused off-screen; instant under reduced motion): request → process → reply (lost?) → timeout/give up → retry → process retry → reply → summary; sequence diagram rows, card statement (duplicates flagged), idempotency store table (key, saved result, replays). Opens with the failure case already played (quiet, no companion). Stats: Total charged, Charges, Requests sent.
- **Reset / log / loop:** "Clear statement" clears charges/store/requests (order counter continues); no log; timeout chain.
- **Companion:** `confused` — "Charged twice for one tap! Turn on the Idempotency-Key and pay again." once on a non-quiet double charge; `happy` — "One tap, one charge, even with a retry." once on a safe retry (lines 268-280).
- **Concerns:** None technical; the model (key + result saved in the same transaction, replay returns the saved 201, 24 h expiry) matches `idempotency.mdx:9-12`. Narrative nit: the client note says "No reply within the 2 s timeout" (flow line 105) while steps advance every 0.75 s.
- **Used by:** `idempotency.mdx:47`.

### 22. `estimator` — `interactive/estimator.tsx` (204) + `_estimator-math.ts` (317) — variants `url` (default) | `drive` | `chat`
- **Frame:** kicker **"Calculate"**; title **"Back-of-the-envelope estimator"**; hint "Pick a preset or type your own assumptions (100M, 1B and 500KB all work). Every result shows its working."
- **Teaches:** write/read/total QPS and peaks, data per day, total storage, ingress/egress, cache size (20% of daily reads), app servers, records kept and base-62 ID length, plus a "system shape" verdict (storage/bandwidth-heavy, read-heavy, write-heavy stream, modest).
- **Controls:** Preset: URL shortener | Google Drive | Chat app drill | Custom; eight text fields (DAU, writes/user/day, reads per write, size per write, retention days, replication factor, peak factor, QPS per server) with k/M/B/T and B/KB/MB/GB/TB suffix parsing and inline validation; the chat variant hides results behind "Show the results" (self-test).
- **Model:** pure parse → `estimate()` → rows with working strings (10⁵ s/day shortcut, Google ≈ 100k QPS comparison); `shapeOf()` thresholds at `_estimator-math.ts:195-226`.
- **Reset / log / loop / companion:** none.
- **Concerns:** None numeric — the chat preset reproduces the drill answers in `test-yourself.mdx:15-20` (1M write QPS, 2M total, 900 TB, 100 MB/s, ~20× Google); the URL preset yields 1.1 PB and 7-character codes, matching `url-shortener.mdx:22`. The "Google Search ~100k QPS" yardstick is an approximate, dated figure (the lesson flags it "approximate"). Cosmetic: editing any field flips the preset to "Custom" even if the value is unchanged (lines 154-158). Variant `drive` is never passed by a lesson (reachable only via the preset control).
- **Used by:** `estimation-formulas.mdx:18` (no variant → url), `test-yourself.mdx:11` (`variant="chat"`).

### 23. `base62` — `interactive/base62.tsx` (382) + `_base62-codec.ts` (98)
- **Frame:** "Try it"; title **"Counter + base 62"**; hint "Each new URL takes the next number from a counter; base 62 (0–9, A–Z, a–z) turns it into a short code. Type in either box."
- **Teaches:** counter + base-62 encoding (1,000,000 → `4C92`), the repeated-division table, the URL-safe alphabet, capacity per code length (62⁵/62⁶/62⁷ vs 1B and 365B URLs, lifetime at 100M/day), sequential vs scrambled codes.
- **Controls:** "Counter value (ID)" (≤15 digits) and "Short code" text fields, bidirectional; "Next ID (INCR)"; Code style: Sequential | Scrambled.
- **Model:** pure `encode`/`decode`/`divisionSteps`; `CAPACITY` rows; `scrambledCode` = (id × 2147483647 + offset) mod 62⁷ padded to 7 chars.
- **Reset / log / loop / companion:** none.
- **Concerns:** None numeric (verified: `4C92`; 62⁵ ≈ 916M "too few" for 1B; 62⁶ ≈ 56.8B fits 1B but not 365B; 62⁷ ≈ 3.5T fits both; 2³¹−1 is coprime with 62 so the scramble is a bijection). Edge: ids ≥ 62⁷ wrap via `id % SPACE_7` (codec line 71), so two ids 62⁷ apart would share a scrambled code — unreachable in the lesson's range but the input accepts up to 10¹⁵.
- **Used by:** `url-shortener.mdx:26`.

### 24. `recall-cards` — `interactive/recall-cards.tsx` (405) — variants `test` (default) | `revision`
- **Frame:** kicker **"Recall"**; title = deck title: **"Test yourself"** (test) / **"Problem to building block"** (revision) from `data/recall.ts`; hint: test "Answer from memory, then flip the card and grade yourself honestly." / revision "Read the problem, name the building block that solves it, then flip to check."
- **Teaches:** flashcard self-testing with per-deck persisted "known" state (zustand progress store), "Again" requeue, links back to the source lesson.
- **Controls:** Cards to show: All cards | Still learning; Shuffle; Reset progress; Prev / "Show answer"–"Show question" / Next; Again / Got it (when flipped); keyboard Space flips, ← → move; clicking the card flips (3D rotateY; 0 s when reduced).
- **Model:** order array + position + flipped; known Set trusted only after hydration; DonePanel ("End of the deck…") and EmptyPanel ("Nothing left to learn here."); progress bar "Known N of M · card i of n"; sr-only live status.
- **Reset / log / loop:** "Reset progress" clears known for the deck; no log; no loop.
- **Companion:** `happy` — "Whole deck known. Great recall!" when a "Got it" makes every card known (lines 261-263; not once-guarded, naturally rare).
- **Concerns:** None technical (`inert` on the hidden face needs React 19; `package.json` has 19.3.0). Maintenance hazard: known-ness is stored by card *index*, so reordering cards in `data/recall.ts` would silently remap saved progress.
- **Used by:** `test-yourself.mdx:3` (`variant="test"`), `revision-map.mdx:3` (`variant="revision"`).

### 25. `architecture-map` — `interactive/architecture-map.tsx` (205) — also reads `variant === "dashboard"`
- **Frame:** kicker "Try it" (or **"Live blueprint"** when `variant="dashboard"`, line 79); title **"{lit} of 12 boxes lit"**; hint "Each box lights up when you finish the lessons behind it. Select a box to see what it solves." No `note`.
- **Teaches:** the course's final architecture (Users, DNS, API gateway + LB, CDN, Feed/Post/Chat services, Cache, Message queue, Workers, Database, Object storage) as a progress map; each box lights when all lessons tagged with its `archNode` are complete.
- **Controls:** click / Enter / Space on a box selects it (`role="button"`, `aria-pressed`); side panel shows the box's "why" sentence and its lessons with check marks and links; legend (Still to learn / Learned / Learned data store).
- **Model:** lessons' `archNodes` from `data/curriculum.ts`, completion from the progress store (hydration-gated); default selection = first unlit box; three edges carry the CSS `dg-flow` march (globally stilled under reduced motion by `globals.css`).
- **Reset / log / loop / companion:** none.
- **Concerns:** (a) `final-architecture.mdx:1` says "click any box to jump there", but clicking only selects; navigation is via the lesson links in the side panel — prose/behaviour mismatch. (b) This is a third variant-consuming sim: `app/page.tsx:62` renders `<InteractiveDiagram name="architecture-map" variant="dashboard" />`. (c) Every `ArchNodeId` has at least one lesson mapped (db 8, gateway 5, users 4, post 3, feed 3, workers 2, queue 2, storage/dns/chat/cdn/cache 1 each), so every box can light.
- **Used by:** `final-architecture.mdx:3`; `app/page.tsx:62` (dashboard variant).

---

## 3. Static diagrams (`components/diagrams/static/`, registry order from `index.ts`)

| Registry name | Depicts (from SVG labels) | Lesson | Labelling concern |
| --- | --- | --- | --- |
| `bottleneck-chain` | Users "send requests" → App server "handles 200 req/s" → Database "handles 80 req/s" tagged "bottleneck"; footer "System throughput = 80 req/s. Scale the database, not the app server." | `latency.mdx:19` | None. |
| `cache-aside-flow` | Request "GET post:42" → Check cache (Redis) → Hit "return (~1 ms)" / "Miss: read DB" "slower (~10–20 ms)" → "Store + TTL" "then return"; footer "On update: write the database, then delete the cache key". | `caching.mdx:44` | DB latency "~10–20 ms" vs the interactive's 21 ms/"about 20 ms" on the same page (minor). |
| `cdn-edges` | Users · India / Europe / US → Mumbai / Frankfurt / Virginia edge ("cached copies", "hit · ~20 ms") → dashed to Origin "servers + storage" ("on a miss: fetch, cache with TTL"). | `cdn.mdx:3` | None. |
| `estimation-flow` | 1 · Assumptions (DAU, actions per day, read:write, sizes) → 2 · Traffic (DAU × actions ÷ 10⁵; peak = avg × 2–3) → 3 · Storage (writes/day × size × days × 3 copies) → 4 · Bandwidth (QPS × object size; then servers, cache) → "The numbers decide the boxes: cache? read replicas? sharding? CDN?" | `estimation-numbers.mdx:3` | None. |
| `forward-reverse-proxy` | Top "FORWARD PROXY · sits in front of clients": Company network → Employees laptops → Forward proxy "filter · cache · hide" → internet → Any website "sees only the proxy". Bottom "REVERSE PROXY · sits in front of servers": Users → Reverse proxy "Nginx, HAProxy, Envoy" in "Your data center" → App server 1 (/api/*), App server 2, Static file server (/static/*). | `proxy.mdx:6` | Only the top and bottom routes are labelled; the middle (App server 2) route is unlabelled — minor. |
| `monolith-vs-microservices` | Monolith "one codebase · one deploy" with Users / Posts / Feed / Chat modules over "One database"; API gateway → User svc / Post svc / Feed svc each with its own DB; "each service deploys, scales and stores data on its own". | `microservices.mdx:3` | Monolith lists four modules (incl. Chat) but the microservices side shows three services (no Chat) — asymmetric; the aria-label describes it accurately. |
| `pacelc-tree` | "Network partition? nodes up but can't talk" → yes · P → "Choose A or C · rare, but it will happen" → PA: availability "answer, maybe stale" / PC: consistency "refuse or wait"; no · Else → "Choose L or C · the everyday case" → EL: latency "confirm locally, fast" / EC: consistency "wait for replicas"; footer "Social feed → PA/EL · Payment ledger → PC/EC". | `cap.mdx:36` | None. |
| `presigned-upload` | Client (phone app) → "1 · get upload URL" → App server "signs upload URL"; "2 · upload bytes directly" → Object storage "S3 bucket"; "3 · save metadata" → Database "metadata + image_key"; "4 · cached at edge" → CDN "serves the file". | `object-storage.mdx:5` | None. |
| `primary-replicas` | App servers → "writes" → Primary "takes all writes"; "reads" → Replica 1 / Replica 2 "serves reads"; dashed "replication stream (sync or async)". | `replication.mdx:3` | The replication stream is drawn Primary → Replica 1 → Replica 2 as a chain (paths at lines 22-23), which can read as cascading replication rather than two streams from the primary. |
| `queue-vs-pubsub` | Left "Queue: one worker per message": Producer → Queue → Worker 1/2/3, "work distribution". Right "Pub/sub: every subscriber gets a copy": Post service → "PostCreated" → Notify / Analytics / Moderation, "fan-out". | `pubsub.mdx:3` | The topic box is labelled with the event name "PostCreated" while the interactive on the same page calls the topic "post-events". |
| `rate-limit-vs-shedding` | Clients "users, bots" → API gateway "rate limiter · quota left for you?" → Service "load shedder · am I healthy enough?" → DB; branches "429 Too Many Requests · you used your quota" and "503 Service Unavailable · I am overloaded". | `rate-limiting.mdx:36` | None. |
| `rpo-rto-timeline` | Timeline: "Last backup or sync" ● → RPO "data written here is lost" → "Failure" ● → RTO "users see downtime" → "Service restored" ●; footer "Shrink RPO with synchronous replication or frequent backups; shrink RTO with automatic failover". | `availability.mdx:29` | None (caption says "Not to scale"). |
| `scale-up-vs-out` | "VERTICAL · scale up": Server 4 cores → upgrade → Bigger server "64 cores · 512 GB · still one machine"; "Hard ceiling · single point of failure". "HORIZONTAL · scale out": Load balancer → 3 × Server 4 cores; "Add or remove machines live". | `scaling.mdx:21` | "64 cores · 512 GB" vs the interactive's 2XL tier "64 cores, 256 GB" — illustrative, but inconsistent on one page. |
| `shard-routing` | "GET /users/42/posts · user_id = 42" → Shard router "42 % 3 = 0 → Shard 1" → Shard 1 "user_id % 3 = 0 · users 0, 3, 6 … 42", Shard 2 "= 1 · users 1, 4, 7 …", Shard 3 "= 2 · users 2, 5, 8 …"; footer "Each shard holds different rows, and each shard is usually replicated too." | `sharding.mdx:7` | None (caption notes real systems hash). |
| `sync-vs-async-timeline` | "Synchronous · user waits": save → resize images → notify → analytics, "reply at 1.4 s". "Asynchronous · reply, then queue": save, "reply at 0.15 s", then "background workers": resize images / notify / analytics; axis 0 / 0.5 s / 1.0 s / 1.5 s. | `sync-async.mdx:10` | None — box widths actually land at 1.39 s and 0.14 s on the drawn axis. |
| `url-shortener-architecture` | Client (browser) → Load balancer "health checks" → App servers "stateless" (stacked) → Redis "ID counter + hot links" ("INCR · GET") and PostgreSQL "primary + read replica" ("INSERT · miss"); footer "Write: INCR → base 62 → INSERT → 201 · Read: Redis → (miss) PostgreSQL → 302". | `url-shortener.mdx:53` | None. |

All 16 carry a descriptive `aria-label`; all use only dg-* classes that exist in `globals.css` (`dg-dot--muted` is used once, by `rpo-rto-timeline`).

---

## 4. Unused / mismatches

- **Interactives:** all 25 registry names are referenced by at least one lesson (grep of `<Interactive name=`). Multi-use: `littles-law` (latency, backpressure), `estimator` (estimation-formulas default + test-yourself `chat`), `recall-cards` (test-yourself `test`, revision-map `revision`). `architecture-map` is additionally rendered by `app/page.tsx:62` with `variant="dashboard"`.
- **Statics:** all 16 are referenced exactly once each (grep of `<Diagram name=`).
- **Dangling references:** none — every `name` in the lessons exists in `interactiveRegistry` or `staticDiagrams`.
- **Variants:** `estimator` variant `drive` is defined but never passed by a lesson. `architecture-map` consumes a `dashboard` variant (kicker only), so three sims read `variant`, not two. All other sims ignore it.
- **Lessons with only static diagrams (no sim):** cdn, proxy, microservices, object-storage, sync-async, estimation-numbers.
- **Helper duplication:** `_wa-shared.useFrameLoop` (dt in **ms**) and `_wc-frame-loop.useFrameLoop` (dt in **seconds**) share a name with different units; a new sim must pick one deliberately.

---

## 5. Concerns summary

**Content accuracy / page-level consistency**
1. `latency-scale` preset "RAM vs SSD read" shows ≈1,500× while `latency.mdx:54` right below says ~1,000×.
2. `tcp-udp` models retransmission as RTO-only and "an ACK per packet" (lines 66-70, 299-302); the duplicate ACKs it draws would trigger fast retransmit in real TCP.
3. `index-scan` charges a 0.15 ms disk read for every B-tree level including the root; `indexing.mdx:34` says the top levels usually sit in RAM.
4. `littles-law` headline L = λ×W is shown even when it exceeds the pool (lines 28, 187); only the note explains that the excess is a queue.
5. `lb-sim` engine note "no more requests fail" (line 247) while in-flight packets can still 502; single-probe removal is an unstated simplification.
6. `cap-partition` CP models both sides as unavailable — correct for two replicas, not generally.
7. Naming/number drift between a static diagram and the sim on the same page: `queue-vs-pubsub` "PostCreated" vs `pubsub-fanout` "post-events"; `scale-up-vs-out` "64 cores · 512 GB" vs `scaling-compare` 2XL 256 GB; `cache-aside-flow` "~10–20 ms" vs `cache-aside` 21 ms.
8. `final-architecture.mdx:1` "click any box to jump there" does not match `architecture-map`, where a click selects and the jump is via side-panel links.
9. `primary-replicas` draws the replication stream as a chain through Replica 1 to Replica 2 (possible cascading-replication reading).

**UX / behaviour**
10. Step-through sims (`request-journey`, `dns-lookup`) open on the final step because `useStepPlayer` initialises at `last` (`_wa-shared.ts:74`); scenario changes behave differently in the two sims.
11. Reduced-motion users lose functionality in `polling-vs-ws` ("Send a message now" never enabled; Play does nothing) and get inert "Run race" in `tcp-udp`.
12. `index-scan` fires its companion message when the race starts, not when it ends.
13. Companion events that are not once-guarded: `queue-leveling` "Buffer full…" (every full-buffer burst), `cap-partition` "Both ATMs paid out…" (every qualifying heal), `recall-cards` "Whole deck known…" (rare).
14. No reset: `lb-sim`, `cache-aside` (Restart Redis keeps counters), `queue-leveling` (only after a crash), `token-bucket` (mode switch keeps history and counters so the other algorithm's dots remain on the timeline — engine `setMode` lines 139-152).
15. `tail-latency` button "Load 100 more pages" replaces rather than adds.
16. `queue-leveling` redelivers a poison message to the front immediately (line 120); real brokers delay redelivery.
17. `pubsub-fanout` drops an in-flight copy silently if its consumer is removed mid-flight (lines 346-349, 101-111).
18. `scaling-compare` settle timers and `replication-lag`'s wall clock keep running while the widget is off-screen (contrast with the loop convention).
19. `dns-lookup` hard-codes "cached 300 s" beside a live TTL countdown (line 143) and does not restart on Record-type change (line 353).
20. `scaling-compare` "Cost per 1,000 req/s" counts booting/dead nodes as capacity (line 265).

**Data/maintenance**
21. `recall-cards` persists known-ness by card index, so reordering `data/recall.ts` remaps saved progress.
22. `base62` scramble wraps ids ≥ 62⁷ (`id % SPACE_7`), a collision hazard outside the lesson's range but inside the input's 15-digit limit.

Verified correct (no action): IP-hash 2/2/1/1 spread; shard-move 75% / 75% / 0% / 18%; nines table; estimator chat and URL presets against the lesson answers; base-62 `4C92` and capacity rows; sync/async timeline geometry; all dg-* classes present in CSS; every architecture node has mapped lessons.
