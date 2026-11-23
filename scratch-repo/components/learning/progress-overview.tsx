"use client";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stat, StatGrid } from "@/components/ui/stat";
import { knowledgeChecks, lessons, modules, moduleProgress, overallProgress } from "@/lib/curriculum";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { usePreferencesStore, type ThemePreference } from "@/stores/preferences-store";
import { useProgressStore } from "@/stores/progress-store";

export function ProgressOverview() {
  const hydrated = useHydrated();
  const state = useProgressStore();
  const completed = hydrated ? state.completed : {};
  const overall = overallProgress(completed);
  const minutesDone = lessons.filter((l) => completed[l.slug]).reduce((s, l) => s + l.minutes, 0);
  const attempts = hydrated ? Object.values(state.quizAttempts).flat() : [];
  const checksTaken = hydrated ? Object.keys(state.quizAttempts).length : 0;

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="summary-h">
        <h2 id="summary-h" className="sr-only">
          Summary
        </h2>
        <ProgressBar value={overall.fraction} label="Overall progress" valueText={`${overall.done} of ${overall.total} lessons`} />
        <StatGrid className="mt-4">
          <Stat label="Lessons learned" value={`${overall.done}/${overall.total}`} tone="good" />
          <Stat label="Reading done" value={`${Math.round(minutesDone / 6) / 10} h`} />
          <Stat label="Checks taken" value={`${checksTaken}/${knowledgeChecks.length}`} tone="violet" />
          <Stat label="Quiz attempts" value={attempts.length} />
          <Stat label="Bookmarks" value={hydrated ? state.bookmarks.length : 0} tone="amber" />
        </StatGrid>
      </section>

      <section aria-labelledby="modules-h">
        <h2 id="modules-h" className="font-display text-2xl font-bold text-ink">
          Modules
        </h2>
        <ul className="mt-4 grid gap-3">
          {modules.map((m) => {
            const p = moduleProgress(m.id, completed);
            return (
              <li key={m.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/learn#${m.id}`} className="font-display font-bold text-ink hover:text-accent">
                    {m.number}. {m.title}
                  </Link>
                  <span className="font-mono text-sm tabular-nums text-ink-2">
                    {p.done}/{p.total}
                  </span>
                </div>
                <ProgressBar value={p.fraction} label={`${m.title} progress`} size="sm" tone="good" />
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="quiz-h">
        <h2 id="quiz-h" className="font-display text-2xl font-bold text-ink">
          Knowledge check results
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 text-left font-mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-3">
                <th className="px-4 py-2.5">Check</th>
                <th className="px-4 py-2.5">Attempts</th>
                <th className="px-4 py-2.5">Best</th>
                <th className="px-4 py-2.5">Last</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeChecks.map((c) => {
                const list = hydrated ? (state.quizAttempts[c.id] ?? []) : [];
                const best = list.length ? Math.max(...list.map((a) => a.score)) : null;
                const last = list[list.length - 1];
                return (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-bold text-ink">
                      <Link href={`/learn/${c.afterLesson}`} className="hover:text-accent">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{list.length}</td>
                    <td className="px-4 py-2.5 tabular-nums">{best === null ? "–" : `${best}/${c.questions.length}`}</td>
                    <td className="px-4 py-2.5 tabular-nums">{last ? `${last.score}/${last.total}` : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export function GeneralSettings() {
  const hydrated = useHydrated();
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const knownTerms = usePreferencesStore((s) => s.knownTerms);
  const resetProgress = useProgressStore((s) => s.reset);
  const [message, setMessage] = useState("");

  return (
    <section aria-labelledby="settings-h" className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5">
      <h2 id="settings-h" className="font-display text-2xl font-bold text-ink">
        Settings
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-28 text-sm font-bold text-ink-2">Theme</span>
        <SegmentedControl<ThemePreference> label="Theme" options={THEMES} value={hydrated ? theme : "system"} onChange={setTheme} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-28 text-sm font-bold text-ink-2">Term hints</span>
        <span className="text-sm text-ink-2">
          {hydrated && knownTerms.length ? `${knownTerms.length} terms marked as known.` : "All glossary terms are hinted on first mention."}
        </span>
        {hydrated && knownTerms.length ? (
          <button
            type="button"
            className="text-sm font-bold text-accent underline underline-offset-2"
            onClick={() => knownTerms.forEach((t) => usePreferencesStore.getState().setTermKnown(t, false))}
          >
            Hint all terms again
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-line pt-5">
        <ConfirmDialog
          trigger="Reset progress"
          title="Reset all progress?"
          description="This clears completed lessons, quiz results, bookmarks and flashcard progress in this browser. Settings and the companion stay as they are."
          confirmLabel="Reset progress"
          onConfirm={() => {
            resetProgress();
            setMessage("Progress reset.");
          }}
        />
        <p className="text-sm text-ink-3" aria-live="polite">
          {message}
        </p>
      </div>
    </section>
  );
}
