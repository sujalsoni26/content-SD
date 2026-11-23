# Merge lesson bundles (drafts/<module>/<slug>/{lesson.mdx,meta.json}) into the pack's repository-mirrored files.
# Regenerates data files from plan/base-data (Phase 2 state) + all bundles, so it is idempotent.
#   python3 -I plan/merge_bundles.py            # merge + report
#   python3 -I plan/merge_bundles.py --check    # also apply to the scratch repo and run npm run check
import json, os, re, sys, glob, subprocess, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "plan", "base-data")
PLAN = json.load(open(os.path.join(ROOT, "plan", "curriculum-plan.json"), encoding="utf-8"))
SCRATCH = "/Users/ashu/Desktop/sujal/scratch-repo"
TODAY = "2026-11-22"
DECK_FOR_MODULE = {"distributed":"advanced","internals":"advanced","streaming":"advanced","operations":"advanced","security":"advanced","infrastructure":"advanced","architecture":"advanced","hld":"hld","lld":"lld","lld-practice":"lld"}

def rd(p): return open(p, encoding="utf-8").read()
def wr(rel, s):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(s)
def ts(s):  # TypeScript double-quoted string literal
    return json.dumps(s, ensure_ascii=False)

# ---- plan lookups
new_modules = PLAN["new_modules"]
plan_lessons = {}          # slug -> (module dict, lesson dict)
check_for_slug = {}        # slug -> check id (from resources "quiz: check-x-n")
for m in new_modules:
    for l in m["lessons"]:
        plan_lessons[l["slug"]] = (m, l)
        if not l.get("existing"):
            for r in l.get("resources", []):
                mm = re.match(r"quiz: (check-[a-z-]+-\d)", r)
                if mm: check_for_slug[l["slug"]] = mm.group(1)
existing_slugs = set(PLAN["existing_lessons"])
all_plan_slugs = existing_slugs | set(plan_lessons)

# ---- load bundles
bundles = {}
errors = []
for mp in sorted(glob.glob(os.path.join(ROOT, "drafts", "*", "*", "meta.json"))):
    d = os.path.dirname(mp); slug = os.path.basename(d); mod = os.path.basename(os.path.dirname(d))
    try: meta = json.load(open(mp, encoding="utf-8"))
    except Exception as e: errors.append(f"{mp}: invalid JSON: {e}"); continue
    mdx_path = os.path.join(d, "lesson.mdx")
    if not os.path.exists(mdx_path): errors.append(f"{d}: missing lesson.mdx"); continue
    if meta.get("slug") != slug: errors.append(f"{d}: meta.slug {meta.get('slug')!r} != directory {slug!r}")
    if slug not in plan_lessons: errors.append(f"{d}: slug not in plan"); continue
    if plan_lessons[slug][0]["id"] != mod: errors.append(f"{d}: module dir {mod} != plan module {plan_lessons[slug][0]['id']}")
    for k in ("title","moduleId","level","minutes","problem","summary","catTip","recall","archNodes","guide","meow"):
        if k not in meta: errors.append(f"{d}: meta missing {k}")
    for k in ("breaks","tradeoffs","explainSimply","hint"):
        if k not in meta.get("guide", {}): errors.append(f"{d}: guide missing {k}")
    if meta.get("level") not in ("basic","intermediate","advanced"): errors.append(f"{d}: bad level")
    for q in meta.get("quiz", []):
        if len(q.get("options", [])) != 4 or not (0 <= q.get("answer", -1) < 4): errors.append(f"{d}: quiz question needs 4 options and a valid answer index")
    bundles[slug] = dict(meta=meta, mdx=rd(mdx_path), dir=d, module=mod)
if errors:
    print("BUNDLE ERRORS:"); [print("  " + e) for e in errors]; sys.exit(1)

# ---- lessons: copy MDX, neutralise links to lessons that do not exist yet
present = existing_slugs | set(bundles)
deferred = []
link_re = re.compile(r"\[([^\]]+)\]\(/learn/([a-z0-9-]+)\)")
def neutralise(slug, text):
    def sub(mm):
        target = mm.group(2)
        if target in present: return mm.group(0)
        deferred.append((slug, target, mm.group(1)))
        return mm.group(1)
    return link_re.sub(sub, text)
for slug, b in bundles.items():
    wr(f"content/lessons/{slug}.mdx", neutralise(slug, b["mdx"]))
# existing lessons: the Phase 2 versions (with forward links) live in plan/base-lessons and go through the same step
for f in sorted(glob.glob(os.path.join(ROOT, "plan", "base-lessons", "*.mdx"))):
    slug = os.path.basename(f)[:-4]
    wr(f"content/lessons/{slug}.mdx", neutralise(slug, rd(f)))
wr("plan/deferred-links-auto.md", "# Links removed at merge time because the target lesson does not exist yet\n\nRe-run the merge after the target lands and the link is restored automatically.\n\n| Source | Target | Link text |\n| --- | --- | --- |\n" + "\n".join(f"| `{s}` | `{t}` | {x} |" for s, t, x in deferred) + "\n")

