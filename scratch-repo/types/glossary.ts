export interface GlossaryEntry {
  term: string;
  full: string;
  note: string;
  /** Lesson where the term is introduced. */
  lessonSlug: string;
}
