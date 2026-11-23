"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { animate, useDragControls, useMotionValue, type PanInfo } from "motion/react";
import { clampVelocity, GRAVITY, isSettled, stepFall, type Arena, type Body } from "@/lib/companion/physics";
import {
  dockX,
  findFloorSpot,
  floorXFrom,
  getWorld,
  nearestSide,
  normalizeFloorX,
  PEEK_FRACTION,
  readAvoidRects,
  readFloorLine,
  readViewport,
  type Point,
  type Size,
  type World,
} from "@/lib/companion/resting";
import { clamp } from "@/lib/utils";
import { useCompanionStore } from "@/stores/companion-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import type { AnimationLevel, CompanionPosition } from "@/types/companion";

/** resting: on the floor, still. dropping: falling straight down (no physics). walking: along the floor. */
export type MovePhase = "resting" | "dragging" | "flying" | "dropping" | "walking";

interface PositionOptions {
  size: number;
  compact: boolean;
  physics: boolean;
  motionLevel: AnimationLevel;
  /** The companion root; its own elements are never treated as UI to avoid. */
  rootRef: RefObject<HTMLElement | null>;
  /** While true (menu open, bubble with buttons), the cat does not walk away on its own. */
  hold: boolean;
  /** Called when the learner picks the cat up. */
  onPickUp?: () => void;
}

export interface Layout {
  view: Size;
  /** y of the floor line (viewport bottom, or the top of a fixed bottom tab bar). */
  floorLine: number;
}

const SCROLL_SETTLE_MS = 450;
const RESIZE_SETTLE_MS = 350;
const FIRST_CHECK_MS = 900;
/** Height changes smaller than this with the same width are browser toolbars, not a new layout. */
const TOOLBAR_DELTA = 160;
const WALK_SPEED = { desktop: 240, compact: 200 } as const;

function readLayout(): Layout {
  const view = readViewport();
  return { view, floorLine: readFloorLine(view) };
}

/**
 * Position, drag and gravity for the companion.
 * - Motion drag (started only from the cat button) moves two motion values; frames never re-render React.
 * - On release she always falls to the floor under gravity (side walls bounce, the top is a ceiling only
 *   at the top of the page), bounces once or twice, slides to a stop, then walks along the floor if she
 *   covers marked UI. Phones walk to the nearest bottom corner and peek. rAF runs only in flight.
 * - Reduced motion / physics off: a quick straight drop, no throw or bounce. Animations off: instant.
 * - The floor x is stored normalised with `floor: true`, restored onto the floor, re-placed on resize.
 */
