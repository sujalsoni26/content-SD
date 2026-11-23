"use client";
import { useSyncExternalStore } from "react";

export function usePageVisible(): boolean {
  return useSyncExternalStore(
    (callback) => {
      document.addEventListener("visibilitychange", callback);
      return () => document.removeEventListener("visibilitychange", callback);
    },
    () => document.visibilityState === "visible",
    () => true,
  );
}
