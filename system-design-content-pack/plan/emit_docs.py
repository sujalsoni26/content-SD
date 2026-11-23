# Emits CURRICULUM_ROADMAP.md, CONTENT_INDEX.md and CONTENT_STATUS.md from plan/curriculum-plan.json.
import json, os, re, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(os.path.join(ROOT, "plan", "curriculum-plan.json"), encoding="utf-8"))
EM, EL, NM = P["existing_modules"], P["existing_lessons"], P["new_modules"]
ALL_NEW = [(m, l) for m in NM for l in m["lessons"] if not l.get("existing")]
STATUS = json.load(open(os.path.join(ROOT, "plan", "status.json"), encoding="utf-8")) if os.path.exists(os.path.join(ROOT, "plan", "status.json")) else {}
def st(path): return STATUS.get(path, {}).get("status", "planned")
def stnote(path): return STATUS.get(path, {}).get("note", "")
DATE = "2026-11-22"

def code(s): return "`" + s + "`"
def lst(xs, sep=", "): return sep.join(xs) if xs else "—"
def esc(s): return s.replace("|", "\\|")

# ---------------------------------------------------------------- waves
HLD_WAVE_A = {"case-study-method","design-pastebin","design-rate-limiter","design-notification-system","design-file-storage","design-key-value-store","design-instagram"}
LLD_WAVE_A = {"lld-parking-lot","lld-elevator","lld-library-management","lld-movie-ticket-booking","lld-splitwise","lld-chess","lld-snake-and-ladder"}
def wave(m, l):
    if l["priority"] != "P1": return "C"
    if m["id"] in ("distributed","internals","streaming","operations","security","lld"): return "A"
    if m["id"] == "hld": return "A" if l["slug"] in HLD_WAVE_A else "B"
    if m["id"] == "lld-practice": return "A" if l["slug"] in LLD_WAVE_A else "B"
    return "B"  # infrastructure, architecture

# ---------------------------------------------------------------- derived resource plans
checks = collections.OrderedDict()      # check id -> [slugs]
sims, diags, gloss, reuse_sims = collections.OrderedDict(), collections.OrderedDict(), collections.OrderedDict(), collections.OrderedDict()
for m, l in ALL_NEW:
    for r in l["resources"]:
        mm = re.match(r"quiz: (check-[a-z-]+-\d)", r)
        if mm: checks.setdefault(mm.group(1), []).append(l["slug"])
        mm = re.match(r"new sim spec: ([a-z0-9-]+)", r)
        if mm: sims.setdefault(mm.group(1), []).append(l["slug"])
        mm = re.match(r"static diagram spec: ([a-z0-9-]+)", r)
        if mm: diags.setdefault(mm.group(1), []).append(l["slug"])
        mm = re.match(r"reuse sim: ([a-z0-9-]+)", r)
        if mm: reuse_sims.setdefault(mm.group(1), []).append(l["slug"])
        mm = re.match(r"glossary: (.+)", r)
        if mm:
            for t in mm.group(1).split(","):
                t = t.strip()
                if t and "(" not in t: gloss.setdefault(t, l["slug"])
# existing-lesson resources
ex_sims, ex_diags, ex_quiz = [], [], []
for s, d in EL.items():
    for r in d["resources"]:
        mm = re.match(r"new sim spec: ([a-z0-9-]+)", r)
        if mm: sims.setdefault(mm.group(1), []).append(s)
        mm = re.match(r"static diagram spec: ([a-z0-9-]+)", r)
        if mm: diags.setdefault(mm.group(1), []).append(s)
        mm = re.match(r"quiz \+1 \((check-[a-z-]+)\)", r)
        if mm: ex_quiz.append((mm.group(1), s))

order_slugs = [s for m in EM for s in m["lessons"]] + [l["slug"] for _, l in ALL_NEW]
pos = {s: i for i, s in enumerate(order_slugs)}
check_after = {cid: max(sl, key=lambda s: pos[s]) for cid, sl in checks.items()}
check_module = {}
for m, l in ALL_NEW:
    for r in l["resources"]:
        mm = re.match(r"quiz: (check-[a-z-]+-\d)", r)
        if mm: check_module[mm.group(1)] = m["id"]

# ---------------------------------------------------------------- stats
lv_before = collections.Counter(d["level"] for d in EL.values())
lv_after = collections.Counter((d["reclassify"] or d["level"]) for d in EL.values())
for _, l in ALL_NEW: lv_after[l["level"]] += 1
pri = collections.Counter(l["priority"] for _, l in ALL_NEW)
waves = collections.Counter(wave(m, l) for m, l in ALL_NEW)
new_minutes = sum(l["minutes"] for _, l in ALL_NEW)
ex_minutes = sum(d["minutes"] for d in EL.values())
status_counts = collections.Counter(d["status"] for d in EL.values())

