# Simulation spec: `kafka-partitions`

## 1. Identity

- Registry name `kafka-partitions`; files `components/diagrams/interactive/kafka-partitions.tsx` and `_kafka-partitions-sim.ts` (reducer with a seeded `mulberry32`; a simulated clock stepped per frame, as `_lb-sim-engine.ts`).
- Embedded by `content/lessons/partitions-consumer-groups.mdx` directly after the "Consumer groups" flowchart (`<Interactive name="kafka-partitions" />`); reusable in `design-notification-system` and `design-instagram` where fan-out or hot keys are discussed.
- Kicker **"Simulate"**. Title **"Partitions and consumer groups"**. Hint: "Produce keyed records into a topic, add and remove consumers, and watch assignment, per-key order, lag and a hot key."

## 2. Learning objective

The learner can explain that a partition is the unit of both ordering and parallelism: records with one key stay in order inside one partition, a group gives each partition exactly one owner, consumers beyond the partition count idle, lag shows where a group falls behind, and one hot key saturates one partition that extra consumers cannot help.

## 3. Initial state

Topic `orders` with 4 partitions (P0–P3), each holding 6 records; one consumer group `billing` with 2 consumers (C1 owns P0 and P1, C2 owns P2 and P3), each processing 2 records/s per owned partition; producer paused; key distribution **Even** across 8 keys (order ids); a second group `analytics` with 1 consumer shown read-only. Lag per partition 0. Log empty.

## 4. User controls

| Control | Type | Options / range | Default | Effect |
| --- | --- | --- | --- | --- |
| Produce | `SegmentedControl` | Paused · 4 rec/s · 12 rec/s · Burst of 40 | Paused | Records arrive with keys drawn from the key distribution; partition = hash(key) mod 4 |
| Key distribution | `SegmentedControl` | Even (8 keys) · Hot key (one key 60%) · No key (round robin) | Even | Which keys records carry |
| Consumers in `billing` | − / + `Button`s | 1–6 | 2 | Join or leave triggers a rebalance (§5) |
| Rebalance protocol | `SegmentedControl` | Eager (stop the world) · Cooperative | Eager | How partitions move during a rebalance |
| Add partition | `Button` | 4 → 5 (once) | — | Adds P4; shows which keys now map elsewhere |
| Run / Pause clock, Reset | `Button` | — | — | §9 |

## 5. State model and transitions

- **Produce.** Each new record gets the next offset in its partition; with a key, partition = `hash(key) mod partitionCount` (a fixed table shown in the UI); with no key, round-robin. Each record shows its key and a sequence number within that key so order violations are visible.
- **Assignment.** Partitions are assigned to consumers in the group range-style (sorted partitions split as evenly as possible over sorted consumers). Each partition has exactly one owner; a consumer may own several; consumers beyond the partition count own none and are marked idle.
- **Consumption.** Each consumer processes 2 records/s per owned partition in offset order and advances that partition's committed offset. Lag per partition = log end offset − committed offset.
- **Rebalance.** On join/leave: Eager — every consumer stops, all assignments are released for 1.5 s (simulated), then reassigned; Cooperative — only partitions that change owner are revoked (for 1.5 s), the rest keep consuming. The log records "rebalance: eager, 4 partitions paused" or "rebalance: cooperative, 1 partition moved".
- **Hot key.** With one key receiving 60% of records, its partition's lag grows while others stay near zero; adding consumers beyond the point where that partition already has a dedicated owner changes nothing, which the note states.
- **Add partition.** Partition count becomes 5; the key→partition table is recomputed; keys whose partition changed are highlighted and the log records "key 7 moved from P3 to P4: order across the change is not guaranteed".

## 6. Visual representation

- Stage: four (or five) partition lanes drawn as horizontal strips (`dg-box--store`) with record boxes labelled `k7#3` (key 7, third record of key 7); a committed-offset marker per lane (`dg-line--good`) and the unread tail shaded; consumer cards below with the partitions they own as chips; idle consumers greyed (`dg-box--ghost`); the `analytics` group as a single card consuming all four lanes independently with its own markers. A small key→partition table on the right.
- Stats (plain grid, changes every tick): Max lag (partition) · Total lag · Active consumers / total · Records per second in · Order violations (should stay 0 within a key unless a partition was added).
- Note (aria-live): "4 partitions, 6 consumers: 2 idle, because a partition has exactly one owner per group." / "P2 lag 38 and rising: key 7 is 60% of traffic. Adding consumers cannot help; change the key or add a partition." / "Eager rebalance: all consumption paused for 1.5 s." / "Cooperative rebalance: only P3 moved; the others kept consuming." / "Partition added: keys 2 and 7 now hash to P4; their older records are still in P3."
- `EventLog` "Group events" (last 12).

## 7. Expected output

| Setting | Observation |
| --- | --- |
| Even keys, 2 consumers, 4 rec/s | Lag stays near 0; each key's records appear in sequence within one lane |
| 12 rec/s, 2 consumers | Lag grows evenly; adding a third and fourth consumer stops the growth; a fifth idles |
| Hot key | One lane's lag climbs; the others are near zero; "Add consumer" has no effect on it |
| Eager vs Cooperative rebalance with 12 rec/s | Eager shows every lane's lag jump during the pause; Cooperative shows only the moved lane pausing |
| Add partition with Hot key | The hot key may now land in P4 (if the hash says so), splitting the key's history across two lanes; the order-violation counter increases only across the change |
| No key | Records spread round-robin; the key column is blank; per-key order is not a concept |

## 8. Edge cases

- Removing the last consumer: all partitions unowned; lag grows; the note says "no consumers in the group".
- Burst of 40 while paused: records queue and appear when the clock runs.
- Add partition is one-shot (4 → 5) to keep the hash table readable; Reset restores 4.
- The simulation models one topic and one hashing function; it does not model `max.poll.interval.ms` or static membership (named in the lesson's DeepDive).

## 9. Reset and reduced motion

Reset restores §3 with a fresh seed and keeps the chosen protocol and key distribution. Reduced motion: records appear in place without sliding; an **"Advance 1 s"** button steps the clock; loop paused off-screen or in a hidden tab.

## 10. Companion events

- Once, the first time a consumer is added while another already idles: `{ type: "diagram", mood: "thinking", message: "A partition has one owner. The sixth consumer has nothing to do." }`
- Once, the first time hot-key lag exceeds 30 while other lanes are below 5: `{ type: "diagram", mood: "confused", message: "One key, one partition, one very full lane. More consumers cannot help; a better key can." }`

## 11. Concept explanation

A record's key chooses its partition, and a partition is read in order by exactly one consumer in a group, so the key is a promise about ordering and the partition count is the ceiling on parallelism. A group rebalances when members join or leave, pausing everything (eager) or only the partitions that move (cooperative). Lag per partition is the health signal: even growth means the group is too slow, growth on one lane means a hot key, and adding partitions later changes which lane a key maps to.

## 12. Accessibility

Stage `role="img"` with a state summary ("4 partitions, 3 of 4 consumers active, max lag 12 on P2"); consumer add/remove are labelled buttons; owners are shown as text chips, not only by colour; the single `aria-live` note carries each state change.
