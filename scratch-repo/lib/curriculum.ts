import { lessonMeta, modules } from "@/data/curriculum";
import { lessonGuides } from "@/data/lesson-guides";
import { knowledgeChecks } from "@/data/quizzes";
import type { CourseModule, Lesson, LessonGuide, ModuleId } from "@/types/curriculum";
import type { KnowledgeCheck } from "@/types/quiz";

const metaBySlug = new Map(lessonMeta.map((m) => [m.slug, m]));

function guideFor(slug: string): LessonGuide {
  const meta = metaBySlug.get(slug);
  const g = lessonGuides[slug];
  return {
    breaks: g?.breaks ?? meta?.problem ?? "",
    tradeoffs: g?.tradeoffs ?? "",
    explainSimply: g?.explainSimply ?? meta?.summary ?? "",
    hint: g?.hint ?? "Re-read the problem at the top of the lesson; the answer grows out of it.",
  };
}

/** All lessons in learning order, with module-relative numbers like "4.2". */
export const lessons: Lesson[] = modules.flatMap((m) =>
  m.lessons.map((slug, i) => {
    const meta = metaBySlug.get(slug);
    if (!meta) throw new Error(`Lesson "${slug}" is listed in module "${m.id}" but has no metadata.`);
    return { ...meta, ...guideFor(slug), number: `${m.number}.${i + 1}`, index: 0 };
  }),
).map((l, index) => ({ ...l, index }));

const lessonBySlug = new Map(lessons.map((l) => [l.slug, l]));
const moduleById = new Map(modules.map((m) => [m.id, m]));

export { modules };

export function getLesson(slug: string): Lesson | undefined {
  return lessonBySlug.get(slug);
}

export function getModule(id: ModuleId): CourseModule {
  const m = moduleById.get(id);
  if (!m) throw new Error(`Unknown module ${id}`);
  return m;
}

export function getModuleLessons(id: ModuleId): Lesson[] {
  return getModule(id).lessons.map((slug) => lessonBySlug.get(slug)!).filter(Boolean);
}

export function getAdjacentLessons(slug: string): { prev?: Lesson; next?: Lesson } {
  const l = lessonBySlug.get(slug);
  if (!l) return {};
  return { prev: lessons[l.index - 1], next: lessons[l.index + 1] };
}

export interface ProgressSummary {
  done: number;
  total: number;
  fraction: number;
}

export function summarize(slugs: string[], completed: Record<string, number>): ProgressSummary {
  const done = slugs.filter((s) => completed[s]).length;
  return { done, total: slugs.length, fraction: slugs.length ? done / slugs.length : 0 };
}

export function overallProgress(completed: Record<string, number>): ProgressSummary {
  return summarize(
    lessons.map((l) => l.slug),
    completed,
  );
}

export function moduleProgress(id: ModuleId, completed: Record<string, number>): ProgressSummary {
  return summarize(getModule(id).lessons, completed);
}

/** The next lesson to study: the first incomplete one after `from`, else the first incomplete overall. */
export function nextIncompleteLesson(completed: Record<string, number>, from?: string | null): Lesson | undefined {
  const start = from ? (lessonBySlug.get(from)?.index ?? 0) : 0;
  return lessons.slice(start).find((l) => !completed[l.slug]) ?? lessons.find((l) => !completed[l.slug]);
}

export function knowledgeCheckAfter(slug: string): KnowledgeCheck | undefined {
  return knowledgeChecks.find((c) => c.afterLesson === slug);
}

export function getKnowledgeCheck(id: string): KnowledgeCheck | undefined {
  return knowledgeChecks.find((c) => c.id === id);
}

export { knowledgeChecks };

export const totalMinutes = lessons.reduce((sum, l) => sum + l.minutes, 0);
