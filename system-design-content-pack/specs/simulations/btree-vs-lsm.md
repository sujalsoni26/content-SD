# Simulation spec: `btree-vs-lsm`

## 1. Identity

- Registry name: `btree-vs-lsm`. Files: `components/diagrams/interactive/btree-vs-lsm.tsx`, pure logic in `_btree-vs-lsm-sim.ts` (reducer + seeded PRNG, as `_token-bucket-sim.ts` does).
- Embedded by `content/lessons/btree-vs-lsm.mdx` directly under the "Amplification: the three numbers" section (`<Interactive name="btree-vs-lsm" />`), once the widget exists. Until then the lesson has no reference to it (the validator rejects unregistered names).
- Kicker **"Compare"**. Title **"B-tree vs LSM tree"**. Hint: "Send the same writes and reads to both engines and watch what each costs in page writes, file reads and disk space."

## 2. Learning objective

The learner can explain write, read and space amplification as three numbers that any engine trades against each other, say why a B-tree pays on writes and an LSM tree pays in compaction and in files per read, and recognise compaction debt (a write stall) when compaction falls behind.

## 3. Initial state

- 10,000 live keys, key space 0–99,999, 80-byte rows. Simulated clock at 0.0 s. Run paused.
- **B-tree model:** 8 kB pages holding 100 rows each, three levels; internal pages always in the buffer pool; the pool holds 20% of leaf pages. A checkpoint every 5 s writes every dirty page.
- **LSM model:** memtable of 1,000 rows; level sizes L1 = 10 files, L2 = 100, L3 = 1,000 (ratio 10, 1,000 rows per file); leveled compaction; bloom filters on at 10 bits per key (1% false positives); compaction budget 2 file rewrites per tick ("disk speed" 2).
- Workload **Write-heavy** (90% writes), key distribution **Uniform**, 1,000 operations per second.

## 4. User controls

| Control | Type | Options / range | Default | Effect |
| --- | --- | --- | --- | --- |
| Workload | `SegmentedControl` | Write-heavy 90/10 · Mixed 50/50 · Read-heavy 10/90 | Write-heavy | Share of writes versus point reads |
| Keys | `SegmentedControl` | Uniform · Skewed (hot 10%) · Sequential | Uniform | Which keys the operations touch |
| Compaction | `SegmentedControl` | Leveled · Size-tiered | Leveled | The LSM merge policy (§5) |
| Bloom filters | `SegmentedControl` | On · Off | On | Whether LSM reads can skip files that cannot hold the key |
| Disk speed | `RangeField` | 1–10 file rewrites per tick, step 1 | 2 | Compaction and checkpoint bandwidth |
| Run / Pause, Step 1 s, Reset | `Button` | — | paused | Clock control; Reset per §9 |

## 5. State model and transitions

Tick = 0.1 s; `ops = 100` per tick, split by the workload. Keys are drawn uniformly, from a Zipf-like distribution with 10% of keys taking 90% of operations, or as an increasing sequence.

**B-tree per write:** locate the leaf (internal pages cached, so no I/O), read the leaf page if it is not in the pool (uniform: 20% hit; skewed: 90%; sequential: 100% because the right-most leaf stays hot), mark it dirty, and if it reaches 100 rows split it into two half-full pages (sequential inserts split only the right-most leaf). Dirty pages are written on eviction (pool full) or at the checkpoint. Bytes written are counted per 8 kB page written plus 80 bytes of log per row. **Per read:** one leaf page read unless cached. Write amplification = bytes written to pages and log ÷ bytes of rows written; read amplification = page reads per lookup.

