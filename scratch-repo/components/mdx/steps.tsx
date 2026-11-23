import type { ReactNode } from "react";

/** Numbered process with connected step markers. Wrap a markdown ordered list. */
export function Steps({ children }: { children: ReactNode }) {
  return (
    <div
      className={[
        "my-6",
        "[&_ol]:list-none [&_ol]:pl-0 [&_ol]:[counter-reset:step]",
        "[&_ol>li]:relative [&_ol>li]:my-0 [&_ol>li]:pb-4 [&_ol>li]:pl-12 [&_ol>li]:[counter-increment:step]",
        "[&_ol>li]:before:absolute [&_ol>li]:before:left-0 [&_ol>li]:before:top-0 [&_ol>li]:before:z-10 [&_ol>li]:before:grid [&_ol>li]:before:size-[30px] [&_ol>li]:before:place-items-center [&_ol>li]:before:rounded-full [&_ol>li]:before:border-[1.6px] [&_ol>li]:before:border-accent [&_ol>li]:before:bg-surface [&_ol>li]:before:font-mono [&_ol>li]:before:text-[0.8rem] [&_ol>li]:before:font-semibold [&_ol>li]:before:text-accent [&_ol>li]:before:content-[counter(step)]",
        "[&_ol>li]:after:absolute [&_ol>li]:after:bottom-0 [&_ol>li]:after:left-[14.5px] [&_ol>li]:after:top-[30px] [&_ol>li]:after:w-[1.6px] [&_ol>li]:after:bg-line [&_ol>li:last-child]:after:hidden",
        "[&_ol>li::marker]:content-none",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
