"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Send, Zap } from "lucide-react";
import { ControlRow, WidgetFrame } from "@/components/ui/widget-frame";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RangeField } from "@/components/ui/range-field";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/ui/stat";
import { useReducedMotion } from "@/lib/hooks/use-motion-level";
import { emitCompanionEvent } from "@/lib/companion-events";
import { cn } from "@/lib/utils";
import { useFrameLoop, useLoopActive } from "./_wc-frame-loop";
import {
  CAPACITY,
  HISTORY,
  LIMIT,
  WINDOW,
  advance,
  allowedInLast,
  armBoundaryDemo,
  boundariesInView,
  createLimiter,
  sendBurst,
  setMode,
  setRate,
  windowInfo,
  type LimiterMode,
  type LimiterSim,
} from "./_token-bucket-sim";

const MODES = [
  { value: "bucket", label: "Token bucket" },
  { value: "fixed", label: "Fixed window" },
] as const;

/** Horizontal position on the timeline, 0% = HISTORY seconds ago, 100% = now. */
const pos = (now: number, t: number) => `${(100 - ((now - t) / HISTORY) * 100).toFixed(2)}%`;

/** One token (or window) slot. `used` paints it solid; otherwise it is an empty dashed socket. */
function Slot({ children, used = false }: { children?: ReactNode; used?: boolean }) {
  return (
    <span
      className={cn(
        "relative h-6 w-6 shrink-0 overflow-hidden rounded-full border",
        used ? "border-solid border-accent bg-accent" : "border-dashed border-line-strong bg-surface",
      )}
    >
      {children}
    </span>
  );
}

function BucketView({ tokens, rate, reduced, onRate }: { tokens: number; rate: number; reduced: boolean; onRate: (r: number) => void }) {
  const full = Math.floor(tokens + 1e-9);
  const part = tokens - full;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-3">Bucket · capacity {CAPACITY}</span>
        <span className="font-mono text-[0.85rem] tabular-nums text-ink">{tokens.toFixed(1)} tokens</span>
      </div>
      <div
        role="img"
        aria-label={`${Math.floor(tokens)} of ${CAPACITY} tokens in the bucket`}
        className="flex w-fit max-w-full flex-wrap gap-1.5 rounded-b-2xl border-x-2 border-b-2 border-line-strong bg-surface-2 px-2.5 pb-2.5 pt-3"
      >
        {Array.from({ length: CAPACITY }, (_, i) => (
          <Slot key={i}>
            <AnimatePresence initial={false}>
              {i < full ? (
                <motion.span
                  key="coin"
                  className="absolute inset-0 rounded-full bg-amber"
                  initial={reduced ? false : { scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { y: -18, opacity: 0, transition: { duration: 0.35 } }}
                  transition={{ duration: 0.2 }}
                />
              ) : null}
            </AnimatePresence>
            {i === full && part > 0.01 ? (
              <span className="absolute inset-x-0 bottom-0 bg-amber/45" style={{ height: `${(part * 100).toFixed(1)}%` }} />
            ) : null}
          </Slot>
        ))}
      </div>
      <RangeField
        label="Refill rate"
        value={rate}
        min={0.5}
        max={5}
        step={0.5}
        onChange={onRate}
        display={`${rate} tokens/s`}
      />
      <p className="text-[0.82rem] text-ink-3">
        One token drips in every {Number((1 / rate).toFixed(2))} s; a request needs one token, or it gets a 429.
      </p>
    </div>
  );
}

function WindowView({ sim, onDemo }: { sim: LimiterSim; onDemo: () => void }) {
  const w = windowInfo(sim);
  const armedIn = sim.demo ? sim.demo.boundary - 0.7 - sim.now : null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-3">
          Window · {LIMIT} requests per {WINDOW} s
        </span>
        <span className="font-mono text-[0.85rem] tabular-nums text-ink">
          {w.used} / {LIMIT} used · resets in {w.resetsIn.toFixed(1)} s
        </span>
      </div>
      <div role="img" aria-label={`${w.used} of ${LIMIT} requests used in this window`} className="flex flex-wrap gap-1.5">
        {Array.from({ length: LIMIT }, (_, i) => (
          <Slot key={i} used={i < w.used} />
        ))}
      </div>
      <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <span className="block h-full rounded-full bg-accent/70" style={{ width: `${(w.progress * 100).toFixed(1)}%` }} />
      </div>
      <ControlRow>
        <Button size="sm" variant="secondary" onClick={onDemo} disabled={sim.demo !== null}>
          <Zap aria-hidden="true" className="h-4 w-4" />
          Run the boundary burst
        </Button>
        {armedIn !== null ? (
          <span className="font-mono text-[0.82rem] tabular-nums text-accent">
            {armedIn > 0 ? `armed: fires in ${armedIn.toFixed(1)} s` : "firing…"}
          </span>
        ) : null}
      </ControlRow>
    </div>
  );
}

