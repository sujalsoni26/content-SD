# Repository Audit — Box by Box (System Design)

Date: 2026-11-22 · Repository: https://github.com/sujalsoni26/box-by-box-system-design · Branch `main` · HEAD `e508232` ("Rename requirements.txt to TECH_STACK.md"; two commits in history).
Local clone used for this audit: `/Users/ashu/Desktop/sujal/repo` (not modified).

Companion documents: `EXISTING_CONTENT_INDEX.md` (every lesson, quiz, card, term and diagram, generated from the data files) and `CONTENT_GAPS.md` (coverage versus the brief).

## 0. How to read this document

Every statement is tagged with how it was established:

- **[V]** Verified by reading the named file or by running a command; file paths and line numbers are given where useful.
- **[R]** Verified by running it (`npm ci`, `npm run check`).
- **[J]** My judgement (quality, risk, priority). Open to revision.
- **[?]** Assumption or unresolved question, collected again in §12.

Nothing in the repository was changed. The content pack lives outside the clone, at `/Users/ashu/Desktop/sujal/system-design-content-pack/`.

---

## 1. Project overview

**What it is [V].** A static, client-side Next.js course site. One Instagram-like app is grown from one server to millions of users across six modules and 42 lessons. Every lesson follows one teaching pattern (problem → what breaks → building block → trade-offs) rendered as a "teaching strip" above the body. There is no backend, no auth and no network call at runtime; progress lives in `localStorage`.

**Stack [V]** (`package.json`, `TECH_STACK.md`):

| Layer | Package / version |
| --- | --- |
| Framework | Next.js 16.4.6 (App Router, `cacheComponents: true`, `partialPrefetching: true`), React 19.3.0 |
| Content | `@next/mdx` 16.4.6, `@mdx-js/loader` / `react` 3.1.1, `remark-gfm` 4.0.1, local `remark-acronyms.mjs`, `@shikijs/rehype` 4.6.0 (themes `github-light` / `github-dark`, `fallbackLanguage: "text"`) |
| Diagrams | Mermaid 12.3.0 (client-rendered), hand-written SVG React components, custom interactive React simulations |
| State | Zustand 5.1.0 with `persist` through `lib/storage/adapter.ts` (localStorage, in-memory fallback) |
| UI | Tailwind CSS 4.3.3, `motion` 14.14.0, `lucide-react` 1.76.0; self-hosted fonts (SIL OFL) |
| Tooling | TypeScript 5.9 strict, ESLint 9 (`eslint-config-next` core-web-vitals + typescript), Node ≥ 20.9 |

**Scripts [V]** (`package.json`): `dev`, `build` (with `prebuild` that deletes `.next`), `start`, `lint`, `typecheck` (`tsc --noEmit`), `validate:content` (`node scripts/validate-content.mjs`), `check` (= typecheck + lint + validate:content).

**Result of running the checks [R].** `npm ci` installed 630 packages. `npm run check` exited 0:

```
tsc --noEmit            → no errors
eslint                  → no errors
validate-content.mjs    → OK: 42 lessons match 42 curriculum slugs; 28 <Interactive> (25 kinds),
                          16 <Diagram>, 8 <Mermaid>; all compile.
```

`npm run build` was **not** run in this phase (it is a full Next.js production build; `check` is the content gate the repo documents). It should be run in Phase 7. [?]

**Layout [V]:**

```
app/                      routes: / (dashboard), /learn, /learn/[slug], /practice, /progress, /glossary, not-found
content/lessons/*.mdx     42 lesson bodies (no frontmatter)
data/                     curriculum.ts, lesson-guides.ts, quizzes.ts, recall.ts, glossary.json (+ glossary.ts loader), cat-meows.ts
types/                    curriculum.ts, quiz.ts, glossary.ts, companion.ts
lib/                      curriculum.ts (merges data), lesson-headings.ts, mdx/remark-acronyms.mjs, companion/*, storage/adapter.ts, hooks/*
components/mdx/           Callout, Comparison(+Item), ConceptCard, DeepDive, Steps, CodeBlock
components/diagrams/      diagram.tsx (static), mermaid.tsx, interactive.tsx + interactive-registry.tsx, interactive/* (25 sims + 10 _helpers), static/* (16 SVGs + index.ts)
components/learning/      lesson-layout, teaching-strip, recall-card, lesson-actions, lesson-sidebar, lesson-navigation, on-this-page, roadmap, dashboard-widgets, progress-overview
components/quiz/          knowledge-check.tsx
components/companion/     Cache: companion.tsx, pixel-cat.tsx, use-companion-brain.ts, menu, bubble, timer, wardrobe, settings
stores/                   progress-store.ts, preferences-store.ts, companion-store.ts
scripts/                  validate-content.mjs, clean.mjs
docs/                     architecture.md, companion.md
mdx-components.tsx        the MDX component map (root)
```

No tests, no CI configuration (`.github/` absent), no `LICENSE` file [V]. `AGENTS.md` is an auto-generated Next.js notice that the framework's APIs differ from training data and that `node_modules/next/dist/docs/` should be consulted before writing framework code [V].

---

## 2. How a lesson is assembled [V]

