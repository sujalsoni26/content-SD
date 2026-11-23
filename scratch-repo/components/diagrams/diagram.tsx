import { staticDiagrams } from "./static";

/** A hand-drawn static SVG diagram (components/diagrams/static) in a scrollable, captioned figure. */
export function Diagram({ name, caption }: { name: string; caption?: string }) {
  const Svg = staticDiagrams[name];
  return (
    <figure className="not-prose my-8" data-companion-avoid="">
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-4">
        {Svg ? <Svg /> : <p className="text-sm text-bad">Missing diagram “{name}”.</p>}
      </div>
      {caption ? <figcaption className="mt-2 text-center text-sm italic text-ink-3">{caption}</figcaption> : null}
    </figure>
  );
}
