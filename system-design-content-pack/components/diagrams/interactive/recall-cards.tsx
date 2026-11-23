"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { ControlRow, WidgetFrame } from "@/components/ui/widget-frame";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";
import { recallDecks, type RecallDeckId } from "@/data/recall";
import { getLesson } from "@/lib/curriculum";
import { useProgressStore } from "@/stores/progress-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";
import type { RecallCard } from "@/types/quiz";

type Filter = "all" | "learning";

const FILTERS = [
  { value: "all", label: "All cards" },
  { value: "learning", label: "Still learning" },
] as const;

const NO_CARDS: number[] = [];

interface DeckCopy {
  hint: string;
  front: string;
  back: string;
}

const COPY: Record<RecallDeckId, DeckCopy> = {
  test: { hint: "Answer from memory, then flip the card and grade yourself honestly.", front: "Question", back: "Answer" },
  revision: { hint: "Read the problem, name the building block that solves it, then flip to check.", front: "Problem", back: "Building block" },
  advanced: { hint: "Answer from memory, then flip the card and grade yourself honestly.", front: "Question", back: "Answer" },
  hld: { hint: "Read the design problem, decide what you would do, then flip to compare.", front: "Design problem", back: "Decision and why" },
  lld: { hint: "Name the principle, pattern or responsibility, then flip to check.", front: "Problem", back: "Pattern or principle" },
};

/** Any registered deck id is a valid variant; anything else (including no variant) falls back to "test". */
function deckId(variant: string | undefined): RecallDeckId {
  return variant && variant in recallDecks ? (variant as RecallDeckId) : "test";
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function shuffled(list: number[]): number[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ---------------- pieces ---------------- */

function Progress({ known, total, position, count, ready }: { known: number; total: number; position: number; count: number; ready: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span
        role="progressbar"
        aria-label="Cards known"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={ready ? known : undefined}
        className="h-2 w-40 max-w-full overflow-hidden rounded-full bg-surface-3"
      >
        <span className="block h-full rounded-full bg-good transition-[width] duration-300" style={{ width: `${ready ? (known / total) * 100 : 0}%` }} />
      </span>
      <span className="font-mono text-[0.8rem] tabular-nums text-ink-2">
        {ready ? `Known ${known} of ${total}` : "Loading progress…"}
        {count > 0 && position < count ? ` · card ${position + 1} of ${count}` : ""}
      </span>
    </div>
  );
}

function Face({ tag, text, back, known, children }: { tag: string; text: string; back?: boolean; known?: boolean; children?: ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-h-[12rem] flex-col gap-3 rounded-2xl border p-5",
        back ? "border-accent bg-accent-soft" : "border-line-strong bg-surface shadow-[var(--shadow-soft)]",
      )}
    >
      <span className="flex items-center gap-2 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent">
        {tag}
        {known ? <span className="rounded-full bg-good-soft px-2 py-px normal-case tracking-normal text-good">known</span> : null}
      </span>
      <p className={cn("text-ink", back ? "text-[1rem] leading-relaxed" : "font-display text-[1.15rem] font-bold leading-snug")}>{text}</p>
      {children}
    </div>
  );
}

const hidden3d = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;

interface CardProps {
  card: RecallCard;
  flipped: boolean;
  known: boolean;
  copy: DeckCopy;
  direction: number;
  reduced: boolean;
  onFlip: () => void;
  ref: Ref<HTMLDivElement>;
}

