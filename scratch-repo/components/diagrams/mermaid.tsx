"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useInView } from "@/lib/hooks/use-in-view";
import { useResolvedTheme } from "@/lib/hooks/use-resolved-theme";

interface MermaidProps {
  chart: string;
  caption?: string;
}

function themeVariables() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    fontFamily: "var(--font-atkinson), ui-sans-serif, system-ui, sans-serif",
    fontSize: "15px",
    background: v("--surface"),
    primaryColor: v("--surface"),
    primaryTextColor: v("--ink"),
    primaryBorderColor: v("--line-strong"),
    secondaryColor: v("--accent-soft"),
    tertiaryColor: v("--surface-2"),
    lineColor: v("--line-strong"),
    textColor: v("--ink"),
    mainBkg: v("--surface"),
    nodeBorder: v("--line-strong"),
    clusterBkg: v("--surface-2"),
    clusterBorder: v("--line"),
    edgeLabelBackground: v("--surface"),
    actorBkg: v("--accent-soft"),
    actorBorder: v("--accent"),
    actorTextColor: v("--ink"),
    actorLineColor: v("--line-strong"),
    signalColor: v("--ink-2"),
    signalTextColor: v("--ink"),
    labelBoxBkgColor: v("--surface-2"),
    labelBoxBorderColor: v("--line-strong"),
    labelTextColor: v("--ink"),
    loopTextColor: v("--ink-2"),
    noteBkgColor: v("--amber-soft"),
    noteBorderColor: v("--amber"),
    noteTextColor: v("--ink"),
    activationBkgColor: v("--accent-soft"),
    activationBorderColor: v("--accent"),
    stateBkg: v("--surface"),
    stateLabelColor: v("--ink"),
    compositeBackground: v("--surface-2"),
    transitionColor: v("--line-strong"),
    transitionLabelColor: v("--ink-2"),
  };
}

/** Static technical diagram written as Mermaid text, rendered on the client in the current theme. */
export function Mermaid({ chart, caption }: MermaidProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, "400px");
  const theme = useResolvedTheme();
  const reactId = useId();
  const [svg, setSvg] = useState<{ theme: string; markup: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    (async () => {
      const { default: mermaid } = await import("mermaid");
      const vars = themeVariables();
      // Top-level fontFamily too, so Mermaid measures text (note boxes, labels) with the font it will render in.
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "base", fontFamily: vars.fontFamily, themeVariables: vars });
      const id = `mmd-${reactId.replace(/[^a-zA-Z0-9]/g, "")}-${theme}`;
      const { svg: markup } = await mermaid.render(id, chart.trim());
      if (!cancelled) setSvg({ theme, markup });
    })().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Mermaid could not render this diagram.");
    });
    return () => {
      cancelled = true;
    };
  }, [chart, theme, inView, reactId]);

  return (
    <figure ref={ref} className="not-prose my-8" data-companion-avoid="">
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-4">
        {error ? (
          <pre className="whitespace-pre-wrap font-mono text-xs text-bad">{error}</pre>
        ) : svg ? (
          <div
            role="img"
            aria-label={caption ?? "Diagram"}
            className="mermaid-render mx-auto flex min-w-[320px] justify-center"
            dangerouslySetInnerHTML={{ __html: svg.markup }}
          />
        ) : (
          <div role="status" className="grid h-48 place-items-center text-sm text-ink-3">
            Drawing the diagram…
          </div>
        )}
      </div>
      {caption ? <figcaption className="mt-2 text-center text-sm italic text-ink-3">{caption}</figcaption> : null}
    </figure>
  );
}
