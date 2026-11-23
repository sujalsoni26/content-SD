import { clamp } from "@/lib/utils";
import type { CompanionPosition } from "@/types/companion";

/*
 * Safe-zone resting for the companion. Pure geometry plus one DOM reader.
 *
 * Coordinates are viewport pixels for the cat's top-left corner. The cat never rests over an
 * element marked `data-companion-avoid`; when nowhere is fully free it takes the spot with the
 * least overlap, preferring the side edges and the bottom corners.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export type Side = "left" | "right";
export type RestZone = "free" | "corner" | "left" | "right" | "bottom";

export interface RestingSpot {
  point: Point;
  /** Overlapped area / visible cat area (sums nested avoid zones, so it can exceed 1). */
  overlap: number;
  zone: RestZone;
}

/** Gap kept from the viewport edge when the cat is fully on screen. */
export const EDGE_MARGIN = { desktop: 12, compact: 6 } as const;
/** Fraction of the cat tucked past the edge when it docks on a phone. */
export const PEEK_FRACTION = 0.42;
/** Breathing room around avoided UI, in px. */
export const AVOID_PADDING = 6;
/** Overlap ratio the cat tolerates before it moves out of the way on its own. */
export const OVERLAP_TOLERANCE = 0.06;

/** Zone preference when several spots are equally good (lower is better, in px-equivalents). */
const ZONE_PENALTY: Record<RestZone, number> = { free: 0, corner: 0, right: 14, left: 22, bottom: 56 };
const ROWS = 16;
const COLUMNS = 12;

export function readViewport(): Size {
  const doc = document.documentElement;
  const w = doc.clientWidth || window.innerWidth;
  const h = Math.min(window.innerHeight, doc.clientHeight || window.innerHeight);
  return { w, h };
}

/** Where the whole cat stays visible. */
export function getBounds(view: Size, size: number, compact: boolean): Bounds {
  const m = compact ? EDGE_MARGIN.compact : EDGE_MARGIN.desktop;
  return {
    minX: m,
    maxX: Math.max(m, view.w - size - m),
    minY: m,
    maxY: Math.max(m, view.h - size - m),
  };
}

/** Drag and flight range: on phones the cat may hang part-way off the side edges. */
export function getDragBounds(view: Size, size: number, compact: boolean): Bounds {
  const b = getBounds(view, size, compact);
  if (!compact) return b;
  return { ...b, minX: -size * PEEK_FRACTION, maxX: Math.max(b.minX, view.w - size * (1 - PEEK_FRACTION)) };
}

export function clampToBounds(p: Point, b: Bounds): Point {
  return { x: clamp(p.x, b.minX, b.maxX), y: clamp(p.y, b.minY, b.maxY) };
}

export function normalize(p: Point, b: Bounds): CompanionPosition {
  const spanX = b.maxX - b.minX;
  const spanY = b.maxY - b.minY;
  return {
    x: spanX > 0 ? clamp((p.x - b.minX) / spanX, 0, 1) : 1,
    y: spanY > 0 ? clamp((p.y - b.minY) / spanY, 0, 1) : 1,
  };
}

export function denormalize(n: CompanionPosition, b: Bounds): Point {
  const x = Number.isFinite(n.x) ? clamp(n.x, 0, 1) : 1;
  const y = Number.isFinite(n.y) ? clamp(n.y, 0, 1) : 1;
  return { x: b.minX + x * (b.maxX - b.minX), y: b.minY + y * (b.maxY - b.minY) };
}

export function nearestSide(p: Point, view: Size, size: number): Side {
  return p.x + size / 2 < view.w / 2 ? "left" : "right";
}

/** Resting x for a side edge; phones dock with part of the cat tucked off-screen. */
export function dockX(side: Side, view: Size, size: number, compact: boolean): number {
  const b = compact ? getDragBounds(view, size, true) : getBounds(view, size, false);
  return side === "left" ? b.minX : b.maxX;
}

