import { getLesson, lessons } from "@/lib/curriculum";
import type { Lesson } from "@/types/curriculum";

const LESSON_PATH = /^\/learn\/([^/?#]+)\/?$/;

/** The lesson shown at `/learn/<slug>`, if the pathname is a lesson page. */
export function lessonFromPath(pathname: string | null | undefined): Lesson | undefined {
  const match = pathname ? LESSON_PATH.exec(pathname) : null;
  if (!match) return undefined;
  try {
    return getLesson(decodeURIComponent(match[1]));
  } catch {
    return undefined;
  }
}

export type RevisionSource = "completed" | "visited" | "start";

export interface RevisionPick {
  lesson: Lesson;
  source: RevisionSource;
  /** How many lessons the question was drawn from. */
  poolSize: number;
}

/**
 * A Quick Revision question: drawn from finished lessons, else visited ones, else the first few.
 * Avoids repeating `avoidSlug` when there is a choice.
 */
export function pickRevision(
  completed: Record<string, number>,
  visits: Record<string, number>,
  avoidSlug?: string | null,
): RevisionPick | null {
  const withRecall = lessons.filter((l) => l.recall?.q && l.recall?.a);
  let source: RevisionSource = "completed";
  let pool = withRecall.filter((l) => completed[l.slug]);
  if (!pool.length) {
    source = "visited";
    pool = withRecall.filter((l) => visits[l.slug]);
  }
  if (!pool.length) {
    source = "start";
    pool = withRecall.slice(0, 3);
  }
  if (!pool.length) return null;
  const choices = pool.length > 1 && avoidSlug ? pool.filter((l) => l.slug !== avoidSlug) : pool;
  const lesson = choices[Math.floor(Math.random() * choices.length)];
  return { lesson, source, poolSize: pool.length };
}
