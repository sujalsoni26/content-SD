import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { persistenceAdapter, STORAGE_KEYS } from "@/lib/storage/adapter";
import type {
  AccessoryId,
  AccessorySlot,
  AnimationLevel,
  CompanionPosition,
  CompanionSettings,
  CompanionStats,
} from "@/types/companion";

export type ThemePreference = "light" | "dark" | "system";

export interface PreferencesState {
  theme: ThemePreference;
  /** Glossary terms the learner knows; their inline hints are no longer shown. */
  knownTerms: string[];
  companion: CompanionSettings;
}

interface PreferencesActions {
  setTheme: (theme: ThemePreference) => void;
  setTermKnown: (term: string, known: boolean) => void;
  setCompanion: (patch: Partial<CompanionSettings>) => void;
  setCompanionPosition: (position: CompanionPosition | null) => void;
  setAnimations: (level: AnimationLevel) => void;
  resetCompanion: () => void;
  bumpCompanionStat: (stat: keyof CompanionStats) => void;
  /** Wear an accessory in its slot, or pass null to take the slot's accessory off. */
  equipAccessory: (slot: AccessorySlot, id: AccessoryId | null) => void;
  markAccessoriesAnnounced: (ids: AccessoryId[]) => void;
}

export const defaultCompanionStats: CompanionStats = { feeds: 0, pets: 0, plays: 0, focusSessions: 0 };

export const defaultCompanionSettings: CompanionSettings = {
  enabled: true,
  animations: "normal",
  physics: true,
  studyTips: true,
  sound: false,
  position: null,
  stats: defaultCompanionStats,
  equipped: {},
  announced: [],
};

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  persist(
    (set) => ({
      theme: "system",
      knownTerms: [],
      companion: defaultCompanionSettings,
      setTheme: (theme) => set({ theme }),
      setTermKnown: (term, known) =>
        set((s) => ({
          knownTerms: known ? Array.from(new Set([...s.knownTerms, term])) : s.knownTerms.filter((t) => t !== term),
        })),
      setCompanion: (patch) => set((s) => ({ companion: { ...s.companion, ...patch } })),
      setCompanionPosition: (position) => set((s) => ({ companion: { ...s.companion, position } })),
      setAnimations: (animations) => set((s) => ({ companion: { ...s.companion, animations } })),
      resetCompanion: () => set({ companion: defaultCompanionSettings }),
      bumpCompanionStat: (stat) =>
        set((s) => ({
          companion: { ...s.companion, stats: { ...s.companion.stats, [stat]: (s.companion.stats[stat] ?? 0) + 1 } },
        })),
      equipAccessory: (slot, id) =>
        set((s) => {
          const equipped = { ...s.companion.equipped };
          if (id) equipped[slot] = id;
          else delete equipped[slot];
          return { companion: { ...s.companion, equipped } };
        }),
      markAccessoriesAnnounced: (ids) =>
        set((s) => ({
          companion: { ...s.companion, announced: Array.from(new Set([...s.companion.announced, ...ids])) },
        })),
    }),
    {
      name: STORAGE_KEYS.preferences,
      version: 1,
      storage: createJSONStorage(() => persistenceAdapter),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PreferencesState>;
        const c: Partial<CompanionSettings> = p.companion ?? {};
        return {
          ...current,
          ...p,
          companion: {
            ...defaultCompanionSettings,
            ...c,
            stats: { ...defaultCompanionStats, ...(c.stats ?? {}) },
            equipped: c.equipped ?? {},
            announced: c.announced ?? [],
          },
        };
      },
    },
  ),
);
