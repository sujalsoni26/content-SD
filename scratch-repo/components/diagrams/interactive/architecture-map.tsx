"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { WidgetFrame, WidgetScroll } from "@/components/ui/widget-frame";
import { lessons } from "@/lib/curriculum";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import type { ArchNodeId } from "@/types/curriculum";
import type { InteractiveProps } from "../interactive-registry";

interface ArchNode {
  id: ArchNodeId;
  label: string;
  sub: string;
  why: string;
  x: number;
  y: number;
  w: number;
  store?: boolean;
}

const H = 58;
const NODES: ArchNode[] = [
  { id: "users", label: "Users", sub: "Apps and browsers", x: 290, y: 14, w: 180, why: "Clients start every conversation: a request goes in, a response comes back." },
  { id: "dns", label: "DNS", sub: "Domain to IP", x: 40, y: 112, w: 180, why: "People type names; machines need IP addresses." },
  { id: "gateway", label: "API gateway + LB", sub: "TLS, auth, rate limits", x: 280, y: 112, w: 200, why: "One front door that spreads load over stateless servers and turns away abuse." },
  { id: "cdn", label: "CDN", sub: "Static files at edge", x: 540, y: 112, w: 180, why: "Images and scripts are served from a server near the user, not the origin." },
  { id: "feed", label: "Feed service", sub: "Reads cache first", x: 40, y: 222, w: 180, why: "Small stateless services behind the gateway, talking over clear API contracts." },
  { id: "post", label: "Post service", sub: "Publishes events", x: 290, y: 222, w: 180, why: "Saves the post now, announces it as an event, and survives retried requests." },
  { id: "chat", label: "Chat service", sub: "Uses WebSockets", x: 540, y: 222, w: 180, why: "The server pushes each message the instant it arrives." },
  { id: "cache", label: "Cache", sub: "Redis, in memory", x: 40, y: 332, w: 180, store: true, why: "Hot reads come from RAM, about 1,000× faster than SSD." },
  { id: "queue", label: "Message queue", sub: "Events and jobs", x: 290, y: 332, w: 180, store: true, why: "Absorbs bursts so workers drain the work at their own pace." },
  { id: "workers", label: "Workers", sub: "Notifications, resizing", x: 540, y: 332, w: 180, why: "Slow side effects run off the request path, guarded against failing dependencies." },
  { id: "db", label: "Database", sub: "Primary, replicas, shards", x: 40, y: 442, w: 230, store: true, why: "The source of truth, and usually the first thing to break as load grows." },
  { id: "storage", label: "Object storage", sub: "Photos and videos (S3)", x: 500, y: 442, w: 220, store: true, why: "Big files live outside the database; rows keep only their keys." },
];

const EDGES: Array<{ d: string; flow?: boolean; dash?: boolean; label?: [number, number, string] }> = [
  { d: "M290 41 H130 V108" },
  { d: "M380 68 V108", flow: true },
  { d: "M470 41 H630 V108" },
  { d: "M340 170 V196 H130 V218" },
  { d: "M380 170 V218", flow: true },
  { d: "M420 170 V196 H630 V218" },
  { d: "M130 280 V328" },
  { d: "M130 390 V438", label: [140, 420, "on miss"] },
  { d: "M340 280 V306 H250 V438" },
  { d: "M420 280 V328", flow: true },
  { d: "M470 361 H536" },
  { d: "M630 390 V438" },
  { d: "M720 141 H746 V471 H724", dash: true },
];

