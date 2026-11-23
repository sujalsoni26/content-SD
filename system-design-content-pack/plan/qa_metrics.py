#!/usr/bin/env python3
"""Compute educational and technical QA metrics for the pack and write qa/metrics.json plus qa/METRICS.md.

Reads plan/curriculum-plan.json (order, prerequisites, levels), data/curriculum.ts (what is actually shipped),
content/lessons/*.mdx (components, links), data/quizzes.ts, data/recall.ts, data/glossary.json and plan/status.json.
Run from the pack root after plan/merge_bundles.py. No network, no npm.
"""
import json, re, pathlib, collections
ROOT = pathlib.Path(__file__).resolve().parent.parent
plan = json.load(open(ROOT / "plan/curriculum-plan.json"))
status = json.load(open(ROOT / "plan/status.json"))

# ---- ordering from the plan: existing modules (EM) then new modules in number order
modules = []
def walk(o):
    if isinstance(o, dict):
        if "lessons" in o and "id" in o and "number" in o: modules.append(o)
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
walk(plan)
modules = sorted({m["id"]: m for m in modules}.values(), key=lambda m: m["number"])
order, lesson_of, level_of, minutes_of, prereqs_of, title_of = [], {}, {}, {}, {}, {}
for m in modules:
    for l in m["lessons"]:
        slug = l["slug"] if isinstance(l, dict) else l
        order.append(slug); lesson_of[slug] = m["id"]
        if isinstance(l, dict):
            level_of[slug] = l.get("level"); minutes_of[slug] = l.get("minutes"); prereqs_of[slug] = l.get("prereqs") or []; title_of[slug] = l.get("title", slug)
pos = {s: i for i, s in enumerate(order)}

# ---- what is shipped: curriculum.ts
cur = (ROOT / "data/curriculum.ts").read_text()
shipped = re.findall(r'^\s*slug: "([a-z0-9-]+)", title: "(.*?)", moduleId: "([a-z-]+)", level: "(basic|intermediate|advanced)", minutes: (\d+)', cur, re.M)
ship = {s: dict(title=t, module=m, level=lv, minutes=int(mn)) for s, t, m, lv, mn in shipped}
lessons_dir = ROOT / "content/lessons"
mdx = {p.stem: p.read_text() for p in lessons_dir.glob("*.mdx")}

# ---- prerequisite ordering: every planned prereq must be shipped and come earlier
prereq_violations, missing_prereqs = [], []
for s, pr in prereqs_of.items():
    if s not in ship: continue
    for q in pr:
        if q not in ship: missing_prereqs.append((s, q)); continue
        if pos.get(q, 10**6) >= pos.get(s, -1): prereq_violations.append((s, q))

# ---- links: targets exist; count forward links (to later lessons)
link_bad, forward, backward = [], 0, 0
for s, t in mdx.items():
    for m in re.finditer(r"\]\(/learn/([a-z0-9-]+)\)", t):
        tgt = m.group(1)
        if tgt not in ship: link_bad.append((s, tgt)); continue
        if pos.get(tgt, 0) > pos.get(s, 0): forward += 1
        else: backward += 1