1. `data/curriculum.ts` exports `modules: CourseModule[]` (six entries, each with an ordered `lessons: string[]` of slugs) and `lessonMeta: LessonMeta[]` (42 entries).
2. `data/lesson-guides.ts` exports `lessonGuides: Record<string, LessonGuide>` keyed by slug.
3. `lib/curriculum.ts` merges them into `Lesson = LessonMeta & LessonGuide & { number: "4.2", index }`, in module order. It **throws at build time** if a module lists a slug with no `lessonMeta` entry. Missing guide fields fall back silently: `breaks ← problem`, `explainSimply ← summary`, `tradeoffs ← ""`, `hint ← "Re-read the problem at the top of the lesson; the answer grows out of it."` (lines 204–213).
4. `app/learn/[slug]/page.tsx` prerenders every slug via `generateStaticParams`, imports `@/content/lessons/${slug}.mdx` dynamically and renders it inside `LessonLayout`. Page `<title>` is `lesson.title`; meta description is `lesson.summary`.
5. `LessonLayout` renders, in order: breadcrumb (module), "Lesson N.n", title, `LevelChip`, minutes, bookmark, learned chip → `TeachingStrip` (problem, breaks, summary, tradeoffs) → the MDX body → `RecallCard` (`recall.q`, hint, `recall.a`) → the `KnowledgeCheck` whose `afterLesson` is this slug, if any → `MarkCompleteButton` → previous/next cards. The right rail lists `##` headings parsed from the MDX source by `lib/lesson-headings.ts` (regex on lines starting `## `, fences skipped).
6. MDX files contain **no frontmatter, no imports, no exports** (validator forbids `mdxjsEsm`). All metadata lives in TypeScript.

Consequence for authoring [J]: a "lesson" in this project is always a **triple**: an `.mdx` body, a `lessonMeta` object and a `lessonGuides` entry (plus a `catMeows` line). Delivering an `.mdx` alone would fail validation (orphaned file) and the build (missing meta).

---

## 3. Schemas (verbatim from `types/`) [V]

### 3.1 `types/curriculum.ts`

```ts
export type Level = "basic" | "intermediate" | "advanced";
export type ModuleId = "foundations" | "scaling" | "communication" | "data" | "reliability" | "practice";
export type ArchNodeId = "users" | "dns" | "gateway" | "cdn" | "feed" | "post" | "chat" | "cache" | "queue" | "workers" | "db" | "storage";
export interface RecallPrompt { q: string; a: string; }
export interface LessonMeta {
  slug: string; title: string; moduleId: ModuleId; level: Level; minutes: number;
  problem: string;   // the problem that forced this building block in
  summary: string;   // the building block / fix, one or two sentences (also the page meta description)
  catTip: string;    // short, playful line the companion can say on this lesson
  recall: RecallPrompt; // end-of-lesson recall and Quick Revision
  archNodes: ArchNodeId[]; // final-architecture boxes this lesson lights up
}
export interface LessonGuide { breaks: string; tradeoffs: string; explainSimply: string; hint: string; }
export type Lesson = LessonMeta & LessonGuide & { number: string; index: number };
export interface CourseModule { id: ModuleId; number: number; title: string; tagline: string; stage: string; description: string; lessons: string[]; }
```

Both `ModuleId` and `ArchNodeId` are **closed unions**. Adding a module or an architecture box is a TypeScript change in `types/curriculum.ts` (and, for arch nodes, a layout change in `components/diagrams/interactive/architecture-map.tsx` lines 26–37 where the 12 boxes have fixed coordinates).

Observed field conventions (from the 42 existing entries) [V]:

| Field | Observed length / register |
| --- | --- |
| `title` | 1–7 words, sentence case, no trailing period ("Latency, throughput and the numbers to know") |
| `minutes` | 3–15; course total 248 |
| `problem` | One sentence, 12–30 words, concrete, often with a number or example; shown truncated to one line in the roadmap |
| `summary` | One or two sentences, 20–45 words; doubles as SEO description |
| `catTip` | One to three short sentences in Cache's voice (first person cat, puns allowed), 20–45 words |
| `recall.q` | One question, often scenario-based; `recall.a` one to three sentences with the key terms |
| `breaks` | One long sentence describing the concrete failure without the block |
| `tradeoffs` | One sentence naming the cost |
| `explainSimply` | 2–3 short sentences, everyday analogy, no jargon |
| `hint` | One sentence that points at the answer's shape without stating it |
| `catMeows[slug]` | One line, cat voice, must still be technically accurate |

### 3.2 `types/quiz.ts`

```ts
export interface QuizQuestion { id: string; prompt: string; options: string[]; answer: number /* index */; explanation: string; lessonSlug: string; }
export interface KnowledgeCheck { id: string; title: string; moduleId: ModuleId; afterLesson: string; questions: QuizQuestion[]; }
export interface QuizAttempt { checkId: string; score: number; total: number; answers: Record<string, number>; completedAt: number; }
export interface RecallCard { q: string; a: string; lessonSlug: string; }
```

Conventions [V]: check ids `check-<topic>`, question ids `<checkId>-<n>`; four options everywhere (the component labels up to five, A–E, `knowledge-check.tsx` line 14); `explanation` one or two sentences, sometimes naming which distractor is which pattern. `lessonSlug` powers the "Review <lesson>" link after a wrong answer and must be a real slug. `lib/curriculum.ts` → `knowledgeCheckAfter(slug)` uses `Array.find`, so **only the first check with a given `afterLesson` is rendered** on a lesson page; all checks render on `/practice`.

### 3.3 `data/recall.ts`

```ts
export type RecallDeckId = "test" | "revision";
export interface RecallDeck { id: RecallDeckId; title: string; description: string; cards: RecallCard[] }
export const recallDecks: Record<RecallDeckId, RecallDeck>
```

