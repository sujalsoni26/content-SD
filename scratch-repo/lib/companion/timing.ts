/** Behaviour timings. Reactions are meant to stay subtle and infrequent. */
export const TIMING = {
  /** No input for this long: the cat settles into a quiet sit. */
  settleMs: 45_000,
  /** No input for this long: the cat curls up and sleeps. */
  sleepMs: 120_000,
  /** A nap at least this long earns a "welcome back" tip on wake-up (when tips are on). */
  longNapMs: 5 * 60_000,
  /** Minimum gap between unsolicited bubbles (tips, nudges, diagram comments). */
  nudgeGapMs: 90_000,
  /** Minimum gap between quiz-answer bubbles (the pose still reacts every time). */
  quizBubbleGapMs: 20_000,
  /** Minimum gap between reactions to diagram events. */
  diagramGapMs: 45_000,
  /** Delay before a lesson tip, so it does not compete with the page loading in. */
  tipDelayMs: 2_500,
  /** Delay before the once-per-session greeting. */
  greetingDelayMs: 1_600,
  /** Focus-timer notifications older than this (after a long absence) are skipped. */
  focusEventFreshMs: 10 * 60_000,
} as const;
