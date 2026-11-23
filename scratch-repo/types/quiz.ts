import type { ModuleId } from "./curriculum";

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index into options. */
  answer: number;
  explanation: string;
  /** Lesson the question checks, for "review this" links. */
  lessonSlug: string;
}

export interface KnowledgeCheck {
  id: string;
  title: string;
  moduleId: ModuleId;
  /** The lesson after which this check is offered. */
  afterLesson: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  checkId: string;
  score: number;
  total: number;
  /** Selected option index per question id. */
  answers: Record<string, number>;
  completedAt: number;
}

export interface RecallCard {
  q: string;
  a: string;
  lessonSlug: string;
}
