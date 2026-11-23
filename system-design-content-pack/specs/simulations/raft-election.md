# Simulation spec: `raft-election`

## 1. Identity

- Registry name `raft-election`; files `components/diagrams/interactive/raft-election.tsx` and `_raft-sim.ts` (discrete-event engine like `_circuit-breaker-sim.ts`: an ordered event queue advanced per frame).
- Embedded by `content/lessons/consensus.mdx` after the state diagram and before "Replicating the log" (`<Interactive name="raft-election" />`).
- Kicker **"Simulate"**. Title **"Raft leader election"**. Hint: "Five servers, one leader. Pause the leader, crash a server or cut the network, then watch terms, votes and heartbeats choose a new one."

## 2. Learning objective

The learner can explain why a majority is needed to elect a leader and to commit, why randomised timeouts resolve split votes, and what happens to a leader on the minority side of a partition.

## 3. Initial state

Five servers S1–S5 in a ring; S1 is leader in term 1 with heartbeats every 100 ms (simulated); followers have election timeouts drawn from 300–600 ms (seeded); every log holds three committed entries (index 1–3, term 1), commit index 3. Clock running at 1×; log empty except "Term 1: S1 is leader".

## 4. User controls

| Control | Type | Options | Effect |
| --- | --- | --- | --- |
| Server card | click | opens Pause / Crash / Restore for that server | Pause = stop-the-world (no messages sent or processed, clock keeps running); Crash = state lost except the persisted log and term; Restore = back to follower |
| Partition | `SegmentedControl` | None · S1–S3 vs S4–S5 · S1–S2 vs S3–S5 | Messages across the cut are dropped |
| Client write | `Button` | — | Sends a command to the current leader (or to the server the client believes is leader) |
| Speed | `SegmentedControl` | 1× · Slow (¼) | Simulation speed |
| Run / Pause | `Button` | — | Clock control |
| Reset | `Button` | — | §9 |

## 5. State model and transitions

Per server: `role` (follower, candidate, leader), `term`, `votedFor`, `log[]` (index, term, command), `commitIndex`, `electionDeadline`, `paused`, `crashed`. Rules (from the Raft paper, simplified to one AppendEntries per heartbeat):

1. Leader sends `AppendEntries` (heartbeat or entries) to all others every 100 ms. A follower that receives one from a leader with a term ≥ its own resets its election deadline, adopts the term, appends entries that match (prevLogIndex/prevLogTerm check; on mismatch it rejects and the leader retries one index back), and advances its commit index to the leader's.
2. A follower whose deadline passes becomes candidate: term + 1, votes for itself, sends `RequestVote(term, lastLogIndex, lastLogTerm)` to all. A server grants one vote per term, only if the candidate's log is at least as up to date (last term higher, or equal with index ≥).
3. A candidate with votes from a majority (3 of 5) becomes leader and sends a heartbeat at once. A candidate that sees a higher term, or a heartbeat from a leader of its term, becomes follower. A candidate whose deadline passes starts a new term with a new random deadline.
4. Client write: the leader appends (index n+1, current term), replicates; the entry is **committed** when a majority have stored it; the leader applies and the log shows "committed". A write sent to a non-leader is redirected (the client learns the leader from the reply).
5. Partition: messages between the two groups are dropped. A minority-side leader keeps sending heartbeats and accepting client writes but never commits them. When healed, any server that sees a higher term steps down; a new leader's AppendEntries truncates conflicting uncommitted entries on others.
6. Pause: the server processes nothing while paused; on resume it processes queued messages in order and discovers higher terms. Crash: `votedFor` and `term` persist (as Raft persists them), volatile state resets, deadline redrawn.

## 6. Visual representation

- Stage: five server circles on a ring (`dg-box` with a crown mark for the leader, dashed for candidate, grey `dg-box--ghost` for crashed, a pause glyph for paused), term badge under each, and below each a mini log of boxes labelled by term with a commit-index marker (`dg-line--good`). Vote and heartbeat messages travel as dots along the ring edges (`dg-flow`); dropped messages fade at the partition line, drawn as a dashed `dg-line--bad` cut.
- Stats (plain grid, changes every tick): Current term · Leader · Committed entries · Elections held · Writes rejected (no leader / minority).
- Note (aria-live): "S3's timeout fired first: term 2, votes from S2, S4 → leader." / "Split vote in term 2: S1 and S3 have two votes each; new random timeouts." / "S1 is leader on the minority side: it accepts writes but cannot commit them (needs 3 acknowledgements)." / "Partition healed: S1 saw term 3 and stepped down; its uncommitted entries were overwritten."
- `EventLog` "Raft events" (last 20).

## 7. Expected output

| Action | Observation |
| --- | --- |
| Pause S1 (leader) | Within 300–600 ms one follower times out; a new leader is elected in term 2; when S1 resumes it sees term 2 in the first heartbeat and becomes a follower |
| Crash two followers | Leader continues; writes still commit (3 of 5) |
| Crash three servers | No majority: elections repeat with rising terms, every client write is rejected; the note names "lost majority" |
| Partition S1–S2 vs S3–S5 with S1 leader | S1 keeps leading its side but writes never commit; S3–S5 elect a leader in a higher term and commit; healing demotes S1 and truncates its uncommitted entries |
| Several simultaneous timeouts (Slow speed, lucky seed) | Split vote visible; resolved in the next term by a new random deadline |

## 8. Edge cases

- Pausing a follower changes nothing until it resumes and catches up (the note says so).
- Crashing the only remaining majority member mid-election leaves the cluster leaderless; Restore any server to continue.
- Partition toggled while an election is in flight: in-flight votes across the cut are dropped.
- Messages are never reordered within a pair (FIFO per link) to keep the model readable; the note states this simplification.

## 9. Reset and reduced motion

Reset restores §3 with a new seed per Reset. Reduced motion: message dots are not drawn; an **"Advance 100 ms"** button steps the engine; the loop pauses off-screen and in hidden tabs.

## 10. Companion events

- Once, on the first successful election after the initial leader is lost: `{ type: "diagram", mood: "happy", message: "A new leader won with three of five votes. The term number tells the old one it lost." }`
- Once, on the first rejected write under a lost majority: `{ type: "diagram", mood: "confused", message: "No majority, no commits. Two servers in a cupboard cannot out-vote three." }`

## 11. Concept explanation

Raft divides time into terms, each with at most one leader. A follower that stops hearing heartbeats starts an election with a higher term and wins with a majority of votes, which also guarantees that the winner's log contains every committed entry. Commits need a majority too, so a leader cut off with a minority can accept but never commit, and it steps down when it next hears a higher term; randomised timeouts make split votes rare and short.

## 12. Accessibility

Stage `role="img"` with a summary ("Term 2; S3 is leader; 4 of 5 servers up; commit index 4"); server circles are buttons that open a small menu (`role="menu"`) for Pause/Crash/Restore; roles are shown as text labels, not only shapes.
