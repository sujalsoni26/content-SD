import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { persistenceAdapter, STORAGE_KEYS } from "@/lib/storage/adapter";
import type { QuizAttempt } from "@/types/quiz";

export interface ProgressState {
  /** slug -> completion timestamp */
  completed: Record<string, number>;
  /** slug -> last visit timestamp */
  visits: Record<string, number>;
  currentLesson: string | null;
  lastVisited: string | null;
  quizAttempts: Record<string, QuizAttempt[]>;
  bookmarks: string[];
  /** Recall cards the learner marked as known, per deck. */
  knownCards: Record<string, number[]>;
}

interface ProgressActions {
  visit: (slug: string) => void;
  leaveLesson: () => void;
  setCompleted: (slug: string, done: boolean) => void;
  /** Stores a finished attempt; the store stamps `completedAt`. */
  recordQuizAttempt: (attempt: Omit<QuizAttempt, "completedAt">) => void;
  toggleBookmark: (slug: string) => void;
  setCardKnown: (deck: string, index: number, known: boolean) => void;
  reset: () => void;
}

const initialProgress: ProgressState = {
  completed: {},
  visits: {},
  currentLesson: null,
  lastVisited: null,
  quizAttempts: {},
  bookmarks: [],
  knownCards: {},
};

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set) => ({
      ...initialProgress,
      visit: (slug) =>
        set((s) => ({ currentLesson: slug, lastVisited: slug, visits: { ...s.visits, [slug]: Date.now() } })),
      leaveLesson: () => set({ currentLesson: null }),
      setCompleted: (slug, done) =>
        set((s) => {
          const completed = { ...s.completed };
          if (done) completed[slug] = Date.now();
          else delete completed[slug];
          return { completed };
        }),
      recordQuizAttempt: (attempt) =>
        set((s) => ({
          quizAttempts: {
            ...s.quizAttempts,
            [attempt.checkId]: [...(s.quizAttempts[attempt.checkId] ?? []), { ...attempt, completedAt: Date.now() }].slice(-10),
          },
        })),
      toggleBookmark: (slug) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(slug) ? s.bookmarks.filter((b) => b !== slug) : [...s.bookmarks, slug],
        })),
      setCardKnown: (deck, index, known) =>
        set((s) => {
          const current = new Set(s.knownCards[deck] ?? []);
          if (known) current.add(index);
          else current.delete(index);
          return { knownCards: { ...s.knownCards, [deck]: [...current].sort((a, b) => a - b) } };
        }),
      reset: () => set({ ...initialProgress }),
    }),
    {
      name: STORAGE_KEYS.progress,
      version: 1,
      storage: createJSONStorage(() => persistenceAdapter),
      skipHydration: true,
      partialize: (s) => ({
        completed: s.completed,
        visits: s.visits,
        currentLesson: s.currentLesson,
        lastVisited: s.lastVisited,
        quizAttempts: s.quizAttempts,
        bookmarks: s.bookmarks,
        knownCards: s.knownCards,
      }),
    },
  ),
);