`recall-cards.tsx` maps `variant="revision"` → `revision`, anything else → `test` (line 39–41). Known-card state is `progress-store.knownCards[deckId]: number[]` of **card indices** (lines 208–266). Cards are therefore **append-only**; reordering or inserting silently remaps learners' saved progress.

### 3.4 `types/glossary.ts` and `data/glossary.json`

```ts
export interface GlossaryEntry { term: string; full: string; note: string; lessonSlug: string; }
```

JSON array, sorted alphabetically by `term` (case-insensitive, `ACID`…`VM`). All 73 entries are short forms. `lib/mdx/remark-acronyms.mjs` builds one case-sensitive regex of all terms (longest first, word-boundary guarded) and wraps the first mention per lesson in `<Acronym term="…">`, skipping headings, links, code and the `Interactive`/`Mermaid`/`Diagram`/`KnowledgeCheck` components. The glossary page anchors each term at `#term-<term>`; the popover links there. Plurals need their own entry (`PoP` and `PoPs` both exist).

### 3.5 `data/cat-meows.ts`

`export const catMeows: Record<string, string>` — one line per slug, no type beyond `string`. Used by the menu items "Meow about this topic" and "Pet", and alternated with `catTip` as the lesson-open nudge (`lib/companion/reactions.ts` lines 676–687).

---

## 4. MDX authoring contract [V]

Established from `mdx-components.tsx`, the component files and `scripts/validate-content.mjs` (the single source of truth for what passes).

### 4.1 Components allowed by the validator (`COMPONENTS`, line 362–372) and their real props

| Component | Required (validator) | Full props (component file) | Notes |
| --- | --- | --- | --- |
| `Callout` | `type` | `type: "idea" \| "analogy" \| "warning" \| "interview"`, `title?: string`, children | Labels: Key idea / Analogy / Watch out / Interview tip. Titles containing quotes are written as `title={"Myth: \"…\""}` (seen in `sql-nosql`, `cap`, `consistency`). |
| `Comparison` | — | children | Grid of `ComparisonItem`s. |
| `ComparisonItem` | `title` | `title: string`, children | Must be a **direct child** of `Comparison` (validator). |
| `DeepDive` | `title` | `title: string`, children | Native `<details>`, collapsed by default. Convention: titles start "Go deeper: …" (25 of 27) or "Show …" (2). |
| `Steps` | — | children | Wraps a markdown ordered list; renders numbered connected markers. |
| `Interactive` | `name` | `name: string`, `variant?: string` | `name` must be a key of `interactiveRegistry`. `variant` allowed only for `estimator` (`url` / `drive` / `chat`) and `recall-cards` (`test` / `revision`); any other name with a variant **fails**. |
| `Diagram` | `name` | `name: string`, `caption?: string` | `name` must be a key of `staticDiagrams`. All 16 existing uses pass a caption. |
| `Mermaid` | `chart`, `caption` | `chart: string`, `caption?: string` | Validator requires **both** props, `chart={`…`}` as a plain template literal with no `${}`, body (after an optional `---` YAML config block) starting with `sequenceDiagram`, `flowchart LR\|RL\|TB\|TD\|BT` or `stateDiagram-v2`. |
| `mark` | — | HTML `<mark>` | Used 33 times for the one-line takeaway of a section. |

**`ConceptCard`** is registered in `mdx-components.tsx` (line 53) with props `{ title: string; children }` but is **absent from the validator's `COMPONENTS` map**, so any lesson using it fails `validate:content` with "unknown component". It is used by zero lessons today. **Content for this project must not use it** unless the validator is updated (§10). `Acronym` is inserted by the plugin, never written by hand.

### 4.2 Other validator rules (lines 417–505)

- No `#` h1 (the layout renders the title). Section headings are `##`; sub-headings `###`. Headings feed the "On this page" rail (needs ≥ 2 to show).
- No `import` / `export`; no bare `{expression}` in prose (escape braces as `\{ \}`); no raw HTML nodes; no JSX fragments.
- Links: only `https?://…`, `/learn/<existing-slug>`, `/learn#<existing-moduleId>` or exactly `/learn`. Anything else (including `/glossary`, `/practice`, relative anchors like `#section`) fails. **No external links exist in any lesson today** [V]; external links render with `target="_blank" rel="noreferrer"`.
- A text node containing `**`, a backtick or `](` outside code fails ("markdown did not parse") — this catches unbalanced emphasis and broken links.
- Every curriculum slug needs a file and every file needs a slug (no orphans); empty files fail.
- Warnings (non-fatal): registered simulations or static diagrams that no lesson uses.

### 4.3 Conventions observed in the 42 lessons (not enforced, but consistent)

- Lessons open with prose or a `Callout`, never with a heading; the first paragraph states the mechanism in one or two sentences with the key term in **bold**.
- GFM tables are the main structural device (31 lessons). A literal tilde is escaped `\~1,000` (GFM treats single tildes as strikethrough) and underscores inside table cells are escaped `user\_id`.
- Code fences seen: `sql`, `http`, `protobuf`, `text`. Shiki falls back to plain text for unknown languages, so `java`, `python`, `typescript`, `go`, `kotlin` are safe.
- Mermaid sequence diagrams carry a YAML config block (`mirrorActors: false`, `width: 110`, `actorMargin: 30`) for compact layout; flowcharts use `subgraph` with quoted labels. Mermaid runs with `securityLevel: "strict"`.
- Indian-context examples (₹, IPL, BookMyShow, Flipkart, Diwali sale, chai stall) alongside global ones (Instagram, WhatsApp, Netflix); the brief's example systems fit this register.
- Analogies are explicit `Callout type="analogy"` blocks (13 lessons), each one short paragraph, usually followed by the technical mapping in prose.
- Lengths: 150–640 MDX tokens for concept lessons; 1,290 for the one case study. Roughly 40–150 words per `minutes` unit.
- Internal cross-links are heavy (≈120 links; `rate-limiting`, `message-queues`, `latency`, `idempotency`, `cdn` are the most linked-to). Links use the lesson title or a short phrase as text, e.g. `(see [Caching](/learn/caching))`.

