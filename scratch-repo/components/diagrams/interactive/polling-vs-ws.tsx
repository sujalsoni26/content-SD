"use client";

import { useRef, useState, type ComponentType } from "react";
import { motion } from "motion/react";
import { MessageSquarePlus, Pause, Play, RotateCcw, Shuffle } from "lucide-react";
import type { InteractiveProps } from "../interactive-registry";
import { Button } from "@/components/ui/button";
import { RangeField } from "@/components/ui/range-field";
import { Stat, StatGrid } from "@/components/ui/stat";
import { ControlRow, WidgetFrame, WidgetScroll } from "@/components/ui/widget-frame";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { mulberry32, useFrameLoop, useLoopGate } from "./_wa-shared";

/* ------------------------------------------------------------------ model (times in seconds) */

const WINDOW = 30;
const SPEED = 5; // 30 s of simulated time plays in 6 s
const WS_DELAY = 0.05; // one-way network hop for a pushed frame

function seededMessages(seed: number): number[] {
  const rand = mulberry32(seed * 9973);
  return Array.from({ length: 3 }, () => +(1.5 + rand() * 27).toFixed(1)).sort((a, b) => a - b);
}

function pollTimes(interval: number): number[] {
  const out: number[] = [];
  for (let k = 1; k * interval <= WINDOW; k++) out.push(k * interval);
  return out;
}

/** A message waits for the first poll at or after it arrives (which may fall after the window). */
const deliveredAt = (m: number, interval: number) => Math.max(1, Math.ceil(m / interval - 1e-9)) * interval;

function snapshot(messages: readonly number[], interval: number, t: number) {
  const polls = pollTimes(interval);
  const sent = polls.filter((p) => p <= t);
  const carrying = (p: number) => messages.filter((m) => deliveredAt(m, interval) === p);
  const empty = sent.filter((p) => carrying(p).length === 0).length;
  const arrived = messages.filter((m) => m <= t);
  const waits = arrived.map((m) => deliveredAt(m, interval) - m);
  const avgWait = waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : null;
  return { polls, sent, carrying, empty, arrived, avgWait };
}

/* ------------------------------------------------------------------ timeline drawing (viewBox 360 × 206) */

const X0 = 18;
const X1 = 342;
const X = (t: number) => X0 + (t / WINDOW) * (X1 - X0);
const Y = { msg: 32, poll: 82, wait: 98, ws: 152, axis: 186 };

interface TimelineProps {
  messages: readonly number[];
  interval: number;
  t: number;
  popIn: boolean;
}

function Timeline({ messages, interval, t, popIn }: TimelineProps) {
  const { sent, carrying, arrived } = snapshot(messages, interval, t);
  const pop = {
    initial: popIn ? { scale: 0 } : false,
    animate: { scale: 1 },
    transition: { type: "spring" as const, stiffness: 500, damping: 22 },
  };

  return (
    <svg
      viewBox="0 0 360 206"
      className="mx-auto h-auto w-full min-w-[300px] max-w-[600px]"
      role="img"
      aria-label={`Timeline over ${WINDOW} seconds: ${arrived.length} messages, ${sent.length} polling requests, one WebSocket connection.`}
    >
      <text x={X0} y={14} className="dg-label">
        message reaches the server
      </text>
      <text x={X0} y={60} className="dg-sub">
        Polling every {interval} s
      </text>
      <path d={`M${X0} ${Y.poll} H${X1}`} className="dg-line dg-line--dash" />
      <text x={X0} y={130} className="dg-sub">
        WebSocket: one open connection
      </text>
      <path d={`M${X0} ${Y.ws} H${X1}`} className="dg-line dg-line--dash opacity-50" />

      {/* each message: a diamond at the server, dropping to both lanes */}
      {arrived.map((m, i) => (
        <g key={`m${i}-${m}`}>
          <path d={`M${X(m)} ${Y.msg + 6} V${Y.ws}`} className="dg-line dg-line--dash opacity-40" />
          <motion.path {...pop} d={`M${X(m)} ${Y.msg - 6} l6 6 l-6 6 l-6 -6 z`} className="fill-amber stroke-amber-ink" />
        </g>
      ))}

      {/* polling: wait bars, then a request per tick */}
      {arrived.map((m, i) => {
        const end = Math.min(t, deliveredAt(m, interval));
        return <path key={`w${i}-${m}`} d={`M${X(m)} ${Y.wait} H${Math.max(X(m) + 0.5, X(end))}`} strokeWidth={4} strokeLinecap="round" className="fill-none stroke-amber" />;
      })}
      {sent.map((p) => {
        const got = carrying(p).length > 0;
        return (
          <g key={`p${p}`}>
            <path d={`M${X(p)} ${Y.poll - 10} V${Y.poll + 10}`} className="dg-line" />
            <motion.circle {...pop} cx={X(p)} cy={Y.poll} r={5} strokeWidth={1.6} className={got ? "fill-accent stroke-accent" : "fill-surface stroke-line-strong"} />
          </g>
        );
      })}

      {/* websocket: upgrade once, then instant pushes */}
      <path d={`M${X(0)} ${Y.ws} H${X(Math.min(t, WINDOW))}`} strokeWidth={3} strokeLinecap="round" className="fill-none stroke-accent" />
      <circle cx={X(0)} cy={Y.ws} r={5} className="fill-ink-3" />
      <text x={X(0)} y={Y.ws + 18} className="dg-label">
        HTTP Upgrade
      </text>
      {arrived.map((m, i) => (
        <motion.circle key={`s${i}-${m}`} {...pop} cx={X(m)} cy={Y.ws} r={5} strokeWidth={1.6} className="fill-good stroke-surface" />
      ))}

      {/* axis */}
      <path d={`M${X0} ${Y.axis} H${X1}`} className="dg-line" />
      {[0, 5, 10, 15, 20, 25, 30].map((s) => (
        <g key={s}>
          <path d={`M${X(s)} ${Y.axis - 3} V${Y.axis + 3}`} className="dg-line" />
          {s % 10 === 0 ? (
            <text x={X(s)} y={Y.axis + 16} textAnchor={s === 0 ? "start" : s === WINDOW ? "end" : "middle"} className="dg-label">
              {s} s
            </text>
          ) : null}
        </g>
      ))}
      {t < WINDOW ? <path d={`M${X(t)} 20 V${Y.axis}`} className="stroke-ink-2" strokeWidth={1.5} strokeDasharray="3 3" /> : null}
    </svg>
  );
}

