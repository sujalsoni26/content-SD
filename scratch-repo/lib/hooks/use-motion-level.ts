"use client";
import { useMediaQuery } from "./use-media-query";
import { usePreferencesStore } from "@/stores/preferences-store";
import type { AnimationLevel } from "@/types/companion";

/**
 * Effective animation level: the stricter of the OS setting (prefers-reduced-motion)
 * and the learner's Animations setting.
 */
export function useMotionLevel(): AnimationLevel {
  const osReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const setting = usePreferencesStore((s) => s.companion.animations);
  if (setting === "off") return "off";
  if (osReduced || setting === "reduced") return "reduced";
  return "normal";
}

/** True when decorative or continuous motion should be skipped. */
export function useReducedMotion(): boolean {
  return useMotionLevel() !== "normal";
}
