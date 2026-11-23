export type Level = "basic" | "intermediate" | "advanced";

export type ModuleId =
  | "foundations"
  | "scaling"
  | "communication"
  | "data"
  | "reliability"
  | "practice"
  // Advanced tracks and design practice (added by the system-design-content-pack).
  | "distributed"
  | "internals"
  | "streaming"
  | "operations"
  | "security"
  | "infrastructure"
  | "architecture"
  | "hld"
  | "lld"
  | "lld-practice";

/** Boxes of the final architecture that a lesson "lights up". */
export type ArchNodeId =
  | "users"
  | "dns"
  | "gateway"
  | "cdn"
  | "feed"
  | "post"
  | "chat"
  | "cache"
  | "queue"
  | "workers"
  | "db"
  | "storage";

export interface RecallPrompt {
  q: string;
  a: string;
}

/** Core lesson metadata (data/curriculum.ts). The lesson body lives in content/lessons/<slug>.mdx. */
export interface LessonMeta {
  slug: string;
  title: string;
  moduleId: ModuleId;
  level: Level;
  minutes: number;
  /** The problem that forced this building block in. */
  problem: string;
  /** The building block / fix, in one or two sentences. */
  summary: string;
  /** Short, playful line the companion can say on this lesson. */
  catTip: string;
  /** Active-recall prompt shown at the end of the lesson and used for Quick Revision. */
  recall: RecallPrompt;
  /** Final-architecture boxes this lesson contributes to. */
  archNodes: ArchNodeId[];
}

/** Teaching guidance authored per lesson (data/lesson-guides.ts). */
export interface LessonGuide {
  /** What breaks without this building block (1 sentence). */
  breaks: string;
  /** The key trade-off it introduces (1 sentence). */
  tradeoffs: string;
  /** Plain-language explanation for "Explain simply" (2–3 short sentences, no jargon). */
  explainSimply: string;
  /** A nudge toward the recall answer without giving it away. */
  hint: string;
}

export type Lesson = LessonMeta & LessonGuide & { number: string; index: number };

export interface CourseModule {
  id: ModuleId;
  number: number;
  title: string;
  tagline: string;
  /** Where the growing system is at this point, e.g. "10k users". */
  stage: string;
  description: string;
  lessons: string[];
}
