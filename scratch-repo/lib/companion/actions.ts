import { catMeows } from "@/data/cat-meows";
import { lessons, nextIncompleteLesson } from "@/lib/curriculum";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useProgressStore } from "@/stores/progress-store";
import { useCompanionStore, useFocusStore, type BubbleAction, type BubbleInput, type BubbleItem } from "@/stores/companion-store";
import type { Lesson } from "@/types/curriculum";
import { LINES, pick } from "./lines";
import { pickRevision, type RevisionSource } from "./lesson-context";
import { companionBlip } from "./sound";

/*
 * What each menu item does. Plain functions over the stores, so they can run from click handlers
 * without re-rendering the companion. Everything here was asked for by the learner (solicited).
 */

const ask = (input: BubbleInput) => useCompanionStore.getState().say({ solicited: true, focus: true, ...input });
const lessonHref = (l: Lesson) => `/learn/${l.slug}`;
const label = (l: Lesson) => `${l.number} ${l.title}`;

function nextAfter(from?: string | null): Lesson | undefined {
  const { completed, lastVisited } = useProgressStore.getState();
  return nextIncompleteLesson(completed, from ?? lastVisited);
}

type LessonFeature = "explain" | "hint" | "summary";
const FEATURE_TEXT: Record<LessonFeature, string> = {
  explain: "explain it simply",
  hint: "give you a hint",
  summary: "sum up the topic",
};

/** Off lesson pages: say what the item needs and offer the next lesson instead. */
export function needLesson(feature: LessonFeature): void {
  const next = nextAfter();
  const actions: BubbleAction[] = next
    ? [{ label: `Open ${next.title}`, href: lessonHref(next), primary: true }, { label: "Later" }]
    : [{ label: "Browse lessons", href: "/learn", primary: true }, { label: "Later" }];
  ask({
    title: "Open a lesson first",
    text: `I can ${FEATURE_TEXT[feature]} once you are on a lesson page.${next ? ` Next up for you: ${label(next)}.` : ""}`,
    actions,
    mood: "thinking",
  });
}

export function explainSimply(lesson?: Lesson): void {
  if (!lesson) return needLesson("explain");
  ask({
    title: `In plain words: ${lesson.title}`,
    text: lesson.explainSimply,
    actions: [{ label: "Got it", primary: true }],
    mood: "studying",
  });
}

export function giveHint(lesson?: Lesson): void {
  if (!lesson) return needLesson("hint");
  ask({
    title: "Hint",
    text: lesson.hint,
    detailLabel: "Now try to answer",
    detail: lesson.recall.q,
    actions: [
      {
        label: "Show answer",
        onSelect: () =>
          ask({
            title: `Answer: ${lesson.title}`,
            text: lesson.recall.q,
            detailLabel: "Answer",
            detail: lesson.recall.a,
            actions: [{ label: "Got it", primary: true }],
            mood: "happy",
          }),
      },
      { label: "Got it", primary: true },
    ],
    mood: "thinking",
  });
}

const SOURCE_TEXT: Record<RevisionSource, string> = {
  completed: "a lesson you finished",
  visited: "a lesson you opened",
  start: "the start of the course",
};

let lastRevisionSlug: string | null = null;

export function quickRevision(): void {
  const { completed, visits } = useProgressStore.getState();
  const pick = pickRevision(completed, visits, lastRevisionSlug);
  if (!pick) {
    ask({ text: "No revision questions yet. Finish a lesson and ask me again.", ms: 4000, focus: false });
    return;
  }
  const { lesson, source } = pick;
  lastRevisionSlug = lesson.slug;
  ask({
    title: `Quick revision: ${lesson.title}`,
    text: lesson.recall.q,
    detailLabel: "From",
    detail: `${SOURCE_TEXT[source]} (${label(lesson)})`,
    actions: [
      { label: "Reveal answer", primary: true, onSelect: () => revealRevision(lesson) },
      { label: "Skip" },
    ],
    mood: "thinking",
  });
}

function revealRevision(lesson: Lesson): void {
  ask({
    title: `Quick revision: ${lesson.title}`,
    text: lesson.recall.q,
    detailLabel: "Answer",
    detail: lesson.recall.a,
    actions: [
      {
        label: "Knew it",
        primary: true,
        onSelect: () => {
          useCompanionStore.getState().react("happy", 1400);
          companionBlip("happy");
        },
      },
      { label: "Review lesson", href: lessonHref(lesson) },
      { label: "Another", onSelect: quickRevision },
    ],
  });
}

export function topicSummary(lesson?: Lesson): void {
  if (!lesson) return needLesson("summary");
  const items: BubbleItem[] = [{ label: "Problem", text: lesson.problem }];
  if (lesson.breaks && lesson.breaks !== lesson.problem) items.push({ label: "What breaks", text: lesson.breaks });
  items.push({ label: "The fix", text: lesson.summary });
  if (lesson.tradeoffs) items.push({ label: "Trade-off", text: lesson.tradeoffs });
  ask({
    title: `Summary: ${label(lesson)}`,
    text: "The whole lesson in a few lines.",
    items,
    actions: [{ label: "Got it", primary: true }],
    mood: "studying",
  });
}

