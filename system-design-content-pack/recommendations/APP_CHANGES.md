# Recommended Application Changes

Date: 2026-11-22 (opened in Phase 1; maintained through Phase 7; rows 12–13 added in Phase 6). Repository `sujalsoni26/box-by-box-system-design` @ `e508232`.

This project writes **content**, not application code. The changes below are the small code edits that would unblock parts of the content, listed with the exact file, the reason, the content that depends on them and the content-only fallback if the change is declined. None of them has been applied to the repository. Each is independent.

| # | Change | File(s) | Size | Required for | Fallback if declined |
| --- | --- | --- | --- | --- | --- |
| 1 | Extend `ModuleId` with ten new module ids | `types/curriculum.ts` | 1 statement | **All 101 new lessons** (owner has chosen new modules) | Place new lessons inside the six existing modules (not preferred) |
| 2 | Update hard-coded module and widget counts | `app/learn/page.tsx:52`, `app/page.tsx:45`, `README.md:6–9`, `docs/architecture.md:5,12` | copy only | Correct UI copy after integration | None (copy will be wrong) |
| 3 | Allow `ConceptCard` in the content validator | `scripts/validate-content.mjs` (`COMPONENTS`) | 1 line | Term-definition cards in LLD foundations and glossary-style sidebars | Use `Callout type="idea"` with a title |
| 4 | Allow Mermaid `classDiagram` and `erDiagram` | `scripts/validate-content.mjs` (`MERMAID_TYPES`) | 1 regex | UML class diagrams in modules 15–16; ER diagrams in HLD data models | Draw classes as `flowchart` boxes; keep data models as SQL/text code blocks |
| 5 | Allow links to `/glossary`, `/glossary#term-…`, `/practice` | `scripts/validate-content.mjs` (link check) | 3 lines | Cross-links from lessons to the glossary and practice page | Mention in prose without a link |
| 6 | Add recall deck ids `advanced`, `hld`, `lld` | `data/recall.ts` (`RecallDeckId`), `scripts/validate-content.mjs` (`VARIANTS["recall-cards"]`), `components/diagrams/interactive/recall-cards.tsx` (`deckId()` and `COPY`) | ~10 lines | Separate flashcard decks per track and the two revision lessons | Append all cards to the `test` deck |
| 7 | Concept glossary (new data file + glossary page tab), not wired to the acronym plugin | `data/concepts.json`, `components/glossary/glossary-browser.tsx`, `app/glossary/page.tsx` | new feature | The brief's "glossary with linked related concepts" | Concept definitions live inside lessons |
| 8 | Implement the nine simulations specified by the pack (no new static diagrams are needed: every planned one became a Mermaid chart, see `specs/diagrams/README.md`) | `components/diagrams/interactive/*.tsx` + `interactive-registry.tsx` | per widget | Each `specs/simulations/*`; lessons gain the `<Interactive>` only once the widget is registered | Lessons ship without the widget (they do today) |
| 9 | Compute the interactive count from the registry | `app/page.tsx:45` | 1 line | Counts stop drifting | Edit copy by hand |
| 10 | Simulation polish from the audit | `components/diagrams/interactive/*` | small | Nothing in the pack depends on it | — |
| 11 | Add `LICENSE` and a CI job running `npm run check` | repo root, `.github/workflows` | small | Nothing in the pack depends on it | — |
| 12 | List the three new flashcard decks on `/practice` | `app/practice/page.tsx:69–72` | 6 lines | Learners reach the `advanced`, `hld` and `lld` decks from the practice page as well as from the three lessons that embed them (`advanced-revision`, `case-study-method`, `lld-revision`) | The decks are reachable only from those lessons |
| 13 | Run `tools/mermaid-check.mjs` and `tools/render-check.mjs` in CI | `.github/workflows`, dev dependency `jsdom` (the render check needs only Node 22+ and a Chrome binary) | small | Catches a Mermaid chart that fails to parse (the validator checks only the first line) and a lesson page whose chart fails to render | Run them by hand before a release |

## 1. `ModuleId` extension (required)

