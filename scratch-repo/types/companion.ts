export type CompanionMood =
  | "idle"
  | "sitting"
  | "walking"
  | "sleeping"
  | "studying"
  | "thinking"
  | "happy"
  | "celebrating"
  | "confused"
  | "dragged"
  | "eating"
  | "purring"
  | "playing";

export type AnimationLevel = "normal" | "reduced" | "off";

export interface CompanionPosition {
  /** Normalised 0..1 of the usable horizontal range. */
  x: number;
  /** Normalised 0..1 of the usable vertical range. */
  y: number;
  /** True when the cat rests on the floor (bottom of the viewport); restored there after refresh. */
  floor?: boolean;
}

export type AccessorySlot = "head" | "eyes" | "neck" | "body";

export type AccessoryId =
  | "bell-collar"
  | "bow-tie"
  | "gold-chain"
  | "bandana"
  | "party-hat"
  | "wizard-hat"
  | "graduation-cap"
  | "round-glasses"
  | "sunglasses"
  | "striped-sweater"
  | "hero-cape";

/** Play and focus counters, used to unlock accessories. */
export interface CompanionStats {
  feeds: number;
  pets: number;
  plays: number;
  focusSessions: number;
}

export interface CompanionSettings {
  enabled: boolean;
  animations: AnimationLevel;
  physics: boolean;
  studyTips: boolean;
  sound: boolean;
  position: CompanionPosition | null;
  stats: CompanionStats;
  /** One accessory per slot. */
  equipped: Partial<Record<AccessorySlot, AccessoryId>>;
  /** Accessories whose unlock has already been announced. */
  announced: AccessoryId[];
}

/** Events any part of the app can emit; the companion decides whether and how to react. */
export type CompanionEvent =
  | { type: "lesson-complete"; slug: string; moduleCompleted: boolean; courseCompleted: boolean }
  | { type: "quiz-answer"; correct: boolean }
  | { type: "quiz-finished"; score: number; total: number }
  | { type: "diagram"; mood: "happy" | "thinking" | "confused"; message?: string }
  | { type: "lesson-opened"; slug: string };
