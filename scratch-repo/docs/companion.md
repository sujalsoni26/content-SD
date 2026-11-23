# Cache, the study companion

Cache is a small cat that lives in a corner of every page. It explains the current lesson in plain
words, gives hints, asks Quick Revision questions from finished lessons, runs a focus timer and
reacts (briefly) to progress. Everything runs locally: there is no AI and no network call.

## Files

| File | Role |
|---|---|
| `components/companion/companion.tsx` | `Companion` root (mounted once in the root layout). Gates on hydration and the On/Off setting, wires position, behaviour, bubble, menu and timer chip. |
| `components/companion/pixel-cat.tsx` | `PixelCat`: the cat as vector SVG parts posed with Motion. Name kept for the component list; the art is smooth. |
| `components/companion/use-companion-position.ts` | Drag (Motion), throw physics, safe-zone resting, persistence of the position, resize handling. |
| `components/companion/use-companion-brain.ts` | Event bus listener, inactivity (sit, sleep, wake), greeting, lesson tips, focus-timer notices. |
| `components/companion/companion-menu.tsx` | Keyboard-navigable `role="menu"` with the eight items and the inline settings view. |
| `components/companion/speech-bubble.tsx` | Visible bubble plus `BubbleAnnouncer`, the single polite live region. |
| `components/companion/focus-timer.tsx` | `FocusTimer` chip (25 min focus, 5 min break, stop and skip). |
| `components/companion/wardrobe.tsx` | `Wardrobe`: accessory toggles (aria-pressed) with lock requirements and progress. |
| `lib/companion/accessories.ts` | Accessory definitions, unlock rules and progress from stored data. |
| `components/companion/companion-settings-panel.tsx` | `CompanionSettingsPanel` (dashboard, progress page, and inside the menu with `compact`). |
| `stores/companion-store.ts` | Runtime store (bubble, reaction, menu, idle level, reset signal) and the persisted focus store (`STORAGE_KEYS.focus`). |
| `lib/companion/*` | Pure logic: resting geometry, physics, lines, sound, menu actions, event reactions, timings. |

Settings and the normalised position live in `stores/preferences-store.ts` (`companion`).

## Poses

`data-mood` on the root (`data-testid="companion"`) is one of:

| Mood | Look | When |
|---|---|---|
| `idle` | sitting upright, tail up, occasional blink / tail flick / ear twitch | default |
| `sitting` | half-closed eyes, tail wrapped round the paws | 45 s without input, or during a focus break |
| `walking` | paws step, tail high | gliding more than 48 px to a resting spot |
| `sleeping` | curled loaf, head down, closed eyes, drifting z's | 2 min without input (wakes on scroll, key or pointer) |
| `studying` | glasses and an open book | during a focus block; while explaining or summarising |
| `thinking` | paw on chin, thought bubble | hints, revision questions, after a wrong answer |
| `happy` | arc eyes, smile, blush, small hop | correct answer, lesson complete, petting (hover 1.2 s) |
| `celebrating` | paws up, jump, sparkles | module or course complete, perfect quiz |
| `confused` | head tilt, one ear down, question mark | diagram events that report confusion |
| `dragged` | wide eyes, ears back, dangling paws, swings with drag speed | picked up, thrown or falling |
| `eating` | head down, chewing, fish at her paws | Feed |
| `purring` | arc eyes, blush, floating hearts | Pet |
| `playing` | wide eyes, paw out to bat | Play |

Precedence: dragged/flying/falling > walking > short reaction > the open bubble's mood > asleep > focus > idle level.
`data-resting` is `"true"` only when the cat stands still on the floor (not dragged, flying, dropping or walking).

## Behaviour

