# Simulation Specification Template

Specifications in `specs/simulations/` describe interactive widgets that do **not** exist yet. They are implementation guidance for the maintainer, written to match the conventions of the 25 existing simulations (`SIMULATION_AUDIT.md` §1). Nothing in a lesson may reference a simulation until it is implemented and registered.

Each spec has these sections, in this order:

1. **Identity** — registry name (kebab-case), file paths (`components/diagrams/interactive/<name>.tsx` and, if the logic is non-trivial, `_<name>-sim.ts`), the lesson(s) that embed it and where in the lesson, the `WidgetFrame` kicker, title and hint text.
2. **Learning objective** — one or two sentences: what the learner should be able to say after using it.
3. **Initial state** — every value the widget starts with (so the first render already teaches something).
4. **User controls** — each control with its type (`SegmentedControl`, `RangeField`, `Button`), options or range and step, default, and what it changes.
5. **State model and transitions** — the entities, the tick (if any), the rules applied per tick or per action, randomness (seeded), and what ends a run.
6. **Visual representation** — the stage (SVG with `dg-*` classes or DOM), what moves, what the `note` (live explanation) says in each notable state, which `Stat`s are shown, whether there is an `EventLog`.
7. **Expected output** — the observations the learner should make per control setting; the "aha".
8. **Edge cases** — degenerate settings and how the widget stays honest (for example, a stampede is harmless when traffic is below capacity, and the note should say so).
9. **Reset and reduced motion** — what Reset restores; what the widget shows when motion is reduced (finished state, coarser interval or manual step button); pause when off-screen or in a hidden tab via the `useLoopActive`/`useLoopGate` pattern.
10. **Companion events** — at most two `emitCompanionEvent({ type: "diagram", mood, message })` calls, each once-guarded, with the exact message text.
11. **Concept explanation** — the paragraph the lesson leans on, so the widget and the prose agree.
12. **Accessibility** — `role="img"` + `aria-label` for the stage, `aria-live` note, keyboard reachability of every control.