# ================================================================ CURRICULUM_ROADMAP.md
R = []
A = R.append
A("# Curriculum Roadmap — Box by Box (System Design)")
A("")
A(f"Date: {DATE} · Repository `sujalsoni26/box-by-box-system-design` @ `e508232` · Phase 1 deliverable. Companion files: `CONTENT_INDEX.md` (every deliverable and its path), `CONTENT_STATUS.md` (progress), `plan/curriculum-plan.json` (machine-readable source of this document; `plan/build_plan.py` regenerates it and checks slugs and prerequisites).")
A("")
A("## 1. Decisions this roadmap rests on")
A("")
A("1. **New modules, not stuffing the existing six.** Confirmed by the project owner after Phase 0. The six core modules keep their ids, order, slugs and lesson order; ten new modules are appended (§3). This requires the `ModuleId` union in `types/curriculum.ts` to be extended, which is an application change; the exact edit is in §3.3 and in `recommendations/APP_CHANGES.md`.")
A("2. **Approved application changes (2026-11-22):** `ModuleId` extension; recall deck ids `advanced`, `hld`, `lld`; Mermaid `classDiagram` in the validator (minimal change, `erDiagram` not included). All three are delivered as drop-in files in the pack. Not requested: `ConceptCard` in the validator, glossary/practice links, a concept glossary; content uses the fallbacks (Callouts for term cards, SQL blocks for data models, prose mentions instead of glossary links).")
A("3. **Quality over quantity, in waves.** The brief's coverage lists and its 12 HLD and 14 LLD problems imply about a hundred new lessons. They are planned here in full so the structure is coherent, but delivered in three waves (§10) so the most valuable material lands first and nothing is shipped half-written to hit a count.")
A("4. **Existing lessons are improved only where Phase 0 found a reason.** 42 lessons: " + ", ".join(f"{k} {v}" for k, v in sorted(status_counts.items())) + " (§5). Two are reclassified.")
A("5. **The `url-shortener` case study moves into module 14** (owner decision after Phase 1), keeping its slug so saved progress survives. Module 6 keeps `playbook` as the method introduction with a cross-reference; `check-url-shortener` moves to module `hld` with it. Nothing is duplicated.")
A("")
A("## 2. Summary")
A("")
A("| Measure | Today | After this roadmap |")
A("| --- | --- | --- |")
A(f"| Modules | 6 | 16 |")
A(f"| Lessons | 42 | {42 + len(ALL_NEW)} (42 existing + {len(ALL_NEW)} new) |")
A(f"| Level mix | basic {lv_before['basic']} · intermediate {lv_before['intermediate']} · advanced {lv_before['advanced']} | basic {lv_after['basic']} · intermediate {lv_after['intermediate']} · advanced {lv_after['advanced']} |")
A(f"| Reading time | {ex_minutes} min (≈ {round(ex_minutes/60)} h) | {ex_minutes + new_minutes} min (≈ {round((ex_minutes+new_minutes)/60)} h) |")
A(f"| HLD case studies | 1 | {1 + sum(1 for m,l in ALL_NEW if m['id']=='hld' and l['slug'].startswith('design-'))} |")
A(f"| LLD lessons | 0 | {sum(1 for m,l in ALL_NEW if m['id'] in ('lld','lld-practice'))} ({sum(1 for m,l in ALL_NEW if m['id']=='lld')} foundations + {sum(1 for m,l in ALL_NEW if m['id']=='lld-practice' and l['slug'].startswith('lld-') and l['slug']!='lld-revision')} case studies + 1 revision) |")
A(f"| Knowledge checks | 10 (29 Qs) | {10 + len(checks)} (existing 10 extended by {len(ex_quiz)} questions; {len(checks)} new checks, target 4–5 questions each) |")
A(f"| New simulation specifications | — | {len(sims)} (§9.4) |")
A(f"| New static diagram specifications | — | {len(diags)} (§9.5) |")
A(f"| New glossary short forms | — | about {len(gloss)} (§9.3) |")
A(f"| Priority of new lessons | — | P1 {pri['P1']} · P2 {pri['P2']} · P3 {pri['P3']} |")
A(f"| Delivery waves (new lessons) | — | A {waves['A']} · B {waves['B']} · C {waves['C']} |")
A("")
A("## 3. Module structure")
A("")
A("### 3.1 All sixteen modules")
A("")
A("Modules 1–6 are unchanged (\"the core course\": one app grown box by box). Modules 7–13 are **advanced tracks** that can be read in any order after the core, though the listed order is the recommended one. Modules 14–16 are **design practice** (HLD case studies, LLD foundations, LLD case studies). The UI has no grouping concept; the `stage` field carries the group label (\"Advanced track\", \"Design practice\", \"Code level\") so the roadmap page shows it under each module.")
A("")
A("| # | id | Title | Tagline | Stage | Lessons | Levels | Minutes |")
A("| --- | --- | --- | --- | --- | --- | --- | --- |")
for m in EM:
    ls = m["lessons"]; lv = collections.Counter((EL[s]["reclassify"] or EL[s]["level"]) for s in ls)
    A(f"| {m['number']} | `{m['id']}` | {m['title']} | {m['tagline']} | {m['stage']} | {len(ls)} (existing) | " + " · ".join(f"{k[0].upper()} {v}" for k, v in sorted(lv.items())) + f" | {sum(EL[s]['minutes'] for s in ls)} |")
for m in NM:
    newl = [l for l in m["lessons"] if not l.get("existing")]; moved = [l for l in m["lessons"] if l.get("existing")]
    lv = collections.Counter(l["level"] for l in newl)
    for l in moved: lv[EL[l["slug"]]["reclassify"] or EL[l["slug"]]["level"]] += 1
    A(f"| {m['number']} | `{m['id']}` | {m['title']} | {m['tagline']} | {m['stage']} | {len(newl)} new" + (f" + {len(moved)} moved" if moved else "") + " | " + " · ".join(f"{k[0].upper()} {v}" for k, v in sorted(lv.items())) + f" | {sum(l['minutes'] for l in newl) + sum(EL[l['slug']]['minutes'] for l in moved)} |")