# ---- curriculum.ts: base minus the hld placeholder module + all new modules that have at least one lesson present + lessonMeta for bundles
cur = rd(os.path.join(BASE, "curriculum.ts"))
hld_block = re.search(r'\n  // Design practice \(system-design-content-pack\).*?lessons: \["url-shortener"\] \},', cur, re.S)
assert hld_block, "base curriculum.ts: hld placeholder block not found"
cur = cur.replace(hld_block.group(0), "")
mod_entries = []
for m in new_modules:
    slugs = [l["slug"] for l in m["lessons"] if l["slug"] in present]
    if not slugs: continue
    mod_entries.append(f'  {{ id: {ts(m["id"])}, number: {m["number"]}, title: {ts(m["title"])}, tagline: {ts(m["tagline"])}, stage: {ts(m["stage"])},\n    description: {ts(m["description"])},\n    lessons: [{", ".join(ts(s) for s in slugs)}] }},')
cur = cur.replace("\n];\n\nexport const lessonMeta", "\n  // Advanced tracks and design practice (system-design-content-pack). Module numbers are final; lists grow as lessons land.\n" + "\n".join(mod_entries) + "\n];\n\nexport const lessonMeta", 1)
meta_entries = []
for m in new_modules:
    for l in m["lessons"]:
        if l["slug"] not in bundles: continue
        md = bundles[l["slug"]]["meta"]
        meta_entries.append(
            f'  {{\n    slug: {ts(md["slug"])}, title: {ts(md["title"])}, moduleId: {ts(md["moduleId"])}, level: {ts(md["level"])}, minutes: {int(md["minutes"])},\n'
            f'    problem: {ts(md["problem"])},\n    summary: {ts(md["summary"])},\n    catTip: {ts(md["catTip"])},\n'
            f'    recall: {{ q: {ts(md["recall"]["q"])}, a: {ts(md["recall"]["a"])} }},\n    archNodes: [{", ".join(ts(a) for a in md.get("archNodes", []))}],\n  }},')
assert cur.rstrip().endswith("];")
cur = cur.rstrip()[:-2].rstrip() + "\n" + "\n".join(meta_entries) + ("\n" if meta_entries else "") + "];\n"
wr("data/curriculum.ts", cur)

# ---- lesson-guides.ts and cat-meows.ts
g = rd(os.path.join(BASE, "lesson-guides.ts")).rstrip(); assert g.endswith("};")
gl = []
for m in new_modules:
    hdr = False
    for l in m["lessons"]:
        if l["slug"] not in bundles: continue
        if not hdr: gl.append(f"\n  // {m['title']}"); hdr = True
        gd = bundles[l["slug"]]["meta"]["guide"]
        gl.append(f'  {ts(l["slug"])}: {{\n    breaks: {ts(gd["breaks"])},\n    tradeoffs: {ts(gd["tradeoffs"])},\n    explainSimply: {ts(gd["explainSimply"])},\n    hint: {ts(gd["hint"])},\n  }},')
wr("data/lesson-guides.ts", g[:-2].rstrip() + "\n" + "\n".join(gl) + ("\n" if gl else "") + "};\n")
c = rd(os.path.join(BASE, "cat-meows.ts")).rstrip(); assert c.endswith("};")
cl = [f'  {ts(l["slug"])}: {ts(bundles[l["slug"]]["meta"]["meow"])},' for m in new_modules for l in m["lessons"] if l["slug"] in bundles]
wr("data/cat-meows.ts", c[:-2].rstrip() + "\n" + "\n".join(cl) + ("\n" if cl else "") + "};\n")

# ---- quizzes.ts: one KnowledgeCheck per plan check id, questions in plan order, afterLesson = last present lesson of that check
q = rd(os.path.join(BASE, "quizzes.ts")).rstrip(); assert q.endswith("];")
checks = collections.OrderedDict()
for m in new_modules:
    for l in m["lessons"]:
        cid = check_for_slug.get(l["slug"])
        if cid and l["slug"] in bundles and bundles[l["slug"]]["meta"].get("quiz"):
            checks.setdefault(cid, dict(module=m, slugs=[]))["slugs"].append(l["slug"])
