"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { motion, type MotionValue } from "motion/react";
import { X } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompanionStore, type Bubble } from "@/stores/companion-store";

/** Persistent polite live region: the only thing about the companion a screen reader hears unprompted. */
export function BubbleAnnouncer() {
  const bubble = useCompanionStore((s) => s.bubble);
  const text = bubble ? announceText(bubble) : "";
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {text}
    </div>
  );
}

function announceText(b: Bubble): string {
  const parts = ["Cache says:"];
  if (b.title) parts.push(`${b.title}.`);
  parts.push(b.text);
  if (b.detail) parts.push(`${b.detailLabel ? `${b.detailLabel}: ` : ""}${b.detail}`);
  if (b.items) for (const item of b.items) parts.push(`${item.label}: ${item.text}`);
  return parts.join(" ");
}

interface SpeechBubbleProps {
  bubble: Bubble;
  /** Bubble sits above the cat (tail points down) or below it (tail points up). */
  above: boolean;
  /** Horizontal tail position inside the bubble, px. */
  tailX: MotionValue<number>;
  /** Where focus returns when the bubble closes from the keyboard. */
  returnFocusRef: RefObject<HTMLElement | null>;
  animated: boolean;
}

/**
 * The visible speech bubble. Its text is aria-hidden because <BubbleAnnouncer> already carries it
 * (once, politely); the buttons stay reachable. Auto-dismisses unless it has actions, and pauses
 * while hovered or focused.
 */
export function SpeechBubble({ bubble, above, tailX, returnFocusRef, animated }: SpeechBubbleProps) {
  const dismiss = useCompanionStore((s) => s.dismiss);
  const cardRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!bubble.ms || paused) return;
    const id = window.setTimeout(() => dismiss(bubble.id), bubble.ms);
    return () => window.clearTimeout(id);
  }, [bubble.id, bubble.ms, paused, dismiss]);

  useEffect(() => {
    if (!bubble.focus) return;
    const first = cardRef.current?.querySelector<HTMLElement>("[data-bubble-action]");
    first?.focus({ preventScroll: true });
  }, [bubble.id, bubble.focus]);

  const close = (restoreFocus: boolean) => {
    const hadFocus = cardRef.current?.contains(document.activeElement) ?? false;
    dismiss(bubble.id);
    if (restoreFocus || hadFocus) returnFocusRef.current?.focus({ preventScroll: true });
  };

  return (
    <motion.div
      ref={cardRef}
      data-testid="companion-bubble"
      initial={animated ? { opacity: 0, scale: 0.94, y: above ? 6 : -6 } : { opacity: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={animated ? { opacity: 0, scale: 0.96 } : { opacity: 0 }}
      transition={{ duration: animated ? 0.18 : 0.1, ease: "easeOut" }}
      style={{ originY: above ? 1 : 0 }}
      className="relative flex max-h-[inherit] flex-col"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close(true);
        }
      }}
    >
      <div className="min-h-0 overflow-y-auto overscroll-auto rounded-2xl border border-line-strong bg-surface p-3 text-[0.9rem] leading-snug text-ink shadow-[var(--shadow-lift)]">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1" aria-hidden="true">
            <p className="font-mono text-[0.64rem] font-bold uppercase tracking-[0.16em] text-amber-ink">Cache</p>
            {bubble.title ? <p className="mt-0.5 font-display text-[0.95rem] font-bold leading-tight">{bubble.title}</p> : null}
          </div>
          <button
            type="button"
            data-testid="companion-bubble-close"
            onClick={() => close(false)}
            aria-label="Dismiss message"
            className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div aria-hidden="true">
          <p className="mt-1.5 whitespace-pre-line">{bubble.text}</p>
          {bubble.detail ? (
            <div className="mt-2 rounded-lg bg-surface-2 px-2.5 py-2">
              {bubble.detailLabel ? (
                <p className="font-mono text-[0.64rem] font-bold uppercase tracking-[0.12em] text-ink-3">{bubble.detailLabel}</p>
              ) : null}
              <p className="mt-0.5">{bubble.detail}</p>
            </div>
          ) : null}
          {bubble.items?.length ? (
            <dl className="mt-2 space-y-1.5">
              {bubble.items.map((item) => (
                <div key={item.label} className="rounded-lg bg-surface-2 px-2.5 py-1.5">
                  <dt className="font-mono text-[0.64rem] font-bold uppercase tracking-[0.12em] text-accent">{item.label}</dt>
                  <dd className="text-[0.86rem]">{item.text}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {bubble.actions?.length ? (
          <div role="group" aria-label="Reply to Cache" className="mt-3 flex flex-wrap gap-1.5">
            {bubble.actions.map((a) =>
              a.href ? (
                <Link
                  key={a.label}
                  href={a.href}
                  data-bubble-action=""
                  onClick={() => dismiss(bubble.id)}
                  className={buttonClasses(a.primary ? "primary" : "secondary", "sm")}
                >
                  {a.label}
                </Link>
              ) : (
                <Button
                  key={a.label}
                  data-bubble-action=""
                  size="sm"
                  variant={a.primary ? "primary" : "secondary"}
                  onClick={() => {
                    const hadFocus = cardRef.current?.contains(document.activeElement) ?? false;
                    a.onSelect?.();
                    // Closes only if the handler did not replace the bubble with a follow-up.
                    const replaced = useCompanionStore.getState().bubble?.id !== bubble.id;
                    dismiss(bubble.id);
                    if (!replaced && hadFocus) returnFocusRef.current?.focus({ preventScroll: true });
                  }}
                >
                  {a.label}
                </Button>
              ),
            )}
          </div>
        ) : null}
      </div>

      {/* tail pointing at the cat (outer span moves, inner span is the rotated square) */}
      <motion.span
        aria-hidden="true"
        style={{ x: tailX }}
        className={cn("pointer-events-none absolute left-0 block", above ? "-bottom-1.5" : "-top-1.5")}
      >
        <span
          className={cn(
            "block size-3 -translate-x-1/2 rotate-45 border-line-strong bg-surface",
            above ? "border-b border-r" : "border-l border-t",
          )}
        />
      </motion.span>
    </motion.div>
  );
}