export default function ArchitectureMap({ variant }: InteractiveProps) {
  const hydrated = useHydrated();
  const completedRaw = useProgressStore((s) => s.completed);
  const completed = useMemo(() => (hydrated ? completedRaw : {}), [hydrated, completedRaw]);

  const lessonsByNode = useMemo(() => {
    const map = new Map<ArchNodeId, typeof lessons>();
    for (const n of NODES) map.set(n.id, lessons.filter((l) => l.archNodes.includes(n.id)));
    return map;
  }, []);

  const fraction = (id: ArchNodeId) => {
    const ls = lessonsByNode.get(id) ?? [];
    return ls.length ? ls.filter((l) => completed[l.slug]).length / ls.length : 0;
  };

  const firstUnlit = NODES.find((n) => fraction(n.id) < 1) ?? NODES[0];
  const [selectedId, setSelectedId] = useState<ArchNodeId | null>(null);
  const selected = NODES.find((n) => n.id === (selectedId ?? firstUnlit.id)) ?? NODES[0];
  const lit = NODES.filter((n) => fraction(n.id) >= 1).length;

  return (
    <WidgetFrame
      kicker={variant === "dashboard" ? "Live blueprint" : "Try it"}
      title={`${lit} of ${NODES.length} boxes lit`}
      hint="Each box lights up when you finish the lessons behind it. Select a box to see what it solves."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <WidgetScroll>
          <svg viewBox="0 0 760 512" role="group" aria-label="Final architecture of the social app" className="h-auto w-full min-w-[540px]">
            {EDGES.map((e, i) => (
              <g key={i}>
                <path
                  d={e.d}
                  className={cn("dg-line", e.dash && "dg-line--dash", e.flow && "dg-line--accent dg-flow")}
                  markerEnd={e.flow ? "url(#ah-accent)" : "url(#ah)"}
                />
                {e.label ? (
                  <text className="dg-label" x={e.label[0]} y={e.label[1]}>
                    {e.label[2]}
                  </text>
                ) : null}
              </g>
            ))}
            {NODES.map((n) => {
              const f = fraction(n.id);
              const isLit = f >= 1;
              const isSel = n.id === selected.id;
              const meterW = n.w - 28;
              return (
                <g
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={`${n.label}: ${Math.round(f * 100)}% learned`}
                  onClick={() => setSelectedId(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(n.id);
                    }
                  }}
                  className="cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-accent [&:focus-visible>rect:first-child]:[stroke-width:3]"
                >
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={H}
                    rx={10}
                    className={cn(
                      "dg-box transition-[fill,stroke] duration-500",
                      isLit && (n.store ? "dg-box--store" : "dg-box--good"),
                      isSel && "stroke-accent [stroke-width:2.4]",
                    )}
                  />
                  <text className="dg-text" x={n.x + n.w / 2} y={n.y + 23} textAnchor="middle">
                    {n.label}
                  </text>
                  <text className="dg-sub" x={n.x + n.w / 2} y={n.y + 40} textAnchor="middle">
                    {n.sub}
                  </text>
                  <rect x={n.x + 14} y={n.y + H - 8} width={meterW} height={3} rx={1.5} className="fill-surface-3" />
                  <rect
                    x={n.x + 14}
                    y={n.y + H - 8}
                    width={meterW * f}
                    height={3}
                    rx={1.5}
                    className="fill-good transition-[width] duration-700"
                  />
                  {isLit ? (
                    <g>
                      <circle cx={n.x + n.w - 4} cy={n.y + 4} r={9} className="fill-good" />
                      <path
                        d={`M${n.x + n.w - 8} ${n.y + 4} l3 3 l5 -6`}
                        className="fill-none stroke-accent-ink [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
                      />
                    </g>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </WidgetScroll>

        <div className="rounded-xl border border-line bg-surface-2 p-4" aria-live="polite">
          <h4 className="font-display text-lg font-bold text-ink">{selected.label}</h4>
          <p className="mt-1 text-sm text-ink-2">{selected.why}</p>
          <ul className="mt-3 space-y-1.5">
            {(lessonsByNode.get(selected.id) ?? []).map((l) => {
              const done = Boolean(completed[l.slug]);
              return (
                <li key={l.slug}>
                  <Link href={`/learn/${l.slug}`} className="group flex items-start gap-2 text-[0.92rem] text-ink hover:text-accent">
                    <span
                      className={cn(
                        "mt-0.5 grid size-4 shrink-0 place-items-center rounded border-[1.5px]",
                        done ? "border-good bg-good text-accent-ink" : "border-line-strong",
                      )}
                    >
                      {done ? <Check aria-hidden="true" className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span>
                      <span className="mr-1 font-mono text-xs text-ink-3">{l.number}</span>
                      {l.title}
                      {done ? <span className="sr-only"> (learned)</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-3 rounded-[3px] border-[1.5px] border-line-strong bg-surface" /> Still to learn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-3 rounded-[3px] border-[1.5px] border-good bg-good-soft" /> Learned
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-3 rounded-[3px] border-[1.5px] border-amber bg-amber-soft" /> Learned data store
        </span>
      </p>
    </WidgetFrame>
  );
}