export function suggestNext(current?: Lesson): void {
  const { completed } = useProgressStore.getState();
  const next = nextAfter(current?.slug);
  if (!next) {
    ask({
      title: "Every lesson learned",
      text: `You have finished all ${lessons.length} lessons. Lock it in with the Test yourself deck.`,
      actions: [{ label: "Test yourself", href: "/learn/test-yourself", primary: true }, { label: "Later" }],
      mood: "celebrating",
    });
    return;
  }
  if (current && next.slug === current.slug) {
    const after = nextIncompleteLesson({ ...completed, [current.slug]: 1 }, current.slug);
    ask({
      title: "Next up",
      text: `Finish this one first: ${current.title}.${after ? ` After that, ${label(after)} (${after.minutes} min).` : " It is the last one left."}`,
      actions: after
        ? [{ label: `Preview ${after.title}`, href: lessonHref(after) }, { label: "Keep reading", primary: true }]
        : [{ label: "Keep reading", primary: true }],
      mood: "happy",
    });
    return;
  }
  ask({
    title: "Next up",
    text: `${label(next)} (${next.minutes} min). ${next.problem}`,
    actions: [{ label: `Open ${next.title}`, href: lessonHref(next), primary: true }, { label: "Later" }],
    mood: "happy",
  });
}

export function toggleFocus(): void {
  const focus = useFocusStore.getState();
  const say = useCompanionStore.getState().say;
  if (focus.session) {
    focus.stop();
    say({ text: LINES.focusStop, mood: "happy", ms: 3000, solicited: true });
    return;
  }
  focus.start(Date.now());
  say({ title: "Focus timer", text: LINES.focusStart, mood: "studying", ms: 4500, solicited: true });
}

export function hideCompanion(): void {
  useCompanionStore.getState().closeMenu();
  useCompanionStore.getState().dismiss();
  usePreferencesStore.getState().setCompanion({ enabled: false });
}

/* ------------------------------------------------------------------ play with Cache */

/** The topic line in meow-speak on a lesson page; a generic cute line elsewhere. */
export function meowLine(lesson?: Lesson): string {
  return (lesson && catMeows[lesson.slug]) || pick(LINES.meowGeneric);
}

export function meowAboutTopic(lesson?: Lesson): void {
  ask({
    title: lesson ? `Meow: ${lesson.title}` : "Meow",
    text: meowLine(lesson),
    actions: [{ label: "Purr", primary: true }],
    mood: "happy",
  });
}

function wakeIfNapping(): void {
  const s = useCompanionStore.getState();
  if (s.napping) s.setNapping(false);
}

let feedTimer = 0;

/** A fish appears, about two seconds of eating, then a happy "nom". */
export function feedCache(): void {
  wakeIfNapping();
  const s = useCompanionStore.getState();
  usePreferencesStore.getState().bumpCompanionStat("feeds");
  s.dismiss();
  s.react("eating", 2000);
  companionBlip("pop");
  window.clearTimeout(feedTimer);
  feedTimer = window.setTimeout(() => {
    const c = useCompanionStore.getState();
    c.react("happy", 1600);
    companionBlip("happy");
    c.say({ text: pick(LINES.nom), mood: "happy", ms: 3000, solicited: true });
  }, 2000);
}

/** Hearts and a purr. `speak` adds the topic meow (menu pet); hover-petting stays silent. */
export function petCache(lesson?: Lesson, speak = true): void {
  wakeIfNapping();
  const s = useCompanionStore.getState();
  usePreferencesStore.getState().bumpCompanionStat("pets");
  s.react("purring", 1900);
  companionBlip("happy");
  if (speak) s.say({ text: meowLine(lesson), mood: "purring", ms: 5000, solicited: true });
}

/** Nap until woken from the menu, by a tap or by a pet; ordinary scrolling does not wake her. */
export function toggleNap(): void {
  const s = useCompanionStore.getState();
  if (s.napping) {
    s.setNapping(false);
    s.react("happy", 900);
    s.say({ text: LINES.wake, mood: "happy", ms: 2600, solicited: true });
    return;
  }
  s.dismiss();
  s.setNapping(true);
  s.say({ text: LINES.napStart, mood: "sleeping", ms: 3000, solicited: true });
}

/** A yarn ball rolls along the floor; the companion component plays the chase (needs her position). */
export function playWithCache(): void {
  wakeIfNapping();
  usePreferencesStore.getState().bumpCompanionStat("plays");
  const s = useCompanionStore.getState();
  s.dismiss();
  s.startActivity("play");
  companionBlip("pop");
}

export function openWardrobe(): void {
  useCompanionStore.getState().setMenuView("wardrobe");
}
