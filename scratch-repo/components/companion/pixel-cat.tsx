"use client";
import { memo, useEffect, useId, useRef } from "react";
import type { CSSProperties } from "react";
import { animate, AnimatePresence, motion, useMotionValue, type Transition } from "motion/react";
import { cn } from "@/lib/utils";
import type { AccessoryId, AccessorySlot, AnimationLevel, CompanionMood } from "@/types/companion";

/*
 * Cache, drawn as vector parts (body, head, ears, eyes, muzzle, tail, paws) and posed with Motion.
 * "A little pixelated": the fur layers pass through a mosaic filter (5-unit blocks, about 3.5 px at
 * the 84 px desktop size) while the eyes, nose and mouth stay crisp, so expressions read clearly.
 * The filter only re-runs while something animates. Colours come from theme tokens; a faint --ink
 * drop-shadow rim keeps the silhouette readable on dark backgrounds.
 */

type Eyes = "open" | "wide" | "relaxed" | "down" | "up" | "happy" | "closed" | "confused";
type Mouth = "w" | "smile" | "o" | "wavy" | "flat";
type Paws = "sit" | "walk" | "tuck" | "dangle" | "chin" | "book" | "cheer" | "bat";
type Tail = "up" | "high" | "curl" | "wrap" | "hang";
type Extra = "book" | "glasses" | "thought" | "question" | "sparkles" | "zzz" | "blush" | "fish" | "hearts";

interface Pose {
  head: { x: number; y: number; rotate: number };
  earL: number;
  earR: number;
  earScale: number;
  body: { scaleX: number; scaleY: number };
  tail: Tail;
  eyes: Eyes;
  mouth: Mouth;
  paws: Paws;
  extras: readonly Extra[];
  shadow: { rx: number; opacity: number };
}

const BASE: Pose = {
  head: { x: 0, y: 0, rotate: 0 },
  earL: 0,
  earR: 0,
  earScale: 1,
  body: { scaleX: 1, scaleY: 1 },
  tail: "up",
  eyes: "open",
  mouth: "w",
  paws: "sit",
  extras: [],
  shadow: { rx: 25, opacity: 0.13 },
};

const POSES: Record<CompanionMood, Pose> = {
  idle: BASE,
  sitting: { ...BASE, head: { x: 0, y: 1, rotate: 0 }, earL: -5, earR: 5, earScale: 0.96, tail: "wrap", eyes: "relaxed" },
  walking: { ...BASE, head: { x: 0, y: -1, rotate: 0 }, tail: "high", paws: "walk" },
  sleeping: {
    ...BASE,
    head: { x: -7, y: 27, rotate: -14 },
    earL: -16,
    earR: 14,
    earScale: 0.86,
    body: { scaleX: 1.3, scaleY: 0.56 },
    tail: "wrap",
    eyes: "closed",
    paws: "tuck",
    extras: ["zzz"],
    shadow: { rx: 34, opacity: 0.13 },
  },
  studying: {
    ...BASE,
    head: { x: 0, y: 2, rotate: 0 },
    earL: -6,
    earR: 6,
    earScale: 0.96,
    tail: "curl",
    eyes: "down",
    paws: "book",
    extras: ["book", "glasses"],
  },
  thinking: { ...BASE, head: { x: -1, y: 0, rotate: -8 }, earL: -3, earR: 9, tail: "curl", eyes: "up", mouth: "flat", paws: "chin", extras: ["thought"] },
  happy: { ...BASE, head: { x: 0, y: -1, rotate: 5 }, earL: 7, earR: -7, earScale: 1.04, tail: "high", eyes: "happy", mouth: "smile", extras: ["blush"] },
  celebrating: {
    ...BASE,
    head: { x: 0, y: -2, rotate: 0 },
    earL: 8,
    earR: -8,
    earScale: 1.05,
    tail: "high",
    eyes: "happy",
    mouth: "smile",
    paws: "cheer",
    extras: ["blush", "sparkles"],
  },
  confused: { ...BASE, head: { x: 1, y: 0, rotate: 13 }, earL: -22, earR: 4, earScale: 0.95, tail: "curl", eyes: "confused", mouth: "wavy", extras: ["question"] },
  dragged: {
    ...BASE,
    head: { x: 0, y: -2, rotate: 0 },
    earL: -34,
    earR: 34,
    earScale: 0.78,
    body: { scaleX: 0.94, scaleY: 1.06 },
    tail: "hang",
    eyes: "wide",
    mouth: "o",
    paws: "dangle",
    shadow: { rx: 15, opacity: 0.05 },
  },
  eating: { ...BASE, head: { x: 0, y: 5, rotate: 0 }, earL: 4, earR: -4, tail: "curl", eyes: "happy", mouth: "o", extras: ["fish"] },
  purring: { ...BASE, head: { x: 0, y: 0, rotate: 7 }, earL: 6, earR: -6, earScale: 1.02, tail: "high", eyes: "happy", mouth: "w", extras: ["blush", "hearts"] },
  playing: { ...BASE, head: { x: 2, y: 1, rotate: 10 }, earL: 8, earR: -4, earScale: 1.04, tail: "high", eyes: "wide", mouth: "o", paws: "bat" },
};

