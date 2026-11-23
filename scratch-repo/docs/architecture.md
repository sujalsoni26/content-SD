# Architecture

## Content

- **Curriculum** (`data/curriculum.ts`): six modules, 42 lessons, in learning order. Each lesson has metadata the layout renders:
  title, level, minutes, `problem`, `summary` (the building block), `catTip`, `recall`, and `archNodes` (the boxes of the final
  architecture it lights up).
- **Teaching guidance** (`data/lesson-guides.ts`): `breaks`, `tradeoffs`, `explainSimply`, `hint` per lesson. Kept separate so it
  can be edited without touching lesson metadata. `lib/curriculum.ts` merges both into a `Lesson`.
- **Lesson bodies** (`content/lessons/<slug>.mdx`): prose plus a small component vocabulary (see `mdx-components.tsx`):
  `Callout`, `Comparison`/`ComparisonItem`, `DeepDive`, `Steps`, `ConceptCard`, `Diagram`, `Mermaid`, `Interactive`.
  The lesson page imports the MDX file by slug and prerenders all 42 routes at build time.
- **Quizzes** (`data/quizzes.ts`) are optional knowledge checks shown after the lesson that completes their topics, and all
  together on `/practice`. **Recall decks** (`data/recall.ts`) feed the flashcards.

### Adding a lesson

1. Add metadata to `data/curriculum.ts` and list the slug in a module.
2. Add guidance to `data/lesson-guides.ts`.
3. Write `content/lessons/<slug>.mdx`.
4. Run `npm run validate:content`.

## Short forms (acronyms)

`data/glossary.json` is the single source of truth. At build time, `lib/mdx/remark-acronyms.mjs` wraps the **first** mention
of each term in a lesson with `<Acronym>`. Later mentions stay plain, and headings, links, code and diagrams are skipped.
Authors write plain text. The `Acronym` popover opens on hover or focus and pins on tap or click. It is announced to screen
readers as the button's description. Learners can mark a term as known to stop its hints; the glossary page lists every term.

## State and persistence

- `stores/progress-store.ts`: completed lessons, visits (recently studied), current/last lesson, quiz attempts, bookmarks,
  known flashcards.
- `stores/preferences-store.ts`: theme, known glossary terms, companion settings and position.
- `stores/companion-store.ts`: companion runtime state and the focus timer.

All persisted stores go through `lib/storage/adapter.ts` (`persistenceAdapter`). Today that is localStorage with an in-memory
fallback. To move to authenticated server storage, implement the same `getItem/setItem/removeItem` interface (it may be async)
against an API and export it as `persistenceAdapter`. UI code only talks to the stores.

Stores use `skipHydration` and are rehydrated in `AppProviders` on the client. Components that show persisted data check
`useHydrated()` first, so server HTML and the first client render always match (no hydration errors). The theme is applied
before first paint by `ThemeScript`, which reads the same localStorage key.

## Diagrams

- **Mermaid** (`components/diagrams/mermaid.tsx`): sequence, state and flow diagrams written as text in MDX. Rendered on the
  client only when scrolled near, themed from the CSS tokens, and re-rendered when the theme changes.
- **Static SVG** (`components/diagrams/static/*`): hand-drawn diagrams as React components using the `dg-*` classes in
  `app/globals.css`, so they follow the theme.
- **Interactive** (`components/diagrams/interactive/*`): simulations, each code-split through `interactive-registry.tsx` and
  mounted only when scrolled near. Loops pause off-screen and in hidden tabs and respect reduced motion.

## Companion events

`lib/companion-events.ts` is a tiny event bus. Lessons, quizzes and diagrams emit events such as `lesson-complete`,
`quiz-answer` and `diagram`. The companion decides whether to react, so the rest of the app never depends on it.

## Motion and accessibility

`useMotionLevel()` combines the OS `prefers-reduced-motion` setting with the learner's Animations setting (Normal, Reduced
or Off). The result sets `data-motion` on `<html>` (CSS animations stop) and Motion's `MotionConfig` (JS animations stop).

Landmarks, a skip link, visible focus rings and keyboard shortcuts are built in:
- `/` or Ctrl+K for search;
- ← and → to move between lessons, ignored while typing or inside a simulation.
