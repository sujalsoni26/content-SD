import { usePreferencesStore } from "@/stores/preferences-store";

/*
 * Tiny WebAudio blips. No audio files. The AudioContext is created lazily on the first blip, which
 * only happens after the learner switched Sound on (a click, so browsers allow audio).
 */

export type Blip = "pop" | "happy" | "soft" | "chime";

/** [frequency Hz, start s, duration s] */
const NOTES: Record<Blip, ReadonlyArray<readonly [number, number, number]>> = {
  pop: [[660, 0, 0.06]],
  happy: [
    [659.25, 0, 0.07],
    [880, 0.08, 0.09],
  ],
  soft: [[392, 0, 0.12]],
  chime: [
    [523.25, 0, 0.16],
    [659.25, 0.14, 0.22],
  ],
};

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

/** Play a blip regardless of settings (used right after the learner turns sound on). */
export function playBlip(kind: Blip, volume = 0.045): void {
  try {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime + 0.01;
    for (const [freq, at, dur] of NOTES[kind]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + at);
      gain.gain.setValueAtTime(0, now + at);
      gain.gain.linearRampToValueAtTime(volume, now + at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + dur + 0.02);
    }
  } catch {
    // Audio is a nicety; never let it break the page.
  }
}

/** Play a blip only when the learner enabled companion sound and the tab is visible. */
export function companionBlip(kind: Blip): void {
  const { enabled, sound } = usePreferencesStore.getState().companion;
  if (!enabled || !sound || document.visibilityState !== "visible") return;
  playBlip(kind);
}
