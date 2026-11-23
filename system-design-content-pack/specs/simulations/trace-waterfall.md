# Simulation spec: `trace-waterfall`

## 1. Identity

- Registry name: `trace-waterfall`. Files: `components/diagrams/interactive/trace-waterfall.tsx`; the trace generator and critical-path arithmetic in `_trace-waterfall-sim.ts`.
- Embedded by `content/lessons/tracing.mdx` directly under the "Reading a waterfall" section (`<Interactive name="trace-waterfall" />`) once implemented; the lesson's text waterfall stays as the fallback and is not removed.
- Kicker **"Read it"**. Title **"Trace waterfall"**. Hint: "One request fans out across four services. Find where the time went, apply the fix, and watch the critical path shrink."

## 2. Learning objective

The learner can read a waterfall as a tree of spans on one time axis, recognise the three common shapes (the N+1 staircase, serial calls that could run in parallel, and self time with no child span) and explain why the span with the most self time, not the widest bar, is where the time is spent. They can also say what head- and tail-based sampling keep.

## 3. Initial state

- Scenario **N+1 staircase**: `GET /orders/42` at the gateway (root, `SERVER`), a `verify token` child (20 ms), a `CLIENT` call to the order service whose `SERVER` span runs `select order` (25 ms) followed by thirty serial `select item` spans (12 ms each), then a `payment status` `CLIENT` call (50 ms), then `render` (15 ms). Total about 480 ms. Durations carry ±10% seeded jitter so the trace looks real.
- No fix applied. Sampling panel at **Head 100%** over a simulated 1,000 requests of which 10 fail and 20 are slow.

## 4. User controls

| Control | Type | Options / range | Default | Effect |
| --- | --- | --- | --- | --- |
| Scenario | `SegmentedControl` | N+1 staircase · Serial calls · Hidden gap · Healthy | N+1 staircase | Loads a different generated trace (§5) |
| Apply fix / Undo fix | `Button` | — | not applied | Batches the staircase into one query, runs the serial calls in parallel, or adds the missing `wait for connection` span |
| Sampling | `SegmentedControl` | Head 100% · Head 10% · Tail: errors and slow | Head 100% | Changes which of the 1,000 simulated traces are kept (§5) |
| Replay | `Button` | — | — | Re-rolls the jitter with the next seed |
| Reset | `Button` | — | — | §9 |

Hovering or focusing a bar shows its service, kind, duration, self time and attributes in a details panel.

## 5. State model and transitions

A trace is a list of spans `{ id, parentId, name, service, kind, start, end }`. The generator builds one per scenario:

- **N+1 staircase:** as §3. Fix: the thirty item spans become one `select items where id in (…)` span of 15 ms.
- **Serial calls:** the order service calls inventory (60 ms), pricing (50 ms) and recommendations (70 ms) one after another though none depends on another. Fix: the three start at the same time; the parent shrinks to the longest.
- **Hidden gap:** the order service span lasts 300 ms but its children sum to 120 ms. Fix: an `acquire connection` `INTERNAL` span of 180 ms appears, showing the pool wait.
- **Healthy:** a 90 ms trace with no pattern; the fix button is disabled.

Derived per render: **self time** of a span = its duration minus the union of its children's intervals; the **critical path** = the chain from root to leaf that determines the root's end, found by walking from the root to the child that ends last. The sampling panel does not use the trace; it simulates 1,000 request outcomes (1% error, 2% slow) and applies the chosen policy: head 100% keeps all, head 10% keeps a deterministic tenth regardless of outcome, tail keeps every error, every slow trace and 1% of the rest.

Randomness (jitter and the sampled set) uses seeded `mulberry32`; Replay advances the seed.

## 6. Visual representation

- **Stage (SVG, `viewBox 0 0 760 360`):** a time axis in milliseconds across the top; one row per span, indented 14 px per depth, with a `dg-box` bar from start to end; critical-path bars are `dg-box--accent`; self time inside a parent is hatched (`dg-box--ghost`); after a fix the removed bars fade and the new one slides in. For the staircase the thirty rows are grouped into one row labelled "30 × select item" with a chevron that expands them, so the stage keeps a readable height.
- **Stats (plain grid):** Total duration · Spans · Critical path (ms) · Largest self time (span name, ms) · Traces kept out of 1,000 (and how many of the 10 errors).
- **Note (aria-live):** N+1: "Thirty identical short spans under one parent: one query per item. Batch them."; after the fix: "One query, 15 ms. The trace went from 480 ms to about 150."; serial: "These three calls do not depend on each other, but each starts when the previous one ends."; hidden gap: "180 ms of this span has no child. The service was waiting, here for a connection."; healthy: "Nothing to fix: the critical path is the real work."; sampling: "Head 10% kept 100 traces and about 1 of the 10 errors; tail kept all 10 errors and all 20 slow traces."
- No `EventLog`; the details panel plays that role.

## 7. Expected output

| Setting | What the learner sees |
| --- | --- |
| N+1 staircase, fix | Total falls from about 480 ms to about 150 ms; the critical path now runs through `payment status` |
| Serial calls, fix | The parent shrinks from 180 ms to 70 ms; three bars start on the same vertical line |
| Hidden gap | The widest bar has little self time elsewhere; the hatched region is the finding; the fix names it |
| Healthy | The critical path is highlighted but every span has small self time |
| Sampling Head 10% | 100 traces kept, 0–2 of the 10 errors: the rare error is usually missing |
| Sampling Tail | 10 errors + 20 slow + about 10 others kept: 40 traces that are the ones worth reading |

## 8. Edge cases

- Applying a fix twice toggles it off (the button reads "Undo fix").
- Replay changes jitter but never the shape, so the lesson's numbers stay roughly true.
- Very narrow spans (under 2 ms) are drawn with a 2 px minimum width so they remain focusable.

## 9. Reset and reduced motion

- Reset restores the N+1 scenario, no fix, Head 100%, seed 1.
- Reduced motion: bars are drawn in their final positions with no slide or fade. There is no running loop.

## 10. Companion events

- Once, on applying the N+1 fix: `{ type: "diagram", mood: "happy", message: "Thirty tiny queries became one. The staircase collapsed." }`
- Once, on selecting Hidden gap: `{ type: "diagram", mood: "thinking", message: "No child span covers this time. The wait is inside the parent." }`

## 11. Concept explanation

A waterfall lays one request's spans on a shared time axis, indented by depth, so the shape of the tree shows where time went. A staircase of identical short spans is a loop of queries that should be one batch; children that start only when their sibling ends are serial work that could be parallel; time inside a parent that no child covers is waiting, for a connection, a lock or a garbage collector. The span to fix is the one with the most self time on the critical path, which is rarely the widest bar.

## 12. Accessibility

- Stage `role="img"` with an `aria-label` giving the total, the span count and the largest self-time span; each bar is a focusable element with an accessible name "span name, start to end, N ms"; the note is `aria-live="polite"`; the sampling result is also written as text in the stats.
