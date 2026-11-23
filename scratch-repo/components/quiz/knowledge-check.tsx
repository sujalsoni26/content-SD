"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, CircleHelp, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emitCompanionEvent } from "@/lib/companion-events";
import { getLesson } from "@/lib/curriculum";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import type { KnowledgeCheck as KnowledgeCheckData, QuizQuestion } from "@/types/quiz";

const KEYS = ["A", "B", "C", "D", "E"];

function Question({
  question,
  index,
  picked,
  onPick,
}: {
  question: QuizQuestion;
  index: number;
  picked: number | undefined;
  onPick: (option: number) => void;
}) {
  const answered = picked !== undefined;
  const correct = picked === question.answer;
  const review = getLesson(question.lessonSlug);
  return (
    <fieldset className="border-b border-dashed border-line py-5 last:border-b-0">
      <legend className="mb-3 font-bold text-ink">
        <span className="mr-2 font-mono text-violet">Q{index + 1}</span>
        {question.prompt}
      </legend>
      <div className="grid gap-2">
        {question.options.map((opt, oi) => {
          const isPicked = picked === oi;
          const isAnswer = oi === question.answer;
          return (
            <button
              key={oi}
              type="button"
              disabled={answered}
              aria-pressed={isPicked}
              onClick={() => onPick(oi)}
              className={cn(
                "grid grid-cols-[1.75rem_1fr_auto] items-start gap-3 rounded-xl border-[1.5px] px-3 py-2.5 text-left text-[0.95rem] leading-snug transition-[border-color,background-color,transform]",
                !answered && "border-line bg-surface hover:translate-x-0.5 hover:border-violet",
                answered && isAnswer && "border-good bg-good-soft",
                answered && isPicked && !isAnswer && "border-bad bg-bad-soft",
                answered && !isPicked && !isAnswer && "border-line bg-surface opacity-70",
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-md font-mono text-xs font-semibold",
                  answered && isAnswer ? "bg-good text-accent-ink" : answered && isPicked ? "bg-bad text-accent-ink" : "bg-surface-2 text-ink-2",
                )}
              >
                {KEYS[oi]}
              </span>
              <span className="pt-0.5">{opt}</span>
              {answered && isAnswer ? <CheckCircle2 aria-label="Correct answer" className="mt-0.5 size-5 text-good" /> : null}
              {answered && isPicked && !isAnswer ? <XCircle aria-label="Your answer" className="mt-0.5 size-5 text-bad" /> : null}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {answered ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-lg bg-surface-2 px-3.5 py-2.5 text-[0.93rem]"
            aria-live="polite"
          >
            <strong className={correct ? "text-good" : "text-ink"}>{correct ? "Right. " : "Not quite, and that's useful. "}</strong>
            {question.explanation}
            {!correct && review ? (
              <>
                {" "}
                <Link href={`/learn/${review.slug}`} className="font-bold text-accent underline underline-offset-2">
                  Review {review.title}
                </Link>
              </>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </fieldset>
  );
}

/** Optional multiple-choice check after a group of lessons. Never blocks progress. */
export function KnowledgeCheck({ check, defaultOpen = false }: { check: KnowledgeCheckData; defaultOpen?: boolean }) {
  const hydrated = useHydrated();
  const attempts = useProgressStore((s) => s.quizAttempts[check.id]);
  const record = useProgressStore((s) => s.recordQuizAttempt);
  const [open, setOpen] = useState(defaultOpen);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const last = hydrated && attempts?.length ? attempts[attempts.length - 1] : undefined;
  const best = hydrated && attempts?.length ? Math.max(...attempts.map((a) => a.score)) : undefined;
  const answeredCount = Object.keys(answers).length;
  const total = check.questions.length;
  const score = check.questions.filter((q) => answers[q.id] === q.answer).length;
  const finished = answeredCount === total;

  const pick = (q: QuizQuestion, option: number) => {
    const next = { ...answers, [q.id]: option };
    setAnswers(next);
    emitCompanionEvent({ type: "quiz-answer", correct: option === q.answer });
    if (Object.keys(next).length === total) {
      const finalScore = check.questions.filter((qq) => next[qq.id] === qq.answer).length;
      record({ checkId: check.id, score: finalScore, total, answers: next });
      emitCompanionEvent({ type: "quiz-finished", score: finalScore, total });
    }
  };

  const restart = () => {
    setAnswers({});
    setOpen(true);
  };

  return (
    <section aria-labelledby={`${check.id}-title`} data-companion-avoid="" className="not-prose mt-12 overflow-hidden rounded-2xl border-[1.5px] border-violet bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-violet-soft px-5 py-4">
        <div className="flex items-start gap-3">
          <CircleHelp aria-hidden="true" className="mt-0.5 size-5 text-violet" />
          <div>
            <h2 id={`${check.id}-title`} className="font-display text-lg font-bold text-ink">
              Knowledge check: {check.title}
            </h2>
            <p className="text-sm text-ink-2">
              Optional · {total} questions
              {last ? ` · last score ${last.score}/${last.total}` : ""}
              {best !== undefined && last && best !== last.score ? ` · best ${best}/${total}` : ""}
            </p>
          </div>
        </div>
        {!open ? (
          <Button variant="primary" onClick={() => setOpen(true)}>
            {last ? "Try again" : "Start"}
          </Button>
        ) : null}
      </div>
      {open ? (
        <div className="px-5 pb-5">
          {check.questions.map((q, i) => (
            <Question key={q.id} question={q} index={i} picked={answers[q.id]} onPick={(o) => pick(q, o)} />
          ))}
          {finished ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3" aria-live="polite">
              <p className="font-bold text-ink">
                You scored {score} of {total}. {score === total ? "Flawless." : "The explanations above cover the gaps."}
              </p>
              <Button size="sm" onClick={restart}>
                <RotateCcw aria-hidden="true" className="size-4" /> Retry
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-3">
              {answeredCount} of {total} answered. Wrong answers show why, so guessing is fine.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
