import { lessons, moduleProgress, modules } from "@/lib/curriculum";
import type { QuizAttempt } from "@/types/quiz";
import type { AccessoryId, AccessorySlot, CompanionStats } from "@/types/companion";

/*
 * Wardrobe rewards. Every unlock is derived from real stored data: the progress store (completed
 * lessons, quiz attempts, known flashcards) and the companion's play and focus counters.
 */

export interface RewardContext {
  lessonsDone: number;
  modulesDone: number;
  /** Knowledge checks with at least one perfect attempt. */
  perfectChecks: number;
  knownCards: number;
  feedsAndPlays: number;
  focusSessions: number;
}

export interface AccessoryDef {
  id: AccessoryId;
  slot: AccessorySlot;
  name: string;
  /** What unlocks it, in words. */
  requirement: string;
  /** Unit for the progress label, e.g. "lessons" in "3/5 lessons". */
  unit: string;
  target: number;
  value: (ctx: RewardContext) => number;
}

export const SLOTS: readonly AccessorySlot[] = ["head", "eyes", "neck", "body"];
export const SLOT_LABEL: Record<AccessorySlot, string> = { head: "Head", eyes: "Eyes", neck: "Neck", body: "Body" };

export const ACCESSORIES: readonly AccessoryDef[] = [
  { id: "bell-collar", slot: "neck", name: "Bell collar", requirement: "Finish your first lesson", unit: "lesson", target: 1, value: (c) => c.lessonsDone },
  { id: "bow-tie", slot: "neck", name: "Bow tie", requirement: "Complete a focus session", unit: "focus session", target: 1, value: (c) => c.focusSessions },
  { id: "gold-chain", slot: "neck", name: "Gold chain", requirement: "Perfect score on 3 different knowledge checks", unit: "perfect checks", target: 3, value: (c) => c.perfectChecks },
  { id: "bandana", slot: "neck", name: "Bandana", requirement: "Play with or feed Cache 5 times", unit: "treats and games", target: 5, value: (c) => c.feedsAndPlays },
  { id: "party-hat", slot: "head", name: "Party hat", requirement: "Finish 5 lessons", unit: "lessons", target: 5, value: (c) => c.lessonsDone },
  { id: "wizard-hat", slot: "head", name: "Wizard hat", requirement: "Complete any module", unit: "module", target: 1, value: (c) => c.modulesDone },
  { id: "graduation-cap", slot: "head", name: "Graduation cap", requirement: "Finish every lesson", unit: "lessons", target: lessons.length, value: (c) => c.lessonsDone },
  { id: "round-glasses", slot: "eyes", name: "Round glasses", requirement: "Perfect score on any knowledge check", unit: "perfect check", target: 1, value: (c) => c.perfectChecks },
  { id: "sunglasses", slot: "eyes", name: "Sunglasses", requirement: "Mark 10 flashcards as known", unit: "cards", target: 10, value: (c) => c.knownCards },
  { id: "striped-sweater", slot: "body", name: "Striped sweater", requirement: "Finish 20 lessons", unit: "lessons", target: 20, value: (c) => c.lessonsDone },
  { id: "hero-cape", slot: "body", name: "Hero cape", requirement: "Complete 3 modules", unit: "modules", target: 3, value: (c) => c.modulesDone },
];

const byId = new Map(ACCESSORIES.map((a) => [a.id, a]));

export function getAccessory(id: AccessoryId): AccessoryDef | undefined {
  return byId.get(id);
}

export function rewardContext(
  progress: { completed: Record<string, number>; quizAttempts: Record<string, QuizAttempt[]>; knownCards: Record<string, number[]> },
  stats: CompanionStats,
): RewardContext {
  const lessonsDone = lessons.filter((l) => progress.completed[l.slug]).length;
  const modulesDone = modules.filter((m) => moduleProgress(m.id, progress.completed).fraction === 1).length;
  const perfectChecks = Object.values(progress.quizAttempts).filter((attempts) =>
    attempts.some((a) => a.total > 0 && a.score === a.total),
  ).length;
  const knownCards = Object.values(progress.knownCards).reduce((sum, cards) => sum + cards.length, 0);
  return {
    lessonsDone,
    modulesDone,
    perfectChecks,
    knownCards,
    feedsAndPlays: (stats.feeds ?? 0) + (stats.plays ?? 0),
    focusSessions: stats.focusSessions ?? 0,
  };
}

export function isUnlocked(def: AccessoryDef, ctx: RewardContext): boolean {
  return def.value(ctx) >= def.target;
}

/** "3/5 lessons" */
export function progressLabel(def: AccessoryDef, ctx: RewardContext): string {
  return `${Math.min(def.value(ctx), def.target)}/${def.target} ${def.unit}`;
}

export function unlockedIds(ctx: RewardContext): AccessoryId[] {
  return ACCESSORIES.filter((a) => isUnlocked(a, ctx)).map((a) => a.id);
}

/** Stable "slot:id" list for the root's data-accessories attribute. */
export function equippedAttr(equipped: Partial<Record<AccessorySlot, AccessoryId>>): string {
  return SLOTS.filter((s) => equipped[s])
    .map((s) => `${s}:${equipped[s]}`)
    .join(",");
}
