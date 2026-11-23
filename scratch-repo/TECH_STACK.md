# Tech stack

The tools and exact package versions Box by Box is built and tested with. `npm install` installs them from
`package.json` / `package-lock.json`; this file is a readable summary.

## Requirements

| Tool | Version |
|---|---|
| Node.js | 20.9 or newer (tested with 26.13.1 LTS) |
| npm | 10 or newer (tested with 11.20.0) |
| Browser | Recent Chrome, Edge, Firefox or Safari |

## Runtime dependencies

| Package | Version | Used for |
|---|---|---|
| next | 16.4.6 | App Router framework, static prerendering |
| react, react-dom | 19.3.0 | UI |
| @next/mdx, @mdx-js/loader, @mdx-js/react | 16.4.6 / 3.1.1 / 3.1.1 | Lessons written in MDX |
| remark-gfm | 4.0.1 | Tables and other GitHub-flavoured Markdown in lessons |
| shiki, @shikijs/rehype | 4.6.0 | Code highlighting (light and dark themes) |
| mermaid | 12.3.0 | Sequence, state and flow diagrams |
| motion | 14.14.0 | Animations and the companion's drag |
| zustand | 5.1.0 | Progress and preferences, saved in localStorage |
| lucide-react | 1.76.0 | Icons |

## Development dependencies

| Package | Version | Used for |
|---|---|---|
| typescript | 5.9.3 | Strict type checking |
| tailwindcss, @tailwindcss/turbopack | 4.3.3 | Styling and design tokens |
| eslint, eslint-config-next | 9.39.5 / 16.4.6 | Linting |
| @types/node, @types/react, @types/react-dom, @types/mdx | 20.19.43 / 19.3.0 / 19.3.0 / 2.0.14 | Type definitions |

Fonts (Bricolage Grotesque, Atkinson Hyperlegible Next, JetBrains Mono) are self-hosted in `app/fonts` under the
SIL Open Font License 1.1, so builds need no network access.