```ts
// types/curriculum.ts
export type ModuleId =
  | "foundations" | "scaling" | "communication" | "data" | "reliability" | "practice"
  | "distributed" | "internals" | "streaming" | "operations" | "security"
  | "infrastructure" | "architecture" | "hld" | "lld" | "lld-practice";
```

`data/curriculum.ts` gains ten `CourseModule` entries (listed in `CURRICULUM_ROADMAP.md` §3.3) and 101 `lessonMeta` entries; the pack delivers the whole file. No other code keys on the module count: `lib/curriculum.ts`, the sidebar, roadmap, dashboard and wardrobe unlocks iterate `modules[]`. `ArchNodeId` is **not** extended; new lessons use existing node ids or `[]`.

## 2. Hard-coded copy

| File:line | Today | Change to |
| --- | --- | --- |
| `app/learn/page.tsx:52` | "{lessons.length} lessons in six modules, about {h} hours." | "…in {modules.length} modules…" (import `modules` from `@/lib/curriculum`) |
| `app/page.tsx:45` | "{lessons.length} lessons · 6 modules · about {h} hours · 25 interactive diagrams" | "…· {modules.length} modules · … · {interactiveNames.length} interactive diagrams" |
| `README.md:6–9` | "42 lessons in 6 modules", "25 interactive simulations", "73 terms" | final counts from `CONTENT_STATUS.md` |
| `docs/architecture.md:5,12` | "six modules, 42 lessons", "all 42 routes" | final counts |

## 3–5. Validator changes

```js
// scripts/validate-content.mjs
const MERMAID_TYPES = /^(sequenceDiagram|flowchart (?:LR|RL|TB|TD|BT)|stateDiagram-v2|classDiagram|erDiagram)\b/;
const COMPONENTS = { /* …existing… */ ConceptCard: ["title"] };
// link check: also accept /glossary, /glossary#term-<term>, /practice
```

Mermaid 12 renders `classDiagram` and `erDiagram` with the `base` theme already configured in `components/diagrams/mermaid.tsx`; class-specific theme variables (`classText`) could be added for polish but are not required.

## 6. Recall decks

```ts
// data/recall.ts
export type RecallDeckId = "test" | "revision" | "advanced" | "hld" | "lld";
```

```js
// scripts/validate-content.mjs
const VARIANTS = { estimator: ["url", "drive", "chat"], "recall-cards": ["test", "revision", "advanced", "hld", "lld"] };
```

```ts
// components/diagrams/interactive/recall-cards.tsx
function deckId(variant: string | undefined): RecallDeckId {
  return variant && variant in recallDecks ? (variant as RecallDeckId) : "test";
}
// and add COPY entries (hint text) for the three new decks
```

Known-card state is keyed by deck id then card index, so new decks start empty and existing decks are untouched.

## 7. Concept glossary (optional feature)

Proposed shape, kept out of `remark-acronyms.mjs` so ordinary prose is never auto-wrapped:

```ts
interface ConceptEntry { term: string; definition: string; lessonSlug: string; related: string[]; }
```

Rendered as a second tab on `/glossary` and searchable from the search dialog. The pack can deliver `data/concepts.json` content in this shape if the feature is accepted; until then the same definitions appear in lessons.

## Status

| # | Decision | Owner response |
| --- | --- | --- |
| 1 | Required for the chosen structure | **Accepted** (2026-11-22). Delivered: `types/curriculum.ts` in the pack. |
| 4 | Mermaid `classDiagram` | **Accepted, minimal** (2026-11-22): only `classDiagram` added; `erDiagram` not approved. Delivered: `scripts/validate-content.mjs`. |
| 6 | Recall deck ids | **Accepted** (2026-11-22). Delivered: `data/recall.ts`, `scripts/validate-content.mjs`, `components/diagrams/interactive/recall-cards.tsx`; existing decks and stored progress untouched. |
| 3, 5 | `ConceptCard`, glossary/practice links | not requested; content uses the fallbacks |
| 7 | Concept glossary | not requested; definitions stay inside lessons |
| 2, 8–13 | Integration-time housekeeping | for the maintainer; 12 is a six-line copy of the two existing `InteractiveDiagram` blocks with `variant="advanced"`, `"hld"` and `"lld"` |
