import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Callout } from "@/components/mdx/callout";
import { CodeBlock } from "@/components/mdx/code-block";
import { Comparison, ComparisonItem } from "@/components/mdx/comparison";
import { ConceptCard } from "@/components/mdx/concept-card";
import { DeepDive } from "@/components/mdx/deep-dive";
import { Steps } from "@/components/mdx/steps";
import { Diagram } from "@/components/diagrams/diagram";
import { InteractiveDiagram } from "@/components/diagrams/interactive";
import { Mermaid } from "@/components/diagrams/mermaid";
import { Acronym } from "@/components/glossary/acronym";
import { slugify, textOf } from "@/lib/text";

function Heading2({ children }: { children?: ReactNode }) {
  const id = slugify(textOf(children));
  return (
    <h2 id={id} className="group mb-3 mt-12 flex scroll-mt-24 items-baseline gap-2.5 font-display text-[1.45rem] font-bold leading-tight tracking-[-0.015em] text-ink">
      <span aria-hidden="true" className="size-2.5 shrink-0 translate-y-[-2px] rounded-[2px] bg-accent" />
      <span>{children}</span>
      <a href={`#${id}`} className="text-base text-ink-3 opacity-0 transition-opacity hover:text-accent focus-visible:opacity-100 group-hover:opacity-100" aria-label="Link to this section">
        #
      </a>
    </h2>
  );
}

function Heading3({ children }: { children?: ReactNode }) {
  const id = slugify(textOf(children));
  return (
    <h3 id={id} className="mb-2 mt-8 scroll-mt-24 font-display text-[1.12rem] font-bold text-ink">
      {children}
    </h3>
  );
}

function Anchor({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) {
  const cls = "font-semibold text-accent underline decoration-1 underline-offset-[3px] hover:decoration-2";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} className={cls} target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  );
}

const components = {
  h2: Heading2,
  h3: Heading3,
  p: (props) => <p className="my-4" {...props} />,
  ul: (props) => <ul className="my-4 list-none space-y-1.5 pl-5 [&>li]:relative [&>li]:before:absolute [&>li]:before:-left-4 [&>li]:before:top-[0.7em] [&>li]:before:size-1.5 [&>li]:before:rounded-[1px] [&>li]:before:bg-accent [&>li]:before:content-['']" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-1.5 pl-6 marker:font-mono marker:text-sm marker:text-ink-3" {...props} />,
  li: (props) => <li className="pl-1" {...props} />,
  a: Anchor,
  strong: (props) => <strong className="font-bold text-ink" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  code: (props) => <code className="rounded-md border border-line bg-surface-2 px-1.5 py-px font-mono text-[0.86em] [overflow-wrap:anywhere] [pre_&]:border-0 [pre_&]:bg-transparent [pre_&]:p-0" {...props} />,
  pre: CodeBlock,
  blockquote: (props) => <blockquote className="my-6 border-l-4 border-line-strong pl-4 text-ink-2" {...props} />,
  hr: () => <hr className="my-10 border-line" />,
  table: (props) => (
    <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse text-[0.92rem] leading-normal" {...props} />
    </div>
  ),
  th: (props) => <th className="whitespace-nowrap border-b border-line bg-surface-2 px-3.5 py-2.5 text-left align-bottom font-mono text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-3" {...props} />,
  td: (props) => <td className="min-w-[7.5rem] border-b border-line px-3.5 py-2.5 align-top first:font-bold [tr:last-child_&]:border-b-0" {...props} />,
  tr: (props) => <tr className="transition-colors hover:bg-accent-soft/40" {...props} />,
  Callout,
  Comparison,
  ComparisonItem,
  ConceptCard,
  DeepDive,
  Steps,
  Diagram,
  Mermaid,
  Acronym,
  Interactive: InteractiveDiagram,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
