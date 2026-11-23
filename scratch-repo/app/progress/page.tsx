import type { Metadata } from "next";
import { CompanionSettingsPanel } from "@/components/companion/companion-settings-panel";
import { BookmarkList, RecentlyStudied } from "@/components/learning/dashboard-widgets";
import { GeneralSettings, ProgressOverview } from "@/components/learning/progress-overview";

export const metadata: Metadata = { title: "Progress", description: "Lessons learned, quiz results, bookmarks and settings." };

export default function ProgressPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6">
      <header className="animate-rise">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Progress</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
          How far you have come
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-2">Everything is saved in this browser and survives restarts. Nothing is sent anywhere.</p>
      </header>
      <ProgressOverview />
      <div className="grid gap-6 md:grid-cols-2">
        <RecentlyStudied />
        <BookmarkList />
      </div>
      <GeneralSettings />
      <section aria-labelledby="companion-settings-h">
        <h2 id="companion-settings-h" className="mb-4 font-display text-2xl font-bold text-ink">
          Companion settings
        </h2>
        <CompanionSettingsPanel />
      </section>
    </div>
  );
}