/** Every tail shares one command structure (M C C) so Motion can morph between them. */
const TAILS: Record<Tail, string> = {
  up: "M 80 99 C 95 101 105 92 103 79 C 102 72 96 69 93 74",
  high: "M 80 98 C 91 96 98 85 97 71 C 96.5 64 92 59 88 62",
  curl: "M 80 100 C 94 104 104 98 104 88 C 104 82 99 80 97 84",
  wrap: "M 80 102 C 90 108 79 111 63 111 C 53 111 45 109.5 42 106",
  hang: "M 72 100 C 74 107 73 112 70 116 C 69 118 67 118.5 66 117",
};

type PawShape = { cx: number; cy: number; rx: number; ry: number; opacity: number };
const SIT_L: PawShape = { cx: 51, cy: 104, rx: 6.5, ry: 4.4, opacity: 1 };
const SIT_R: PawShape = { cx: 69, cy: 104, rx: 6.5, ry: 4.4, opacity: 1 };
const PAWS: Record<Paws, readonly [PawShape, PawShape]> = {
  sit: [SIT_L, SIT_R],
  walk: [SIT_L, SIT_R],
  tuck: [
    { cx: 50, cy: 105, rx: 6, ry: 3.6, opacity: 0 },
    { cx: 66, cy: 105, rx: 6, ry: 3.6, opacity: 0 },
  ],
  dangle: [
    { cx: 50, cy: 112, rx: 4.8, ry: 6.4, opacity: 1 },
    { cx: 70, cy: 112, rx: 4.8, ry: 6.4, opacity: 1 },
  ],
  chin: [SIT_L, { cx: 66, cy: 67, rx: 5.4, ry: 4.6, opacity: 1 }],
  book: [
    { cx: 45.5, cy: 86, rx: 5, ry: 4.4, opacity: 1 },
    { cx: 74.5, cy: 86, rx: 5, ry: 4.4, opacity: 1 },
  ],
  cheer: [
    { cx: 37, cy: 70, rx: 5, ry: 5.6, opacity: 1 },
    { cx: 83, cy: 70, rx: 5, ry: 5.6, opacity: 1 },
  ],
  bat: [SIT_L, { cx: 82, cy: 95, rx: 5.6, ry: 4.8, opacity: 1 }],
};

const BODY_D = "M 41 104 C 35 104 33 96 34.5 87 C 36.5 75 45 63 60 63 C 75 63 83.5 75 85.5 87 C 87 96 85 104 79 104 Z";
const BLINKABLE: ReadonlySet<Eyes> = new Set(["open", "wide", "up", "relaxed", "down", "confused"]);
const EYE_L = { cx: 48, cy: 45 };
const EYE_R = { cx: 72, cy: 45 };
/** Mosaic block size in viewBox units (120 units = the cat's width). */
const BLOCK = 5;

type CatStyle = CSSProperties & Record<`--${string}`, string>;
/** Palette derived from tokens (no hex): fur is --amber, lines and eyes are darkened amber. */
const CAT_STYLE: CatStyle = {
  "--cat-fur": "var(--amber)",
  "--cat-fur-dark": "color-mix(in oklab, var(--amber) 70%, black)",
  "--cat-cream": "color-mix(in oklab, var(--amber) 20%, white)",
  "--cat-line": "color-mix(in oklab, var(--amber) 28%, black)",
  "--cat-eye": "color-mix(in oklab, var(--amber) 12%, black)",
  "--cat-pink": "color-mix(in oklab, var(--bad) 40%, white)",
  "--cat-mouth": "color-mix(in oklab, var(--bad) 45%, black)",
  "--cat-shine": "white",
  "--cat-gold": "color-mix(in oklab, var(--amber) 72%, white)",
  filter:
    "drop-shadow(0 0 0.8px color-mix(in srgb, var(--ink) 45%, transparent)) drop-shadow(0 3px 5px hsl(var(--shadow-color) / 0.22))",
};

/** Transform origin in viewBox units (Motion sets transform-box for SVG; we pin it to the view box). */
const pivot = (x: number, y: number) => ({ originX: `${x}px`, originY: `${y}px`, transformBox: "view-box" as const });

const SPARKLE = "M 0 -7 C 1 -2 2 -1 7 0 C 2 1 1 2 0 7 C -1 2 -2 1 -7 0 C -2 -1 -1 -2 0 -7 Z";
const SPARKLES = [
  { x: 17, y: 40, tone: "fill-amber", delay: 0, scale: 1 },
  { x: 103, y: 30, tone: "fill-accent", delay: 0.12, scale: 0.85 },
  { x: 12, y: 82, tone: "fill-accent", delay: 0.22, scale: 0.75 },
  { x: 108, y: 76, tone: "fill-amber", delay: 0.32, scale: 0.95 },
] as const;
const HEART = "M 0 3.2 C -5.5 -1 -4.6 -6.4 0 -3.8 C 4.6 -6.4 5.5 -1 0 3.2 Z";

export type EquippedAccessories = Partial<Record<AccessorySlot, AccessoryId>>;

