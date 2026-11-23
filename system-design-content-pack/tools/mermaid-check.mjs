#!/usr/bin/env node
// Parse every <Mermaid chart={`...`} /> block in the given MDX files or directories with the
// real Mermaid parser (the same package the app renders with), under a jsdom window.
//
//   node tools/mermaid-check.mjs <app-repo-root> <file-or-dir> [<file-or-dir> ...]
//
// <app-repo-root> must have node_modules with `mermaid` (the app's dependency) and `jsdom`
// (dev only: `npm install --no-save jsdom` in a scratch checkout; it is not a project dependency).
// Exit code 1 if any chart fails to parse. This is a syntax check: it catches the errors that make
// the <Mermaid> component show its error state, not layout differences.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";

const [repoRoot, ...targets] = process.argv.slice(2);
if (!repoRoot || targets.length === 0) {
  console.error("usage: node tools/mermaid-check.mjs <app-repo-root> <file-or-dir>...");
  process.exit(2);
}
const require = createRequire(path.join(path.resolve(repoRoot), "package.json"));
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (!(key in globalThis)) {
    try { globalThis[key] = dom.window[key]; } catch { /* read-only */ }
  }
}
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const mermaid = (await import(pathToFileURL(require.resolve("mermaid")).href)).default;
mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

function* mdxFiles(target) {
  const st = fs.statSync(target);
  if (st.isFile()) { if (target.endsWith(".mdx")) yield target; return; }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const p = path.join(target, entry.name);
    if (entry.isDirectory()) yield* mdxFiles(p);
    else if (entry.name.endsWith(".mdx")) yield p;
  }
}
const CHART = /<Mermaid\b[^>]*?chart=\{`([\s\S]*?)`\}/g;
let charts = 0, failures = 0;
const types = new Map();
for (const target of targets) {
  for (const file of mdxFiles(target)) {
    const src = fs.readFileSync(file, "utf8");
    let i = 0;
    for (const m of src.matchAll(CHART)) {
      i += 1; charts += 1;
      // Evaluate the template literal exactly as the MDX runtime would (the validator forbids ${}).
      const chart = new Function("return `" + m[1] + "`;")();
      try {
        const res = await mermaid.parse(chart, { suppressErrors: false });
        const t = res?.diagramType ?? "unknown";
        types.set(t, (types.get(t) ?? 0) + 1);
      } catch (err) {
        failures += 1;
        const msg = String(err?.message ?? err).split("\n").slice(0, 4).join(" | ");
        console.log(`FAIL ${file} #${i}: ${msg}`);
      }
    }
  }
}
console.log(`${charts} charts parsed, ${failures} failed; by type: ${[...types].map(([k, v]) => `${k}=${v}`).join(", ")}`);
process.exit(failures ? 1 : 0);
