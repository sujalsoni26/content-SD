import Link from "next/link";
import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { KnowledgeCheck } from "@/components/quiz/knowledge-check";
import { LevelChip } from "@/components/ui/chip";
import { getAdjacentLessons, getModule, knowledgeCheckAfter } from "@/lib/curriculum";
import type { LessonHeading } from "@/lib/lesson-headings";
import type { Lesson } from "@/types/curriculum";
import { BookmarkButton, CompletedChip, LessonVisitTracker, MarkCompleteButton } from "./lesson-actions";
import { LessonNavigation } from "./lesson-navigation";
import { LessonSidebar } from "./lesson-sidebar";
import { OnThisPage, ReadingProgress } from "./on-this-page";
import { RecallCard } from "./recall-card";
import { TeachingStrip } from "./teaching-strip";

export function LessonLayout({ lesson, headings, children }: { lesson: Lesson; headings: LessonHeading[]; children: ReactNode }) {
  const courseModule = getModule(lesson.moduleId);
  const { prev, next } = getAdjacentLessons(lesson.slug);
  const check = knowledgeCheckAfter(lesson.slug);

  return (
    <>
      <ReadingProgress />
      <LessonVisitTracker slug={lesson.slug} />
      <div className="mx-auto grid max-w-[90rem] gap-x-10 px-4 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_13rem]">
        <aside data-companion-avoid="" className="sticky top-16 hidden h-[calc(100dvh-4rem)] overflow-y-auto py-8 pr-2 lg:block">
          <LessonSidebar moduleId={lesson.moduleId} currentSlug={lesson.slug} />
        </aside>

        <article data-companion-avoid="" className="min-w-0 max-w-[46rem] py-8 sm:py-10">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-x-2 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-ink-3">
            <Link href="/learn" className="hover:text-accent">
              Learn
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/learn#${courseModule.id}`} className="hover:text-accent">
              {courseModule.number}. {courseModule.title}
            </Link>
          </nav>

          <header className="mb-7">
            <p className="font-mono text-sm font-semibold text-accent">Lesson {lesson.number}</p>
            <h1 className="mt-1 font-display text-[clamp(2rem,4.6vw,2.9rem)] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink">{lesson.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <LevelChip level={lesson.level} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.72rem] font-semibold text-ink-2">
                <Clock aria-hidden="true" className="size-3.5" /> {lesson.minutes} min
              </span>
              <BookmarkButton slug={lesson.slug} title={lesson.title} />
              <CompletedChip slug={lesson.slug} />
            </div>
          </header>

          <details className="group mb-6 rounded-xl border border-line bg-surface px-4 py-2 lg:hidden" data-companion-avoid="">
            <summary className="cursor-pointer py-1 font-bold text-ink-2 group-open:mb-2">Course outline</summary>
            <LessonSidebar moduleId={lesson.moduleId} currentSlug={lesson.slug} />
          </details>

          <TeachingStrip lesson={lesson} />

          <div className="text-[1.06rem] leading-[1.75] text-ink">{children}</div>

          <RecallCard recall={lesson.recall} hint={lesson.hint} />
          {check ? <KnowledgeCheck check={check} /> : null}
          <MarkCompleteButton lesson={lesson} />
          <LessonNavigation prev={prev} next={next} />
        </article>

        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] overflow-y-auto py-10 xl:block" data-companion-avoid="">
          <OnThisPage headings={headings} />
        </aside>
      </div>
    </>
  );
}