export interface PixelCatProps {
  mood?: CompanionMood;
  /** "normal" poses with springs and plays idle beats; "reduced" and "off" snap between poses. */
  motionLevel?: AnimationLevel;
  /** Allow occasional idle micro-motions (blink, tail flick, ear twitch, drifting z). */
  ambient?: boolean;
  /** Eyes follow a mouse pointer (only while `ambient`). */
  gaze?: boolean;
  /** Worn accessories, one per slot. */
  accessories?: EquippedAccessories;
  /** Mosaic look; on by default. */
  pixelated?: boolean;
  /** Accessible name; omit when a parent (the companion button) already names the cat. */
  label?: string;
  className?: string;
}

function hopFor(mood: CompanionMood, animated: boolean): { y: number | number[]; transition: Transition } {
  if (!animated) return { y: 0, transition: { duration: 0 } };
  switch (mood) {
    case "walking":
      return { y: [0, -1.6, 0], transition: { y: { duration: 0.36, repeat: Infinity, ease: "easeInOut" } } };
    case "celebrating":
      return { y: [0, -12, 0, -4, 0], transition: { y: { duration: 0.9, ease: "easeOut" } } };
    case "happy":
      return { y: [0, -5, 0], transition: { y: { duration: 0.45, ease: "easeOut" } } };
    case "eating":
      return { y: [0, 1.6, 0], transition: { y: { duration: 0.32, repeat: 4, ease: "easeInOut" } } };
    case "playing":
      return { y: [0, -3, 0], transition: { y: { duration: 0.3, ease: "easeOut" } } };
    default:
      return { y: 0, transition: { y: { duration: 0.25, ease: "easeOut" } } };
  }
}