/** A focusable flashcard: Space or Enter (handled by the deck) or a click flips it in 3D. */
function Card({ card, flipped, known, copy, direction, reduced, onFlip, ref }: CardProps) {
  const lesson = getLesson(card.lessonSlug);
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 28 * direction }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="[perspective:1200px]"
    >
      <motion.div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-roledescription="flashcard"
        aria-label={flipped ? `${copy.back}: ${card.a}` : `${copy.front}: ${card.q}`}
        data-flashcard=""
        onClick={onFlip}
        className="grid cursor-pointer rounded-2xl"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div aria-hidden={flipped} inert={flipped} className="[grid-area:1/1]" style={hidden3d}>
          <Face tag={copy.front} text={card.q} known={known}>
            <span className="mt-auto text-[0.8rem] text-ink-3">Tap the card or press Space to flip.</span>
          </Face>
        </div>
        <div aria-hidden={!flipped} inert={!flipped} className="[grid-area:1/1]" style={{ ...hidden3d, transform: "rotateY(180deg)" }}>
          <Face tag={copy.back} text={card.a} back>
            {lesson ? (
              <Link
                href={`/learn/${card.lessonSlug}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-auto inline-flex w-fit items-center gap-1.5 text-[0.86rem] font-bold text-accent underline-offset-4 hover:underline"
              >
                <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0" />
                Review lesson {lesson.number}: {lesson.title}
              </Link>
            ) : null}
          </Face>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[12rem] flex-col items-start justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface-2 p-5">
      {children}
    </div>
  );
}

function DonePanel({ known, total, left, onRestart, onLearning }: { known: number; total: number; left: number; onRestart: () => void; onLearning: () => void }) {
  return (
    <Panel>
      <p className="text-ink">
        <strong>End of the deck.</strong> You know {known} of {total} cards.{" "}
        {left ? `${left} from this pass still need work.` : "Every card in this pass is known. Nicely done."}
      </p>
      <ControlRow>
        <Button size="sm" variant="primary" onClick={onRestart}>
          Go again
        </Button>
        {left ? (
          <Button size="sm" variant="secondary" onClick={onLearning}>
            Review the {left} still learning
          </Button>
        ) : null}
      </ControlRow>
    </Panel>
  );
}

function EmptyPanel({ onAll }: { onAll: () => void }) {
  return (
    <Panel>
      <p className="text-ink">
        <strong>Nothing left to learn here.</strong> Every card is marked as known.
      </p>
      <Button size="sm" variant="secondary" onClick={onAll}>
        Review all cards
      </Button>
    </Panel>
  );
}

/* ---------------- the deck ---------------- */

export default function RecallCards({ variant }: InteractiveProps) {
  const deck = recallDecks[deckId(variant)];
  const cards = deck.cards;
  const copy = COPY[deck.id];
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const storedKnown = useProgressStore((s) => s.knownCards[deck.id] ?? NO_CARDS);
  const setCardKnown = useProgressStore((s) => s.setCardKnown);
  // Persisted progress is only trusted once the store has loaded from storage.
  const known = useMemo(() => new Set(hydrated ? storedKnown : NO_CARDS), [hydrated, storedKnown]);

  const [filter, setFilter] = useState<Filter>("all");
  const [order, setOrder] = useState<number[]>(() => range(cards.length));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(1);

  const atEnd = pos >= order.length;
  const index = atEnd ? -1 : order[pos];
  const card = index >= 0 ? cards[index] : null;
  const left = order.filter((i) => !known.has(i)).length;

  // Moving to another card remounts it; put keyboard focus back on the new card (or the stage).
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  useEffect(() => {
    if (focusRequest > 0) (cardRef.current ?? stageRef.current)?.focus();
  }, [focusRequest]);
  const refocus = () => setFocusRequest((n) => n + 1);
  // The last grading outcome, shown (and announced) under the deck.
  const [outcome, setOutcome] = useState<string | null>(null);

  const rebuild = (nextFilter: Filter, shuffle: boolean) => {
    const base = range(cards.length).filter((i) => nextFilter === "all" || !known.has(i));
    setFilter(nextFilter);
    setOrder(shuffle ? shuffled(base) : base);
    setPos(0);
    setFlipped(false);
    setDirection(1);
  };
  const move = (delta: number) => {
    setPos((p) => Math.min(order.length, Math.max(0, p + delta)));
    setFlipped(false);
    setDirection(delta >= 0 ? 1 : -1);
  };
  /** Prev / Next buttons: when the move disables the pressed button, keep focus in the deck. */
  const step = (delta: number) => {
    const target = Math.min(order.length, Math.max(0, pos + delta));
    move(delta);
    if (target === 0 || target === order.length) refocus();
  };
  const flip = () => {
    if (card) setFlipped((f) => !f);
  };
  const grade = (gotIt: boolean) => {
    if (index < 0) return;
    setCardKnown(deck.id, index, gotIt);
    const knownNow = known.size + (gotIt && !known.has(index) ? 1 : 0) - (!gotIt && known.has(index) ? 1 : 0);
    if (gotIt && !known.has(index) && knownNow === cards.length) {
      emitCompanionEvent({ type: "diagram", mood: "happy", message: "Whole deck known. Great recall!" });
    }
    // "Again" brings the card back at the end of this pass.
    const requeue = !gotIt && pos < order.length - 1;
    if (requeue) setOrder((o) => [...o, index]);
    setOutcome(
      gotIt
        ? `Got it: ${knownNow} of ${cards.length} known.`
        : requeue
          ? "Again: this card comes back at the end of the pass."
          : "Again: marked as still learning.",
    );
    move(1);
    refocus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;
    const onCard = target.closest("[data-flashcard]") !== null;
    const claim = () => {
      // Keep page-level shortcuts from also reacting.
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    };
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      claim();
      move(e.key === "ArrowLeft" ? -1 : 1);
      if (onCard) refocus();
    } else if ((e.key === " " && !target.closest("button, a")) || (e.key === "Enter" && onCard && target.closest("a") === null)) {
      claim();
      flip();
    } else if (e.key === " ") {
      // Space on a button or link keeps its native action.
      e.stopPropagation();
    }
  };

  const status = card
    ? flipped
      ? `${copy.back}: ${card.a}`
      : `${copy.front} ${pos + 1} of ${order.length}: ${card.q}`
    : order.length
      ? "End of the deck."
      : "Every card is known.";

  return (
    <WidgetFrame kicker="Recall" title={deck.title} hint={copy.hint} note={outcome}>
      <div onKeyDown={onKeyDown} className="flex flex-col gap-4">
        <ControlRow>
          <SegmentedControl label="Cards to show" size="sm" options={FILTERS} value={filter} onChange={(f) => rebuild(f, false)} />
          <Button size="sm" variant="ghost" onClick={() => rebuild(filter, true)}>
            <Shuffle aria-hidden="true" className="h-4 w-4" />
            Shuffle
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!hydrated || known.size === 0}
            onClick={() => {
              known.forEach((i) => setCardKnown(deck.id, i, false));
              rebuild("all", false);
              setOutcome("Progress reset: every card is back to still learning.");
              refocus();
            }}
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Reset progress
          </Button>
        </ControlRow>

        <Progress known={known.size} total={cards.length} position={pos} count={order.length} ready={hydrated} />

        <div ref={stageRef} tabIndex={-1} className="rounded-2xl outline-none">
          {card ? (
            <Card
              key={`${index}-${pos}`}
              ref={cardRef}
              card={card}
              flipped={flipped}
              known={known.has(index)}
              copy={copy}
              direction={direction}
              reduced={reduced}
              onFlip={flip}
            />
          ) : order.length ? (
            <DonePanel
              known={known.size}
              total={cards.length}
              left={left}
              onRestart={() => {
                rebuild(filter, false);
                refocus();
              }}
              onLearning={() => {
                rebuild("learning", false);
                refocus();
              }}
            />
          ) : (
            <EmptyPanel
              onAll={() => {
                rebuild("all", false);
                refocus();
              }}
            />
          )}
        </div>

        <ControlRow className="justify-between">
          <Button size="sm" variant="ghost" onClick={() => step(-1)} disabled={pos === 0}>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            Prev
          </Button>
          <Button size="sm" variant="primary" onClick={flip} disabled={!card}>
            {flipped ? "Show question" : "Show answer"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => step(1)} disabled={atEnd}>
            Next
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </ControlRow>

        {card && flipped ? (
          <ControlRow className="justify-center">
            <Button size="sm" variant="danger" onClick={() => grade(false)} disabled={!hydrated}>
              Again
            </Button>
            <Button size="sm" variant="success" onClick={() => grade(true)} disabled={!hydrated}>
              Got it
            </Button>
          </ControlRow>
        ) : null}

        <p className="text-center font-mono text-[0.72rem] text-ink-3">Keys: Space flips · ← → move</p>
        <p className="sr-only" aria-live="polite">
          {status}
        </p>
      </div>
    </WidgetFrame>
  );
}