- Events (`onCompanionEvent`): `lesson-complete` (praise with progress and the next lesson; module and
  course completion celebrate with a link), `quiz-answer` (pose every time; a bubble at most every 20 s,
  always encouraging after a miss), `quiz-finished` (score line), `diagram` (pose at most every 45 s,
  message only as a tip), `lesson-opened` (the lesson's tip after 2.5 s, once per lesson per page load).
- Tips and nudges (greeting once per browser session, lesson tips, diagram comments, welcome back after
  a long nap) need Study tips on and share a 90 s budget. Replies to the learner's own actions are not tips.
- During a focus block Cache only changes pose: no bubbles.
- Bubbles without buttons auto-dismiss (3.5 to 12 s by length) and pause while hovered or focused; bubbles
  with buttons stay until answered. Navigation closes the menu and plain bubbles.

## Menu

Click, tap, Enter or Space on the cat (ArrowDown/ArrowUp also open it). Arrow keys, Home and End move,
Escape closes and returns focus to the cat, Tab leaves. Items: Explain simply (`lesson.explainSimply`),
Give me a hint (`lesson.hint` plus the recall question, then the answer), Quick revision (a completed
lesson's `recall`, else visited, else the first lessons; reveal, Knew it, Review lesson, Another), Focus
timer (start or stop), Current topic summary (problem, what breaks, the fix, trade-off), What should I
learn next? (`nextIncompleteLesson`, with a link), Meow about this topic, a "Play with Cache" group
(Feed, Pet, Nap / Wake up, Play, Wardrobe), Hide companion, Companion settings. Off lesson pages
the lesson items explain that they need a lesson and offer the next one.

## Drag, gravity and the floor

- Drag starts only from the cat button (`dragControls`, `touch-action: none` on the cat only), so page
  scrolling is never blocked. A click that ends a drag does not open the menu.
- On release she always falls to the floor under constant gravity, even with no throw. The floor is
  the bottom of the viewport, or the top of the fixed bottom tab bar (`nav[aria-label=Main]`) on phones.
  Left and right edges are walls. The top is a ceiling only at the top of the page (`scrollY <= 0`);
  otherwise she may fly up to 1.2 viewport heights above the screen and falls back. rAF runs only in flight.

| Constant (`lib/companion/physics.ts`) | Desktop | Phone |
|---|---|---|
| Max throw speed | 2200 px/s | 1300 px/s |
| Gravity | 2400 px/s² | 2200 px/s² |
| Air drag (horizontal) | 0.35 /s | 0.6 /s |
| Wall / ceiling restitution | 0.45 / 0.4 | 0.25 / 0.25 |
| Floor restitution, min bounce | 0.32, 140 px/s (two small bounces) | 0.22, 160 px/s (one) |
| Floor friction, stop speed | 1600 px/s², 10 px/s | 2200 px/s², 12 px/s |

- After landing, if she covers more than 6% of `[data-companion-avoid]` UI she walks along the floor
  (walking pose, 240 px/s) to the nearest floor spot that is free, else one with clearly less overlap.
  Candidates include the spots just clear of each avoided element, so gaps between columns are found.
  Phones (coarse pointer or under 640 px; 60 px cat) walk to the nearest bottom corner and tuck 42% off-screen.
- The same check runs after scroll stops, after navigation and after resize (not while the menu, a
  bubble with buttons or a play activity is active).
- Stored as `{ x: normalised floor x, y: 1, floor: true }` via `setCompanionPosition`; restored onto the
  floor; re-placed on resize and rotation (toolbar-sized height changes just keep her on the floor).
- Reduced motion or Physics off: a quick straight drop (0.16 to 0.45 s), no throw or bounce. Animations off: instant.

## Play with Cache

- Feed: a fish appears, eating pose for 2 s, then happy with a "nom" line.
- Pet (menu, or hovering a mouse over her for 1.2 s): hearts and a purr pose; from the menu she also
  says the lesson's meow line (`catMeows[slug]`), or a generic cute line off lesson pages.
- Nap / Wake up: she sleeps until woken from the menu, by a tap on her, or by a pet; scrolling and
  typing do not wake a requested nap.
- Play: a yarn ball rolls along the floor, she walks after it, bats it and settles (about 3 s).
- Counters (`companion.stats`: feeds, pets, plays, focusSessions) persist in the preferences store.
- Meow about this topic (menu) uses `catMeows[slug]`. When a lesson opens, desktop only and within the
  90 s nudge budget, she alternates between the lesson's tip and its meow line.

## Wardrobe

One accessory per slot (head, eyes, neck, body), drawn as vector layers inside the head and body
groups so they follow every pose and tilt. Unlocks come from stored data (`lib/companion/accessories.ts`):

| Id | Slot | Unlock |
|---|---|---|
| `bell-collar` | neck | first lesson completed |
| `bow-tie` | neck | one focus session completed |
| `gold-chain` | neck | perfect score on 3 different knowledge checks |
| `bandana` | neck | fed or played with Cache 5 times |
| `party-hat` | head | 5 lessons |
| `wizard-hat` | head | any module completed |
| `graduation-cap` | head | all lessons |
| `round-glasses` | eyes | perfect score on any knowledge check |
| `sunglasses` | eyes | 10 flashcards marked known |
| `striped-sweater` | body | 20 lessons |
| `hero-cape` | body | 3 modules |

New unlocks are announced once (`companion.announced`) with a celebration and a "Wear it" action.
The Wardrobe is a menu sub-view and a section of `CompanionSettingsPanel`; `companion.equipped` persists.

## Look

Fur layers (tail, body, head, ears, paws, accessories) pass through an SVG mosaic filter: one sample per
5×5 viewBox units, grown back with `feMorphology`, so blocks are about 3.5 px at the 84 px desktop size
and stay hard-edged. Eyes, nose, mouth and whiskers stay crisp. The filter only re-runs while something animates.

## Accessibility and performance

- The root is a labelled region (`aria-label="Study companion"`). The cat is a real button with
  `aria-haspopup="menu"`; the only live output is one polite `role="status"` region carrying bubble text.
- No continuous animation at rest: idle micro-motions are one-shot animations every 3 to 8 s, only with
  normal motion and a visible tab. The focus chip ticks once a second only while a session runs.
- `PixelCat` is memoised; drag and panel positions use motion values, so frames do not re-render React.
- Colours come from tokens (fur is `--amber`; lines and eyes are `color-mix` darkenings); a faint
  `--ink` drop-shadow rim keeps the outline readable in dark mode.

## Test hooks

- Root: `[data-testid="companion"]` with `data-mood` and `data-resting="true|false"` (wait for `"true"` after a drag).
- Cat button: `[data-testid="companion-cat"]` (`aria-haspopup="menu"`, `aria-expanded`).
- Menu: `[data-testid="companion-menu"]` (`role="menu"`); items `[data-testid="companion-menu-<id>"]` with ids
  `explain`, `hint`, `revise`, `focus`, `summary`, `next`, `meow`, `feed`, `pet`, `nap`, `play`, `wardrobe`, `hide`,
  `settings`; sub-views `[data-testid="companion-menu-settings"]` and `[data-testid="companion-menu-wardrobe-view"]`,
  back button `[data-testid="companion-menu-back"]`.
- Wardrobe: `[data-testid="accessory-<id>"]` buttons with `aria-pressed` (disabled while locked); the root has
  `data-accessories="head:party-hat,neck:bell-collar"` (slot order head, eyes, neck, body).
- Bubble: `[data-testid="companion-bubble"]`, close `[data-testid="companion-bubble-close"]`, actions `[data-bubble-action]`;
  announced text in the root's `[role="status"]`.
- Focus timer: `[data-testid="focus-timer"]` (`data-phase="focus|break"`), `[data-testid="focus-timer-skip"]`, `[data-testid="focus-timer-stop"]`.
- Settings: `[data-testid="companion-settings"]`; toggles are `[role="group"][aria-label="Companion|Animations|Physics|Study tips|Sound"] button[aria-pressed]`;
  `[data-testid="companion-reset-position"]`; when hidden, `[data-testid="companion-show"]`.
- Stored position: `localStorage["sdn-preferences-v1"]` → `state.companion.position`; timer: `localStorage["sdn-focus-v1"]`.

## Future work (genuine AI, not implemented)

These would need a model behind an API; none of them should ship as canned text pretending to be AI.

- Free-form questions about the current lesson, answered from the lesson's own MDX (retrieval over the
  42 lessons) with citations back to sections.
- Explain-it-differently: regenerate `explainSimply` at a chosen level (beginner, interview prep) or
  with a learner-chosen analogy.
- Adaptive revision: pick recall questions with spaced repetition from quiz history, and generate new
  variants of a recall question so the learner cannot memorise the wording.
- Grading open answers: let the learner type an answer to the recall question and get feedback on what
  is missing compared with the reference answer.
- Design review for the practice module: critique a learner's URL-shortener or chat design against the
  playbook, pointing at the lesson that covers each gap.
- Study planning: suggest a weekly plan from visit and completion history and the time the learner has.