---

## 5. Difficulty classification [V]

- Type: `Level = "basic" | "intermediate" | "advanced"` — exactly the three tiers the brief asks for; no mapping needed.
- UI: `LevelChip` (`components/ui/chip.tsx`) renders the raw lower-case string with tone good / amber / violet. Shown on the lesson header, roadmap rows, "Recently studied" and (per module) nowhere else. `/learn` has a **highlight** filter (dims non-matching rows; does not hide them).
- Distribution: basic 19 · intermediate 18 · advanced 5 (`sharding`, `cap`, `circuit-breaker`, `backpressure`, `idempotency`).
- Module 1 is all basic except `latency`; module 6 mixes basic method lessons with intermediate practice. The in-lesson explanation of the tiers lives in `big-idea.mdx` ("Basic (first-time essentials), Intermediate (builds on the basics), Advanced (distributed-systems depth for deep dives)").
- [J] `circuit-breaker` and `idempotency` read as intermediate by the brief's definitions; see `CONTENT_GAPS.md` §5.

---

## 6. Routing, navigation and identifiers [V]

- Routes: `/` dashboard, `/learn` roadmap, `/learn/[slug]` lesson, `/practice`, `/progress`, `/glossary`. Lesson URLs are flat: **the slug is the identity** used by routes, progress (`completed[slug]`, `visits[slug]`, `bookmarks[]`, `lastVisited`), quizzes (`lessonSlug`), recall cards, glossary (`lessonSlug`), companion (`catMeows[slug]`, `lessonGuides[slug]`) and the validator. Renaming a slug would orphan learners' saved progress for that lesson; slugs must be preserved.
- Order: module order in `modules[]`, then `lessons[]` order within a module, gives `number` ("4.2"), previous/next navigation, ← / → keyboard shortcuts and "next incomplete lesson" logic. Inserting a lesson renumbers everything after it in that module (numbers are derived, not stored, so nothing breaks; cross-references in prose to "topic 18" style numbering would — one quiz explanation says "Shard last (topic 18)" in `check-url-shortener-3`, a leftover from the original site [V]).
- Search (`components/layout/search-dialog.tsx`) indexes `title`, `summary`, `problem` of lessons and `term` / `full` of glossary entries; nothing else.
- The dashboard hero hard-codes "6 modules" and "25 interactive diagrams" (`app/page.tsx` line 45); `/learn` hard-codes "six modules" in prose (`app/learn/page.tsx` line 52); lesson count and hours are computed.

---

## 7. Interactive simulations and diagrams

### 7.1 Inventory [V]

25 simulations are registered in `components/diagrams/interactive-registry.tsx` and code-split with `next/dynamic` (`ssr: false`), mounted only when within 600 px of the viewport, and kept mounted afterwards (`interactive.tsx`). Every simulation receives `{ variant?: string }`. Embeds per lesson are listed in `EXISTING_CONTENT_INDEX.md` → "Interactive simulations". Three simulations are also used outside lessons: `recall-cards` and `estimator` on `/practice`, `architecture-map` on the dashboard with `variant="dashboard"` (a variant the MDX validator would reject in a lesson, which is fine because it is used from TSX).

16 static SVG diagrams are React components in `components/diagrams/static/`, registered in `static/index.ts`, styled with the `dg-*` classes in `app/globals.css` (lines 166–192: `dg-box`, `dg-box--store|accent|good|bad|ghost`, `dg-zone`, `dg-text`, `dg-sub`, `dg-label`, `dg-line`, `dg-line--dash|accent|bad|good`, `dg-flow` (animated dash), arrowheads `dg-ah*`, dots `dg-dot*`). They follow the theme automatically. Each is used by exactly one lesson.

8 Mermaid charts are written inline in MDX (5 `sequenceDiagram`, 2 `flowchart LR`, 1 `stateDiagram-v2`).

### 7.2 Companion hooks in simulations [V]

14 of the 25 simulations emit `emitCompanionEvent({ type: "diagram", mood, message })` (found by `grep emitCompanionEvent components/diagrams`): `cache-aside`, `token-bucket`, `recall-cards`, `queue-leveling`, `backoff-jitter`, `scaling-compare`, `circuit-breaker`, `lb-sim`, `index-scan`, `replication-lag`, `shard-router`, `pubsub-fanout`, `idempotency`, `cap-partition`. The messages are literal strings in the `.tsx` (e.g. `"Stale cache! Delete the key when you write."`, `"Both ATMs paid out. That's why money is CP!"`). The companion reacts at most once every 45 s and only shows the message as a tip within the 90 s nudge budget (§8). These strings are **application code**; the content pack can only propose them.

### 7.3 Per-simulation audit [V]

