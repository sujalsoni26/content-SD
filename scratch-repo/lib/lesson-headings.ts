import { readFileSync } from "node:fs";
import path from "node:path";
import { slugify } from "./text";

export interface LessonHeading {
  id: string;
  text: string;
}

/** Section headings (## …) of a lesson, read from its MDX source at build time for the "On this page" list. */
export function getLessonHeadings(slug: string): LessonHeading[] {
  let source = "";
  try {
    source = readFileSync(path.join(process.cwd(), "content", "lessons", `${slug}.mdx`), "utf8");
  } catch {
    return [];
  }
  const headings: LessonHeading[] = [];
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      const text = m[1].replace(/\*\*|__|`|\\/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
      headings.push({ id: slugify(text), text });
    }
  }
  return headings;
}