**LSM per write:** append 80 bytes to the log and the memtable. When the memtable holds 1,000 rows it is frozen and flushed as one L0 file (one file write). **Leveled:** when L0 holds 4 files, merge them into L1, rewriting every overlapping L1 file; when a level exceeds its target, move one file down, rewriting the ~10 overlapping files beneath it. **Size-tiered:** when four files of similar size exist in a tier, merge them into one file four times larger in the next tier; older copies of a key survive in lower tiers until a merge reaches them. Each file rewrite consumes one unit of disk speed per tick; outstanding work queues. When L0 holds 20 files, writes are halved (**slowdown**); at 36 they stop (**stall**) until L0 drains (RocksDB's `level0_slowdown_writes_trigger` and `level0_stop_writes_trigger` defaults). **Per read:** check the memtable, then every L0 file newest first, then one file per level whose key range covers the key. With bloom filters, a file that does not hold the key costs a read only 1% of the time; without, every candidate file is read. Read amplification = files actually read per lookup. Space amplification = bytes on disk ÷ bytes of live rows (older versions and tombstones count as dead).

Randomness uses seeded `mulberry32` so Replay reproduces a run. A run never ends.

## 6. Visual representation

- **Stage (SVG, `viewBox 0 0 760 320`), two panels.** Left, the B-tree: a root, an internal row and a leaf row of 20 representative leaf boxes (`dg-box`); dirty leaves turn `dg-box--accent`, cached leaves have a solid border and uncached a dashed one, a split draws a new box sliding in, and the checkpoint flashes every dirty leaf and writes a count. Right, the LSM tree: a memtable bar filling upward, L0 as a stack of small boxes, L1–L3 as rows whose box count scales with the level, a compaction drawn as an arrow from the moving file to the files it rewrites, and a `dg-box--bad` banner reading "write stall" when L0 reaches the stop trigger.
- **Stats (plain grid):** Write amplification B-tree · Write amplification LSM · Read amplification B-tree (pages) · Read amplification LSM (files) · Space amplification LSM · L0 files.
- **Note (aria-live):** uniform write-heavy: "Each 80-byte row dirties an 8 kB page; the checkpoint just wrote N pages for M rows."; after the first compaction: "Moving one file down rewrote K files beneath it: that is leveled compaction's write amplification."; size-tiered: "Fewer rewrites, but the same key now lives in up to T files."; bloom filters off: "Every file in the way is a disk read: R files per lookup."; stall: "Compaction fell behind. L0 has 36 files and writes have stopped."
- **EventLog** "Engine events" (last 20): "t=1.0 memtable flushed to L0 (4 files)", "t=1.1 compaction L0 to L1 rewrote 11 files", "t=5.0 checkpoint wrote 312 pages", "t=7.3 write stall: 36 files in L0".

## 7. Expected output

| Setting | What the learner sees |
| --- | --- |
| Write-heavy, Uniform, Leveled | B-tree write amplification in the tens (whole pages per row); LSM near 1 until the first flush, then rising towards 10 per level as files move down |
| Write-heavy, Sequential | B-tree write amplification falls sharply (only the right-most leaf is dirty); the LSM side is unchanged |
| Write-heavy, Skewed | B-tree write amplification falls (the hot leaves stay in the pool and absorb many rows per page write): a hot working set is where B-trees shine |
| Read-heavy, Bloom on vs off | LSM read amplification about 1–2 files with filters, 5 or more without; B-tree stays at 1–3 pages |
| Size-tiered vs Leveled | Size-tiered: lower write amplification, space amplification 1.5–2×, more files per read; Leveled: the reverse |
| Disk speed 1, Write-heavy | L0 piles up, slowdown at 20 files, stall at 36: compaction debt made visible |

## 8. Edge cases

- Read-heavy with Sequential keys: the LSM never compacts and the note says so ("Nothing to compact: no writes").
- Disk speed 10: compaction keeps up at every workload; the note points out that the amplification numbers are unchanged, only the stall disappears, because amplification is a property of the policy and the stall a property of bandwidth.
- Switching compaction policy mid-run applies to the next merge; existing files are kept so the two policies can be compared on the same history.

## 9. Reset and reduced motion

- Reset restores §3 and keeps the chosen controls.
- Reduced motion: no auto-run; the **Step 1 s** button applies ten ticks and redraws without transitions. The loop pauses off-screen or in a hidden tab (`useLoopActive`).

## 10. Companion events

- Once, on the first write stall: `{ type: "diagram", mood: "confused", message: "Compaction fell behind and the LSM tree stopped taking writes. That is compaction debt." }`
- Once, when bloom filters are switched off and LSM read amplification at least doubles: `{ type: "diagram", mood: "thinking", message: "Without bloom filters, every file in the way is a disk read." }`

## 11. Concept explanation

A B-tree changes rows in place, so each small write dirties a whole page and the engine eventually writes that page back, scattered across the disk; it pays on writes and reads stay predictable. An LSM tree appends to a memtable and flushes sorted files, so writes are sequential and cheap at first, but files pile up and compaction rewrites data to keep reads from visiting every file. Leveled compaction keeps few files per key and rewrites more; size-tiered rewrites less and keeps duplicates. Bloom filters let a read skip files that cannot hold the key. When writes outrun compaction, the tree stalls at the moment of peak load.

## 12. Accessibility

- Stage `role="img"` with an `aria-label` that summarises both engines' current amplification numbers; the note is `aria-live="polite"`; every control is a native button or input reachable by keyboard; the event log is a list.
