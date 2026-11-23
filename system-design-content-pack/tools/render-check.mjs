#!/usr/bin/env node
// Render every lesson page in headless Chrome through the DevTools protocol and verify that each
// <Mermaid> chart produced an SVG (the component swaps "Drawing the diagram…" for a .mermaid-render
// node on success, or a red <pre> on failure).
//
//   node tools/render-check.mjs <base-url> <lessons-dir> [--chrome <path>] [--only slug,slug] [--timeout ms]
//
// Needs Node 22+ (global WebSocket and fetch) and a Chrome/Chromium binary; no npm packages.
// Run against a built app (`npm run build && npm run start -- -p 3111`). Exit code 1 if any chart
// failed, is still pending at the timeout, or the page did not load.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2);
if (args.length < 2) { console.error("usage: node tools/render-check.mjs <base-url> <lessons-dir> [--chrome p] [--only a,b] [--timeout ms]"); process.exit(2); }
const base = args[0].replace(/\/$/, ""), lessonsDir = args[1];
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const chrome = opt("--chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
const only = opt("--only", null)?.split(",");
const timeoutMs = Number(opt("--timeout", 30000));
const port = 9333 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "render-check-"));
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--user-data-dir=${profile}`,
  "--window-size=1400,16000", `--remote-debugging-port=${port}`, "--remote-allow-origins=*", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pages;
for (let i = 0; i < 50; i++) { try { pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (pages.length) break; } catch {} await sleep(200); }
if (!pages?.length) { proc.kill(); console.error("could not reach Chrome's DevTools endpoint"); process.exit(2); }
const ws = new WebSocket(pages.find((p) => p.type === "page").webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
await send("Page.enable");

const slugs = fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".mdx")).map((f) => f.slice(0, -4)).filter((s) => !only || only.includes(s)).sort();
const COUNT = `JSON.stringify({rendered: document.querySelectorAll('.mermaid-render').length, errors: [...document.querySelectorAll('pre.text-bad')].map(e => e.textContent.slice(0,160)), pending: [...document.querySelectorAll('[role=status]')].filter(e => /Drawing the diagram/.test(e.textContent)).length})`;
let bad = 0;
for (const slug of slugs) {
  const expected = (fs.readFileSync(path.join(lessonsDir, `${slug}.mdx`), "utf8").match(/<Mermaid\b/g) || []).length;
  const nav = await send("Page.navigate", { url: `${base}/learn/${slug}` });
  let result = null, loaded = !nav.error;
  const t0 = Date.now();
  while (loaded && Date.now() - t0 < timeoutMs) {
    const raw = await evalJs(COUNT);
    if (raw) { result = JSON.parse(raw); if (result.pending === 0 && result.rendered + result.errors.length >= expected) break; }
    await sleep(400);
  }
  const ok = loaded && result && result.errors.length === 0 && result.pending === 0 && result.rendered >= expected;
  if (!ok) bad += 1;
  console.log(`${slug.padEnd(32)} charts=${String(expected).padStart(2)} rendered=${String(result?.rendered ?? 0).padStart(2)} errors=${result?.errors.length ?? 0} pending=${result?.pending ?? 0} ${((Date.now() - t0) / 1000).toFixed(1)}s ${ok ? "ok" : "CHECK"}`);
  for (const e of result?.errors ?? []) console.log(`    error: ${e}`);
}
console.log(`\n${slugs.length} pages, ${bad} need attention`);
ws.close(); proc.kill(); await sleep(1500); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(bad ? 1 : 0);