TITLES = {"distributed":"Distributed systems check","internals":"Database internals check","streaming":"Messaging and streaming check","operations":"Reliability and observability check","security":"Security check","infrastructure":"Cloud and infrastructure check","architecture":"Architecture patterns check","hld":"Case studies check","lld":"Low-level design check","lld-practice":"LLD case studies check"}
ql = []
for cid, info in checks.items():
    n = cid.rsplit("-", 1)[1]; m = info["module"]
    title = f"{TITLES[m['id']]} {n}"
    qs = []; k = 0
    for s in info["slugs"]:
        for qq in bundles[s]["meta"]["quiz"]:
            k += 1
            qs.append(f'    {{ id: {ts(f"{cid}-{k}")}, lessonSlug: {ts(s)},\n      prompt: {ts(qq["prompt"])},\n      options: [{", ".join(ts(o) for o in qq["options"])}],\n      answer: {int(qq["answer"])},\n      explanation: {ts(qq["explanation"])} }},')
    ql.append(f'  {{ id: {ts(cid)}, title: {ts(title)}, moduleId: {ts(m["id"])}, afterLesson: {ts(info["slugs"][-1])}, questions: [\n' + "\n".join(qs) + "\n  ] },")
wr("data/quizzes.ts", q[:-2].rstrip() + "\n" + "\n".join(ql) + ("\n" if ql else "") + "];\n")

# ---- recall.ts: fill the three new decks from bundle cards (plan order)
r = rd(os.path.join(BASE, "recall.ts"))
for deck in ("advanced","hld","lld"):
    cards = []
    for m in new_modules:
        if DECK_FOR_MODULE[m["id"]] != deck: continue
        for l in m["lessons"]:
            if l["slug"] in bundles:
                for cd in bundles[l["slug"]]["meta"].get("cards", []):
                    cards.append(f'    {{ q: {ts(cd["q"])}, a: {ts(cd["a"])}, lessonSlug: {ts(l["slug"])} }},')
    pat = re.compile(r'(  %s: \{ id: "%s", title: "[^"]*", description: "[^"]*", cards: \[\n)(.*?)(  \] \},)' % (deck, deck), re.S)
    mm = pat.search(r); assert mm, deck
    r = r[:mm.start()] + mm.group(1) + ("\n".join(cards) + "\n" if cards else "") + mm.group(3) + r[mm.end():]
wr("data/recall.ts", r)

# ---- glossary.json: add bundle terms not already present (first lesson in plan order wins), sorted case-insensitively
gloss = json.load(open(os.path.join(BASE, "glossary.json"), encoding="utf-8"))
have = {e["term"] for e in gloss}
added = []
for m in new_modules:
    for l in m["lessons"]:
        if l["slug"] not in bundles: continue
        for e in bundles[l["slug"]]["meta"].get("glossary", []):
            if e["term"] in have: continue
            gloss.append({"term": e["term"], "full": e["full"], "note": e["note"], "lessonSlug": l["slug"]}); have.add(e["term"]); added.append(e["term"])
gloss.sort(key=lambda e: e["term"].lower())
wr("data/glossary.json", json.dumps(gloss, indent=1, ensure_ascii=False) + "\n")

# ---- status.json: bundles are drafted
sp = os.path.join(ROOT, "plan", "status.json"); status = json.load(open(sp, encoding="utf-8"))
for slug in bundles:
    key = f"content/lessons/{slug}.mdx"
    if status.get(key, {}).get("status") in ("reviewed", "integration-ready"):
        continue  # never downgrade a reviewed lesson; a re-review resets it by hand
    status[key] = {"status": "drafted", "note": "bundle merged; passes validator on scratch if the merge check is green", "updated": TODAY}
json.dump(status, open(sp, "w", encoding="utf-8"), indent=1)

# ---- source manifest additions (append rows for new sources, dedupe by url)
man_path = os.path.join(ROOT, "SOURCE_MANIFEST.md"); man = rd(man_path)
have_urls = set(re.findall(r"\| (https?://[^ |]+)", man))
rows = []; n = len(re.findall(r"^\| S(\d+) \|", man, re.M))
for m in new_modules:
    for l in m["lessons"]:
        if l["slug"] not in bundles: continue
        for s in bundles[l["slug"]]["meta"].get("sources", []):
            u = s.get("url", "").split(" ")[0]
            if not u or u in have_urls: continue
            have_urls.add(u); n += 1
            rows.append(f"| S{n} | {s.get('title','')} | {u} | {s.get('accessed', TODAY)} | {s.get('supports','')} | `{l['slug']}` | {s.get('status','reference')} |")
if rows:
    marker = "\nEntries are appended as later phases consult new sources."
    assert marker in man
    man = man.replace(marker, "\n".join(rows) + "\n" + marker, 1)
    wr("SOURCE_MANIFEST.md", man)

print(f"merged {len(bundles)} bundle(s): {', '.join(sorted(bundles)) or '-'}")
print(f"modules present: {[m['id'] for m in new_modules if any(l['slug'] in present for l in m['lessons'])]}")
print(f"checks: {list(checks)} | glossary added: {added} | deferred links: {len(deferred)} | sources added: {len(rows)}")
if "--check" in sys.argv:
    res = subprocess.run([os.path.join(ROOT, "tools", "apply.sh"), SCRATCH], capture_output=True, text=True)
    tail = (res.stdout + res.stderr).strip().splitlines()[-12:]
    print("\n".join(tail)); sys.exit(res.returncode)
