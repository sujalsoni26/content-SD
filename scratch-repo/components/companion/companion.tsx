"use client";
import { Suspense, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { usePathname } from "next/navigation";
import { animate, AnimatePresence, motion, useMotionValue, useSpring, type MotionValue } from "motion/react";
import { equippedAttr } from "@/lib/companion/accessories";
import { petCache } from "@/lib/companion/actions";
import { lessonFromPath } from "@/lib/companion/lesson-context";
import { LINES, pick } from "@/lib/companion/lines";
import type { Size } from "@/lib/companion/resting";
import { companionBlip } from "@/lib/companion/sound";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useMotionLevel } from "@/lib/hooks/use-motion-level";
import { usePageVisible } from "@/lib/hooks/use-page-visible";
import { clamp, cn } from "@/lib/utils";
import { useCompanionStore, useFocusHydrated, useFocusStore } from "@/stores/companion-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import type { CompanionMood } from "@/types/companion";
import { CompanionMenu } from "./companion-menu";
import { FocusTimer } from "./focus-timer";
import { PixelCat } from "./pixel-cat";
import { BubbleAnnouncer, SpeechBubble } from "./speech-bubble";
import { useCompanionBrain } from "./use-companion-brain";
import { useCompanionPosition } from "./use-companion-position";

const CAT_SIZE = { desktop: 84, compact: 60 } as const;
const PANEL_MAX_WIDTH = 304;
const PET_DELAY_MS = 1200;
const PET_GAP_MS = 15_000;

/**
 * Cache, the study companion. Mount once in the root layout. Renders nothing on the server or
 * before persisted settings load, and nothing at all while the companion is switched off.
 */
export function Companion() {
  return (
    <Suspense fallback={null}>
      <CompanionGate />
    </Suspense>
  );
}

function CompanionGate() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const enabled = usePreferencesStore((s) => s.companion.enabled);
  if (!hydrated || !enabled) return null;
  return <CompanionShell pathname={pathname ?? "/"} />;
}

