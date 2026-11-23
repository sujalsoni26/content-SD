# Authoring Brief — new lessons for Box by Box

This is the contract every new lesson in this pack follows. It is derived from the repository's actual code (see `REPOSITORY_AUDIT.md` §3–4) and from the 42 existing lessons. A lesson that breaks any **must** rule fails `node scripts/validate-content.mjs` or the TypeScript build.

## 1. What a lesson is

One lesson = one **bundle** directory `drafts/<module-id>/<slug>/` containing:

- `lesson.mdx` — the student-facing body (no frontmatter, no imports).
- `meta.json` — everything the data files need: lesson metadata, Cache guidance, quiz questions, recall cards, glossary short forms, and the sources consulted.

`plan/merge_bundles.py` turns bundles into `content/lessons/<slug>.mdx` and merged `data/*.ts|json` files, assigns quiz ids, strips links to lessons that do not exist yet (and logs them), and runs the repository checks on a scratch checkout.

## 2. `meta.json`

```json
{
  "slug": "wal",
  "title": "Write-ahead logging and crash recovery",
  "moduleId": "internals",
  "level": "intermediate",
  "minutes": 8,
  "problem": "One sentence: the concrete thing that goes wrong without this building block.",
  "summary": "One or two sentences: the building block and what it does. Doubles as the page's meta description.",
  "catTip": "One to three short sentences in Cache's voice (first-person cat, playful, technically accurate).",
  "recall": { "q": "One question, scenario-flavoured where possible.", "a": "One to three sentences with the key terms." },
  "archNodes": [],
  "guide": {
    "breaks": "One sentence: the concrete failure without this block (what breaks).",
    "tradeoffs": "One sentence: the cost the block introduces.",
    "explainSimply": "Two or three short sentences, no jargon, one everyday analogy.",
    "hint": "One sentence that points at the shape of recall.a without stating it."
  },
  "meow": "One line in meow-speak that is still accurate.",
  "quiz": [
    { "prompt": "...", "options": ["...", "...", "...", "..."], "answer": 1, "explanation": "Why the answer is right and why the strongest distractor is wrong." }
  ],
  "cards": [ { "q": "...", "a": "..." } ],
  "glossary": [ { "term": "WAL", "full": "Write-Ahead Log", "note": "One line." } ],
  "sources": [ { "title": "...", "url": "https://...", "accessed": "2026-11-22", "supports": "the claim this backs", "status": "verified | secondary | reference" } ]
}
```

Field rules (lengths observed in the existing 42 lessons):

| Field | Rule |
| --- | --- |
| `slug` | lowercase, digits, hyphens; must match the plan (`plan/curriculum-plan.json`); never reuse an existing slug |
| `title` | 1–7 words, sentence case, no trailing period |
| `level` | `basic` (no system-design prerequisite beyond module 1), `intermediate` (assumes the core course), `advanced` (combines two or more intermediate ideas or reasons about partial failure across machines) |
| `minutes` | basic 5–8, intermediate 7–10, advanced 9–12; case studies 12–18 |
| `problem` | 12–30 words, concrete, shown truncated on the roadmap |
| `summary` | 20–45 words |
| `catTip` | 20–45 words; Cache is a cat who naps on servers; puns allowed, facts never bent |
| `recall.q` / `recall.a` | one question; answer ≤ 3 sentences and names the key terms |
| `archNodes` | subset of `users dns gateway cdn feed post chat cache queue workers db storage`, usually `[]` |
| `guide.*` | one sentence each except `explainSimply` (2–3 sentences, everyday analogy, zero jargon) |
| `meow` | one line |
| `quiz` | 1–2 questions per lesson (the plan says which check they join); exactly 4 options; `answer` is the 0-based index; distractors plausible and technically meaningful; explanation ≤ 2 sentences and says why the best distractor fails |
| `cards` | the number the plan's resources say (`recall ×N`); not trivially the recall prompt reworded; prefer scenarios, distinctions, failure cases |
| `glossary` | **acronyms and abbreviations only**, only when the lesson is the first to use them; `note` one line; the merge script skips terms already in the glossary |
| `sources` | every non-obvious claim, number, default or quotation; vendor defaults carry the product name; `status` is honest |

## 3. `lesson.mdx` — the MDX contract (must rules)