A("")
A("Level key: B basic · I intermediate · A advanced. Levels use the exact existing `Level` union; the roadmap page's level highlight filter and the `LevelChip` need no change.")
A("")
A("### 3.2 Why these ten modules")
A("")
A("- **7 Distributed Systems, 8 Database Internals, 9 Messaging and Streaming** are the three \"how it really works\" tracks the brief's Phase 3 list is built around. They are kept separate because each has its own prerequisite chain (consensus needs quorums needs clocks; LSM needs storage engines; exactly-once needs partitions) and each is 7–9 lessons, the size of the existing modules.")
A("- **10 Reliability and Observability** continues module 5 at production depth and adds the observability topics the course lacks entirely.")
A("- **11 Security** is its own module because the course has nothing on it today and it has an internal progression (identity → authorisation → tokens → encryption → API hardening → secrets → threat modelling).")
A("- **12 Cloud and Infrastructure** and **13 Architecture Patterns** are separated so that \"where it runs\" and \"what shape it has\" do not blur; several lessons cross-link (Kubernetes ↔ service mesh, autoscaling ↔ capacity planning).")
A("- **14 HLD Case Studies** holds the twelve priority systems plus three P2 extras. **15 LLD Foundations** and **16 LLD Case Studies** are split because 27 lessons in one module would overflow the sidebar and because the foundations are reusable without the problems.")
A("")
A("Alternatives considered: merging 10 and 12 (operations and infrastructure) would give one 17-lesson module; merging 15 and 16 likewise. Both were rejected for sidebar length and because the existing modules average seven lessons. Three to four fewer modules would be possible only by merging unrelated tracks.")
A("")
A("### 3.3 The application change this needs (recommendation, not performed)")
A("")
A("`types/curriculum.ts` — extend the union (existing members unchanged):")
A("")
A("```ts")
A("export type ModuleId =")
A("  | \"foundations\" | \"scaling\" | \"communication\" | \"data\" | \"reliability\" | \"practice\"")
A("  | \"distributed\" | \"internals\" | \"streaming\" | \"operations\" | \"security\"")
A("  | \"infrastructure\" | \"architecture\" | \"hld\" | \"lld\" | \"lld-practice\";")
A("```")
A("")
A("`data/curriculum.ts` — append ten `CourseModule` entries (delivered in the pack's merged `data/curriculum.ts`):")
A("")
A("```ts")
for m in NM:
    A(f"  {{ id: \"{m['id']}\", number: {m['number']}, title: \"{m['title']}\", tagline: \"{m['tagline']}\", stage: \"{m['stage']}\",")
    A(f"    description: \"{m['description']}\",")
    A("    lessons: [" + ", ".join(f'"{l["slug"]}"' for l in m["lessons"]) + "] },")
A("```")
A("")
A("Copy that hard-codes the module count must change: `app/learn/page.tsx` line 52 (\"six modules\"), `app/page.tsx` line 45 (\"6 modules\" and \"25 interactive diagrams\"), `README.md` lines 6–9, `docs/architecture.md` lines 5 and 12. The validator's module-id regex (`[a-z0-9-]+`) already accepts `lld-practice`. Nothing else in the application keys on the number of modules; progress, wardrobe unlocks and the sidebar all iterate `modules[]`.")
A("")
A("## 4. Progression principles")
A("")
A("1. **Core first.** Modules 1–6 remain the on-ramp; every new lesson's prerequisites resolve to core lessons or to earlier lessons in its own track. `plan/build_plan.py` asserts that every prerequisite appears earlier in the overall order.")
A("2. **Within a track, mechanism before pattern.** Clocks → quorums → consensus → election → locks → transactions → sagas; storage engine → WAL → trees → MVCC → planner → replication → partitioning; Kafka → partitions → semantics → processing.")
A("3. **Difficulty follows prerequisites, not length.** A lesson is `advanced` only if it needs two or more intermediate ideas at once or reasons about failure across machines. `sagas`, `kafka-architecture`, `cqrs`, `authentication` and most observability lessons are therefore `intermediate` even though they sit in advanced tracks. `basic` is reserved for lessons a newcomer can read first (`security-fundamentals`, `containers`, `lld-intro`, `oop-pillars`, `class-relationships-uml`, `clean-code`, `lld-snake-and-ladder`, revision lessons).")
A("4. **Case studies name their prerequisites explicitly** so a learner can jump straight to \"Design WhatsApp\" and be sent to `websockets`, `message-queues` and `consistency` first.")
A("5. **Reuse before build.** Every new lesson that can embed an existing simulation or static diagram does (§9.4 lists reuse); new simulations are specified only where nothing exists (consistent hashing, for example, is already in `shard-router`).")
A("6. **One recall prompt and one companion set per lesson**, written in the existing register, so Cache's Explain / Hint / Summary / Quick revision work on every new lesson from day one.")
A("")
A("## 5. Existing modules 1–6: improvement plan (Phase 2)")
A("")
A("Status key: **keep** = no content change (links and companion fields verified); **polish** = small, local edits; **improve** = substantive additions. \"Level\" shows a reclassification as `old → new`.")
A("")
for m in EM:
    A(f"### Module {m['number']}: {m['title']} (`{m['id']}`)")
    A("")
    A("| # | Slug | Title | Level | Plan | Phase 2 actions | Supporting resources | Done? |")
    A("| --- | --- | --- | --- | --- | --- | --- | --- |")
    for i, s in enumerate(m["lessons"], 1):
        d = EL[s]
        lv = f"{d['level']} → **{d['reclassify']}**" if d["reclassify"] else d["level"]
        A(f"| {m['number']}.{i} | `{s}` | {d['title']} | {lv} | {d['status']} | {esc(d['actions'])} | {esc(lst(d['resources']))} | {st(f'content/lessons/{s}.mdx')} |")
    A("")
