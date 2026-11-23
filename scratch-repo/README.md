# Box by Box

An interactive system design course that grows one Instagram-like app from a single server to millions of users.
Every lesson follows one pattern: **problem → what breaks → building block → trade-offs**.

- **42 lessons in 6 modules:** foundations, scaling and traffic, communication, data, performance and reliability, and design practice.
- **25 interactive simulations:** load balancers, caches, CAP partitions, circuit breakers, rate limiters, an estimation calculator and more. There are also Mermaid and SVG diagrams.
- **Optional checks:** knowledge checks, flashcards, and a live architecture map that lights up as you learn.
- **Short forms:** a glossary of 73 terms. Only the first mention per lesson is hinted.
- **Cache, the study cat:** drag and throw her around, feed her and play with her, and unlock accessories through progress. She also offers hints, quick revision and a focus timer.
- **Persistent progress:** saved in the browser, with light and dark themes, keyboard support and reduced-motion support.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, MDX, Zustand, Motion, Mermaid and Shiki. There's no backend.

## Run

Requires Node.js 20.9 or newer. Versions of everything used are in [TECH_STACK.md](TECH_STACK.md).

```bash
npm install
npm run dev        # development: http://localhost:3000
npm run build      # production build
npm run start      # serve the build: http://localhost:3000
npm run check      # type check + lint + content validation
```

On Windows, if PowerShell blocks `npm` scripts, use `npm.cmd` instead, e.g. `npm.cmd run dev`.

## Project layout

```
app/              routes: dashboard, /learn, /learn/[slug], /practice, /progress, /glossary
content/lessons/  lesson bodies (MDX)
data/             curriculum, quizzes, flashcards, glossary, lesson guides
components/       UI, lesson layout, diagrams, quiz, glossary, companion
stores/           Zustand stores (progress, preferences, companion)
lib/              helpers, hooks, storage adapter, MDX plugin
docs/             architecture and companion notes
```

More detail is in [docs/architecture.md](docs/architecture.md) and [docs/companion.md](docs/companion.md).

Fonts (Bricolage Grotesque, Atkinson Hyperlegible Next, JetBrains Mono) are self-hosted under the SIL Open Font License 1.1.
