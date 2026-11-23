// remark plugin: wrap the FIRST meaningful mention of each glossary term in a lesson with
// <Acronym term="…">…</Acronym>. Later mentions stay plain text, so a term used 100 times
// gets one hint, not 100. Headings, links, code and embedded widgets are skipped.
import { readFileSync } from "node:fs";

const glossary = JSON.parse(readFileSync(new URL("../../data/glossary.json", import.meta.url), "utf8"));
const terms = glossary.map((entry) => entry.term).sort((a, b) => b.length - a.length);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const pattern = new RegExp(`(?<![A-Za-z0-9_])(${terms.map(escapeRe).join("|")})(?![A-Za-z0-9_])`, "g");

const SKIP_TYPES = new Set([
  "heading",
  "link",
  "linkReference",
  "inlineCode",
  "code",
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
  "html",
]);
const SKIP_COMPONENTS = new Set(["Acronym", "Interactive", "Mermaid", "Diagram", "KnowledgeCheck", "a", "code", "pre"]);

export default function remarkAcronyms() {
  return (tree) => {
    const seen = new Set();

    const split = (value) => {
      pattern.lastIndex = 0;
      let match;
      let last = 0;
      let out = null;
      while ((match = pattern.exec(value))) {
        const term = match[1];
        if (seen.has(term)) continue;
        seen.add(term);
        out ??= [];
        if (match.index > last) out.push({ type: "text", value: value.slice(last, match.index) });
        out.push({
          type: "mdxJsxTextElement",
          name: "Acronym",
          attributes: [{ type: "mdxJsxAttribute", name: "term", value: term }],
          children: [{ type: "text", value: term }],
        });
        last = match.index + term.length;
      }
      if (!out) return null;
      if (last < value.length) out.push({ type: "text", value: value.slice(last) });
      return out;
    };

    const walk = (node) => {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (SKIP_TYPES.has(child.type)) continue;
        const isJsx = child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement";
        if (isJsx && SKIP_COMPONENTS.has(child.name)) continue;
        if (child.type === "text") {
          const replacement = split(child.value);
          if (replacement) {
            node.children.splice(i, 1, ...replacement);
            i += replacement.length - 1;
          }
          continue;
        }
        walk(child);
      }
    };

    walk(tree);
  };
}
