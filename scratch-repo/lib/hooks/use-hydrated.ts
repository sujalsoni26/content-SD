"use client";
import { useSyncExternalStore } from "react";
import { useProgressStore } from "@/stores/progress-store";
import { usePreferencesStore } from "@/stores/preferences-store";

function subscribe(callback: () => void) {
  const a = useProgressStore.persist.onFinishHydration(callback);
  const b = usePreferencesStore.persist.onFinishHydration(callback);
  return () => {
    a();
    b();
  };
}
const getSnapshot = () => useProgressStore.persist.hasHydrated() && usePreferencesStore.persist.hasHydrated();
const getServerSnapshot = () => false;

/** True once persisted stores have loaded on the client. Render progress-dependent UI only after this. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
