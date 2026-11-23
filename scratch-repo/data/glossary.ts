// Central glossary. The JSON is also read at build time by lib/mdx/remark-acronyms.mjs,
// which marks the first mention of each term in every lesson.
import type { GlossaryEntry } from "@/types/glossary";
import entries from "./glossary.json";

export const glossary: GlossaryEntry[] = entries;

export const glossaryByTerm: Record<string, GlossaryEntry> = Object.fromEntries(glossary.map((e) => [e.term, e]));