A("Across the six modules Phase 2 also: adds the 19 missing quiz questions by extending the existing checks (ids preserved, new questions appended with the next index), writes no new recall cards for existing lessons except where a deck gap matters (`client-server`, `big-idea` are deliberately uncovered), verifies the six external citations listed in `CONTENT_GAPS.md` §9 and starts `SOURCE_MANIFEST.md`.")
A("")
A("## 6. New modules 7–16: lesson plan")
A("")
A("Each row carries every field the brief asks for. **Prereqs** are slugs. **Objectives** are what the learner can do afterwards. **Resources** name the diagrams, simulations (new spec or reuse), knowledge check, recall cards and glossary short forms the lesson ships with; every lesson additionally ships `lessonMeta`, `lessonGuides` and `catMeows` entries. **Wave** is the delivery order (§10).")
A("")
for m in NM:
    A(f"### Module {m['number']}: {m['title']} (`{m['id']}`) — {m['tagline']}")
    A("")
    A(f"*{m['description']}*")
    A("")
    A("| # | Slug | Title | Level | Min | Pri | Wave | Prereqs | Learning objectives | Key concepts | Resources |")
    A("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    for i, l in enumerate(m["lessons"], 1):
        if l.get("existing"):
            d = EL[l["slug"]]
            A(f"| {m['number']}.{i} | `{l['slug']}` | {d['title']} | {d['reclassify'] or d['level']} | {d['minutes']} | — | A | — | *Existing lesson moved here from module 6; see §5* | — | {esc(d['actions'])} |")
            continue
        A(f"| {m['number']}.{i} | `{l['slug']}` | {l['title']} | {l['level']} | {l['minutes']} | {l['priority']} | {wave(m,l)} | {lst([code(p) for p in l['prereqs']])} | {esc('; '.join(l['objectives']))} | {esc(lst(l['concepts']))} | {esc(lst(l['resources']))} |")
    A("")
A("## 7. Duplicates, splits and combinations")
A("")
A("| Topic | Decision | Reason |")
A("| --- | --- | --- |")
A("| Rate limiting | Three lessons: existing `rate-limiting` (concept), `design-rate-limiter` (HLD), `lld-rate-limiter` (LLD) | Different angles the brief asks for separately; each links to the others and reuses the `token-bucket` simulation. |")
A("| Consistent hashing | Stays inside `sharding` (DeepDive) and the existing `shard-router` sim; deepened in `partitioning-internals` and applied in `design-key-value-store` | Already simulated; a separate lesson would duplicate. |")
A("| Bulkheads | Promoted from a `circuit-breaker` DeepDive to `bulkheads-degradation` | The brief lists bulkheads and graceful degradation as topics; the DeepDive stays as a teaser. |")
A("| Consistency models | `consistency` improved in Phase 2; `linearizability` added as the advanced follow-up | Beginner lesson keeps its four-model table; formal definitions need clocks and transactions first. |")
A("| CDN | `cdn` unchanged; `cdn-internals` added | Core lesson is correct at its level; internals (anycast, shields, cache keys) are a separate step. |")
A("| Object storage / file storage | `object-storage` unchanged; `design-file-storage` is the case study | The estimation example for Drive already exists and is linked. |")
A("| Monolith vs microservices | `microservices` unchanged; `modular-monolith-soa` adds SOA history and decomposition | Overlap limited to one definition; the new lesson is about boundaries and splitting. |")
A("| Replication | `replication` + `replication-internals`; `quorums` separate | Leader-based mechanics vs leaderless reasoning are distinct prerequisite chains. |")
A("| Backpressure | No new lesson; `queue-leveling` is the backpressure sim; stream-processing covers backpressure in pipelines in one section | Existing lesson is strong. |")
A("| API gateway | One new lesson `api-gateway` (with BFF); `microservices` keeps its paragraph | Brief lists it as its own topic. |")
A("| Serverless | `serverless` (architecture) only; infrastructure module mentions scale-to-zero in `autoscaling` | One lesson is enough; the infra angle is a paragraph. |")
A("| Disaster recovery vs multi-region | `disaster-recovery` (recovery, backups, tiers) and `multi-region` (serving, routing, data placement) | Different questions; heavy cross-linking. |")
A("| Design patterns | Split into creational / structural / behavioural | One lesson would exceed 2,000 words; three keep the 8–10 minute rhythm. |")
A("| Revision lessons | `advanced-revision`, `lld-revision` (P2) | Mirror `revision-map` / `test-yourself`; depend on new recall deck ids or append to `test`. |")
A("| Twitter/X, Spotify, distributed cache, message broker, analytics, ad serving, object storage design | Not planned (P3 backlog) | Instagram covers the social-feed shape; KV store covers the distributed-store shape; capacity is better spent on depth. |")
A("")
A("## 8. Difficulty classification after the plan")
A("")
A(f"- Before: basic {lv_before['basic']} · intermediate {lv_before['intermediate']} · advanced {lv_before['advanced']} (advanced 12%).")
A(f"- After: basic {lv_after['basic']} · intermediate {lv_after['intermediate']} · advanced {lv_after['advanced']} (advanced {round(100*lv_after['advanced']/sum(lv_after.values()))}%).")
A("- Reclassified existing lessons: `circuit-breaker` advanced → intermediate; `idempotency` advanced → intermediate (reasons in `CONTENT_GAPS.md` §5).")
A("- Rules applied to every new lesson: (1) `basic` needs no system-design prerequisite beyond module 1; (2) `intermediate` assumes the core course; (3) `advanced` needs two or more intermediate concepts at once or reasons about partial failure across machines. HLD case studies are `advanced` when they combine three or more tracks (feed fan-out + sharding + CDN), `intermediate` when they extend one existing design (Pastebin, rate limiter, notifications, ticket booking, autocomplete).")
A("- Metadata consistency: the level lives only in `lessonMeta.level`; the roadmap filter, chip and recently-studied list read it from there, so no second source exists to drift.")
A("")
A("## 9. Supporting resources plan")
A("")
A("### 9.1 Knowledge checks")
A("")
A("Existing checks are extended in place (ids kept, new question ids continue the sequence):")
A("")
A("| Existing check | Extended with a question on |")
A("| --- | --- |")
for cid in sorted(set(c for c, _ in ex_quiz)):
    A(f"| `{cid}` | {', '.join(code(s) for c, s in ex_quiz if c == cid)} |")
A("")
A(f"New checks ({len(checks)}), one per two to four lessons, shown after the last lesson they cover (the layout renders at most one check per `afterLesson`):")
A("")
A("| Check id | Module | Shown after | Lessons tested | Target questions |")
A("| --- | --- | --- | --- | --- |")
for cid, sl in checks.items():
    A(f"| `{cid}` | `{check_module[cid]}` | `{check_after[cid]}` | {', '.join(code(s) for s in sl)} | {min(5, max(4, len(sl)+1))} |")
A("")
A("Question mix per check: at least one scenario, one trade-off or architecture-decision question and, where the topic has failure modes, one debugging question; four plausible options; explanation names why the distractors are wrong.")
A("")
A("### 9.2 Recall decks")
A("")
A("- Every new lesson has its own `recall {q, a}` in `lessonMeta` (used by the end-of-lesson card and Cache). The \"recall ×N\" entries above are additional flashcards.")
A("- Preferred: three new decks `advanced` (modules 7–13), `hld` (14) and `lld` (15–16), each embedded by its revision lesson and on `/practice`. This needs `RecallDeckId` extended in `data/recall.ts`, the `VARIANTS` map in `scripts/validate-content.mjs` extended, and `recall-cards.tsx` `deckId()` generalised (three small edits, listed in `recommendations/APP_CHANGES.md`).")
A("- Fallback that needs no app change: append the cards to the `test` deck (append-only; indices of existing cards unchanged). The pack will deliver the cards in a form that works either way.")
A("")
A("### 9.3 Glossary short forms to add")
A("")
A("Kept to acronyms and abbreviations so the first-mention plugin stays precise. Each lands with the lesson that introduces it (`lessonSlug`):")
A("")
A("| Term | Introduced in |")
A("| --- | --- |")
for t, s in gloss.items(): A(f"| {t} | `{s}` |")
A("")
A("Concept definitions (quorum, saga, idempotency…) are **not** added to `glossary.json`; see `recommendations/APP_CHANGES.md` for the concept-glossary proposal and `CONTENT_GAPS.md` §7.3 for why.")
A("")
A("### 9.4 Simulations")
A("")
A("Reused in new lessons (no work beyond embedding): " + ", ".join(f"`{k}` → {', '.join(code(s) for s in v)}" for k, v in reuse_sims.items()) + ".")
A("")
A(f"New simulation specifications to write in Phase 6 ({len(sims)}), each following the conventions in `SIMULATION_AUDIT.md` §1:")
A("")
A("| Spec | For lesson(s) | One-line learning objective |")
A("| --- | --- | --- |")
SIM_OBJ = {
 "quorum-reads-writes": "Tune N, R, W; see when a read misses the latest write and what sloppy quorums change.",
 "raft-election": "Watch heartbeats stop, a candidate win a majority, and a partitioned old leader get fenced by a higher term.",
 "distributed-lock": "Hold a Redis lock, pause the holder past its TTL, and watch a second worker write; add a fencing token.",
 "btree-vs-lsm": "Race random writes and point reads through a B-tree and an LSM tree; see write amplification and compaction.",
 "kafka-partitions": "Produce keyed messages into partitions, add/remove consumers in a group, see rebalancing, lag and per-key order.",
 "trace-waterfall": "Click a slow request and read its span waterfall across four services; change sampling and see what you lose.",
 "jwt-inspector": "Decode a JWT, tamper with a claim, see the signature fail; expire it and see the refresh flow.",
 "cdn-cache": "Send requests from three regions; watch edge hits/misses, TTL expiry, a purge, and a Vary mistake.",
 "cache-stampede": "Expire a hot key under load and compare naive refill, request coalescing and TTL jitter.",
}
for k, v in sims.items(): A(f"| `{k}` | {', '.join(code(s) for s in v)} | {SIM_OBJ.get(k, '')} |")
A("")
A("### 9.5 Static diagram specifications")
A("")
A(f"{len(diags)} static diagrams were planned here in Phase 1. While drafting, every lesson expressed its structural diagram as a Mermaid chart authored directly in the MDX, or reused a diagram already registered in `components/diagrams/static/`, so no new static SVG components are required and none are specified; `specs/diagrams/README.md` records the resolution per planned diagram (status *superseded*, or *planned* for Wave C lessons not yet drafted).")
A("")
A("| Diagram spec | For lesson(s) |")
A("| --- | --- |")
for k, v in diags.items(): A(f"| `{k}` | {', '.join(code(s) for s in v)} |")
A("")
A("### 9.6 Companion (Cache) data")
A("")
A("For each of the 101 new lessons: `catTip` (lesson-open nudge), `recall {q, a}` (end card and Quick revision), `breaks`, `tradeoffs`, `explainSimply` (2–3 sentences, everyday analogy, no jargon), `hint` (points at the answer's shape), and one `catMeows` line. Register and length follow the 42 existing entries (`REPOSITORY_AUDIT.md` §3.1). No new companion capability is assumed.")
A("")
A("## 10. Delivery waves and phase mapping")
A("")
A("| Wave | Content | Lessons | Rationale |")
A("| --- | --- | --- | --- |")
A(f"| A | Phase 2 improvements to modules 1–6; modules 7–11 (distributed, internals, streaming, operations, security) P1 lessons; HLD method + Pastebin, rate limiter, notifications, file storage, KV store, Instagram; LLD foundations; LLD problems 1–7 | {waves['A']} new + 42 existing | Covers the brief's Phase 3 core, half the priority HLD list in increasing complexity, and the complete LLD foundation. |")
A(f"| B | Modules 12–13 (infrastructure, architecture) P1 lessons; HLD WhatsApp, YouTube, Uber, Netflix, e-commerce; LLD problems 8–14 | {waves['B']} | Builds on wave A (meshes need Kubernetes; Netflix needs CDN internals and multi-region; later LLD problems reuse earlier patterns). |")
A(f"| C | All P2 lessons: `distributed-sql`, `cdc`, `brokers-compared`, `incident-response`, `cloud-networking`, `multi-tenancy`, `advanced-revision`, `design-ticket-booking`, `design-payment-system`, `design-search-autocomplete`, `lld-revision` | {waves['C']} | Valuable but not required for coherence. |")
A("")
A("Phase mapping: Phase 2 = wave A existing-lesson work; Phase 3 = modules 7–13 (wave A then B); Phase 4 = module 14; Phase 5 = modules 15–16; Phase 6 = specifications, checks, recall, glossary for everything written; Phase 7 = QA and export. If capacity runs short, wave C is dropped first and `CONTENT_STATUS.md` says so explicitly; nothing is shipped as a stub.")
A("")
A("## 11. Items needing a decision or carrying risk")
A("")
A("1. **`ModuleId` extension** (§3.3) is required for new modules. Chosen by the owner; the pack will deliver `data/curriculum.ts` as a merged superset plus the one-line type change as a recommendation.")
A("2. **Recall deck ids** (§9.2): approved; decks exist (empty) in `data/recall.ts` and fill in Phases 3–6.")
A("3. **Mermaid `classDiagram`**: approved (minimal); `erDiagram` was not approved, so HLD data models stay as SQL/text blocks.")
A("4. **`url-shortener` now lives in module 14** (decided 2026-11-22); module 6 has eight lessons and `test-yourself` is 6.8.")
A("5. **Sixteen modules lengthen the roadmap page and the dashboard grid.** No code change is needed, but the owner may want to group modules visually later; that is outside this project.")
A("6. **Hard-coded counts** (\"6 modules\", \"25 interactive diagrams\", \"42 lessons\", \"73 terms\") must be edited at integration; `INTEGRATION_NOTES.md` will list every occurrence.")
A("")
A("**Approval record.** Roadmap approved 2026-11-22 with the decisions above; Phase 2 completed the same day (see `CONTENT_STATUS.md`).")
open(os.path.join(ROOT, "CURRICULUM_ROADMAP.md"), "w", encoding="utf-8").write("\n".join(R) + "\n")

# ================================================================ CONTENT_INDEX.md and CONTENT_STATUS.md
def lesson_paths(slug, new):
    p = [f"`content/lessons/{slug}.mdx` (.mdx)"]
    if new: p.append("entries in `data/curriculum.ts`, `data/lesson-guides.ts`, `data/cat-meows.ts` (.ts)")
    else: p.append("edits in `data/curriculum.ts` / `data/lesson-guides.ts` only if the plan says so (.ts)")
    return "; ".join(p)

I = []; S = []
IA = I.append; SA = S.append
IA("# Content Index — system-design-content-pack"); IA("")
IA(f"Date: {DATE}. Authoritative list of every deliverable in this package, its exact relative path and format. Paths under `content/`, `data/` and `types/` **mirror the repository** so files can be copied over directly; `data/*` files are delivered as merged supersets of the repository files (existing entries preserved verbatim, new entries appended). Everything else is supporting documentation. Status lives in `CONTENT_STATUS.md`.")
IA("")
IA("## A. Project documents"); IA("")
IA("| Deliverable | Path | Format | Phase |"); IA("| --- | --- | --- | --- |")
DOCS = [("Repository audit","REPOSITORY_AUDIT.md","md","0"),("Existing content index","EXISTING_CONTENT_INDEX.md","md","0"),("Content gaps","CONTENT_GAPS.md","md","0"),("Simulation and static diagram audit","SIMULATION_AUDIT.md","md","0"),
        ("Curriculum roadmap","CURRICULUM_ROADMAP.md","md","1"),("Content index (this file)","CONTENT_INDEX.md","md","1"),("Content status","CONTENT_STATUS.md","md","1"),("Machine-readable plan","plan/curriculum-plan.json","json","1"),("Plan generator / validator","plan/build_plan.py, plan/emit_docs.py, plan/status.json","py/json","1"),("Apply-to-repository script","tools/apply.sh","sh","2"),("Deferred forward links register","plan/deferred-links.md","md","2"),
        ("Recommended application changes","recommendations/APP_CHANGES.md","md","1→7"),("Source manifest (URLs, access dates)","SOURCE_MANIFEST.md","md","2→7"),("Research notes","research/phase2-core-lessons.md (one file per phase)","md","2→5"),
        ("Technical QA report","qa/TECHNICAL_QA.md","md","7"),("Educational QA report","qa/EDUCATIONAL_QA.md","md","7"),("Integration notes for Claude Enterprise","INTEGRATION_NOTES.md","md","7"),("Package README","README.md","md","7")]
for d in DOCS: IA(f"| {d[0]} | `{d[1]}` | {d[2]} | {d[3]} |")
IA("")
IA("## B. Structured data files (merged supersets, repository paths)"); IA("")
IA("| File | Path in pack = path in repo | Format | What changes | Phase |"); IA("| --- | --- | --- | --- | --- |")
DATA = [("Curriculum metadata","data/curriculum.ts","ts","10 new modules appended to `modules[]`; 101 new `lessonMeta` entries; 2 level reclassifications; otherwise verbatim","2–5"),
        ("Lesson guides","data/lesson-guides.ts","ts","101 new entries; existing entries verbatim unless an improvement changes a fact","2–5"),
        ("Cat meow lines","data/cat-meows.ts","ts","101 new entries","2–5"),
        ("Knowledge checks","data/quizzes.ts","ts","existing checks extended (ids kept); new checks appended","2–6"),
        ("Recall decks","data/recall.ts","ts","cards appended (`test`) and/or new decks `advanced`, `hld`, `lld` (needs type change)","6"),
        ("Glossary","data/glossary.json","json","new short forms inserted in alphabetical order; existing entries verbatim","2–6"),
        ("Curriculum types","types/curriculum.ts","ts","`ModuleId` union extended (approved application change, drop-in file)","2"),
        ("Content validator","scripts/validate-content.mjs","mjs","recall-card variants `advanced`/`hld`/`lld` and Mermaid `classDiagram` allowed (approved application change, drop-in file)","2"),
        ("Recall cards component","components/diagrams/interactive/recall-cards.tsx","tsx","`deckId()` accepts any registered deck; copy for the new decks (approved application change, drop-in file)","2")]
for d in DATA: IA(f"| {d[0]} | `{d[1]}` | {d[2]} | {d[3]} | {d[4]} |")
IA("")
IA("## C. Lessons (existing 42 + new 101)"); IA("")
IA("One `.mdx` per lesson at the repository path, plus the metadata triple in the data files above. Status key in `CONTENT_STATUS.md`.")
IA("")
SA("# Content Status — system-design-content-pack"); SA("")
SA(f"Last updated: {DATE} (end of Phase 7). Status values: **complete** (Phase 0/1 documents), **planned** (not started), **in progress**, **drafted** (file saved, not yet QA'd), **reviewed** (technical + educational QA done), **integration-ready** (passes the repository validator on a scratch copy), **blocked** (needs an application change named in `recommendations/APP_CHANGES.md`), **superseded** (a planned static diagram replaced by a Mermaid chart authored in the lesson; nothing to build). Wave = delivery order from `CURRICULUM_ROADMAP.md` §10.")
SA("")
SA("## Summary"); SA("")
COLS = ["complete","planned","in progress","drafted","reviewed","integration-ready","blocked","superseded"]
def row(label, paths):
    c = collections.Counter(st(p) for p in paths)
    SA(f"| {label} | {len(paths)} | " + " | ".join(str(c.get(k, 0)) for k in COLS) + " |")
SA("| Group | Items | " + " | ".join(COLS) + " |"); SA("| --- | --- | " + " | ".join("---" for _ in COLS) + " |")
row("Existing lessons (modules 1–6 + moved)", [f"content/lessons/{s}.mdx" for s in EL])
row("New lessons", [f"content/lessons/{l['slug']}.mdx" for _, l in ALL_NEW])
row("Data and app-change files", [d[1] for d in DATA])
row("Simulation specs", [f"specs/simulations/{k}.md" for k in sims])
row("Static diagram specs", [f"specs/diagrams/{k}.md" for k in diags])
row("Project, research and QA documents", [d[1].split(",")[0].strip() for d in DOCS])
SA("")
SA("## Project documents"); SA("")
SA("| Path | Phase | Status | Notes |"); SA("| --- | --- | --- | --- |")
for d in DOCS:
    s0 = "complete" if d[3] in ("0","1") else st(d[1].split(",")[0].strip())
    SA(f"| `{d[1]}` | {d[3]} | {s0} | {esc(stnote(d[1].split(',')[0].strip())) or ('' if s0=='complete' else 'created in the phase shown')} |")
SA("")
SA("## Data files"); SA("")
SA("| Path | Phase | Status | Notes |"); SA("| --- | --- | --- | --- |")
for d in DATA:
    SA(f"| `{d[1]}` | {d[4]} | {st(d[1])} | {esc(stnote(d[1])) or d[3]} |")
SA("")
for m in EM:
    IA(f"### Module {m['number']}: {m['title']} (`{m['id']}`) — existing"); IA("")
    IA("| # | Slug | Title | Level | Plan | Paths (format) |"); IA("| --- | --- | --- | --- | --- | --- |")
    SA(f"### Module {m['number']}: {m['title']} (`{m['id']}`) — existing"); SA("")
    SA("| # | Slug | Plan | Wave | Status | Notes |"); SA("| --- | --- | --- | --- | --- | --- |")
    for i, s in enumerate(m["lessons"], 1):
        d = EL[s]; lv = f"{d['level']} → {d['reclassify']}" if d["reclassify"] else d["level"]
        IA(f"| {m['number']}.{i} | `{s}` | {d['title']} | {lv} | {d['status']} | {lesson_paths(s, False)} |")
        p = f"content/lessons/{s}.mdx"
        SA(f"| {m['number']}.{i} | `{s}` | {d['status']} | A | {st(p)} | {esc(stnote(p))} |")
    IA(""); SA("")
for m in NM:
    IA(f"### Module {m['number']}: {m['title']} (`{m['id']}`) — new"); IA("")
    IA("| # | Slug | Title | Level | Pri | Wave | Paths (format) |"); IA("| --- | --- | --- | --- | --- | --- | --- |")
    SA(f"### Module {m['number']}: {m['title']} (`{m['id']}`) — new"); SA("")
    SA("| # | Slug | Level | Pri | Wave | Status | Blocked by / notes |"); SA("| --- | --- | --- | --- | --- | --- | --- |")
    for i, l in enumerate(m["lessons"], 1):
        if l.get("existing"):
            d = EL[l["slug"]]; p = f"content/lessons/{l['slug']}.mdx"
            IA(f"| {m['number']}.{i} | `{l['slug']}` | {d['title']} | {d['reclassify'] or d['level']} | — | A | {lesson_paths(l['slug'], False)} (moved from module 6) |")
            SA(f"| {m['number']}.{i} | `{l['slug']}` | {d['reclassify'] or d['level']} | — | A | {st(p)} | moved from module 6; {esc(stnote(p))} |")
            continue
        IA(f"| {m['number']}.{i} | `{l['slug']}` | {l['title']} | {l['level']} | {l['priority']} | {wave(m,l)} | {lesson_paths(l['slug'], True)} |")
        blocked = []
        if any("classDiagram" in r for r in l["resources"]): blocked.append("Mermaid classDiagram preferred (fallback: flowchart boxes)")
        if any("RecallDeckId" in r for r in l["resources"]): blocked.append("new recall deck id preferred (fallback: `test` deck)")
        p = f"content/lessons/{l['slug']}.mdx"
        SA(f"| {m['number']}.{i} | `{l['slug']}` | {l['level']} | {l['priority']} | {wave(m,l)} | {st(p)} | {esc(stnote(p)) or ('; '.join(blocked) if blocked else '')} |")
    IA(""); SA("")
IA("## D. Specifications (Phase 6)"); IA("")
IA("| Spec | Path | Format | For lesson(s) |"); IA("| --- | --- | --- | --- |")
SA("## Specifications (Phase 6)"); SA("")
SA("| Path | Status | For lesson(s) |"); SA("| --- | --- | --- |")
for k, v in sims.items():
    IA(f"| Simulation `{k}` | `specs/simulations/{k}.md` | md | {', '.join(code(s) for s in v)} |"); SA(f"| `specs/simulations/{k}.md` | {st(f'specs/simulations/{k}.md')} | {', '.join(code(s) for s in v)} |")
for k, v in diags.items():
    IA(f"| Static diagram `{k}` | `specs/diagrams/{k}.md` (+ optional `specs/diagrams/tsx/{k}.tsx` draft) | md (+tsx) | {', '.join(code(s) for s in v)} |"); SA(f"| `specs/diagrams/{k}.md` | {st(f'specs/diagrams/{k}.md')} | {', '.join(code(s) for s in v)} |")
IA(""); SA("")
IA("## E. Knowledge checks and recall (inside the data files)"); IA("")
IA("| Check id | Module | Shown after | Lessons tested |"); IA("| --- | --- | --- | --- |")
for cid in sorted(set(c for c, _ in ex_quiz)): IA(f"| `{cid}` (extend) | existing | unchanged | +{', '.join(code(s) for c, s in ex_quiz if c == cid)} |")
for cid, sl in checks.items(): IA(f"| `{cid}` (new) | `{check_module[cid]}` | `{check_after[cid]}` | {', '.join(code(s) for s in sl)} |")
IA("")
IA("Recall: cards appended to `data/recall.ts` (deck `test`, or decks `advanced` / `hld` / `lld` if the type change is accepted). Glossary: short forms listed in `CURRICULUM_ROADMAP.md` §9.3 go into `data/glossary.json`.")
IA("")
IA("## F. Conventions for every path above")
IA("")
IA("- `.mdx` files follow the authoring contract in `REPOSITORY_AUDIT.md` §4 and must pass `node scripts/validate-content.mjs` when copied into the repository together with the merged data files.")
IA("- `.ts` data files are full files, not fragments, so `tsc --noEmit` can be run on the repository after copying. Entries that already exist in the repository are byte-identical unless `CURRICULUM_ROADMAP.md` §5 names a change.")
IA("- `.md` files are documentation and are never copied into the repository.")
open(os.path.join(ROOT, "CONTENT_INDEX.md"), "w", encoding="utf-8").write("\n".join(I) + "\n")
open(os.path.join(ROOT, "CONTENT_STATUS.md"), "w", encoding="utf-8").write("\n".join(S) + "\n")
print("roadmap", len(R), "index", len(I), "status", len(S), "| checks", len(checks), "| sims", len(sims), "| diags", len(diags), "| gloss", len(gloss))