# ---- components per lesson
comp = {}
for s, t in mdx.items():
    comp[s] = dict(
        mermaid=len(re.findall(r"<Mermaid\b", t)), diagram=len(re.findall(r"<Diagram\b", t)), interactive=len(re.findall(r"<Interactive\b", t)),
        callouts=len(re.findall(r"<Callout\b", t)), interview=len(re.findall(r'type="interview"', t)), analogy=len(re.findall(r'type="analogy"', t)),
        deepdive=len(re.findall(r"<DeepDive\b", t)), steps=len(re.findall(r"<Steps>", t)), comparison=len(re.findall(r"<Comparison>", t)),
        code=len(re.findall(r"^```", t, re.M)) // 2, words=len(re.findall(r"\b\w+\b", t)), h2=len(re.findall(r"^## ", t, re.M)))
mermaid_types = collections.Counter()
for t in mdx.values():
    for m in re.finditer(r"chart=\{`(?:---\n[\s\S]*?\n---\n)?\s*([a-zA-Z-]+)", t): mermaid_types[m.group(1)] += 1

# ---- quizzes, recall, glossary
qz = (ROOT / "data/quizzes.ts").read_text()
checks = re.findall(r'id: "(check-[a-z0-9-]+)",\s*title: "(.*?)",\s*moduleId: "([a-z-]+)",\s*afterLesson: "([a-z0-9-]+)"', qz)
questions = len(re.findall(r'^\s*id: "q-', qz, re.M)) or len(re.findall(r"prompt:", qz))
rc = (ROOT / "data/recall.ts").read_text()
decks = {}
chunks = re.split(r'^\s*(test|revision|advanced|hld|lld): \{ id: "\1"', rc, flags=re.M)
for i in range(1, len(chunks), 2):
    decks[chunks[i]] = len(re.findall(r'\{\s*q:', chunks[i + 1]))
glossary = json.load(open(ROOT / "data/glossary.json"))

# ---- new vs existing lessons, levels and minutes per module
by_module = collections.OrderedDict()
for m in modules:
    sl = [s for s in (l["slug"] if isinstance(l, dict) else l for l in m["lessons"]) if s in ship]
    by_module[m["id"]] = dict(number=m["number"], title=m["title"], lessons=len(sl), minutes=sum(ship[s]["minutes"] for s in sl),
                              levels=dict(collections.Counter(ship[s]["level"] for s in sl)))
base = {p.stem for p in (ROOT / "plan/base-lessons").glob("*.mdx")}
new_lessons = [s for s in ship if s not in base]
st = collections.Counter(status.get(f"content/lessons/{s}.mdx", {}).get("status", "planned") for s in new_lessons)

metrics = dict(
    lessons_shipped=len(ship), lessons_existing=len(base), lessons_new=len(new_lessons), new_lesson_status=dict(st),
    modules=by_module, levels=dict(collections.Counter(v["level"] for v in ship.values())), total_minutes=sum(v["minutes"] for v in ship.values()),
    prereq_violations=prereq_violations, missing_prereqs=missing_prereqs, bad_links=link_bad, forward_links=forward, backward_links=backward,
    components=dict(mermaid=sum(c["mermaid"] for c in comp.values()), mermaid_types=dict(mermaid_types), diagram=sum(c["diagram"] for c in comp.values()),
                    interactive=sum(c["interactive"] for c in comp.values()), deepdive=sum(c["deepdive"] for c in comp.values()),
                    interview_callouts=sum(c["interview"] for c in comp.values()), analogy_callouts=sum(c["analogy"] for c in comp.values()), code_blocks=sum(c["code"] for c in comp.values())),
    lessons_without=dict(interview=[s for s, c in comp.items() if c["interview"] == 0 and s in new_lessons], analogy=[s for s, c in comp.items() if c["analogy"] == 0 and s in new_lessons],
                         visual=[s for s, c in comp.items() if c["mermaid"] + c["diagram"] + c["interactive"] == 0 and s in new_lessons]),
    knowledge_checks=len(checks), questions=questions, checks_per_module=dict(collections.Counter(m for _, _, m, _ in checks)), recall_decks=decks, glossary_terms=len(glossary),
    words=dict(min=min(c["words"] for c in comp.values()), max=max(c["words"] for c in comp.values()), mean=round(sum(c["words"] for c in comp.values()) / len(comp))),
    per_lesson={s: dict(ship[s], **comp.get(s, {})) for s in ship},
)
(ROOT / "qa").mkdir(exist_ok=True)
json.dump(metrics, open(ROOT / "qa/metrics.json", "w"), indent=1, ensure_ascii=False)

L = []
A = L.append
A("# QA metrics (generated by `plan/qa_metrics.py`)\n")
A(f"Lessons shipped: **{metrics['lessons_shipped']}** ({metrics['lessons_existing']} existing, {metrics['lessons_new']} new; new-lesson status {metrics['new_lesson_status']}). Total reading time {metrics['total_minutes']} min. Levels: {metrics['levels']}.\n")
A("| # | Module | Lessons | Minutes | basic / intermediate / advanced |"); A("| --- | --- | --- | --- | --- |")
for mid, m in by_module.items():
    lv = m["levels"]; A(f"| {m['number']} | {m['title']} (`{mid}`) | {m['lessons']} | {m['minutes']} | {lv.get('basic',0)} / {lv.get('intermediate',0)} / {lv.get('advanced',0)} |")
A("")
A(f"Prerequisite ordering: {len(prereq_violations)} violation(s) {prereq_violations if prereq_violations else ''}; missing prerequisites: {len(missing_prereqs)} {missing_prereqs if missing_prereqs else ''}.")
A(f"Links: {len(link_bad)} broken {link_bad if link_bad else ''}; {backward} backward (to earlier lessons) and {forward} forward links.")
c = metrics["components"]
A(f"Components: {c['mermaid']} Mermaid charts {c['mermaid_types']}, {c['diagram']} static diagrams, {c['interactive']} simulations, {c['deepdive']} deep dives, {c['interview_callouts']} interview callouts, {c['analogy_callouts']} analogies, {c['code_blocks']} code blocks.")
A(f"New lessons without an interview callout: {metrics['lessons_without']['interview'] or 'none'}; without an analogy: {metrics['lessons_without']['analogy'] or 'none'}; without any visual: {metrics['lessons_without']['visual'] or 'none'}.")
A(f"Knowledge checks: {metrics['knowledge_checks']} ({metrics['questions']} questions) {metrics['checks_per_module']}. Recall decks: {decks}. Glossary: {metrics['glossary_terms']} terms. Words per lesson: {metrics['words']}.")
(ROOT / "qa/METRICS.md").write_text("\n".join(L) + "\n")
print("\n".join(L))