- No `#` heading (the layout renders the title). Sections are `##`; sub-sections `###`. Two or more `##` sections so the "On this page" rail shows.
- No `import`/`export`, no raw HTML, no JSX fragments, no bare `{expression}` in prose (write `\{` `\}`), no images.
- Components, with required props: `Callout type="idea|analogy|warning|interview" [title]`, `Comparison` > `ComparisonItem title`, `DeepDive title`, `Steps` (wrap a markdown ordered list), `Mermaid chart={`…`} caption="…"`, `Interactive name="…"` (existing registry names only; `variant` only for `estimator` and `recall-cards`), `Diagram name="…" caption="…"` (existing static names only), `<mark>` for one-line takeaways. **Do not use `ConceptCard`.**
- Mermaid: template literal, no `${}`; first line `sequenceDiagram`, `flowchart LR|RL|TB|TD|BT`, `stateDiagram-v2` or `classDiagram`; sequence diagrams carry the standard YAML config block (`mirrorActors: false`, `width: 110`, `actorMargin: 30`); labels in quotes; keep under ~16 nodes.
- Links: `/learn/<slug>` to any lesson in the plan (the merge script converts links to not-yet-existing lessons into plain text and logs them), `/learn#<module-id>`, `/learn`. **No external links in prose**: sources go in `meta.json`.
- GFM tables for comparisons; escape `~` as `\~` and `_` inside table cells as `\_`; balanced `**` and backticks (the validator rejects stray ones).
- Code fences: `sql`, `http`, `protobuf`, `text`, `java`, `typescript`, `python`, `go`, `yaml`, `json`, `bash`. Keep snippets short and runnable-looking.

## 4. Teaching pattern and voice

Every lesson follows **problem → what breaks → building block → trade-offs**, which the layout renders above the body from `problem`, `guide.breaks`, `summary`, `guide.tradeoffs`. The body then goes **intuition → mechanism → implementation → trade-offs → failure modes → optional depth**:

1. Open with one or two plain sentences that state the mechanism with the key term in **bold**; never open with a heading.
2. Explain why the thing exists before how it works. Define a term the first time it appears.
3. One `Callout type="analogy"` where an analogy genuinely helps (not forced); say what the analogy gets wrong if it could mislead.
4. One concrete example from a familiar system (WhatsApp, Instagram, YouTube, a bank, food delivery, ride booking, IPL ticketing, Flipkart sale) when it clarifies.
5. Mechanism in a table, `Steps` or a Mermaid diagram; prefer a diagram for anything with an order or a flow.
6. A **trade-offs** or **what gets hard** section; a **failure** case where applicable; distinguish theory from configuration-dependent reality ("by default", "in PostgreSQL", "depends on").
7. `Callout type="interview"` with the one thing to say out loud, when the topic is interview-relevant.
8. `DeepDive title="Go deeper: …"` for optional depth (one or two per lesson), never for required material.
9. Reuse an existing simulation or static diagram when the topic overlaps (list in `SIMULATION_AUDIT.md`); do not describe simulations that do not exist.
10. Length: 450–900 words of prose for concept lessons (not counting diagrams); shorter is fine when the topic is small. Short paragraphs, descriptive headings.

Voice: plain, direct, second person, British spelling in prose except established technical spellings ("normalization", "serialization"). Numbers rounded and stated as assumptions. No marketing adjectives. No "In this lesson we will".

## 5. Difficulty and prerequisites

Use the level in the plan. Prerequisites are the plan's `prereqs`; the lesson should link to each prerequisite once where it is used ("see [Replication](/learn/replication)") and must not re-teach it.

## 6. Research and accuracy

- Verify every number, default, RFC section, algorithm detail and historical attribution before writing it; put the source in `meta.json.sources` with the access date and the claim it supports.
- Prefer official documentation, the original paper or the original engineering post. Mark `status: "secondary"` when only coverage of a primary could be read, `"reference"` when a well-known paper or book is named but not re-read.
- Never invent benchmarks, percentages or production details. If a figure is a rule of thumb, say so.
- Write original explanations. Do not paraphrase a single source closely.

## 7. Quality checklist before handing a bundle back

- [ ] A newcomer at the stated level can follow the first two sections without the DeepDives.
- [ ] Every section earns its place; nothing restates a prerequisite lesson.
- [ ] Mechanism, trade-offs and at least one failure scenario are present.
- [ ] Diagrams use only allowed Mermaid types and compile mentally (quoted labels, valid arrows).
- [ ] No link targets outside the plan; no external links in prose.
- [ ] `meta.json` complete, valid JSON, all lengths within the table in §2; Cache lines sound like the existing ones.
- [ ] Quiz distractors are wrong for a reason a learner could believe; the explanation names that reason.
- [ ] Sources listed for every non-obvious claim.
