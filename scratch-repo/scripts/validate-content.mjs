#!/usr/bin/env node
// Validate the lesson MDX in content/lessons against the curriculum and the component registries.
//
//   node scripts/validate-content.mjs
//
// Checks:
//   - every file compiles as MDX (with remark-gfm and the app's acronym plugin);
//   - every curriculum slug has content/lessons/<slug>.mdx and no lesson file is orphaned;
//   - only the agreed MDX components are used, with their required props;
//   - <Interactive name> is in components/diagrams/interactive-registry.tsx (variants checked
//     where a widget has presets), <Diagram name> is in components/diagrams/static/index.ts;
//   - <Mermaid chart> is a plain template literal for a supported diagram type
//     (sequenceDiagram, flowchart <dir>, stateDiagram-v2, classDiagram);
//   - internal links point at a real lesson (/learn/<slug>) or module (/learn#<module>);
//   - no h1, no import/export, and no markdown that failed to parse (stray ** or backticks).
// Exits 1 if anything is wrong.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = path.join(ROOT, "content", "lessons");
const read = (...p) => readFileSync(path.join(ROOT, ...p), "utf8");

const problems = [];
const warnings = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

// ---------------------------------------------------------------------------------------------
// Sources of truth
// ---------------------------------------------------------------------------------------------
const curriculumSrc = read("data", "curriculum.ts");
const moduleIds = [...curriculumSrc.matchAll(/\{\s*id:\s*"([a-z0-9-]+)",\s*number:/g)].map((m) => m[1]);
const moduleSlugs = [...curriculumSrc.matchAll(/lessons:\s*\[([^\]]*)\]/g)].flatMap((m) =>
  [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((s) => s[1]),
);
const metaSlugs = [...curriculumSrc.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);

if (moduleIds.length === 0 || moduleSlugs.length === 0) fail("data/curriculum.ts", "could not read modules or lessons");
for (const [label, list] of [["modules[].lessons", moduleSlugs], ["lessonMeta", metaSlugs]]) {
  const dupes = list.filter((s, i) => list.indexOf(s) !== i);
  if (dupes.length) fail("data/curriculum.ts", `duplicate slugs in ${label}: ${[...new Set(dupes)].join(", ")}`);
}
for (const s of moduleSlugs) if (!metaSlugs.includes(s)) fail("data/curriculum.ts", `"${s}" is in a module but has no lessonMeta entry`);
for (const s of metaSlugs) if (!moduleSlugs.includes(s)) fail("data/curriculum.ts", `lessonMeta "${s}" is not in any module`);
const slugs = new Set([...moduleSlugs, ...metaSlugs]);

const registrySrc = read("components", "diagrams", "interactive-registry.tsx");
const registryBody = registrySrc.slice(registrySrc.indexOf("interactiveRegistry"));
const interactiveNames = new Set(
  [...registryBody.matchAll(/^\s*(?:"([a-z0-9-]+)"|([a-zA-Z0-9]+))\s*:\s*load\(/gm)].map((m) => m[1] ?? m[2]),
);
if (interactiveNames.size === 0) fail("interactive-registry.tsx", "could not read any interactive names");

const staticIndex = path.join("components", "diagrams", "static", "index.ts");
const staticNames = new Set(existsSync(path.join(ROOT, staticIndex))
  ? [...read(staticIndex).matchAll(/^\s*"([a-z0-9-]+)"\s*:\s*\w+\s*,?\s*$/gm)].map((m) => m[1])
  : []);
if (staticNames.size === 0) fail(staticIndex, "missing, or no entries in staticDiagrams");
const staticDir = path.join(ROOT, "components", "diagrams", "static");
const staticFiles = (existsSync(staticDir) ? readdirSync(staticDir) : [])
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => f.slice(0, -4));
for (const f of staticFiles) if (!staticNames.has(f)) fail(staticIndex, `static diagram file ${f}.tsx is not registered`);
for (const n of staticNames) if (!staticFiles.includes(n)) fail(staticIndex, `"${n}" has no ${n}.tsx file`);

/** Widgets whose `variant` selects a preset; anything else must not get a variant. */
const VARIANTS = { estimator: ["url", "drive", "chat"], "recall-cards": ["test", "revision", "advanced", "hld", "lld"] };
const CALLOUT_TYPES = ["idea", "analogy", "warning", "interview"];
const MERMAID_TYPES = /^(sequenceDiagram|flowchart (?:LR|RL|TB|TD|BT)|stateDiagram-v2|classDiagram)\b/;
/** The MDX vocabulary agreed in the contract: component -> required props. */
const COMPONENTS = {
  Callout: ["type"],
  Comparison: [],
  ComparisonItem: ["title"],
  DeepDive: ["title"],
  Steps: [],
  Interactive: ["name"],
  Diagram: ["name"],
  Mermaid: ["chart", "caption"],
  mark: [],
};

// ---------------------------------------------------------------------------------------------
// Lesson files
// ---------------------------------------------------------------------------------------------
const files = existsSync(LESSONS) ? readdirSync(LESSONS).filter((f) => f.endsWith(".mdx")) : [];
const fileSlugs = new Set(files.map((f) => f.slice(0, -4)));
for (const s of slugs) if (!fileSlugs.has(s)) fail(`content/lessons/${s}.mdx`, "missing (slug is in the curriculum)");
for (const s of fileSlugs) if (!slugs.has(s)) fail(`content/lessons/${s}.mdx`, "orphaned (slug is not in the curriculum)");
if (!existsSync(LESSONS)) fail("content/lessons", "folder is missing");
else for (const f of readdirSync(LESSONS)) if (!f.endsWith(".mdx")) warnings.push(`content/lessons/${f}: not an .mdx file`);

let acronymPlugin = null;
const acronymPath = path.join(ROOT, "lib", "mdx", "remark-acronyms.mjs");
if (existsSync(acronymPath)) acronymPlugin = (await import(pathToFileURL(acronymPath).href)).default;

const attrValue = (node, name) => {
  const a = node.attributes?.find((x) => x.type === "mdxJsxAttribute" && x.name === name);
  if (!a) return undefined;
  if (a.value == null) return true;
  if (typeof a.value === "string") return a.value;
  return { expression: a.value.value };
};

const stringProp = (node, name) => {
  const v = attrValue(node, name);
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    try {
      const parsed = JSON.parse(v.expression);
      if (typeof parsed === "string") return parsed;
    } catch {
      /* not a plain string literal */
    }
  }
  return undefined;
};

