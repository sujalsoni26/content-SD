import type { Metadata } from "next";
import Link from "next/link";
import { InteractiveDiagram } from "@/components/diagrams/interactive";
import { KnowledgeCheck } from "@/components/quiz/knowledge-check";
import { buttonClasses } from "@/components/ui/button";
import { recallDecks } from "@/data/recall";
import { getModule, knowledgeChecks } from "@/lib/curriculum";

export const metadata: Metadata = { title: "Practice", description: "Knowledge checks, flashcards, estimation and architecture exercises." };

const EXERCISES = [
  {
    title: "Design a URL shortener",
    body: "Requirements, estimation, API, data model, then three deep dives: unique codes, 301 vs 302, and hot links.",
    href: "/learn/url-shortener",
  },
  {
    title: "Follow the interview framework",
    body: "Seven steps from functional requirements to deep dives. Practise saying each assumption out loud.",
    href: "/learn/playbook",
  },
  {
    title: "Justify every box",
    body: "Open the final architecture and, for each box, name the problem that forced it in before you check.",
    href: "/learn/final-architecture",
  },
  {
    title: "Classify the system shape",
    body: "Read-heavy, storage-heavy or write-heavy? The shape decides between caching, CDNs and append-only logs.",
    href: "/learn/system-shapes",
  },
];

export default function PracticePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-10 sm:px-6">
      <header className="animate-rise">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Practice</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] font-extrabold leading-tight tracking-[-0.03em] text-ink">
          Make it stick
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-2">
          Recall beats rereading. Flip flashcards, size systems with real numbers, and take the optional checks. Wrong answers explain
          themselves and link back to the lesson.
        </p>
      </header>

      <section aria-labelledby="exercises-h">
        <h2 id="exercises-h" className="font-display text-2xl font-bold text-ink">
          Architecture exercises
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {EXERCISES.map((e) => (
            <li key={e.href} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-display text-lg font-bold text-ink">{e.title}</h3>
              <p className="text-sm text-ink-2">{e.body}</p>
              <Link href={e.href} className={`${buttonClasses("secondary", "sm")} mt-auto self-start`}>
                Start
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="flash-h">
        <h2 id="flash-h" className="font-display text-2xl font-bold text-ink">
          Flashcards
        </h2>
        <p className="mt-1 text-ink-2">{recallDecks.revision.description}</p>
        <InteractiveDiagram name="recall-cards" variant="revision" />
        <p className="mt-6 text-ink-2">{recallDecks.test.description}</p>
        <InteractiveDiagram name="recall-cards" variant="test" />
      </section>

      <section aria-labelledby="estimate-h">
        <h2 id="estimate-h" className="font-display text-2xl font-bold text-ink">
          Estimation calculator
        </h2>
        <p className="mt-1 text-ink-2">Pick a preset or plug in your own numbers. The working is shown next to every result.</p>
        <InteractiveDiagram name="estimator" />
      </section>

      <section aria-labelledby="checks-h">
        <h2 id="checks-h" className="font-display text-2xl font-bold text-ink">
          Knowledge checks
        </h2>
        <p className="mt-1 text-ink-2">
          {knowledgeChecks.length} short, optional checks. Each also appears at the end of the lesson that completes its topics.
        </p>
        {knowledgeChecks.map((c) => (
          <div key={c.id}>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.12em] text-ink-3">{getModule(c.moduleId).title}</p>
            <KnowledgeCheck check={c} />
          </div>
        ))}
      </section>
    </div>
  );
}
