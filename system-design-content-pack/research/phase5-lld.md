# Research notes — Phase 5 (modules 15–16: low-level design foundations and case studies)

Date: 2026-11-22. Sources per lesson are in `drafts/lld/<slug>/meta.json`, `drafts/lld-practice/<slug>/meta.json` and `SOURCE_MANIFEST.md`.

## Method

`plan/LLD_ADDENDUM.md` fixes the language (Java, essential shapes only, at most ~120 lines per lesson), the diagram rules (Mermaid `classDiagram` for structure, `sequenceDiagram` for the main flow, `stateDiagram-v2` for lifecycles) and the section order of a case study. Review checked every Java API statement against the JDK 21 documentation, every pattern definition against Gamma et al., every algorithmic claim against its paper or documentation, and that each case study states its scope, keeps one responsibility per entity, justifies each pattern (and names the ones deliberately not used), enumerates edge cases, and names the shared mutable state before choosing a concurrency tool.

## Verified claims worth knowing

| Lesson | Claim | Status |
| --- | --- | --- |
| `oop-pillars` | Interface methods | The draft said interface methods are "all public"; interfaces have allowed private helper methods since Java 9, and the table now says so |
| `composition-over-inheritance` | `AbstractCollection.addAll` calls `add`, so the counting-set subclass double-counts (Bloch, Effective Java item 18); `Stack extends Vector` and the JDK's own pointer to `Deque` | verified against the JDK 21 API |
| `solid` | `List.add` as an "optional operation"; Liskov and Wing 1994; Martin's 2000 paper and Feathers' acronym | verified / reference |
| `interfaces-abstractions-di` | Fowler 2004, Seemann's composition root, Spring's constructor-injection guidance, `java.time.Clock` injection advice | verified |
| `concurrency-basics` | `newFixedThreadPool` unbounded queue, `newCachedThreadPool` thread growth, `CallerRunsPolicy`, happens-before sources, `volatile` without atomicity, virtual threads in Java 21 | verified |
| `design-patterns-behavioural` | `java.util.Observable` deprecated in Java 9 with unspecified notification order | verified |
| `lld-parking-lot` | `AtomicBoolean.compareAndSet`, `ConcurrentHashMap`, `ReentrantLock` in `finally` | verified |
| `lld-vending-machine` | Intrinsic locks are reentrant and released on exceptional return; `ScheduledExecutorService` for the idle timeout; greedy change-making is optimal for canonical coin systems but a finite register can defeat it | verified / reasoning stated as such |
| `lld-elevator` | `scheduleAtFixedRate` suppresses later executions after an uncaught exception; `TreeSet` is not synchronised; SCAN/LOOK from OSTEP and Wikipedia | verified / secondary |
| `lld-library-management` | `ConcurrentHashMap.compute` is atomic per key, must stay short, and leaves the mapping unchanged on exception; ISBN-13 since 2007 | verified / secondary |
| `lld-movie-ticket-booking` | PostgreSQL `FOR UPDATE NOWAIT` and lock ordering; JPA `@Version` and `OptimisticLockException`; Redis `SET NX EX` lock pattern | verified |
| `lld-splitwise` | Greedy settlement moves the minimum total and uses at most n − 1 transfers but not the fewest transfers (Verhoeff 2004; counter-example checked by hand); exact minimisation is NP-hard; `BigDecimal.divide` without a rounding mode throws for non-terminating quotients; `HALF_EVEN` | verified |
| `lld-snake-and-ladder` | `Random.nextInt(6)` is 0–5; `Random` is thread-safe with `ThreadLocalRandom` suggested for contention | verified |

## Decisions recorded

- Vehicle types in the parking lot are an enum, not a hierarchy, and the lot is not a Singleton: each case study names the patterns it deliberately does not use, because interviewers credit that reasoning.
- `lld-revision` embeds the `lld` flashcard deck and maps every foundation and case study to the problem it answers; it closes with the advice to redo one case study a week from a blank page.
- Lessons that the metrics showed without an analogy or a visual received one in review (`solid`, `interfaces-abstractions-di`, `error-handling`, `oop-pillars`); `clean-code` and `testing-extensibility` stay code-centred by design.