The complete audit (title and hint text, every control with its range, the state model, reset/log/loop behaviour, exact companion strings, line-referenced concerns, and all 16 static diagrams) is in **`SIMULATION_AUDIT.md`**. The table below is the summary needed for planning; "Concern" lists the most consequential item per simulation, not all of them.

| # | Registry name | Title shown | Teaches | Companion event(s) | Main concern | Lesson(s) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `request-journey` | One request, end to end | DNS → TCP handshake → TLS 1.3 → request → response timeline; DNS cache and connection reuse | — | Opens on the last step ("Step 11 of 11"); "Round trips" counts the DNS reply | `http` |
| 2 | `dns-lookup` | Resolve instagram.com | Recursive resolution, referrals, TTL countdown, A vs AAAA | — | Hard-coded "cached 300 s" beside a live TTL; record-type switch does not restart | `dns` |
| 3 | `tcp-udp` | TCP vs UDP packet race | Handshake, cumulative ACKs, RTO retransmit, in-order hold vs lossy/reordered UDP | — | RTO-only retransmission although the duplicate ACKs it draws would trigger fast retransmit; "Run race" inert under reduced motion | `tcp-udp` |
| 4 | `latency-scale` | Latency numbers, to scale | Dean/Norvig numbers on a log axis; ratio presets | — | Preset shows ≈1,500× for RAM vs SSD while the lesson table says ~1,000× | `latency` |
| 5 | `tail-latency` | The tail at scale | 1 − p^N fan-out amplification; per-backend budget | — | "Load 100 more pages" replaces instead of accumulating | `latency` |
| 6 | `littles-law` | Little's Law | L = λW, pool utilisation, queue growth | — | Headline L shown even when it exceeds the pool | `latency`, `backpressure` |
| 7 | `lb-sim` | Load balancer | RR / weighted / least-conn / IP hash; health checks; 502 window | happy: "Health check caught the dead server. No more failed requests!" | No reset; single failed probe removes a server (unstated simplification) | `load-balancing` |
| 8 | `scaling-compare` | Scale up or scale out? | Ceiling, cost, resize downtime, SPOF vs partial loss | thinking: "Even the biggest machine can't keep up. Time to scale out." | Cost-per-capacity counts booting/dead nodes; timers not paused off-screen | `scaling` |
| 9 | `polling-vs-ws` | Polling vs WebSocket | Request count, empty responses, delay vs push | — | Under reduced motion the interactive half is unavailable | `websockets` |
| 10 | `index-scan` | Full scan vs index | O(n) vs O(log n); B-tree depth; index cost | happy: "The index found it in {depth} page reads." | Message fires at race start; every level charged a disk read (lesson says top levels sit in RAM) | `indexing` |
| 11 | `replication-lag` | The vanishing comment | Async lag → stale read; sync cost; read-your-writes | confused: "Where did my comment go? Replication lag!" | Replica choice is random, so the stale read may take several refreshes | `replication` |
| 12 | `shard-router` | Which shard holds this user? | Modulo / hash / range / **consistent hashing** (ring, 8 vnodes); % keys moved on 3→4 (75/75/0/18%) | confused/happy on first "Add shard 4" by % moved | Range strategy earns "Only 0% moved" praise; its hot-shard cost is only in the note | `sharding` |
| 13 | `cap-partition` | A network partition | CP wait/error vs AP local answer and double payout; reconcile on heal | confused: "Both ATMs paid out. That's why money is CP!" (not once-guarded) | Two-replica CP model may over-generalise (a 3-node majority stays available) | `cap` |
| 14 | `cache-aside` | Cache-aside with Redis | Hit/miss latency, TTL, LRU at capacity 4, delete-on-write vs stale, hot key, cold start, hit ratio | confused: "Stale cache! Delete the key when you write."; happy: "Hit ratio {N}%. The database can relax." | No full reset; **stampede / request coalescing not modelled**; 21 ms vs "~10–20 ms" in the static diagram | `caching` |
| 15 | `queue-leveling` | Queue load leveling | Burst absorption, worker drain, bounded buffer shedding (503) vs unbounded OOM, poison → DLQ | confused: "The unbounded queue ate all the memory…"; thinking: "Buffer full: the whole burst was shed…" (repeats) | Poison message re-queued at the front immediately; no reset | `message-queues` |
| 16 | `pubsub-fanout` | Queue vs pub/sub | Competing consumers vs fan-out; offline backlog; late subscribers | happy: "A new subscriber, and the post service never changed." | Topic named `post-events` while the static diagram says `PostCreated` | `pubsub` |
| 17 | `nines` | How much downtime does each nine allow? | Downtime per period; series multiply, parallel 1 − Π(1−aᵢ) | — | None numeric | `availability` |
| 18 | `backoff-jitter` | Retry storms vs backoff + jitter | Synchronised retries vs exponential vs full jitter (AWS formula) | happy: "Jitter spread the retries out, and every client got through." | Pure backoff serves 0 of 20 with these parameters (dramatic but intentional) | `timeouts-retries` |
| 19 | `circuit-breaker` | Circuit breaker | Closed → Open (5 failures) → Half-open (2 trials) with fallback and held threads | thinking: "Breaker tripped…"; happy: "The service is back and the breaker closed itself." | None noticed | `circuit-breaker` |
| 20 | `token-bucket` | Rate limiter | Token bucket (burst within rate) vs fixed window boundary leak; 429 + Retry-After | thinking: "{N} requests slipped through in about a second. Fixed windows leak at the edges." | Mode switch keeps the other algorithm's dots and counters | `rate-limiting` |
| 21 | `idempotency` | Retry a payment safely | Lost reply + retry → double charge vs Idempotency-Key replay | confused: "Charged twice for one tap!…"; happy: "One tap, one charge, even with a retry." | None technical | `idempotency` |
| 22 | `estimator` | Back-of-the-envelope estimator | QPS, storage, bandwidth, cache, servers, code length, system shape; presets url / drive / chat | — | `drive` preset is never passed by a lesson | `estimation-formulas`, `test-yourself` (chat), `/practice` |
| 23 | `base62` | Counter + base 62 | Encoding steps, alphabet, capacity per length, sequential vs scrambled | — | Scramble wraps ids ≥ 62⁷ (outside lesson range) | `url-shortener` |
| 24 | `recall-cards` | Test yourself / Problem to building block | Flashcards with persisted known state, Again requeue | happy: "Whole deck known. Great recall!" | Known state keyed by card index | `test-yourself`, `revision-map`, `/practice` |
| 25 | `architecture-map` | {n} of 12 boxes lit | Final architecture as a progress map | — | Lesson prose says "click any box to jump there" but a click only selects | `final-architecture`, dashboard |