function intersection(a: Rect, b: Rect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Share of the cat's on-screen area that covers avoided UI. */
export function overlapRatio(p: Point, size: number, view: Size, avoid: readonly Rect[]): number {
  const cat: Rect = {
    left: Math.max(0, p.x - AVOID_PADDING),
    top: Math.max(0, p.y - AVOID_PADDING),
    right: Math.min(view.w, p.x + size + AVOID_PADDING),
    bottom: Math.min(view.h, p.y + size + AVOID_PADDING),
  };
  const area = Math.max(1, (cat.right - cat.left) * (cat.bottom - cat.top));
  let covered = 0;
  for (const r of avoid) covered += intersection(cat, r);
  return covered / area;
}

function spread(min: number, max: number, count: number): number[] {
  if (max - min < 1) return [min];
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1));
}

/** Evenly spread positions plus the positions just clear of each obstacle, clamped and de-duplicated. */
function stops(min: number, max: number, count: number, extra: number[]): number[] {
  const all = spread(min, max, count).concat(extra.map((v) => clamp(v, min, max)));
  const seen = new Set<number>();
  return all.filter((v) => {
    const key = Math.round(v);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

interface FindOptions {
  from: Point;
  size: number;
  view: Size;
  avoid: readonly Rect[];
  compact: boolean;
}

/**
 * The resting spot for a cat released at `from`.
 * 1. Any fully free spot wins; among those, the nearest one (plus a small zone preference).
 *    On desktop the release point itself counts, so a cat dropped on empty space stays put.
 * 2. Otherwise the least-overlap spot, preferring the side edges and bottom corners, then distance.
 * Phones only consider docked spots on the left and right edges.
 */
export function findRestingSpot({ from, size, view, avoid, compact }: FindOptions): RestingSpot {
  const b = getBounds(view, size, compact);
  const start = clampToBounds(from, b);
  const candidates: Array<{ point: Point; zone: RestZone }> = [];

  // Rows along the side edges and columns along the bottom edge, including the spots just clear of
  // each avoided element (below the header, above a bottom nav, in the gap between two columns).
  const pad = AVOID_PADDING + 1;
  const rows = stops(b.minY, b.maxY, ROWS, [start.y, ...avoid.flatMap((r) => [r.bottom + pad, r.top - pad - size])]);
  for (const side of ["left", "right"] as const) {
    const x = dockX(side, view, size, compact);
    for (const y of rows) candidates.push({ point: { x, y }, zone: y >= b.maxY - 0.5 ? "corner" : side });
  }
  if (!compact) {
    const columns = stops(b.minX, b.maxX, COLUMNS, [start.x, ...avoid.flatMap((r) => [r.right + pad, r.left - pad - size])]);
    for (const x of columns) candidates.push({ point: { x, y: b.maxY }, zone: "bottom" });
    candidates.push({ point: start, zone: "free" });
  }

  let bestFree: RestingSpot | null = null;
  let bestFreeScore = Infinity;
  let bestAny: RestingSpot | null = null;
  let bestAnyScore = Infinity;

  for (const c of candidates) {
    const overlap = overlapRatio(c.point, size, view, avoid);
    const distance = Math.hypot(c.point.x - from.x, c.point.y - from.y);
    const spot: RestingSpot = { point: c.point, overlap, zone: c.zone };
    if (overlap <= 0.0001) {
      const score = distance + ZONE_PENALTY[c.zone];
      if (score < bestFreeScore) {
        bestFreeScore = score;
        bestFree = spot;
      }
    }
    const score = overlap * 1000 + ZONE_PENALTY[c.zone] + distance * 0.15;
    if (score < bestAnyScore) {
      bestAnyScore = score;
      bestAny = spot;
    }
  }

  return bestFree ?? bestAny ?? { point: start, overlap: 0, zone: "free" };
}

/** Rects of every visible `[data-companion-avoid]` element, clipped to the viewport. */
export function readAvoidRects(exclude?: Element | null): Rect[] {
  const view = readViewport();
  const rects: Rect[] = [];
  document.querySelectorAll("[data-companion-avoid]").forEach((el) => {
    if (exclude && exclude.contains(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (r.bottom <= 0 || r.right <= 0 || r.top >= view.h || r.left >= view.w) return;
    rects.push({
      left: Math.max(0, r.left),
      top: Math.max(0, r.top),
      right: Math.min(view.w, r.right),
      bottom: Math.min(view.h, r.bottom),
    });
  });
  return rects;
}

/* ------------------------------------------------------------------ floor (gravity mode) */

/** Gap between the cat's box and the floor line, px. */
export const FLOOR_GAP = 2;

/** The floor line: the bottom of the viewport, or the top of a fixed bottom tab bar (`nav[aria-label=Main]`). */
export function readFloorLine(view: Size): number {
  let line = view.h;
  document.querySelectorAll('nav[aria-label="Main"]').forEach((nav) => {
    const r = nav.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (r.bottom >= view.h - 4 && r.top < view.h && r.top > view.h * 0.5) line = Math.min(line, r.top);
  });
  return line;
}

export interface World {
  /** Side walls for the cat's left edge. */
  minX: number;
  maxX: number;
  /** Resting y (top of the cat's box) on the floor. */
  floorY: number;
}

export function getWorld(view: Size, size: number, compact: boolean, floorLine: number): World {
  const m = compact ? 2 : 8;
  return {
    minX: m,
    maxX: Math.max(m, view.w - size - m),
    floorY: Math.max(m, floorLine - size - FLOOR_GAP),
  };
}

export interface FloorSpot {
  x: number;
  overlap: number;
  moved: boolean;
}

/**
 * Where to stand on the floor after landing at `fromX`.
 * Phones: the nearest bottom corner, tucked part-way off-screen.
 * Desktop: stay unless covering marked UI; otherwise the nearest floor spot that is free, else the
 * one with clearly less overlap.
 */
export function findFloorSpot({
  fromX,
  world,
  size,
  view,
  avoid,
  compact,
}: {
  fromX: number;
  world: World;
  size: number;
  view: Size;
  avoid: readonly Rect[];
  compact: boolean;
}): FloorSpot {
  const here = clamp(fromX, world.minX, world.maxX);
  if (compact) {
    const x = dockX(nearestSide({ x: fromX, y: world.floorY }, view, size), view, size, true);
    return { x, overlap: 0, moved: Math.abs(x - fromX) > 1 };
  }
  const y = world.floorY;
  const current = overlapRatio({ x: here, y }, size, view, avoid);
  if (current <= OVERLAP_TOLERANCE) return { x: here, overlap: current, moved: Math.abs(here - fromX) > 1 };
  const pad = AVOID_PADDING + 1;
  const xs = stops(world.minX, world.maxX, 24, [here, ...avoid.flatMap((r) => [r.right + pad, r.left - pad - size])]);
  let bestFree: FloorSpot | null = null;
  let bestAny: FloorSpot | null = null;
  let bestAnyScore = Infinity;
  for (const x of xs) {
    const overlap = overlapRatio({ x, y }, size, view, avoid);
    const distance = Math.abs(x - here);
    if (overlap <= OVERLAP_TOLERANCE && (!bestFree || distance < Math.abs(bestFree.x - here))) bestFree = { x, overlap, moved: true };
    const score = overlap * 1000 + distance * 0.15;
    if (score < bestAnyScore) {
      bestAnyScore = score;
      bestAny = { x, overlap, moved: true };
    }
  }
  if (bestFree) return bestFree;
  if (bestAny && bestAny.overlap < current * 0.8) return bestAny;
  return { x: here, overlap: current, moved: Math.abs(here - fromX) > 1 };
}

export function normalizeFloorX(x: number, world: World): CompanionPosition {
  const span = world.maxX - world.minX;
  return { x: span > 0 ? clamp((x - world.minX) / span, 0, 1) : 1, y: 1, floor: true };
}

export function floorXFrom(position: CompanionPosition | null, world: World): number {
  const n = position && Number.isFinite(position.x) ? clamp(position.x, 0, 1) : 1;
  return world.minX + n * (world.maxX - world.minX);
}
