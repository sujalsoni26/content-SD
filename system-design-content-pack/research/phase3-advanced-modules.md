# Research notes — Phase 3 (modules 7–13: distributed, internals, streaming, operations, security, infrastructure, architecture)

Date: 2026-11-22. Each lesson's sources are in its bundle (`drafts/<module>/<slug>/meta.json`) and were appended to `SOURCE_MANIFEST.md` by the merge. This note records how the material was verified and what the review changed.

## Method

1. Lessons were drafted module by module from `AUTHORING_BRIEF.md` (the validator contract, the meta schema, the voice) and the plan entry for each lesson, with primary sources fetched for every default, number and attribution; a claim that could not be fetched was softened to a rule of thumb or dropped, and the bundle's `sources` records the status (`verified`, `secondary`, `reference`).
2. Every lesson was then read end to end by the lead against the bundle's sources: numbers recomputed, quoted defaults checked against the vendor page, attributions checked, voice and structure checked against the exemplar (`distributed-fundamentals`), and validator compliance checked by the merge's `npm run check`. Contested claims were re-verified with a fresh fetch.
3. Every Mermaid chart was parsed with the app's own Mermaid 12.3.0 (`tools/mermaid-check.mjs`) and, after a production build, rendered in headless Chrome (`tools/render-check.mjs`).

## Corrections made during review

| Lesson | Finding | Change |
| --- | --- | --- |
| `serverless` | The draft gave 30 minutes as the Lambda timeout | AWS documents 900 s (15 minutes) for standard functions, 5,400 s only for Lambda Managed Instances; the table, the analogy and the quiz were corrected |
| `event-sourcing` | EventStoreDB rename | The product became KurrentDB (November 2024); the lesson names both |
| `metrics-monitoring` | Two attributions to the Prometheus docs | Both confirmed by a fresh fetch: averaging quantiles "yields statistically nonsensical values"; native histograms are recommended over classic histograms and summaries where supported |
| `capacity-planning` | Interview arithmetic: 40 instances at 60% utilisation across three zones was said to leave the survivors under 90% after losing a zone | 30,000 ÷ (40 × ⅔ × 1,200) is 94%; the figure is now 42 instances, 59.5% normally and 89% after a zone loss |
| `capacity-planning` | The rolling-deploy headroom point was trimmed for length | Restored (taking 10% of instances out at a time is a 10% tax on headroom) |
| `bulkheads-degradation` | Analogy said every other table shares at most one waiter | One table in 28 is dealt the identical pair; wording now says "almost every other table" |
| `api-security` | The length trim removed the SSRF deep dive and the API9/API10 sentence, leaving the Top 10 table partly uncovered | Both restored; the interview callout mentions signed webhooks again |
| `oauth-jwt` | The trim removed the cross-JWT confusion sentence and the token-storage deep dive; the glossary expanded OAuth as "Open Authorization" | Both restored; the glossary entry was dropped because OAuth is a name, not an acronym the specification expands |
| `authentication` | The fast-hash warning the first quiz relies on had been shortened | MD5, SHA-1 and SHA-256 are named again as the wrong tool |
| `encryption` | The end-to-end row that a recall card refers to was cut | Restored |
| `threat-modelling` | The STRIDE mitigation map was compressed to bare links and the business-layer DoS row was dropped | Both restored |
| `secrets-management` | A claim attributed to OWASP (that restarting an app revokes nothing) could not be located on the cheat sheet | Attribution removed; `SPIFFE` added to the glossary |
| `autoscaling` | "AWS target tracking refuses latency" | AWS's guidance rules latency out as a target-tracking metric; it is not a hard refusal, and the wording now says so |
| `acid` (existing lesson, Phase 2 chart) | A semicolon inside a `Note over` line ends a Mermaid statement and broke the parse | Replaced with a comma; found by the parse check, not the validator |

## Decisions recorded

- Every structural diagram planned as a static SVG in Phase 1 was drawn as a Mermaid chart in MDX or reuses a registered static diagram; no new static components are required (`specs/diagrams/README.md`).
- The nine planned simulations are specified in `specs/simulations/` but not referenced from lessons, because a lesson may not name an unregistered widget.
- `advanced-revision` embeds the `advanced` flashcard deck and maps every problem in modules 7–13 to its lesson; the deck is filled by the merge from each bundle's cards.
- Lessons that the metrics showed without an analogy or without a diagram received one in the review (`distributed-locks`, `linearizability`, `distributed-transactions`, `query-execution`, `api-security`), so every new lesson in these modules has an interview callout, an analogy and at least one visual.