function PixelCatImpl({
  mood = "idle",
  motionLevel = "normal",
  ambient = false,
  gaze = false,
  accessories,
  pixelated = true,
  label,
  className,
}: PixelCatProps) {
  const pose = POSES[mood];
  const animated = motionLevel === "normal";
  const svgRef = useRef<SVGSVGElement>(null);
  const moodRef = useRef(mood);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const pxId = `cat-px-${uid}`;
  const clipId = `cat-body-${uid}`;
  const fur = pixelated ? `url(#${pxId})` : undefined;
  const wear = accessories ?? {};

  // Imperative one-shot motions, driven by the beat timer below (no continuous loops at rest).
  const blink = useMotionValue(1);
  const tailFlick = useMotionValue(0);
  const earTwitch = useMotionValue(0);
  const zLift = useMotionValue(0);
  const gazeX = useMotionValue(0);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    if (!ambient || !animated) return;
    let timer = 0;
    let beat = 0;
    const running: Array<{ stop: () => void }> = [];
    const play = () => {
      beat += 1;
      const current = POSES[moodRef.current];
      if (current.extras.includes("zzz")) {
        running.push(animate(zLift, [0, -6, 0], { duration: 2.4, ease: "easeInOut" }));
      } else {
        if (BLINKABLE.has(current.eyes)) running.push(animate(blink, [1, 0.1, 1], { duration: 0.24, times: [0, 0.45, 1] }));
        if (beat % 3 === 0) running.push(animate(tailFlick, [0, 9, -4, 0], { duration: 0.9, ease: "easeInOut" }));
        if (beat % 4 === 2) running.push(animate(earTwitch, [0, -11, 0], { duration: 0.34, ease: "easeOut" }));
      }
      if (running.length > 8) running.splice(0, running.length - 8);
      timer = window.setTimeout(play, 3200 + Math.random() * 4800);
    };
    timer = window.setTimeout(play, 1800 + Math.random() * 2500);
    return () => {
      window.clearTimeout(timer);
      running.forEach((a) => a.stop());
      blink.set(1);
      tailFlick.set(0);
      earTwitch.set(0);
      zLift.set(0);
    };
  }, [ambient, animated, blink, tailFlick, earTwitch, zLift]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !ambient || !animated || !gaze) return;
    let raf = 0;
    let px = 0;
    let target = 0;
    let anim: { stop: () => void } | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = svg.getBoundingClientRect();
        const centre = r.left + r.width / 2;
        const next = px < centre - 90 ? -1 : px > centre + 90 ? 1 : 0;
        if (next === target) return;
        target = next;
        anim?.stop();
        anim = animate(gazeX, next * 1.7, { duration: 0.25, ease: "easeOut" });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      anim?.stop();
      gazeX.set(0);
    };
  }, [ambient, animated, gaze, gazeX]);

  const spring: Transition = animated ? { type: "spring", stiffness: 300, damping: 24, mass: 0.8 } : { duration: 0 };
  const morph: Transition = animated ? { duration: 0.32, ease: "easeOut" } : { duration: 0 };
  const fade: Transition = animated ? { duration: 0.2 } : { duration: 0 };
  const has = (e: Extra) => pose.extras.includes(e);
  const hop = hopFor(mood, animated);
  const walking = animated && mood === "walking";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      overflow="visible"
      className={cn("block select-none", className)}
      style={CAT_STYLE}
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <defs>
        {/* Mosaic: sample one point per BLOCK×BLOCK cell, then grow it back to fill the cell. */}
        <filter id={pxId} filterUnits="userSpaceOnUse" x={-20} y={-20} width={160} height={160} colorInterpolationFilters="sRGB">
          <feFlood x={-18} y={-18} width={1} height={1} result="dot" />
          <feComposite in="dot" in2="dot" operator="over" x={-20} y={-20} width={BLOCK} height={BLOCK} result="cell" />
          <feTile in="cell" result="grid" />
          <feComposite in="SourceGraphic" in2="grid" operator="in" result="samples" />
          <feMorphology in="samples" operator="dilate" radius={(BLOCK - 1) / 2} />
        </filter>
        <clipPath id={clipId}>
          <path d={BODY_D} />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <motion.ellipse
        cx={60}
        cy={110}
        ry={3.6}
        className="fill-ink"
        initial={false}
        animate={{ rx: pose.shadow.rx, opacity: pose.shadow.opacity }}
        transition={spring}
      />

      <motion.g initial={false} animate={{ y: hop.y }} transition={hop.transition}>
        {/* tail */}
        <motion.g style={{ rotate: tailFlick, ...pivot(80, 100) }}>
          <g filter={fur}>
            <motion.path
              className="fill-none stroke-(--cat-line)"
              strokeWidth={10.5}
              strokeLinecap="round"
              initial={false}
              animate={{ d: TAILS[pose.tail] }}
              transition={morph}
            />
            <motion.path
              className="fill-none stroke-(--cat-fur)"
              strokeWidth={7}
              strokeLinecap="round"
              initial={false}
              animate={{ d: TAILS[pose.tail] }}
              transition={morph}
            />
          </g>
        </motion.g>

        {/* body (+ cape behind, sweater and neckwear in front) */}
        <motion.g style={pivot(60, 106)} initial={false} animate={pose.body} transition={spring}>
          <g filter={fur}>
            {wear.body === "hero-cape" ? <Cape /> : null}
            <path d={BODY_D} className="fill-(--cat-fur) stroke-(--cat-line)" strokeWidth={2.2} strokeLinejoin="round" />
            {wear.body === "striped-sweater" ? (
              <Sweater clipId={clipId} />
            ) : (
              <>
                <ellipse cx={60} cy={88} rx={10.5} ry={13.5} className="fill-(--cat-cream)" />
                <path
                  d="M 37.5 88 Q 41.5 89 43.5 86 M 37 95 Q 41 96 43 93 M 82.5 88 Q 78.5 89 76.5 86 M 83 95 Q 79 96 77 93"
                  className="fill-none stroke-(--cat-fur-dark)"
                  strokeWidth={2.1}
                  strokeLinecap="round"
                />
              </>
            )}
            {wear.body === "hero-cape" ? (
              <g>
                <circle cx={47.5} cy={68.5} r={2.2} className="fill-(--cat-gold) stroke-(--cat-line)" strokeWidth={0.8} />
                <circle cx={72.5} cy={68.5} r={2.2} className="fill-(--cat-gold) stroke-(--cat-line)" strokeWidth={0.8} />
              </g>
            ) : null}
            {wear.neck ? <Neckwear id={wear.neck} /> : null}
          </g>
        </motion.g>

        {/* book (studying) */}
        <AnimatePresence initial={false}>
          {has("book") ? (
            <motion.g
              key="book"
              initial={animated ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={animated ? { opacity: 0, y: 6 } : { opacity: 0 }}
              transition={fade}
            >
              <path
                d="M 41.5 76.5 L 41.5 93.5 C 49 92.5 55 93 60 95.5 C 65 93 71 92.5 78.5 93.5 L 78.5 76.5"
                className="fill-none stroke-accent"
                strokeWidth={2.4}
                strokeLinejoin="round"
              />
              <path
                d="M 60 77 C 55 74.5 49 74 43 75 L 43 92 C 49 91 55 91.5 60 94 Z M 60 77 C 65 74.5 71 74 77 75 L 77 92 C 71 91 65 91.5 60 94 Z"
                className="fill-(--cat-cream) stroke-accent"
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
              <path
                d="M 47 79.5 L 56 80.6 M 47 83.2 L 56 84.2 M 47 86.9 L 53 87.6 M 64 80.6 L 73 79.5 M 64 84.2 L 73 83.2 M 67 87.6 L 73 86.9"
                className="fill-none stroke-line-strong"
                strokeWidth={1.2}
                strokeLinecap="round"
              />
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* head */}
        <motion.g style={pivot(60, 66)} initial={false} animate={pose.head} transition={spring}>
          <g filter={fur}>
            {/* ears sit behind the head shape */}
            <motion.g style={pivot(45, 31)} initial={false} animate={{ rotate: pose.earL, scaleY: pose.earScale }} transition={spring}>
              <path
                d="M 37 35 C 34 26 32 17 33 11 C 33.5 8.5 35.5 8 37.5 9.5 C 42 13 48 19 53 27 Z"
                className="fill-(--cat-fur) stroke-(--cat-line)"
                strokeWidth={2.2}
                strokeLinejoin="round"
              />
              <path d="M 38.5 30 C 37 24 36 18 36.5 14 C 40 17 44 21 47.5 25.5 Z" className="fill-(--cat-pink)" />
            </motion.g>
            <motion.g style={pivot(75, 31)} initial={false} animate={{ rotate: pose.earR, scaleY: pose.earScale }} transition={spring}>
              <motion.g style={{ rotate: earTwitch, ...pivot(75, 31) }}>
                <path
                  d="M 83 35 C 86 26 88 17 87 11 C 86.5 8.5 84.5 8 82.5 9.5 C 78 13 72 19 67 27 Z"
                  className="fill-(--cat-fur) stroke-(--cat-line)"
                  strokeWidth={2.2}
                  strokeLinejoin="round"
                />
                <path d="M 81.5 30 C 83 24 84 18 83.5 14 C 80 17 76 21 72.5 25.5 Z" className="fill-(--cat-pink)" />
              </motion.g>
            </motion.g>

            <path
              d="M 30 47 C 30 31 43 23 60 23 C 77 23 90 31 90 47 C 90 55 87 61 82 64 C 76 68 68 69 60 69 C 52 69 44 68 38 64 C 33 61 30 55 30 47 Z"
              className="fill-(--cat-fur) stroke-(--cat-line)"
              strokeWidth={2.2}
              strokeLinejoin="round"
            />
            <path
              d="M 55 26 L 56 31.5 M 60 25 L 60 31 M 65 26 L 64 31.5"
              className="fill-none stroke-(--cat-fur-dark)"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <ellipse cx={55.2} cy={56} rx={5.8} ry={4.4} className="fill-(--cat-cream)" />
            <ellipse cx={64.8} cy={56} rx={5.8} ry={4.4} className="fill-(--cat-cream)" />
            {wear.head ? <Hat id={wear.head} /> : null}
          </g>

          <AnimatePresence initial={false}>
            {has("blush") ? (
              <motion.g key="blush" initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} exit={{ opacity: 0 }} transition={fade}>
                <ellipse cx={41.5} cy={55} rx={4.2} ry={2.5} className="fill-(--cat-pink)" />
                <ellipse cx={78.5} cy={55} rx={4.2} ry={2.5} className="fill-(--cat-pink)" />
              </motion.g>
            ) : null}
          </AnimatePresence>

          {/* eyes stay crisp: gaze shifts both, blink squashes each around its own centre */}
          <motion.g style={{ x: gazeX }}>
            <motion.g style={{ scaleY: blink, ...pivot(EYE_L.cx, EYE_L.cy) }}>
              <Eye {...EYE_L} shape={pose.eyes} side="left" />
            </motion.g>
            <motion.g style={{ scaleY: blink, ...pivot(EYE_R.cx, EYE_R.cy) }}>
              <Eye {...EYE_R} shape={pose.eyes} side="right" />
            </motion.g>
          </motion.g>

          <path
            d="M 57.4 51.2 Q 60 50 62.6 51.2 Q 61.6 53.8 60 54.2 Q 58.4 53.8 57.4 51.2 Z"
            className="fill-(--cat-pink) stroke-(--cat-line)"
            strokeWidth={0.9}
            strokeLinejoin="round"
          />
          <Mouth shape={pose.mouth} />
          <path
            d="M 44 55 L 31 52.5 M 44 58 L 31 59.5 M 76 55 L 89 52.5 M 76 58 L 89 59.5"
            className="fill-none stroke-(--cat-line)"
            strokeWidth={1.1}
            strokeLinecap="round"
            opacity={0.5}
          />

          {wear.eyes ? <Eyewear id={wear.eyes} /> : null}
          <AnimatePresence initial={false}>
            {has("glasses") && !wear.eyes ? (
              <motion.g key="glasses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
                <RoundGlasses />
              </motion.g>
            ) : null}
          </AnimatePresence>
        </motion.g>

        {/* paws (front layer, so a paw can rest on the chin, hold the book or bat the yarn) */}
        <g filter={fur}>
          {PAWS[pose.paws].map((paw, i) => (
            <motion.ellipse
              key={i}
              className="fill-(--cat-cream) stroke-(--cat-line)"
              strokeWidth={1.8}
              initial={false}
              animate={walking ? { ...paw, cy: [paw.cy, paw.cy - 2.2, paw.cy] } : paw}
              // Only cy loops while walking; everything else uses the spring, so nothing keeps the frame loop alive.
              transition={
                walking ? { default: spring, cy: { duration: 0.36, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 } } : spring
              }
            />
          ))}
        </g>
      </motion.g>

      {/* overlays */}
      <AnimatePresence initial={false}>
        {has("fish") ? (
          <motion.g key="fish" initial={animated ? { opacity: 0, y: 4 } : { opacity: 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={fade}>
            <g transform="translate(60 110)">
              <path d="M -10 0 Q -3 -6 5 0 Q -3 6 -10 0 Z" className="fill-accent stroke-(--cat-line)" strokeWidth={1} />
              <path d="M 5 0 L 11 -4.5 L 11 4.5 Z" className="fill-accent stroke-(--cat-line)" strokeWidth={1} strokeLinejoin="round" />
              <circle cx={-5.5} cy={-1} r={1} className="fill-(--cat-eye)" />
            </g>
          </motion.g>
        ) : null}
        {has("hearts") ? (
          <motion.g key="hearts" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
            {[
              { x: 88, y: 40, delay: 0, s: 1.3 },
              { x: 99, y: 27, delay: 0.25, s: 1 },
            ].map((h) => (
              <g key={h.x} transform={`translate(${h.x} ${h.y}) scale(${h.s})`}>
                <motion.path
                  d={HEART}
                  className="fill-bad"
                  initial={animated ? { opacity: 0, y: 4 } : false}
                  animate={animated ? { opacity: [0, 1, 1, 0], y: [4, 0, -4, -8] } : { opacity: 1 }}
                  transition={animated ? { duration: 1.5, delay: h.delay, ease: "easeOut" } : { duration: 0 }}
                />
              </g>
            ))}
          </motion.g>
        ) : null}
        {has("thought") ? (
          <motion.g key="thought" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
            <circle cx={87} cy={32} r={2.2} className="fill-surface stroke-line-strong" strokeWidth={1.3} />
            <circle cx={93.5} cy={23.5} r={3.2} className="fill-surface stroke-line-strong" strokeWidth={1.3} />
            <circle cx={103} cy={12} r={6.2} className="fill-surface stroke-line-strong" strokeWidth={1.3} />
            <circle cx={100.4} cy={12} r={0.95} className="fill-ink-3" />
            <circle cx={103} cy={12} r={0.95} className="fill-ink-3" />
            <circle cx={105.6} cy={12} r={0.95} className="fill-ink-3" />
          </motion.g>
        ) : null}
        {has("question") ? (
          <motion.text
            key="question"
            x={101}
            y={28}
            textAnchor="middle"
            className="fill-accent font-display"
            fontSize={24}
            fontWeight={800}
            initial={animated ? { opacity: 0, y: 6 } : { opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={fade}
          >
            ?
          </motion.text>
        ) : null}
        {has("zzz") ? (
          <motion.g key="zzz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
            <motion.g style={{ y: zLift }}>
              <text x={86} y={60} className="fill-ink-3 font-display" fontSize={10} fontWeight={700}>
                z
              </text>
              <text x={95} y={47} className="fill-ink-3 font-display" fontSize={14} fontWeight={700}>
                Z
              </text>
            </motion.g>
          </motion.g>
        ) : null}
        {has("sparkles") ? (
          <motion.g key="sparkles" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
            {SPARKLES.map((s) => (
              <g key={`${s.x}-${s.y}`} transform={`translate(${s.x} ${s.y})`}>
                <motion.path
                  d={SPARKLE}
                  className={s.tone}
                  initial={animated ? { scale: 0, rotate: -30 } : false}
                  animate={animated ? { scale: [0, s.scale * 1.15, s.scale], rotate: 0 } : { scale: s.scale }}
                  transition={animated ? { duration: 0.55, delay: s.delay, ease: "easeOut" } : { duration: 0 }}
                />
              </g>
            ))}
          </motion.g>
        ) : null}
      </AnimatePresence>
    </svg>
  );
}

/* ------------------------------------------------------------------ accessories (vector layers) */

function Hat({ id }: { id: AccessoryId }) {
  switch (id) {
    case "party-hat":
      return (
        <g>
          <path d="M 48 27 L 63 0 L 73 26 Q 60 30.5 48 27 Z" className="fill-accent stroke-(--cat-line)" strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M 52.5 19.5 Q 61 20.5 69.6 17.6 M 57 11.6 Q 61.5 12 66.4 10.4" className="fill-none stroke-(--cat-gold)" strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={63} cy={1} r={3.4} className="fill-(--cat-gold) stroke-(--cat-line)" strokeWidth={1} />
        </g>
      );
    case "wizard-hat":
      return (
        <g>
          <path d="M 46 25 Q 52 11 57 3 Q 62 -4 70 0 Q 65 3 65.5 9 L 74 25 Z" className="fill-violet stroke-(--cat-line)" strokeWidth={1.6} strokeLinejoin="round" />
          <ellipse cx={60} cy={25.5} rx={21} ry={4.4} className="fill-violet stroke-(--cat-line)" strokeWidth={1.6} />
          <path d="M 47 22.4 Q 60 26.4 73 22.4" className="fill-none stroke-(--cat-gold)" strokeWidth={2} strokeLinecap="round" />
          <path d="M 61 10.5 L 62.1 13.4 L 65 14.5 L 62.1 15.6 L 61 18.5 L 59.9 15.6 L 57 14.5 L 59.9 13.4 Z" className="fill-(--cat-gold)" />
        </g>
      );
    case "graduation-cap":
      return (
        <g>
          <path d="M 48 26 L 48 19 Q 60 16 72 19 L 72 26 Q 60 29 48 26 Z" className="fill-(--cat-eye) stroke-(--cat-line)" strokeWidth={1.2} />
          <path d="M 60 8.5 L 85 15 L 60 21.5 L 35 15 Z" className="fill-(--cat-eye) stroke-(--cat-line)" strokeWidth={1.2} strokeLinejoin="round" />
          <path d="M 60 15 Q 74 16 80.5 18.5 L 80.5 28" className="fill-none stroke-(--cat-gold)" strokeWidth={1.6} strokeLinecap="round" />
          <rect x={78.8} y={27} width={3.4} height={5.5} rx={1} className="fill-(--cat-gold)" />
          <circle cx={60} cy={15} r={1.5} className="fill-(--cat-gold)" />
        </g>
      );
    default:
      return null;
  }
}

function RoundGlasses() {
  return (
    <g>
      <circle cx={48} cy={45} r={7.4} className="fill-accent/15 stroke-(--cat-line)" strokeWidth={1.8} />
      <circle cx={72} cy={45} r={7.4} className="fill-accent/15 stroke-(--cat-line)" strokeWidth={1.8} />
      <path d="M 55.4 44 Q 60 41.6 64.6 44 M 40.6 44 L 33 42 M 79.4 44 L 87 42" className="fill-none stroke-(--cat-line)" strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}

function Eyewear({ id }: { id: AccessoryId }) {
  if (id === "round-glasses") return <RoundGlasses />;
  if (id !== "sunglasses") return null;
  return (
    <g>
      <path d="M 40.5 40.5 Q 40.5 38.6 42.5 38.6 L 54 38.6 Q 56 38.6 55.6 41 L 54.6 46.8 Q 54 50.2 50.4 50.2 L 45.2 50.2 Q 41.6 50.2 41 46.8 Z" className="fill-(--cat-eye) stroke-(--cat-line)" strokeWidth={1.2} />
      <path d="M 79.5 40.5 Q 79.5 38.6 77.5 38.6 L 66 38.6 Q 64 38.6 64.4 41 L 65.4 46.8 Q 66 50.2 69.6 50.2 L 74.8 50.2 Q 78.4 50.2 79 46.8 Z" className="fill-(--cat-eye) stroke-(--cat-line)" strokeWidth={1.2} />
      <path d="M 55.6 41 Q 60 39 64.4 41 M 40.6 41 L 33 39.5 M 79.4 41 L 87 39.5" className="fill-none stroke-(--cat-line)" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M 43.4 41.6 L 47.4 41 M 66.6 41.6 L 70.6 41" className="fill-none stroke-(--cat-shine)" strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
    </g>
  );
}

function Neckwear({ id }: { id: AccessoryId }) {
  switch (id) {
    case "bell-collar":
      return (
        <g>
          <path d="M 43.5 66.5 Q 60 74.5 76.5 66.5" className="fill-none stroke-bad" strokeWidth={3.4} strokeLinecap="round" />
          <circle cx={60} cy={73.4} r={3.4} className="fill-(--cat-gold) stroke-(--cat-line)" strokeWidth={1} />
          <path d="M 58.2 74.6 L 61.8 74.6" className="fill-none stroke-(--cat-line)" strokeWidth={0.9} strokeLinecap="round" />
        </g>
      );
    case "bow-tie":
      return (
        <g>
          <path d="M 60 72.5 L 51 67.5 Q 49.4 72.5 51 77.5 Z M 60 72.5 L 69 67.5 Q 70.6 72.5 69 77.5 Z" className="fill-accent stroke-(--cat-line)" strokeWidth={1.1} strokeLinejoin="round" />
          <rect x={57.6} y={70.2} width={4.8} height={4.6} rx={1.3} className="fill-accent stroke-(--cat-line)" strokeWidth={1.1} />
        </g>
      );
    case "gold-chain":
      return (
        <g>
          <path d="M 44 66.5 Q 60 76.5 76 66.5" className="fill-none stroke-(--cat-gold)" strokeWidth={2.4} strokeDasharray="2.6 1.4" strokeLinecap="round" />
          <circle cx={60} cy={76.5} r={2.8} className="fill-(--cat-gold) stroke-(--cat-line)" strokeWidth={0.8} />
        </g>
      );
    case "bandana":
      return (
        <g>
          <path d="M 45 66 Q 60 72 75 66 L 61.6 85 Q 60 86.6 58.4 85 Z" className="fill-bad stroke-(--cat-line)" strokeWidth={1.1} strokeLinejoin="round" />
          <circle cx={55} cy={72} r={1.1} className="fill-(--cat-cream)" />
          <circle cx={63.5} cy={74.5} r={1.1} className="fill-(--cat-cream)" />
          <circle cx={59.5} cy={79.5} r={1.1} className="fill-(--cat-cream)" />
        </g>
      );
    default:
      return null;
  }
}

function Sweater({ clipId }: { clipId: string }) {
  return (
    <g>
      <g clipPath={`url(#${clipId})`}>
        <rect x={30} y={66} width={60} height={40} className="fill-accent" />
        <rect x={30} y={78} width={60} height={3.2} className="fill-(--cat-cream)" />
        <rect x={30} y={87} width={60} height={3.2} className="fill-(--cat-cream)" />
        <rect x={30} y={96} width={60} height={3.2} className="fill-(--cat-cream)" />
      </g>
      <path d={BODY_D} className="fill-none stroke-(--cat-line)" strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M 47 66.6 Q 60 72.5 73 66.6" className="fill-none stroke-(--cat-cream)" strokeWidth={2.6} strokeLinecap="round" />
    </g>
  );
}

function Cape() {
  return (
    <path
      d="M 47 66 Q 60 70 73 66 L 93 104 Q 77 109 60 106 Q 43 109 27 104 Z"
      className="fill-bad stroke-(--cat-line)"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  );
}

/* ------------------------------------------------------------------ face parts (crisp) */

function Eye({ cx, cy, shape, side }: { cx: number; cy: number; shape: Eyes; side: "left" | "right" }) {
  const ink = "fill-(--cat-eye)";
  const shine = "fill-(--cat-shine)";
  const lid = "fill-none stroke-(--cat-line)";
  switch (shape) {
    case "wide":
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={5.6} ry={6.6} className={ink} />
          <circle cx={cx + 1.9} cy={cy - 2.4} r={2.1} className={shine} />
          <circle cx={cx - 1.8} cy={cy + 2.4} r={0.9} className={shine} />
        </g>
      );
    case "relaxed":
      return (
        <g>
          <path d={`M ${cx - 4.6} ${cy - 0.4} A 4.6 4.8 0 0 0 ${cx + 4.6} ${cy - 0.4} Z`} className={ink} />
          <path d={`M ${cx - 5.2} ${cy - 0.7} Q ${cx} ${cy - 2.2} ${cx + 5.2} ${cy - 0.7}`} className={lid} strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={cx + 1.6} cy={cy + 1.2} r={0.9} className={shine} />
        </g>
      );
    case "down":
      return (
        <g>
          <path d={`M ${cx - 4.4} ${cy + 1.2} A 4.4 4.4 0 0 0 ${cx + 4.4} ${cy + 1.2} Z`} className={ink} />
          <path d={`M ${cx - 5} ${cy + 0.9} Q ${cx} ${cy - 0.6} ${cx + 5} ${cy + 0.9}`} className={lid} strokeWidth={1.8} strokeLinecap="round" />
        </g>
      );
    case "up":
      return (
        <g>
          <ellipse cx={cx + 1.2} cy={cy - 1.3} rx={4.2} ry={5.2} className={ink} />
          <circle cx={cx + 2.6} cy={cy - 3.4} r={1.5} className={shine} />
        </g>
      );
    case "happy":
      return (
        <path
          d={`M ${cx - 4.8} ${cy + 1.6} Q ${cx} ${cy - 4.6} ${cx + 4.8} ${cy + 1.6}`}
          className="fill-none stroke-(--cat-eye)"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
      );
    case "closed":
      return (
        <path
          d={`M ${cx - 4.8} ${cy - 0.4} Q ${cx} ${cy + 3.8} ${cx + 4.8} ${cy - 0.4}`}
          className="fill-none stroke-(--cat-eye)"
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      );
    case "confused":
      return side === "left" ? (
        <g>
          <ellipse cx={cx} cy={cy} rx={4.6} ry={5.6} className={ink} />
          <circle cx={cx + 1.6} cy={cy - 2} r={1.5} className={shine} />
          <path d={`M ${cx - 5.5} ${cy - 9} Q ${cx} ${cy - 13} ${cx + 5.5} ${cy - 10}`} className={lid} strokeWidth={1.8} strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <ellipse cx={cx} cy={cy + 0.6} rx={3.6} ry={3.4} className={ink} />
          <circle cx={cx + 1.2} cy={cy - 0.6} r={1} className={shine} />
        </g>
      );
    case "open":
    default:
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={4.6} ry={5.6} className={ink} />
          <circle cx={cx + 1.6} cy={cy - 2} r={1.6} className={shine} />
          <circle cx={cx - 1.4} cy={cy + 2} r={0.7} className={shine} />
        </g>
      );
  }
}

function Mouth({ shape }: { shape: Mouth }) {
  const stroke = "fill-none stroke-(--cat-line)";
  switch (shape) {
    case "smile":
      return (
        <g>
          <path d="M 54.5 55 Q 60 63.5 65.5 55 Q 60 57.5 54.5 55 Z" className="fill-(--cat-mouth) stroke-(--cat-line)" strokeWidth={1.2} strokeLinejoin="round" />
          <ellipse cx={60} cy={59.2} rx={2.3} ry={1.3} className="fill-(--cat-pink)" />
        </g>
      );
    case "o":
      return <ellipse cx={60} cy={58} rx={2.4} ry={3} className="fill-(--cat-mouth) stroke-(--cat-line)" strokeWidth={1} />;
    case "wavy":
      return <path d="M 55 57.5 Q 57.5 55.8 60 57.5 Q 62.5 59.2 65 57.5" className={stroke} strokeWidth={1.7} strokeLinecap="round" />;
    case "flat":
      return <path d="M 57 57.2 L 63.6 56.6" className={stroke} strokeWidth={1.7} strokeLinecap="round" />;
    case "w":
    default:
      return (
        <path d="M 55 55.5 Q 57.5 58.5 60 55.8 Q 62.5 58.5 65 55.5" className={stroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      );
  }
}

/** Cache the study cat, as vector parts with a light mosaic. Memoised: re-renders only when its props change. */
export const PixelCat = memo(PixelCatImpl);