function Legend() {
  const item = "inline-flex items-center gap-1.5";
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-[0.76rem] text-ink-2">
      <span className={item}>
        <span className="size-2.5 rotate-45 bg-amber" aria-hidden="true" />
        new message
      </span>
      <span className={item}>
        <span className="size-2.5 rounded-full bg-accent" aria-hidden="true" />
        poll that got data
      </span>
      <span className={item}>
        <span className="size-2.5 rounded-full border-[1.6px] border-line-strong bg-surface" aria-hidden="true" />
        empty poll
      </span>
      <span className={item}>
        <span className="h-1 w-4 rounded-full bg-amber" aria-hidden="true" />
        waiting for the next poll
      </span>
      <span className={item}>
        <span className="size-2.5 rounded-full bg-good" aria-hidden="true" />
        pushed instantly
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ widget */

function PollingVsWs() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gate = useLoopGate(rootRef);
  const reduced = useReducedMotion();
  const [interval, setPollEvery] = useState(5);
  const [seed, setSeed] = useState(7);
  const [extra, setExtra] = useState<number[]>([]);
  const [t, setT] = useState(WINDOW);
  const [playing, setPlaying] = useState(false);

  const messages = [...seededMessages(seed), ...extra].sort((a, b) => a - b);
  const shownT = reduced ? WINDOW : t;
  const live = playing && !reduced && shownT < WINDOW;

  useFrameLoop((dt) => {
    const next = Math.min(WINDOW, t + (dt / 1000) * SPEED);
    setT(next);
    if (next >= WINDOW) setPlaying(false);
  }, live && gate);

  const togglePlay = () => {
    if (live) {
      setPlaying(false);
      return;
    }
    if (shownT >= WINDOW) {
      setT(0);
      setExtra([]);
    }
    setPlaying(true);
  };
  const sendNow = () => {
    const at = +shownT.toFixed(1);
    if (at <= 0 || at >= WINDOW || messages.includes(at)) return;
    setExtra((xs) => [...xs, at]);
  };
  const reshuffle = () => {
    setSeed((s) => s + 1);
    setExtra([]);
    setPlaying(false);
    setT(WINDOW);
  };

  const snap = snapshot(messages, interval, shownT);
  const wait = snap.avgWait === null ? "–" : `${snap.avgWait.toFixed(1)} s`;
  const done = shownT >= WINDOW;
  const note = done
    ? `Polling every ${interval} s sent ${snap.sent.length} requests; ${snap.empty} came back empty, and messages waited ${wait} on average. ` +
      `The WebSocket made one Upgrade request and pushed each of the ${snap.arrived.length} messages the moment it arrived. ` +
      (interval <= 2 ? "Faster polling cuts the delay but floods the server with empty requests." : "Slower polling saves requests but makes users wait.")
    : `Playing the ${WINDOW}-second window at ${SPEED}× speed. Press "Send a message now" and watch which lane delivers it first.`;

  return (
    <WidgetFrame
      kicker="Compare"
      title="Polling vs WebSocket"
      hint="Chat messages arrive at random moments in a 30-second window. Change the polling interval, play it, and drop in your own message."
      note={note}
    >
      <div ref={rootRef} className="flex flex-col gap-3">
        <ControlRow>
          <RangeField label="Poll every" value={interval} min={1} max={10} onChange={setPollEvery} display={`${interval} s`} />
          <Button size="sm" variant="primary" onClick={togglePlay}>
            {live ? <Pause size={16} aria-hidden="true" /> : done ? <RotateCcw size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {live ? "Pause" : done ? `Play ${WINDOW} s` : "Resume"}
          </Button>
          <Button size="sm" onClick={sendNow} disabled={!live}>
            <MessageSquarePlus size={16} aria-hidden="true" />
            Send a message now
          </Button>
          <Button size="sm" variant="ghost" onClick={reshuffle}>
            <Shuffle size={16} aria-hidden="true" />
            New messages
          </Button>
        </ControlRow>

        <WidgetScroll>
          <Timeline messages={messages} interval={interval} t={shownT} popIn={live} />
        </WidgetScroll>
        <Legend />

        <StatGrid>
          <Stat label="Polling requests" value={snap.sent.length} tone="amber" />
          <Stat label="Empty responses" value={`${snap.empty} of ${snap.sent.length}`} tone={snap.empty > snap.sent.length / 2 ? "bad" : "neutral"} />
          <Stat label="Avg wait (polling)" value={wait} tone="warn" />
          <Stat label="WebSocket requests" value={`1 + ${snap.arrived.length} pushes`} tone="accent" />
          <Stat label="Avg wait (WebSocket)" value={snap.arrived.length ? `≈${WS_DELAY} s` : "–"} tone="good" />
        </StatGrid>
        <p className="text-[0.76rem] text-ink-3">
          A message that lands after the last poll in the window waits for the next one, so its wait is still counted.
        </p>
      </div>
    </WidgetFrame>
  );
}

export default PollingVsWs satisfies ComponentType<InteractiveProps>;
