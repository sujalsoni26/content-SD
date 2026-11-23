"use client";
import { Moon, Sun } from "lucide-react";
import { useResolvedTheme } from "@/lib/hooks/use-resolved-theme";
import { usePreferencesStore } from "@/stores/preferences-store";

export function ThemeToggle() {
  const resolved = useResolvedTheme();
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="grid size-10 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {resolved === "dark" ? <Moon aria-hidden="true" className="size-5" /> : <Sun aria-hidden="true" className="size-5" />}
    </button>
  );
}