function walk(node, visit, parents = []) {
  visit(node, parents);
  for (const child of node.children ?? []) walk(child, visit, [...parents, node]);
}

const usage = { interactive: new Map(), diagram: new Map(), mermaid: 0 };

function checkTree(tree, file) {
  walk(tree, (node, parents) => {
    const at = `${file}:${node.position?.start.line ?? "?"}`;
    switch (node.type) {
      case "heading":
        if (node.depth === 1) fail(at, "h1 headings are not allowed (the layout renders the title)");
        break;
      case "mdxjsEsm":
        fail(at, "import/export is not allowed in lessons");
        break;
      case "mdxFlowExpression":
      case "mdxTextExpression":
        fail(at, "bare {expression} in prose; escape braces as \\{ \\}");
        break;
      case "html":
        fail(at, "raw HTML node");
        break;
      case "link":
      case "definition": {
        const url = node.url ?? "";
        if (/^https?:\/\//.test(url)) break;
        const lesson = url.match(/^\/learn\/([a-z0-9-]+)$/);
        const mod = url.match(/^\/learn#([a-z0-9-]+)$/);
        if (lesson) {
          if (!slugs.has(lesson[1])) fail(at, `link to unknown lesson ${url}`);
        } else if (mod) {
          if (!moduleIds.includes(mod[1])) fail(at, `link to unknown module ${url}`);
        } else if (url !== "/learn") {
          fail(at, `unexpected link target "${url}"`);
        }
        break;
      }
      case "text": {
        const inCode = parents.some((p) => p.type === "inlineCode" || p.type === "code");
        if (!inCode && /\*\*|`|\]\(/.test(node.value)) fail(at, `markdown did not parse: "${node.value.trim().slice(0, 60)}"`);
        break;
      }
      case "mdxJsxFlowElement":
      case "mdxJsxTextElement": {
        const name = node.name;
        if (!name) {
          fail(at, "JSX fragments are not allowed");
          break;
        }
        if (!(name in COMPONENTS)) {
          fail(at, `unknown component <${name}>`);
          break;
        }
        for (const prop of COMPONENTS[name]) if (attrValue(node, prop) === undefined) fail(at, `<${name}> needs a ${prop} prop`);
        if (name === "Callout") {
          const type = stringProp(node, "type");
          if (type && !CALLOUT_TYPES.includes(type)) fail(at, `<Callout type="${type}"> must be one of ${CALLOUT_TYPES.join(", ")}`);
        }
        if (name === "ComparisonItem" && parents.at(-1)?.name !== "Comparison") fail(at, "<ComparisonItem> must sit directly inside <Comparison>");
        if (name === "Interactive") {
          const n = stringProp(node, "name");
          const variant = attrValue(node, "variant");
          if (n !== undefined && !interactiveNames.has(n)) fail(at, `<Interactive name="${n}"> is not in interactive-registry.tsx`);
          if (n !== undefined && variant !== undefined) {
            const allowed = VARIANTS[n];
            const v = stringProp(node, "variant");
            if (!allowed) fail(at, `<Interactive name="${n}"> takes no variant`);
            else if (!allowed.includes(v)) fail(at, `variant "${v}" is not one of ${allowed.join(", ")} for ${n}`);
          }
          usage.interactive.set(n, (usage.interactive.get(n) ?? 0) + 1);
        }
        if (name === "Diagram") {
          const n = stringProp(node, "name");
          if (n !== undefined && !staticNames.has(n)) fail(at, `<Diagram name="${n}"> is not in components/diagrams/static/index.ts`);
          usage.diagram.set(n, (usage.diagram.get(n) ?? 0) + 1);
        }
        if (name === "Mermaid") {
          usage.mermaid += 1;
          const chart = attrValue(node, "chart");
          const expr = typeof chart === "object" ? chart.expression.trim() : "";
          if (!/^`[\s\S]*`$/.test(expr) || expr.includes("${")) {
            fail(at, "<Mermaid chart> must be a plain template literal: chart={`...`}");
          } else {
            const body = expr.slice(1, -1).trim().replace(/^---\n[\s\S]*?\n---\n/, "").trim();
            if (!MERMAID_TYPES.test(body)) fail(at, `<Mermaid> chart must start with sequenceDiagram, flowchart <dir>, stateDiagram-v2 or classDiagram`);
          }
        }
        break;
      }
      default:
        break;
    }
  });
}

for (const f of files.sort()) {
  const file = `content/lessons/${f}`;
  const source = readFileSync(path.join(LESSONS, f), "utf8");
  if (!source.trim()) {
    fail(file, "empty file");
    continue;
  }
  const collect = () => (tree) => checkTree(tree, file);
  try {
    await compile(
      { path: path.join(LESSONS, f), value: source },
      { remarkPlugins: [remarkGfm, collect, ...(acronymPlugin ? [acronymPlugin] : [])] },
    );
  } catch (error) {
    const place = error.place?.start ?? error.place ?? error.position?.start;
    const where = place?.line ? `${file}:${place.line}:${place.column ?? 1}` : file;
    fail(where, `does not compile: ${error.reason ?? error.message}`);
  }
}

for (const n of interactiveNames) if (!usage.interactive.has(n)) warnings.push(`interactive "${n}" is registered but no lesson uses it`);
for (const n of staticNames) if (!usage.diagram.has(n)) warnings.push(`static diagram "${n}" is registered but no lesson uses it`);

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
const count = (m) => [...m.values()].reduce((a, b) => a + b, 0);
for (const w of warnings) console.warn(`warning  ${w}`);
if (problems.length) {
  for (const p of problems) console.error(`error    ${p}`);
  console.error(`\n${problems.length} problem(s) in ${files.length} lesson file(s).`);
  process.exit(1);
}
console.log(
  `OK: ${files.length} lessons match ${slugs.size} curriculum slugs; ` +
    `${count(usage.interactive)} <Interactive> (${usage.interactive.size} kinds), ` +
    `${count(usage.diagram)} <Diagram>, ${usage.mermaid} <Mermaid>; all compile.`,
);
