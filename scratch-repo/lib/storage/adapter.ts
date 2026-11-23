import type { StateStorage } from "zustand/middleware";

/**
 * Persistence boundary for every store. Today it is localStorage; later an authenticated
 * server adapter can implement the same (optionally async) interface without touching the UI.
 */
export type PersistenceAdapter = StateStorage;

const memory = new Map<string, string>();

/** localStorage with a silent in-memory fallback (private mode, blocked storage). */
export const localStorageAdapter: PersistenceAdapter = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      memory.set(name, value);
    }
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name);
    } catch {
      memory.delete(name);
    }
  },
};

/** The adapter the app uses. Swap this export to move persistence to a server. */
export const persistenceAdapter: PersistenceAdapter = localStorageAdapter;

export const STORAGE_KEYS = {
  progress: "sdn-progress-v1",
  preferences: "sdn-preferences-v1",
  focus: "sdn-focus-v1",
} as const;