**Static diagrams.** All 16 carry descriptive `aria-label`s and use only `dg-*` classes that exist. Page-level inconsistencies worth fixing in Phase 2 or recommending: `queue-vs-pubsub` ("PostCreated") vs `pubsub-fanout` ("post-events"); `scale-up-vs-out` ("64 cores · 512 GB") vs `scaling-compare` 2XL tier (256 GB); `cache-aside-flow` ("~10–20 ms") vs `cache-aside` (21 ms); `primary-replicas` draws the replication stream as a chain through Replica 1, which can read as cascading replication; `monolith-vs-microservices` shows four monolith modules but three services.

**Coverage facts that change the gap analysis [V].** Consistent hashing *is* simulated (`shard-router` has a ring with virtual nodes and a moved-keys percentage), so it is not a missing simulation. Cache stampede is *not* modelled anywhere. `queue-leveling` is the de-facto backpressure simulation. All 25 registry names and all 16 static names are used; nothing dangles; `estimator`'s `drive` variant is reachable only through its preset control.

**Conventions a new simulation specification must match** (from `SIMULATION_AUDIT.md` §1): one `"use client"` file per sim default-exporting `ComponentType<InteractiveProps>`; pure logic in a sibling `_<name>-sim.ts` with a seeded PRNG; `WidgetFrame` with `title`, `hint`, `kicker` and an `aria-live` `note`; shared `RangeField`, `SegmentedControl`, `Button`, `Chip`, `Stat`/`StatGrid`, `EventLog`; SVG stages with `viewBox`, `role="img"`, `dg-*` classes and `#ah*` markers; loops gated on in-view **and** page-visible via `useLoopGate`/`useLoopActive`; a reduced-motion path (finished state, coarser interval, or manual stepping); companion events once-guarded with a `useRef` flag.

---

## 8. Cache, the study companion [V]

Source: `docs/companion.md`, `components/companion/*`, `lib/companion/*`, `stores/companion-store.ts`, `types/companion.ts`.

**Runs entirely locally.** No model, no network. Every line is either a fixed string (`lib/companion/lines.ts`), a per-lesson data field, or a template filled with progress numbers.

**Capabilities confirmed in code:**

| Menu item / behaviour | Data it reads | Where |
| --- | --- | --- |
| Explain simply | `lesson.explainSimply` | `lib/companion/actions.ts` → `explainSimply()` |
| Give me a hint | `lesson.hint`, then `recall.q`, then `recall.a` on "Show answer" | `giveHint()` |
| Quick revision | `recall` of a completed lesson, else a visited one, else the first three; "Knew it / Review lesson / Another" | `quickRevision()`, `lib/companion/lesson-context.ts` → `pickRevision()` |
| Current topic summary | `problem`, `breaks` (if different from problem), `summary`, `tradeoffs` | `topicSummary()` |
| What should I learn next? | `nextIncompleteLesson()` | `suggestNext()` |
| Meow about this topic / Pet | `catMeows[slug]`, else generic lines | `meowAboutTopic()`, `petCache()` |
| Lesson-open nudge | alternates `catTip` and `catMeows[slug]`; once per lesson per page load; desktop only; 2.5 s delay; shares the 90 s nudge budget | `reactions.ts` → `maybeLessonTip()` |
| Reactions | `lesson-complete` (praise with progress; module/course celebration), `quiz-answer` (pose always; bubble ≤ every 20 s), `quiz-finished` (score line), `diagram` (pose ≤ every 45 s; message only as a tip), `lesson-opened` | `reactToEvent()` |
| Focus timer | 25 min focus / 5 min break; no bubbles during focus | `stores/companion-store.ts`, `focus-timer.tsx` |
| Wardrobe | 11 accessories unlocked by progress (lessons done, modules done, perfect checks, known cards, feeds/plays, focus sessions) | `lib/companion/accessories.ts` |

**Event type (closed) [V]:**

```ts
type CompanionEvent =
  | { type: "lesson-complete"; slug; moduleCompleted; courseCompleted }
  | { type: "quiz-answer"; correct }
  | { type: "quiz-finished"; score; total }
  | { type: "diagram"; mood: "happy" | "thinking" | "confused"; message? }
  | { type: "lesson-opened"; slug };
```

**What content can and cannot influence [J, from the above]:**

