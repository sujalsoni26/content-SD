import type { Metadata } from "next";
import { Roadmap } from "@/components/learning/roadmap";
import { lessons, totalMinutes } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Learning roadmap", description: "Every module and lesson, in order." };

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6" data-companion-avoid="">
      <header className="mb-10 animate-rise">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Learning roadmap</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
          One app, grown box by box
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-2">
          {lessons.length} lessons in six modules, about {Math.round(totalMinutes / 60)} hours. Follow the order: each module solves the problems the
          previous scale created. Knowledge checks are optional.
        </p>
      </header>
      <Roadmap />
    </div>
  );
}
