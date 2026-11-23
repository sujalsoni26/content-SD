import type { Metadata } from "next";
import { GlossaryBrowser } from "@/components/glossary/glossary-browser";
import { glossary } from "@/data/glossary";

export const metadata: Metadata = { title: "Glossary", description: "Every short form in the course, spelled out and explained." };

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6" data-companion-avoid="">
      <header className="mb-6 animate-rise">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Glossary</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
          {glossary.length} short forms, spelled out
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-2">
          In lessons, only the first mention of each term is underlined. Hover, focus or tap it for the full form. Mark a term as known
          to stop its hints.
        </p>
      </header>
      <GlossaryBrowser />
    </div>
  );
}