function Timeline({ sim, reduced }: { sim: LimiterSim; reduced: boolean }) {
  const band = sim.result && sim.now - sim.result.boundary < HISTORY - 1 ? sim.result : null;
  return (
    <div aria-hidden="true" className="flex flex-col gap-1">
      <div className="relative h-20 overflow-hidden rounded-lg border border-line bg-surface-2">
        <span className="absolute left-2 top-1 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-good">200</span>
        <span className="absolute bottom-1 left-2 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-bad">429</span>
        <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
        {band ? (
          <span
            className="absolute inset-y-0 bg-warn-soft"
            style={{ left: pos(sim.now, band.boundary - 1), width: `${(2 / HISTORY) * 100}%` }}
          />
        ) : null}
        {sim.mode === "fixed"
          ? boundariesInView(sim).map((b) => (
              <span key={b} className="absolute inset-y-0 border-l-2 border-accent/60" style={{ left: pos(sim.now, b) }}>
                <span className="absolute left-1 top-1 whitespace-nowrap font-mono text-[0.6rem] text-accent">reset</span>
              </span>
            ))
          : null}
        {sim.requests.map((r) => (
          <motion.span
            key={r.id}
            className={cn("absolute -ml-1.5 h-3 w-3 rounded-full", r.ok ? "top-[28%] bg-good" : "top-[62%] bg-bad")}
            style={{ left: pos(sim.now, r.t) }}
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[0.68rem] text-ink-3">
        <span>{HISTORY} s ago</span>
        <span>{HISTORY / 2} s ago</span>
        <span>now</span>
      </div>
    </div>
  );
}

function ResponsePanel({ sim, reduced }: { sim: LimiterSim; reduced: boolean }) {
  const r = sim.response;
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-ink-3">Last response</span>
      <div role="status" className="min-h-[3.4rem] rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[0.84rem] leading-relaxed">
        {r ? (
          <motion.div key={r.id} initial={reduced ? false : { opacity: 0.2, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
            {r.ok ? (
              <span className="font-bold text-good">HTTP/1.1 200 OK</span>
            ) : (
              <>
                <span className="block font-bold text-bad">HTTP/1.1 429 Too Many Requests</span>
                <span className="block text-ink-2">Retry-After: {r.retryAfter}</span>
              </>
            )}
          </motion.div>
        ) : (
          <span className="text-ink-3">No requests yet in this mode.</span>
        )}
      </div>
    </div>
  );
}

function explain(sim: LimiterSim) {
  if (sim.mode === "bucket") {
    return (
      <>
        <strong>Token bucket.</strong> Tokens refill at {sim.rate} per second up to {CAPACITY}; each request spends one. A burst
        can empty the whole bucket at once, but over time requests are capped at the refill rate. Try Burst of 15.
      </>
    );
  }
  if (sim.demo) {
    return (
      <>
        <strong>Armed.</strong> {LIMIT} requests fire just before the window resets and {LIMIT} more right after it.
      </>
    );
  }
  if (sim.result) {
    return (
      <>
        <strong>{sim.result.allowed} requests allowed in about one second</strong>, against a limit of {LIMIT} per {WINDOW} s
        window. A sliding window or a token bucket would have stopped this.
      </>
    );
  }
  return (
    <>
      <strong>Fixed window.</strong> A counter allows {LIMIT} requests per {WINDOW} s and resets at each boundary. Simple, but a
      client can send {LIMIT} at the end of one window and {LIMIT} more right after it resets. Run the boundary burst.
    </>
  );
}

export default function TokenBucket() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const active = useLoopActive(ref);
  const [sim, setSim] = useState(createLimiter);

  // The limiter's clock: smooth while animating, a plain 2 Hz update with reduced motion.
  useFrameLoop((dt) => setSim((s) => advance(s, dt)), active, reduced ? 500 : 0);

  const result = sim.result;
  const warned = useRef(false);
  useEffect(() => {
    if (!result || result.allowed <= LIMIT || warned.current) return;
    warned.current = true;
    emitCompanionEvent({
      type: "diagram",
      mood: "thinking",
      message: `${result.allowed} requests slipped through in about a second. Fixed windows leak at the edges.`,
    });
  }, [result]);

  const last10 = allowedInLast(sim, 10);

  return (
    <WidgetFrame
      title="Rate limiter"
      hint="Send requests and watch the limiter answer 200 or 429. Then switch to a fixed window and try the boundary burst."
      note={explain(sim)}
    >
      <div ref={ref} className="flex flex-col gap-4">
        <SegmentedControl
          label="Algorithm"
          options={MODES}
          value={sim.mode}
          onChange={(m: LimiterMode) => setSim((s) => setMode(s, m))}
        />
        <div className="rounded-xl border border-line p-3 sm:p-4">
          {sim.mode === "bucket" ? (
            <BucketView tokens={sim.tokens} rate={sim.rate} reduced={reduced} onRate={(r) => setSim((s) => setRate(s, r))} />
          ) : (
            <WindowView sim={sim} onDemo={() => setSim(armBoundaryDemo)} />
          )}
        </div>
        <Timeline sim={sim} reduced={reduced} />
        <ControlRow>
          <Button variant="primary" onClick={() => setSim((s) => sendBurst(s, 1))}>
            <Send aria-hidden="true" className="h-4 w-4" />
            Send 1 request
          </Button>
          <Button variant="secondary" onClick={() => setSim((s) => sendBurst(s, 15, reduced ? 0 : undefined))}>
            Burst of 15
          </Button>
        </ControlRow>
        <ResponsePanel sim={sim} reduced={reduced} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-2">
          <Stat label="Allowed (200)" value={sim.allowed} tone="good" />
          <Stat label="Rejected (429)" value={sim.rejected} tone={sim.rejected ? "bad" : "neutral"} />
          <Stat label="Allowed, last 10 s" value={last10} tone={sim.mode === "fixed" && last10 > LIMIT ? "warn" : "neutral"} />
        </div>
      </div>
    </WidgetFrame>
  );
}
