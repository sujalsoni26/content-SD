# Simulation spec: `quorum-reads-writes`

## 1. Identity

- Registry name `quorum-reads-writes`; files `components/diagrams/interactive/quorum-reads-writes.tsx` and `_quorum-sim.ts` (reducer with a seeded `mulberry32`, as `_lb-sim-engine.ts`).
- Embedded by `content/lessons/quorums.mdx` directly after the "N, W and R" section's table (`<Interactive name="quorum-reads-writes" />`); reusable in `design-key-value-store`.
- Kicker **"Try it"**. Title **"Quorum reads and writes"**. Hint: "Set N, W and R, then write and read while a replica lags or is down. Watch when a read misses the newest version."

## 2. Learning objective

The learner can predict, for a given N, W and R, whether a read is guaranteed to overlap the latest acknowledged write, and can show two ways a successful quorum read still returns stale data (sloppy quorum, partially failed write).

## 3. Initial state

N = 3 home replicas (R1–R3) each holding key `cart` at version 1; W = 2, R = 2; every replica healthy with a seeded per-request latency of 20–120 ms; sloppy quorum **off**; two stand-in nodes (X1, X2) shown greyed out; counters zero; event log empty. The first render shows "R + W = 4 > N = 3: the sets must overlap".

## 4. User controls

| Control | Type | Options / range | Default | Effect |
| --- | --- | --- | --- | --- |
| N | `SegmentedControl` | 3 · 5 | 3 | Number of home replicas (resets versions) |
| W | `RangeField` | 1–N, step 1 | 2 | Acknowledgements a write needs within the 1 s timeout |
| R | `RangeField` | 1–N, step 1 | 2 | Replicas a read waits for |
| Replica card | click | Healthy → Slow → Down → Healthy | Healthy | Slow answers after 2–4 s; Down never answers |
| Sloppy quorum | `SegmentedControl` | Strict · Sloppy (hinted handoff) | Strict | Whether stand-in nodes may acknowledge |
| Write | `Button` | — | — | Writes version +1 to all home replicas |
| Read | `Button` | — | — | Reads from the R fastest healthy home replicas |
| Heal all | `Button` | — | — | Every replica Healthy; stand-ins hand their hints to the owners |
| Reset | `Button` | — | — | §9 |

## 5. State model and transitions

- **Write.** Increment the global version counter v, send `put(cart, v)` to every home replica. Healthy replicas acknowledge after their latency; Slow after 2–4 s; Down never. When W acknowledgements arrive within 1 s the write is **confirmed** (`latestConfirmed = v`). If not and the quorum is Strict, the write **fails** (replicas that stored v keep it; the log says so). If Sloppy, the coordinator sends the value to stand-ins until W is reached; each stand-in stores it with a hint naming the missing owner.
- **Read.** Choose R home replicas at random among those that are not Down (if fewer than R exist, the read fails in Strict mode or includes stand-ins in Sloppy mode); return the highest version among the answers; the read is **stale** if that version is below `latestConfirmed` and **in doubt** if it is above (a failed write that landed). Read repair: send the highest version to the queried replicas that lacked it.
- **Heal.** Down and Slow replicas become Healthy; each stand-in delivers hinted values to their owners, then empties.
- Overlap indicator recomputed on every N/W/R change: `R + W > N` → "overlap guaranteed"; otherwise "stale reads possible by design".

## 6. Visual representation

- Stage: a row of replica cards (`dg-box`, `dg-box--store`), each with name, state chip (Healthy/Slow/Down), version badge ("v3") and a small latency bar; two stand-in cards (`dg-box--ghost`) that light up only when they hold a hint; a coordinator box above with animated request/ack dots (`dg-flow` while in flight; none under reduced motion).
- Stats (`StatGrid`): Latest confirmed write · Last read returned · Stale reads · Failed writes.
- Note (aria-live): "Write v4 confirmed by R1, R2 (W = 2) in 140 ms; R3 is slow and still holds v3." / "Read returned v3 from R2, R3: STALE. R3 never got v4 and R2 was healed from a stand-in whose hint has not arrived." / "R + W = 2 is not above N = 3; a read can miss the latest write even when everything is healthy."
- `EventLog` "Quorum events" (last 12), one line per request and acknowledgement.

## 7. Expected output

| Setting | Observation |
| --- | --- |
| Defaults, all healthy | Every read fresh; the slowest acknowledgement is ignored once W is reached |
| W = 1, R = 1 | Reads are stale about one time in three right after a write |
| One replica Down, W = 2, R = 2 | Writes still confirm; reads stay fresh because the Down node is never read |
| Two replicas Down, Strict | Write fails ("1 of 2 needed"); the surviving replica keeps the new version, so a later read may return a version newer than any confirmed write (in doubt) |
| Two Down, Sloppy, then Heal before Read | Write confirms through a stand-in; a read immediately after Heal can be stale if it reaches an owner whose hint has not yet been delivered (the sim delivers hints 500 ms after Heal) |
| N = 5, W = 3, R = 3 | Same overlap rule; one more node may fail |

## 8. Edge cases

- W or R above N is impossible by construction (sliders clamp on N change).
- Rapid repeated Writes queue versions; each gets its own acknowledgement set.
- A Read while a Write is in flight can return either version; the note says "read overlapped the write; quorum reads are not linearizable" (links the lesson's point).

## 9. Reset and reduced motion

Reset restores §3 and keeps N/W/R and the sloppy setting. Reduced motion: no dot animation, acknowledgements land at once with their latencies written in the log; loop paused off-screen (`useLoopActive`).

## 10. Companion events

- Once, first stale read: `{ type: "diagram", mood: "confused", message: "The read missed the newest write. Overlap was lost, or the write never reached a quorum." }`
- Once, first fresh read with a Down or Slow replica present: `{ type: "diagram", mood: "happy", message: "Overlap held: one of the replicas you read had the latest version." }`

## 11. Concept explanation

A quorum write is confirmed by W of N replicas and a read waits for R. If R + W exceeds N, any read set and any write set share at least one replica, so a read meets the latest acknowledged write. The guarantee is only overlap: a write that reached fewer than W nodes is reported failed but stays on the nodes that stored it, a sloppy quorum lets stand-in nodes acknowledge so the sets stop overlapping until hinted handoff finishes, and two concurrent writes produce versions that overlap cannot order.

## 12. Accessibility

Stage `role="img"` with a state summary; one `aria-live` note; replica cards are buttons with `aria-pressed` for their state; state is encoded by chips and text, not colour alone.