function CompanionShell({ pathname }: { pathname: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const catRef = useRef<HTMLButtonElement>(null);
  const petTimer = useRef(0);
  const lastPet = useRef(0);
  const menuId = useId();
  const hintId = useId();

  const motionLevel = useMotionLevel();
  const pageVisible = usePageVisible();
  const coarse = useMediaQuery("(pointer: coarse)");
  const narrow = useMediaQuery("(max-width: 640px)");
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const compact = coarse || narrow;
  const size = compact ? CAT_SIZE.compact : CAT_SIZE.desktop;
  const physics = usePreferencesStore((s) => s.companion.physics);
  const lesson = useMemo(() => lessonFromPath(pathname), [pathname]);

  const menuOpen = useCompanionStore((s) => s.menuOpen);
  const bubble = useCompanionStore((s) => s.bubble);
  const reactionMood = useCompanionStore((s) => s.reaction?.mood);
  const idleLevel = useCompanionStore((s) => s.idleLevel);
  const closeMenu = useCompanionStore((s) => s.closeMenu);
  const focusHydrated = useFocusHydrated();
  const focusPhase = useFocusStore((s) => s.session?.phase ?? null);
  const napping = useCompanionStore((s) => s.napping);
  const activity = useCompanionStore((s) => s.activity);
  const equipped = usePreferencesStore((s) => s.companion.equipped);

  const pos = useCompanionPosition({
    size,
    compact,
    physics,
    motionLevel,
    rootRef,
    hold: menuOpen || Boolean(bubble?.actions?.length) || Boolean(activity),
    onPickUp: closeMenu,
  });
  useCompanionBrain({ pathname, lessonSlug: lesson?.slug });
  const anchors = useAnchors(pos.x, pos.y, size, pos.view);
  const swing = useSpring(pos.tilt, { stiffness: 260, damping: 14 });

  // After navigation the page underneath changed: check the cat is not covering the new layout.
  const { ensureSafe } = pos;
  useEffect(() => {
    const id = window.setTimeout(ensureSafe, 700);
    return () => window.clearTimeout(id);
  }, [pathname, ensureSafe]);

  useEffect(() => {
    const timer = petTimer;
    return () => window.clearTimeout(timer.current);
  }, []);

  const resting = pos.phase === "resting";
  const airborne = pos.phase === "dragging" || pos.phase === "flying" || pos.phase === "dropping";
  const restingMood: CompanionMood =
    napping || idleLevel === 2
      ? "sleeping"
      : focusPhase === "focus"
        ? "studying"
        : focusPhase === "break" || idleLevel === 1
          ? "sitting"
          : "idle";
  const mood: CompanionMood = airborne
    ? "dragged"
    : pos.phase === "walking"
      ? "walking"
      : (reactionMood ?? bubble?.mood ?? restingMood);
  const animated = motionLevel === "normal";
  const ambient = animated && pageVisible && resting;

  const toggleMenu = (focus: "first" | "last" = "first") => {
    const s = useCompanionStore.getState();
    if (s.menuOpen) {
      s.closeMenu();
      return;
    }
    s.dismiss();
    s.openMenu(focus);
    companionBlip("pop");
  };

  const onClick = () => {
    if (pos.consumeDrag()) return;
    pos.settleIfInterrupted();
    const s = useCompanionStore.getState();
    if (s.napping) {
      // A tap wakes a napping cat (the next tap opens the menu).
      s.setNapping(false);
      s.react("happy", 900);
      return;
    }
    toggleMenu();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!useCompanionStore.getState().menuOpen) toggleMenu(e.key === "ArrowUp" ? "last" : "first");
    } else if (e.key === "Escape") {
      useCompanionStore.getState().closeMenu();
      useCompanionStore.getState().dismiss();
    }
  };

  // Hover to pet (mouse only, rarely): hearts and a purr, no speech; it also wakes a napping cat.
  const onPointerEnter = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(petTimer.current);
    petTimer.current = window.setTimeout(() => {
      const s = useCompanionStore.getState();
      const now = Date.now();
      if (s.menuOpen || s.activity || now - lastPet.current < PET_GAP_MS) return;
      lastPet.current = now;
      petCache(lesson, false);
    }, PET_DELAY_MS);
  };

  // Play: a yarn ball rolls along the floor, Cache walks after it and bats it (about 3 s).
  const yarnX = useMotionValue(0);
  const yarnRot = useMotionValue(0);
  const yarnOpacity = useMotionValue(0);
  const yarnSize = compact ? 14 : 18;
  const { walkTo, settle, x: catX } = pos;
  const playId = activity?.kind === "play" ? activity.id : 0;
  useEffect(() => {
    if (!playId) return;
    let cancelled = false;
    const anims: Array<{ stop: () => void }> = [];
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));
    const roll = (to: number, turns: number, duration: number) => {
      if (!animated) {
        yarnX.set(to);
        return;
      }
      anims.push(animate(yarnX, to, { duration, ease: [0.2, 0.7, 0.3, 1] }));
      anims.push(animate(yarnRot, yarnRot.get() + turns, { duration, ease: "easeOut" }));
    };
    const finish = () => {
      yarnOpacity.set(0);
      useCompanionStore.getState().endActivity(playId);
    };
    const run = async () => {
      const viewW = document.documentElement.clientWidth || window.innerWidth;
      const centre = catX.get() + size / 2;
      const dir = centre < viewW / 2 ? 1 : -1;
      const start = clamp(centre + dir * size * 0.45, 12, viewW - 12);
      const end = clamp(start + dir * (compact ? 120 : 220), 16, viewW - 16);
      yarnX.set(start);
      yarnOpacity.set(1);
      roll(end, dir * 540, 1.1);
      await wait(animated ? 250 : 0);
      if (cancelled) return;
      const arrived = await walkTo(end - size / 2 - dir * size * 0.42);
      if (cancelled) return;
      if (!arrived) return finish();
      useCompanionStore.getState().react("playing", 1000);
      await wait(300);
      if (cancelled) return;
      roll(clamp(end + dir * 70, 16, viewW - 16), dir * 240, 0.6);
      await wait(800);
      if (cancelled) return;
      const s = useCompanionStore.getState();
      s.react("happy", 1400);
      s.say({ text: pick(LINES.playDone), mood: "happy", ms: 2600, solicited: true });
      finish();
      settle();
    };
    void run();
    return () => {
      cancelled = true;
      anims.forEach((a) => a.stop());
      timers.forEach((t) => window.clearTimeout(t));
      yarnOpacity.set(0);
    };
  }, [playId, animated, compact, size, walkTo, settle, catX, yarnX, yarnRot, yarnOpacity]);
  const yarnY = pos.groundY;

  return (
    <section
      ref={rootRef}
      aria-label="Study companion"
      data-testid="companion"
      data-mood={mood}
      data-resting={resting ? "true" : "false"}
      data-accessories={equippedAttr(equipped)}
      className="fixed left-0 top-0 z-40 h-0 w-0"
    >
      <motion.div
        className="absolute left-0 top-0"
        style={{ x: pos.x, y: pos.y, width: size, height: size }}
        drag
        dragListener={false}
        dragControls={pos.dragControls}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={pos.dragConstraints}
        onDragStart={pos.onDragStart}
        onDrag={pos.onDrag}
        onDragEnd={pos.onDragEnd}
      >
        <motion.button
          ref={catRef}
          type="button"
          data-testid="companion-cat"
          aria-label="Cache, your study companion"
          aria-describedby={hintId}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          onPointerDown={pos.onPointerDown}
          onPointerEnter={onPointerEnter}
          onPointerLeave={() => window.clearTimeout(petTimer.current)}
          onClick={onClick}
          onKeyDown={onKeyDown}
          style={{ rotate: swing, originX: 0.5, originY: 0.12 }}
          className={cn(
            "block size-full touch-none select-none rounded-[38%] [-webkit-touch-callout:none]",
            airborne ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <PixelCat mood={mood} motionLevel={motionLevel} ambient={ambient} gaze={finePointer} accessories={equipped} />
        </motion.button>
        <span id={hintId} className="sr-only">
          Opens a menu with explanations, hints, quick revision and a focus timer. Drag to move Cache.
        </span>
      </motion.div>

      {playId ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0"
          style={{ x: yarnX, y: yarnY, opacity: yarnOpacity }}
        >
          <motion.svg
            viewBox="-12 -12 24 24"
            width={yarnSize}
            height={yarnSize}
            style={{ rotate: yarnRot }}
            className="block -translate-x-1/2 -translate-y-full overflow-visible"
          >
            <circle r={10.5} className="fill-violet stroke-ink/50" strokeWidth={1.4} />
            <path
              d="M -9 -4 Q 0 -1 9 -5 M -10 2 Q 0 5 10 1 M -5 -9 Q -1 0 -4 9 M 4 -9 Q 8 0 3 9"
              className="fill-none stroke-violet-soft"
              strokeWidth={1.3}
              strokeLinecap="round"
            />
            <path d="M 9 6 Q 14 10 11 13" className="fill-none stroke-violet" strokeWidth={1.4} strokeLinecap="round" />
          </motion.svg>
        </motion.div>
      ) : null}

      {focusHydrated && focusPhase ? (
        <motion.div className="absolute left-0 top-0" data-testid="companion-timer-anchor" style={{ x: anchors.chipX, y: anchors.chipY }}>
          <div className={cn("-translate-y-1/2", anchors.side === "right" && "-translate-x-full")}>
            <FocusTimer />
          </div>
        </motion.div>
      ) : null}

      <motion.div
        className="pointer-events-none absolute left-0 top-0"
        style={{ x: anchors.panelX, y: anchors.panelY, width: anchors.panelWidth }}
      >
        <motion.div
          className={cn("pointer-events-auto flex flex-col", anchors.above && "-translate-y-full")}
          style={{ maxHeight: anchors.panelMaxHeight }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {menuOpen ? (
              <CompanionMenu key="menu" id={menuId} lesson={lesson} above={anchors.above} animated={animated} anchorRef={catRef} />
            ) : bubble ? (
              <SpeechBubble
                key={bubble.id}
                bubble={bubble}
                above={anchors.above}
                tailX={anchors.tailX}
                returnFocusRef={catRef}
                animated={animated}
              />
            ) : null}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <BubbleAnnouncer />
    </section>
  );
}

/**
 * Positions for the bubble/menu (above or below the cat, clamped to the viewport) and the timer chip
 * (beside the cat, towards the middle of the screen). Driven by motion-value subscriptions, so the
 * panels follow a drag without re-rendering; React state only flips when a side changes.
 */
function useAnchors(x: MotionValue<number>, y: MotionValue<number>, size: number, view: Size) {
  const panelWidth = Math.max(200, Math.min(PANEL_MAX_WIDTH, view.w - 16));
  const panelX = useMotionValue(0);
  const panelY = useMotionValue(0);
  const panelMaxHeight = useMotionValue(480);
  const tailX = useMotionValue(0);
  const chipX = useMotionValue(0);
  const chipY = useMotionValue(0);
  const [above, setAbove] = useState(true);
  const [side, setSide] = useState<"left" | "right">("right");

  useEffect(() => {
    const update = () => {
      const cx = x.get();
      const cy = y.get();
      const isAbove = cy + size / 2 > view.h / 2;
      const isRight = cx + size / 2 > view.w / 2;
      const px = clamp(cx + size / 2 - panelWidth / 2, 8, Math.max(8, view.w - panelWidth - 8));
      panelX.set(px);
      tailX.set(clamp(cx + size / 2 - px, 18, panelWidth - 18));
      panelY.set(isAbove ? cy - 10 : cy + size + 10);
      panelMaxHeight.set(Math.max(140, isAbove ? cy - 18 : view.h - cy - size - 18));
      chipX.set(isRight ? cx - 4 : cx + size + 4);
      chipY.set(cy + size * 0.55);
      setAbove(isAbove);
      setSide(isRight ? "right" : "left");
    };
    const raf = requestAnimationFrame(update);
    const offX = x.on("change", update);
    const offY = y.on("change", update);
    return () => {
      cancelAnimationFrame(raf);
      offX();
      offY();
    };
  }, [x, y, size, view, panelWidth, panelX, panelY, panelMaxHeight, tailX, chipX, chipY]);

  return { panelWidth, panelX, panelY, panelMaxHeight, tailX, chipX, chipY, above, side };
}