export function useCompanionPosition(options: PositionOptions) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tilt = useMotionValue(0);
  const dragControls = useDragControls();
  const [initialLayout] = useState<Layout>(readLayout);
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [phase, setPhase] = useState<MovePhase>("resting");

  const optsRef = useRef(options);
  const layoutRef = useRef<Layout>(initialLayout);
  const phaseRef = useRef<MovePhase>("resting");
  const restRef = useRef<CompanionPosition | null>(null);
  const rafRef = useRef(0);
  const animsRef = useRef<Array<{ stop: () => void }>>([]);
  const tokenRef = useRef(0);
  const draggedRef = useRef(false);
  const interruptedRef = useRef(false);
  const restoreSelectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    optsRef.current = options;
  });

  const go = useCallback((next: MovePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const world = useCallback((): World => {
    const o = optsRef.current;
    const { view, floorLine } = layoutRef.current;
    return getWorld(view, o.size, o.compact, floorLine);
  }, []);

  /** Re-read the viewport and floor (cheap; called before decisions, never per frame). */
  const refreshLayout = useCallback(() => {
    const next = readLayout();
    const prev = layoutRef.current;
    layoutRef.current = next;
    if (prev.view.w !== next.view.w || prev.view.h !== next.view.h || prev.floorLine !== next.floorLine) setLayout(next);
    return next;
  }, []);

  const stopMotion = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    animsRef.current.forEach((a) => a.stop());
    animsRef.current = [];
    tokenRef.current += 1;
  }, []);

  const commitRest = useCallback(
    (px: number) => {
      const n = normalizeFloorX(px, world());
      restRef.current = n;
      usePreferencesStore.getState().setCompanionPosition(n);
      go("resting");
    },
    [go, world],
  );

  /** Tween to `target`. Resolves true when it arrived, false when something newer interrupted it. */
  const moveTo = useCallback(
    (target: Point, kind: "walk" | "drop"): Promise<boolean> => {
      stopMotion();
      const o = optsRef.current;
      const dx = Math.abs(target.x - x.get());
      const dy = Math.abs(target.y - y.get());
      if ((dx < 1 && dy < 1) || o.motionLevel === "off") {
        x.set(target.x);
        y.set(target.y);
        return Promise.resolve(true);
      }
      const reduced = o.motionLevel === "reduced";
      const speed = o.compact ? WALK_SPEED.compact : WALK_SPEED.desktop;
      const duration =
        kind === "drop"
          ? reduced
            ? 0.16
            : clamp(Math.sqrt((2 * dy) / 2400), 0.12, 0.45)
          : reduced
            ? 0.2
            : clamp(dx / speed, 0.25, 3);
      const token = tokenRef.current;
      go(kind === "drop" ? "dropping" : "walking");
      const ease = kind === "drop" ? ("easeIn" as const) : reduced ? ("easeOut" as const) : ("linear" as const);
      const ax = animate(x, target.x, { duration, ease: kind === "drop" ? "easeOut" : ease });
      const ay = animate(y, target.y, { duration, ease });
      animsRef.current = [ax, ay];
      return Promise.all([ax.finished, ay.finished])
        .then(() => tokenRef.current === token)
        .catch(() => false);
    },
    [go, stopMotion, x, y],
  );

  /** Standing on the floor at x.get(): walk to a better floor spot if needed, then rest. */
  const settleFromFloor = useCallback(() => {
    const o = optsRef.current;
    const w = world();
    const spot = findFloorSpot({
      fromX: x.get(),
      world: w,
      size: o.size,
      view: layoutRef.current.view,
      avoid: readAvoidRects(o.rootRef.current),
      compact: o.compact,
    });
    if (!spot.moved && Math.abs(y.get() - w.floorY) < 1) {
      commitRest(x.get());
      return;
    }
    void moveTo({ x: spot.x, y: w.floorY }, "walk").then((ok) => {
      if (ok) commitRest(spot.x);
    });
  }, [commitRest, moveTo, world, x, y]);

  /** Straight down to the floor (no physics), then settle. */
  const dropToFloor = useCallback(() => {
    const w = world();
    const target = { x: clamp(x.get(), w.minX, w.maxX), y: w.floorY };
    void moveTo(target, "drop").then((ok) => {
      if (ok) settleFromFloor();
    });
  }, [moveTo, settleFromFloor, world, x]);

  const fly = useCallback(
    (velocity: Point) => {
      stopMotion();
      const o = optsRef.current;
      const profile = o.compact ? GRAVITY.compact : GRAVITY.desktop;
      const w = world();
      const viewH = layoutRef.current.view.h;
      const v = clampVelocity(velocity, profile.maxThrow);
      let body: Body = { x: x.get(), y: y.get(), vx: v.x, vy: v.y, grounded: false };
      go("flying");
      const start = performance.now();
      let last = start;
      const step = (t: number) => {
        const dt = Math.min(0.032, Math.max(0, (t - last) / 1000));
        last = t;
        const arena: Arena = {
          minX: w.minX,
          maxX: w.maxX,
          floorY: w.floorY,
          ceilingY: window.scrollY <= 0 ? 4 : null,
          capY: -1.2 * viewH,
        };
        body = stepFall(body, dt, arena, profile);
        x.set(body.x);
        y.set(body.y);
        if (isSettled(body, profile) || t - start > profile.maxFlightMs) {
          rafRef.current = 0;
          y.set(w.floorY);
          settleFromFloor();
          return;
        }
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [go, settleFromFloor, stopMotion, world, x, y],
  );

  /** Walk along the floor to `targetX` (used by play). Resolves false if interrupted. */
  const walkTo = useCallback(
    (targetX: number) => {
      const w = world();
      const tx = clamp(targetX, w.minX, w.maxX);
      return moveTo({ x: tx, y: w.floorY }, "walk").then((ok) => {
        if (ok) commitRest(tx);
        return ok;
      });
    },
    [commitRest, moveTo, world],
  );

  /** Back to a proper resting spot (after play, or when interrupted). */
  const settle = useCallback(() => {
    const w = world();
    if (Math.abs(y.get() - w.floorY) > 1) dropToFloor();
    else settleFromFloor();
  }, [dropToFloor, settleFromFloor, world, y]);

  /** Step aside if the cat now covers marked UI (after scroll, resize or navigation). */
  const ensureSafe = useCallback(() => {
    const o = optsRef.current;
    if (phaseRef.current !== "resting" || o.hold || useCompanionStore.getState().activity) return;
    refreshLayout();
    settle();
  }, [refreshLayout, settle]);

  /** Re-place the cat on the floor for the current viewport (resize, rotation, mode change). */
  const reproject = useCallback(() => {
    if (phaseRef.current === "dragging") return;
    stopMotion();
    const o = optsRef.current;
    const w = world();
    let px = floorXFrom(restRef.current, w);
    if (o.compact) px = dockX(nearestSide({ x: px, y: w.floorY }, layoutRef.current.view, o.size), layoutRef.current.view, o.size, true);
    x.set(px);
    y.set(w.floorY);
    go("resting");
  }, [go, stopMotion, world, x, y]);

  // Initial placement: the stored floor x (normalised, so desktop maps onto phones), else bottom-right.
  useLayoutEffect(() => {
    const stored = usePreferencesStore.getState().companion.position;
    restRef.current = stored ? { x: stored.x, y: 1, floor: true } : { x: 1, y: 1, floor: true };
    reproject();
    const id = window.setTimeout(ensureSafe, FIRST_CHECK_MS);
    return () => window.clearTimeout(id);
  }, [ensureSafe, reproject]);

  // Viewport changes: re-place immediately, then look for UI to avoid once things settle.
  useEffect(() => {
    let raf = 0;
    let settleTimer = 0;
    const onResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const prev = layoutRef.current;
        const next = refreshLayout();
        if (prev.view.w === next.view.w && prev.view.h === next.view.h && prev.floorLine === next.floorLine) return;
        if (prev.view.w === next.view.w && Math.abs(prev.view.h - next.view.h) < TOOLBAR_DELTA) {
          // Mobile toolbars showing or hiding: keep a resting cat standing on the (moved) floor.
          if (phaseRef.current === "resting") y.set(world().floorY);
        } else {
          reproject();
        }
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(ensureSafe, RESIZE_SETTLE_MS);
      });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
    };
  }, [ensureSafe, refreshLayout, reproject, world, y]);

  // Size or phone/desktop mode changed (media queries): re-place.
  const { size, compact } = options;
  const modeRef = useRef({ size, compact });
  useEffect(() => {
    if (modeRef.current.size === size && modeRef.current.compact === compact) return;
    modeRef.current = { size, compact };
    refreshLayout();
    reproject();
    const id = window.setTimeout(ensureSafe, RESIZE_SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [size, compact, refreshLayout, reproject, ensureSafe]);

  // Page scrolled under the cat: once scrolling stops, walk aside if she now covers marked UI.
  useEffect(() => {
    let timer = 0;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(ensureSafe, SCROLL_SETTLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [ensureSafe]);

  // "Reset position": walk back to the bottom-right of the floor.
  const resetNonce = useCompanionStore((s) => s.resetNonce);
  const seenNonce = useRef(resetNonce);
  useEffect(() => {
    if (resetNonce === seenNonce.current) return;
    seenNonce.current = resetNonce;
    refreshLayout();
    const o = optsRef.current;
    const w = world();
    const target = o.compact ? dockX("right", layoutRef.current.view, o.size, true) : w.maxX;
    void moveTo({ x: target, y: w.floorY }, "walk").then((ok) => {
      if (ok) settleFromFloor();
    });
  }, [resetNonce, moveTo, refreshLayout, settleFromFloor, world]);

  useEffect(
    () => () => {
      stopMotion();
      restoreSelectRef.current?.();
    },
    [stopMotion],
  );

  /** Viewport y of the line the cat stands on (for props like the yarn ball). */
  const groundY = useMemo(
    () => getWorld(layout.view, options.size, options.compact, layout.floorLine).floorY + options.size * 0.93,
    [layout, options.size, options.compact],
  );

  const dragConstraints = useMemo(() => {
    const w = getWorld(layout.view, options.size, options.compact, layout.floorLine);
    const left = options.compact ? -options.size * PEEK_FRACTION : w.minX;
    const right = options.compact ? layout.view.w - options.size * (1 - PEEK_FRACTION) : w.maxX;
    return { left, right, top: 4, bottom: w.floorY };
  }, [layout, options.size, options.compact]);

  /** Pointer down on the cat: stop any motion and let Motion take over if the pointer moves. */
  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      draggedRef.current = false;
      interruptedRef.current = phaseRef.current !== "resting";
      if (interruptedRef.current) {
        stopMotion();
        go("resting");
      }
      dragControls.start(e);
    },
    [dragControls, go, stopMotion],
  );

  const onDragStart = useCallback(() => {
    draggedRef.current = true;
    interruptedRef.current = false;
    stopMotion();
    go("dragging");
    // No text selection while the cat is carried across the page.
    const body = document.body.style;
    const previous = body.userSelect;
    body.userSelect = "none";
    window.getSelection()?.removeAllRanges();
    restoreSelectRef.current = () => {
      body.userSelect = previous;
      restoreSelectRef.current = null;
    };
    optsRef.current.onPickUp?.();
  }, [go, stopMotion]);

  const onDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      if (optsRef.current.motionLevel !== "normal") return;
      // Held by the scruff: the body swings against the direction of travel.
      tilt.set(clamp(info.velocity.x / 90, -14, 14));
    },
    [tilt],
  );

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      restoreSelectRef.current?.();
      tilt.set(0);
      refreshLayout();
      const o = optsRef.current;
      if (o.physics && o.motionLevel === "normal") fly(info.velocity);
      else dropToFloor();
    },
    [dropToFloor, fly, refreshLayout, tilt],
  );

  /** True once after a drag, so the click that ends a drag does not open the menu. */
  const consumeDrag = useCallback(() => {
    const dragged = draggedRef.current;
    draggedRef.current = false;
    return dragged;
  }, []);

  /** A press without a drag stopped a fall or a walk: finish settling from here. */
  const settleIfInterrupted = useCallback(() => {
    if (!interruptedRef.current) return;
    interruptedRef.current = false;
    settle();
  }, [settle]);

  return {
    x,
    y,
    tilt,
    layout,
    view: layout.view,
    groundY,
    phase,
    dragControls,
    dragConstraints,
    onPointerDown,
    onDragStart,
    onDrag,
    onDragEnd,
    consumeDrag,
    ensureSafe,
    settle,
    settleIfInterrupted,
    walkTo,
    stopMotion,
    world,
  };
}
