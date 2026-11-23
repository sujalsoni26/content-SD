# Educational QA

Date: 2026-11-22 (Phase 7). What was checked about the content as teaching material, how, and what changed as a result. Counts are in `qa/METRICS.md`.

## 1. Coverage against the approved roadmap

Every lesson in `CURRICULUM_ROADMAP.md` shipped and is recorded in `CONTENT_STATUS.md` as reviewed. Each lesson covers the objectives and concepts listed for it in `plan/curriculum-plan.json`; the lead's review compared the lesson body against those objectives and against the plan's `resources` line (which simulation to reuse, which diagram kind, which knowledge check, which glossary short forms).

## 2. Sequencing and prerequisites

`plan/qa_metrics.py` checks that every prerequisite named in the plan is shipped and appears earlier in the curriculum order: zero violations. Each lesson links each of its prerequisites once in the prose, so a learner who arrives early can step back. Forward links (to later lessons) are used sparingly and only where the later lesson is the natural continuation; the count of forward versus backward links is in the metrics.

Difficulty follows the plan's `Level` labels (`basic`, `intermediate`, `advanced`, the repository's closed union): the six existing modules stay basic-to-intermediate, modules 7–13 are intermediate-to-advanced with a basic entry point where the module has one, the HLD studies step up from intermediate (Pastebin, rate limiter, notifications) to advanced, and the LLD track starts basic (`lld-intro`, `oop-pillars`, `class-relationships-uml`) before the patterns and the advanced case studies. Minutes per lesson follow the plan and were checked against prose length and code volume.

## 3. Lesson structure and voice

Every new lesson was checked for the course's shape: the problem stated before the mechanism, the mechanism before the trade-off, an interview callout that gives the one-breath answer, an analogy with the point where it stops, a "what gets hard" or trade-offs section, and a Cache (cat) tip and meow in the companion's voice. The metrics list new lessons lacking an interview callout, an analogy or any visual; the review added analogies to six lessons and diagrams to four so that every new lesson in modules 7–16 has all three, except two deliberately code-centred foundations (`clean-code`, `testing-extensibility`) whose visuals are code.

Case studies follow one template each (`plan/CASE_STUDY_TEMPLATE.md` for HLD, `plan/LLD_ADDENDUM.md` for LLD) so that a learner reads the routine parts quickly and slows down at the deep dives; every HLD study leads with its dominant number and every LLD study names the patterns it deliberately does not use.

## 4. Accuracy

Every factual claim carries a source in the bundle's `meta.json` with a status (`verified` = the primary page was read; `secondary` = a reputable secondary source; `reference` = a book or paper named but not re-read). Review recomputed every estimate, re-fetched contested claims, and corrected or softened what could not be supported; the corrections are listed per phase in `research/phase3-advanced-modules.md`, `research/phase4-hld.md` and `research/phase5-lld.md`.

## 5. Assessment

- **Knowledge checks**: one to four per module after the lesson they cover, two scenario-style questions per lesson with four options, one correct, and an explanation that names the strongest distractor; question ids are unique and checks are assigned to the last lesson in their group so a learner has read everything they test.
- **Recall prompts**: every lesson ends with one active-recall question (`lessonMeta.recall`) that asks for the key decision or mechanism, with a hint in the guide.
- **Flashcards**: three new decks (`advanced`, `hld`, `lld`) filled from the bundles' cards, one to three per lesson; the two revision lessons and the case-study method lesson embed them, and the existing decks are unchanged.
- **Glossary**: only true acronyms, with the full form and a one-line note; duplicates across bundles were removed by the merge, and `OAuth` was dropped because it is a name rather than an acronym.

## 6. Companion (Cache) consistency

Each lesson ships the companion fields the app expects (`catTip`, `recall`, `breaks`, `tradeoffs`, `explainSimply`, `hint`, `catMeows`) in the existing schema; the tone was checked against the existing lessons' lines (playful, short, in character, never at the expense of accuracy). The existing simulations' `diagram` events are unchanged; the specified new simulations each list their at-most-two events with exact text.

## 7. Known gaps

- Simulations specified in `specs/simulations/` are not implemented, so the lessons that would embed them teach the same point in prose, a table or a Mermaid chart.
- No lesson references a simulation that does not exist; the nine specifications name the lesson each would be embedded in once implemented.
