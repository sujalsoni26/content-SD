import Link from "next/link";
import { Library } from "lucide-react";
import { CompanionSettingsPanel } from "@/components/companion/companion-settings-panel";
import { InteractiveDiagram } from "@/components/diagrams/interactive";
import {
  BookmarkList,
  ContinueLearning,
  OverallProgressCard,
  PracticeTeaser,
  RecentlyStudied,
  RoadmapModules,
} from "@/components/learning/dashboard-widgets";
import { glossary } from "@/data/glossary";
import { lessons, totalMinutes } from "@/lib/curriculum";

function SectionHead({ eyebrow, title, children, id }: { eyebrow: string; title: string; children?: React.ReactNode; id: string }) {
  return (
    <div className="mb-5">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">{eyebrow}</p>
      <h2 id={id} className="mt-1 font-display text-[clamp(1.5rem,3vw,2rem)] font-extrabold tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {children ? <p className="mt-1.5 max-w-2xl text-ink-2">{children}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-[78rem] flex-col gap-16 px-4 py-10 sm:px-6">
      <section aria-labelledby="hero-h" className="grid animate-rise gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">System design · beginner to advanced</p>
            <h1 id="hero-h" className="mt-2 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink">
              Every{" "}
              <span className="inline-block -rotate-1 rounded-[0.14em] border-[3px] border-ink bg-surface px-[0.12em] shadow-[4px_4px_0_var(--accent)]">box</span>{" "}
              exists because a problem <span className="text-accent">forced it in.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">
              Grow one Instagram-like app from a single server to millions of users. Each lesson starts with what breaks, adds the building
              block that fixes it, and names what it costs.
            </p>
            <p className="mt-3 font-mono text-sm text-ink-3">
              {lessons.length} lessons · 6 modules · about {Math.round(totalMinutes / 60)} hours · 25 interactive diagrams
            </p>
          </div>
          <ContinueLearning />
        </div>
        <OverallProgressCard />
      </section>

      <section aria-labelledby="roadmap-h">
        <SectionHead eyebrow="Learning roadmap" title="From one server to millions, in order" id="roadmap-h">
          Each module adds the building blocks the previous scale forced in.
        </SectionHead>
        <RoadmapModules />
      </section>

      <section aria-labelledby="blueprint-h">
        <SectionHead eyebrow="Your blueprint" title="The architecture you are building" id="blueprint-h" />
        <InteractiveDiagram name="architecture-map" variant="dashboard" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentlyStudied />
        <BookmarkList />
        <div className="flex flex-col gap-6">
          <PracticeTeaser />
          <section aria-labelledby="glossary-h" className="rounded-3xl border border-line bg-surface p-6">
            <h2 id="glossary-h" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Library aria-hidden="true" className="size-5 text-accent" /> Glossary
            </h2>
            <p className="mt-2 text-sm text-ink-2">
              {glossary.length} short forms spelled out, from ACID to VM. In lessons, only the first mention of a term is underlined.
            </p>
            <Link href="/glossary" className="mt-3 inline-block text-sm font-bold text-accent underline underline-offset-2">
              Browse the glossary
            </Link>
          </section>
        </div>
      </div>

      <section aria-labelledby="companion-h">
        <SectionHead eyebrow="Study companion" title="Cache, the study cat" id="companion-h">
          Cache explains, hints, quizzes you on finished lessons and runs a focus timer. Drag Cache anywhere, or switch it off.
        </SectionHead>
        <CompanionSettingsPanel />
      </section>
    </div>
  );
}