- Can: every per-lesson string (`catTip`, `recall`, `breaks`, `tradeoffs`, `explainSimply`, `hint`, `catMeows`). These are the "topic-specific guidance" the brief asks for, and they are the *only* companion surfaces that are data.
- Cannot without app changes: generic lines (`lines.ts`), timing budgets (`timing.ts`), new menu items, new event types, simulation messages (inside each sim's `.tsx`), or any per-lesson *reaction* beyond the five fields above.
- Register to match: Cache speaks in first person, short sentences, cat humour that never bends the technical fact ("Four nines means only 52 minutes a year without treats"). `explainSimply` deliberately avoids jargon and names an everyday analogy; `hint` never contains the answer.

Unlock thresholds that new content changes [V]: `graduation-cap` requires `lessons.length` completed (grows automatically); `striped-sweater` needs 20 lessons and `party-hat` 5 (fixed numbers); `wizard-hat` / `hero-cape` need 1 / 3 complete modules. Adding modules makes module-based unlocks relatively easier to reach early; harmless, but worth knowing.

---

## 9. Progress, persistence and compatibility [V]

| Store | Key | Persisted shape | Content-relevant notes |
| --- | --- | --- | --- |
| `progress-store.ts` | `sdn-progress-v1` | `completed{slug→ts}`, `visits{slug→ts}`, `currentLesson`, `lastVisited`, `quizAttempts{checkId→QuizAttempt[] (last 10)}`, `bookmarks[]`, `knownCards{deckId→index[]}` | Slugs and check ids are the identity. Attempts store `answers{questionId→optionIndex}` but the UI only displays scores, so re-ordering options affects no stored display; renaming question ids orphans nothing visible. Card indices must stay stable. |
| `preferences-store.ts` | `sdn-preferences-v1` | `theme`, `knownTerms[]` (glossary terms marked known), `companion{…}` | Renaming a glossary `term` resets its "known" state. |
| `companion-store.ts` (focus part) | `sdn-focus-v1` | focus session | — |

Hydration: stores use `skipHydration` and rehydrate in `AppProviders`; components check `useHydrated()` before showing persisted data. Content has no hydration concerns as long as it stays inside MDX and data files.

---

## 10. Integration constraints, risks and recommended application changes

### 10.1 Hard constraints for the content pack (must follow) [V]

1. Every new lesson = `.mdx` + `lessonMeta` entry + listing in a module's `lessons[]` + `lessonGuides[slug]` + `catMeows[slug]`. Missing any of the first three fails the build or the validator; missing guides/meows degrade silently.
2. Only the nine validator-approved components, with the props in §4.1. **No `ConceptCard`.** No `variant` on any simulation other than `estimator` / `recall-cards`.
3. Links: `/learn/<slug>`, `/learn#<module>`, `/learn` or absolute `http(s)`. No `/glossary`, `/practice` or in-page anchors.
4. Mermaid: `sequenceDiagram`, `flowchart <dir>`, `stateDiagram-v2` only; template literal without `${}`; a `caption` is required.
5. No h1, no import/export, no raw HTML, no bare `{}`; escape `~` and `_` in table cells as the existing lessons do.
6. Preserve all 42 slugs, the six module ids, check ids and question ids; append new recall cards only; keep glossary `term`s unchanged.
7. New `archNodes` values must come from the 12-value union; `[]` is acceptable.
8. Run `npm run check` after integrating any batch; the content validator catches most mistakes with file:line precision.

### 10.2 Risks [J unless marked]

| Risk | Likelihood / impact | Mitigation in the pack |
| --- | --- | --- |
| Validator rejects a component or link the content assumed | High if guessed; eliminated by §4 | Author strictly to §4; Phase 7 runs the validator on a scratch copy of the repo |
| Closed `ModuleId` blocks new modules (HLD, LLD, Advanced) [V] | Certain if new modules are wanted | Phase 1 proposes placements inside the six modules **and** a documented 1-line type extension as the recommended path |
| Acronym plugin wraps unwanted words when concept terms are added to `glossary.json` [V] | Certain for common words | Keep `glossary.json` to short forms; propose a concept glossary as an app change |
| `knownCards` index drift [V] | Certain if cards are inserted | Append-only rule in every recall deliverable |
| Hard-coded counts drift ("25 interactive diagrams", "six modules") [V] | Certain when content grows | Integration notes list each occurrence |
| Lesson count growth lengthens the sidebar and roadmap | Medium (UI only) | Phase 1 keeps module sizes balanced; note for the maintainer |
| Companion unlock thresholds and "course complete" semantics shift as `lessons.length` grows [V] | Low impact | Documented above |
| Build-time cost: every lesson is prerendered and Mermaid/sims are client-only | Low | Nothing to do |
| Claims in existing lessons cite blogs from memory (Prime Video, Cloudflare, Facebook) | Medium | Phase 2 verifies and adds to the source manifest |

### 10.3 Recommended application changes (outside this task; **not** to be assumed) [J]

Each is small, isolated and would unblock content the brief asks for. They are recommendations for the maintainer / Claude Enterprise, listed in priority order:

1. **`scripts/validate-content.mjs`: add `ConceptCard: ["title"]` to `COMPONENTS`** so the already-registered component can be used for term definitions inside lessons. One line.
2. **`scripts/validate-content.mjs`: extend `MERMAID_TYPES`** to allow `classDiagram` (LLD UML) and `erDiagram` (HLD data models). One regex edit; Mermaid 12 renders both; the theme variables in `mermaid.tsx` already cover node/cluster colours (class/ER-specific variables could be added later for polish).
3. **`types/curriculum.ts`: extend `ModuleId`** (e.g. add `"advanced"`, `"hld"`, `"lld"`) and add the corresponding `modules[]` entries; update the "six modules" copy in `app/learn/page.tsx` line 52, `app/page.tsx` line 45, `README.md`, `docs/architecture.md`. Without this, all new content must live inside the existing six modules.
4. **`scripts/validate-content.mjs`: allow links to `/glossary`, `/glossary#term-…` and `/practice`** so lessons can point at the glossary and practice page.
5. **`data/recall.ts` + validator `VARIANTS`: allow additional deck ids** (e.g. `hld`, `lld`), and ideally key `knownCards` by a stable card id rather than index.
6. **Concept glossary**: a second data file (e.g. `data/concepts.json`, `{ term, definition, lessonSlug, related[] }`) and a tab on `/glossary`, *not* wired into the acronym plugin. This is the only way to deliver the brief's "glossary with linked related concepts" without over-matching prose.
7. **Static diagrams and simulations** proposed by the pack are specifications; implementing a `.tsx` under `components/diagrams/static|interactive` and registering it is app work. The pack can include draft `.tsx` files as *suggestions* in a clearly separated folder.
8. Compute the "interactive diagrams" count from `interactiveNames.length` instead of the literal 25.
9. Add a `LICENSE` and a CI job that runs `npm run check` (the repo has neither).
10. **Simulation polish** (all inside `components/diagrams/interactive/*`, see `SIMULATION_AUDIT.md` §5): once-guard the repeating companion events in `queue-leveling` and `cap-partition`; add reset buttons to `lb-sim`, `cache-aside`, `queue-leveling`, `token-bucket` (and clear the other algorithm's history on mode switch); restore the reduced-motion paths in `polling-vs-ws` and `tcp-udp`; emit `index-scan`'s message when the race ends; align the in-widget names and numbers with the static diagrams on the same page (`post-events`/`PostCreated`, 256/512 GB, 21/10–20 ms).

---

## 11. What is good and should be preserved [J, grounded in §§2–8]

- The teaching pattern (problem → breaks → block → trade-offs) is enforced by data, not prose, and every lesson has all four fields filled. New lessons should keep this discipline; it is the course's signature.
- The validator is strict and precise; it is the best integration ally this project has. Author to it, do not route around it.
- `url-shortener.mdx` is a complete, correct HLD case study with verified arithmetic and four deep dives; it is the template for Phase 4.
- The 25 simulations and the companion event bus are a genuine differentiator; new content should **embed existing sims** wherever a topic overlaps (e.g. a Kafka lesson can reuse `queue-leveling` and `pubsub-fanout`; a consistency lesson can reuse `replication-lag`; any case study can reuse `estimator`).
- Numbers in the existing lessons that I recomputed (availability table, error budget, base-62 capacities, birthday-bound order of magnitude, estimation examples, chat drill, Little's Law examples) are all correct [V by arithmetic].
- The glossary's first-mention hinting is elegant; keep it to short forms so it stays precise.

---

## 12. Assumptions and unresolved questions [?]

1. **Target for new modules.** The brief says "preserve the existing six-module structure if it remains appropriate". An LLD track and a case-study track do not fit the "grow one app" narrative of modules 1–5; I will propose new modules in Phase 1 **with** the type change from §10.3 and an alternative placement inside module 6 for a no-code-change path. Which the maintainer prefers is unknown.
2. **Whether the maintainer will accept the small validator changes** (`ConceptCard`, Mermaid types, link targets). Phase 1 will mark every lesson that depends on one so Claude Enterprise can choose.
3. **`npm run build`** was not run; `npm run check` passes. A production build should be run once in Phase 7 on a copy with the new content.
4. **Licensing of existing content.** No LICENSE in the repo; the content was "generated from the original site's lesson data, then maintained by hand" (comment in `data/curriculum.ts`). I assume the maintainer owns it; new content in the pack is original writing.
5. **Hosting / deployment** is not described anywhere; assumed static Next.js hosting. Irrelevant to content.
6. **Audience and locale.** Examples are Indian-flavoured with global systems; spelling is British ("normalise", "behaviour") in guides and docs but lesson prose mixes ("Normalization", "serialization"). I will follow each file's existing spelling and prefer the lesson titles' spelling for new titles.
7. **Simulation audit (§7.3)** is complete; its full text is `SIMULATION_AUDIT.md`. Its UX judgements (e.g. step-throughs opening on the last step) are flagged as concerns, not confirmed defects, because I did not run the site in a browser in this phase.

---

## 13. Phase 0 deliverables

| File | Path (relative to `system-design-content-pack/`) | Status |
| --- | --- | --- |
| Repository audit | `REPOSITORY_AUDIT.md` | this file |
| Existing content index | `EXISTING_CONTENT_INDEX.md` | complete, generated from data |
| Content gaps | `CONTENT_GAPS.md` | complete |
| Simulation and static diagram audit (supporting) | `SIMULATION_AUDIT.md` | complete; full per-simulation detail behind §7.3 |

Validation performed in this phase: `npm ci` and `npm run check` on the unmodified clone (both pass); arithmetic in estimation and availability lessons recomputed; every schema, component prop and validator rule cited above read in source. Not performed: `npm run build`; web verification of cited blogs (deferred to Phase 2, where the source manifest starts).
