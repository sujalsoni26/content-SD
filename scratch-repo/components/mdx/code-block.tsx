"use client";
import { useRef, useState, type ComponentPropsWithoutRef } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shiki-highlighted <pre> with a copy button. Colours come from --shiki-light/--shiki-dark (see globals.css). */
export function CodeBlock({ className, children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      const range = document.createRange();
      if (ref.current) {
        range.selectNodeContents(ref.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  return (
    <div className="group relative my-6">
      <pre
        ref={ref}
        {...props}
        className={cn(
          className,
          "overflow-x-auto rounded-xl border border-line bg-surface-2 px-5 py-4 font-mono text-[0.85rem] leading-relaxed",
        )}
      >
        {children}
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-xs font-bold text-ink-2 opacity-80 transition hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? <Check aria-hidden="true" className="size-3.5 text-good" /> : <Copy aria-hidden="true" className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
