# Simulation spec: `distributed-lock`

## 1. Identity

- Registry name `distributed-lock`; files `components/diagrams/interactive/distributed-lock.tsx` and `_distributed-lock-sim.ts` (scripted step machine like `_idempotency-flow.ts`, with a simulated clock).
- Embedded by `content/lessons/distributed-locks.mdx` directly after the sequence diagram in "A lock in one Redis command" (`<Interactive name="distributed-lock" />`).
- Kicker **"Break it"**. Title **"A lock with a TTL"**. Hint: "Two workers race for a Redis-style lock. Pause the holder past the TTL, see the double write, then turn on fencing."

## 2. Learning objective

The learner can explain why a lock with an expiry is a lease, show how a paused holder causes two writers, distinguish what compare-and-delete protects (the release) from what a fencing token protects (the write), and name the fencing check as the resource's job.

## 3. Initial state

Lock service (one node) with key `lock:video:4821` free; TTL 10 s; token counter 0; Worker A and Worker B idle; Storage shows "last write: none; highest token seen: 0"; Fencing **off**; Release **Compare-and-delete**; simulated clock at 0, paused.

## 4. User controls

| Control | Type | Options / range | Default | Effect |
| --- | --- | --- | --- | --- |
| Acquire (A / B) | `Button` per worker | — | — | `SET lock <token> NX PX ttl`; succeeds only if the key is absent; the token is the next counter value |
| Do work (A / B) | `Button` per worker, enabled while holding | — | — | 3 s of work, then one write to Storage carrying the worker's token, then release |
| Pause holder 15 s | `Button`, enabled while a worker holds | — | — | Freezes that worker (no code runs); the clock and the lock's TTL keep running |
| TTL | `RangeField` | 5–30 s, step 5 | 10 | Expiry applied on acquire |
| Fencing | `SegmentedControl` | Off · On | Off | Whether Storage rejects writes whose token is below the highest it has seen |
| Release | `SegmentedControl` | Compare-and-delete · Plain DEL | Compare-and-delete | How a worker releases |
| Run / Pause clock, Reset | `Button` | — | — | Clock control; §9 |

## 5. State model and transitions

- **Acquire.** If the key is absent, set `holder = worker`, `token = ++counter`, `expiresAt = now + TTL`; the worker records its token. Otherwise the acquire fails ("locked by A, 7 s left").
- **Expiry.** When `now ≥ expiresAt` the key is deleted whether or not the holder is paused or still working.
- **Do work.** The worker runs for 3 s (frozen if paused), then **writes** to Storage: if Fencing is On and the worker's token is below `highestTokenSeen`, Storage **rejects** (counter "rejected writes"); otherwise Storage accepts, sets `lastWriteBy`, raises `highestTokenSeen`, and if a different worker wrote within the last 10 s without an intervening acquire, counts a **double write**. Then the worker **releases**: Compare-and-delete deletes the key only if its stored token equals the worker's; Plain DEL deletes whatever key exists (counting a **wrong release** if the key belonged to another worker).
- **Pause.** The worker's timers stop; on resume it continues exactly where it was (mid-work, or about to write), still believing it holds the lock.
- **Scripted scenario button** "Replay the classic failure" runs: A acquires → A starts work → Pause A 15 s → B acquires at expiry → B works and writes → A resumes and writes.

## 6. Visual representation

- Stage: three columns. Workers A and B as cards with state chips (idle / holding / working / paused / writing), the token they hold and a work progress bar. The lock card in the middle with the key name, current holder, token and a shrinking TTL bar (`dg-line--accent` → `dg-line--bad`). Storage card on the right with "last write by", "highest token seen" and a stamp "REJECTED" when fencing refuses. Arrows for SET / write / DEL as short `dg-flow` lines.
- Stats (`StatGrid`): Double writes · Rejected writes · Wrong releases · Lock expiries under a live holder.
- Note (aria-live): "A holds token 1; the key expires in 10 s." / "A is paused; the lock expired at 10 s; B acquired token 2." / "A resumed and wrote with token 1: double write. Nothing checked the token." / "Fencing on: Storage saw token 2 already and rejected A's write with token 1." / "Plain DEL: A deleted B's lock. A third worker could now acquire."
- `EventLog` "Lock events" (last 12).

## 7. Expected output

| Setting | Observation |
| --- | --- |
| Classic failure, Fencing Off | Double write counted; compare-and-delete release by A does nothing (token mismatch) |
| Classic failure, Fencing On | A's late write rejected; B's write stands; no double write |
| Classic failure, Plain DEL | A's late release deletes B's lock while B is still working ("wrong release"); the next Acquire succeeds for either worker |
| TTL 30 s, Pause 15 s | No expiry during the pause; A completes; no failure (the note says the TTL only moves the problem to a longer pause) |
| B Acquire while A holds | "locked by A, 6 s left" |

## 8. Edge cases

- Pause with nobody holding: disabled.
- Reset mid-pause: allowed; everything returns to §3.
- Fencing switched On after the double write already happened: applies to later writes only; the note says so.
- The sim models one lock node; a Callout-style note in the frame says "Redlock and consensus locks change who issues the token, not whether the resource must check it."

## 9. Reset and reduced motion

Reset restores §3 and keeps TTL, Fencing and Release settings. Reduced motion: no arrow animation; the clock advances via an **"Advance 1 s"** button; progress bars update in steps.

## 10. Companion events

- Once, first double write: `{ type: "diagram", mood: "confused", message: "Two workers wrote under one lock. The TTL ran out while the holder was paused." }`
- Once, first rejected write with fencing on: `{ type: "diagram", mood: "happy", message: "The storage refused the stale token. That is fencing, and it had to happen there." }`

## 11. Concept explanation

A lock with an expiry is a lease: the expiry protects against a crashed holder but not against a slow one, because a paused process cannot see that its lease has run out. Compare-and-delete makes the release safe, so a late holder cannot delete someone else's lock; only a fencing token checked by the resource makes the write safe, by rejecting any write carrying a token older than one it has already accepted.

## 12. Accessibility

Stage `role="img"` with a one-line state summary; every action is a real button with a disabled state and a label naming the worker; the single `aria-live` note carries each state change.
