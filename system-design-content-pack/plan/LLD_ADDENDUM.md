# LLD Addendum to the Authoring Brief (modules 15 and 16)

Applies on top of `AUTHORING_BRIEF.md` for every lesson in `lld` and `lld-practice`.

## Language and code

- Primary language for all code: **Java** (the common interview lingua franca; records, interfaces, enums, generics as needed). Fence as ```java. Keep snippets to the essential shape: interfaces, class skeletons, the one method that shows the idea. No full programs, no imports unless they teach something (`java.util.concurrent` is fine).
- Where a second language clarifies a point (for example TypeScript for a structural-typing contrast), one short extra snippet is allowed, fenced ```typescript.
- Pseudocode is acceptable for algorithms (debt simplification, SCAN scheduling) in a ```text fence.
- Never paste long listings. A case study has at most ~120 lines of code across all snippets.

## Diagrams

- Class structure uses Mermaid **`classDiagram`** (approved in the validator). Rules: `class Name { +method() }` syntax, relationships with `<|--` (inheritance), `*--` (composition), `o--` (aggregation), `-->` (association), `..>` (dependency), `..|>` (realisation of an interface); interfaces marked `<<interface>>`; at most ~12 classes per diagram (split into two diagrams if needed); no generics in labels with angle brackets inside quotes (Mermaid handles `List~Item~` tilde notation; prefer plain names).
- Object interaction uses Mermaid **`sequenceDiagram`** with the standard config block.
- Workflows and lifecycles use Mermaid **`stateDiagram-v2`**.
- Keep one class diagram and one sequence diagram per case study as the minimum.

## Structure of an LLD case study (module 16)

`##` sections in this order: Requirements and assumptions · Core entities and responsibilities · Class design (classDiagram) · Key interfaces and methods (code) · Interactions (sequenceDiagram for the main flow; stateDiagram-v2 where there is a lifecycle) · Design patterns used and why · Edge cases and error handling · Concurrency (where applicable) · Extensibility and trade-offs · optional `DeepDive` with an alternative design. Length 1,200–2,000 words plus code and diagrams; `minutes` 10–15.

## Structure of an LLD foundation lesson (module 15)

Open with the problem the principle solves in code terms (a before snippet), show the mechanism (after snippet), then the trade-off and the smell that tells you it is being over-applied. 450–900 words plus code.

## Voice and metadata

Same as the brief. Cache's lines may joke about objects and classes ("I am an instance of Cat; my behaviour is well encapsulated"). `recall` for case studies asks for the key design decision; `cards` ×1 for module 16 (pattern or responsibility ↔ problem), ×2–3 for module 15.

## Research

Pattern definitions follow Gamma et al. (*Design Patterns*, 1994) for the GoF patterns; SOLID per Robert C. Martin's original articles; concurrency facts per the Java documentation (`java.util.concurrent`). Cite them in `meta.json.sources` as `reference`.
