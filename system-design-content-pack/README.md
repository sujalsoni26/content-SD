# System Design Content Pack

A self-contained, integration-ready content package for the `box-by-box-system-design` course (Next.js App Router + MDX), built from the repository source at commit `e508232` and meant to be applied by an instance without web access. It adds ten modules (distributed systems, database internals, messaging and streaming, reliability and observability, security, cloud and infrastructure, architecture patterns, high-level design case studies, low-level design foundations and low-level design case studies) on top of the six existing ones, improves the existing lessons, and ships every supporting data file, quiz, flashcard deck and glossary entry the new lessons need.

The authoritative numbers (lessons, checks, decks, terms, status per file) are in `CONTENT_STATUS.md` and `qa/METRICS.md`; this file explains what is where and how to use it.

## Start here

| If you want to… | Read |
| --- | --- |
| Apply the pack to a checkout and verify it | `INTEGRATION_NOTES.md` |
| See what was planned and why | `CURRICULUM_ROADMAP.md` (approved), `REPOSITORY_AUDIT.md`, `CONTENT_GAPS.md` |
| Find any lesson, check, deck or spec | `CONTENT_INDEX.md` |
| See the status of every file | `CONTENT_STATUS.md` |
| Check the QA that was done | `qa/TECHNICAL_QA.md`, `qa/EDUCATIONAL_QA.md`, `qa/METRICS.md` |
| See which application changes were approved or recommended | `recommendations/APP_CHANGES.md` |
| Trace a claim to its source | `SOURCE_MANIFEST.md` (every source, URL, access date and the claim it supports) |

## Layout

```
content/lessons/*.mdx        every lesson, existing (improved) and new: copy into the repo
data/                        curriculum.ts, lesson-guides.ts, cat-meows.ts, quizzes.ts, recall.ts, glossary.json: supersets of the repo's
types/, scripts/, components/ the three approved application changes, as drop-in files
drafts/<module>/<slug>/      the authoring bundles (lesson.mdx + meta.json with sources) the data files are generated from
plan/                        the machine-readable plan, the merge pipeline and the status store
specs/simulations/           nine specifications for simulations that do not exist yet (no lesson references them)
specs/diagrams/README.md     why no new static diagrams are needed
tools/                       apply.sh, mermaid-check.mjs, render-check.mjs, full-check.sh (all checks in one run)
qa/                          QA reports, metrics and render evidence
research/                    research notes per phase
```

`content/`, `data/`, `types/`, `scripts/` and `components/` mirror the repository and are the only directories that get copied. Everything else is documentation or tooling.

## How the content was produced

Each new lesson exists first as a bundle under `drafts/`: the MDX body plus a `meta.json` holding the curriculum entry, the companion (Cache) guide and meow, the quiz questions, the flashcards, the glossary short forms and the sources. `plan/merge_bundles.py` regenerates the five data files and `content/lessons/` from the bundles and the improved existing lessons in `plan/base-lessons/`, assigns quiz questions to their knowledge checks, fills the three flashcard decks, dedupes the glossary and links lessons forward only once the target exists. `plan/build_plan.py` and `plan/emit_docs.py` regenerate the roadmap, index and status documents from `plan/curriculum-plan.json` and `plan/status.json`.

To rebuild everything from the bundles and validate it on a scratch checkout that has run `npm ci`:

```bash
python3 -I plan/merge_bundles.py --check      # merge, apply to the scratch checkout, run npm run check
python3 -I plan/build_plan.py && python3 -I plan/emit_docs.py
python3 -I plan/qa_metrics.py                 # qa/METRICS.md and qa/metrics.json
node tools/mermaid-check.mjs <app-repo> content/lessons           # parse every chart with the app's Mermaid
node tools/render-check.mjs http://localhost:3000 content/lessons # after npm run build && npm run start
```

`tools/full-check.sh <scratch-checkout> [port]` runs all of the above in order, builds and serves the app, and leaves the results in `qa/render-check/`. `python3 -I plan/refresh_review_hashes.py --verify` reports any reviewed bundle edited after its review.

The scratch checkout path and the Chrome binary are arguments or constants at the top of each tool.

## Conventions every lesson follows

- MDX with no frontmatter, no imports, no raw HTML and no h1; only the components the repository's validator allows (`Callout`, `Comparison`, `DeepDive`, `Steps`, `Interactive`, `Diagram`, `Mermaid`, `mark`).
- A lesson is a triple: the `.mdx` file, its `lessonMeta` entry (title, module, level `basic|intermediate|advanced`, minutes, problem, summary, catTip, recall) and its `lessonGuides` and `catMeows` entries. Missing entries fail the build, so the pack always ships all three.
- Links go only to existing or planned lesson slugs; the merge neutralises a link until its target exists.
- Every factual claim, default and number carries a source in the bundle's `meta.json` and in `SOURCE_MANIFEST.md`, accessed on the date shown.
- Existing slugs, check ids, deck ids and card order are unchanged, so stored learner progress keeps working.

## Approved application changes

Three small changes were approved during Phase 1 review and are delivered as drop-in files: the `ModuleId` union gains the ten new module ids (`types/curriculum.ts`); the content validator allows Mermaid `classDiagram` and the three new flashcard deck variants (`scripts/validate-content.mjs`); and the flashcard component accepts the new decks (`components/diagrams/interactive/recall-cards.tsx`, `data/recall.ts`). Everything else the content might want is listed in `recommendations/APP_CHANGES.md` with a content-only fallback, and the content never depends on it.
