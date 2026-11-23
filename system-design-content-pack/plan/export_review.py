#!/usr/bin/env python3
"""Export one or more bundles as a single review file: the lesson body followed by a compact summary of meta.json.

    python3 -I plan/export_review.py <out-file> <module>/<slug> [<module>/<slug> ...]

Used during review so a lesson and every claim its metadata makes (quiz, cards, recall, guide, glossary, sources)
can be read together. Pure stdlib; writes nothing but the output file.
"""
import json, sys, pathlib
if len(sys.argv) < 3:
    print(__doc__); sys.exit(2)
out = pathlib.Path(sys.argv[1]); parts = []
for ref in sys.argv[2:]:
    d = pathlib.Path("drafts") / ref
    parts.append(f"################ {ref}/lesson.mdx ################\n" + (d / "lesson.mdx").read_text())
    m = json.loads((d / "meta.json").read_text())
    lines = [f"################ {ref}/meta.json (summary) ################"]
    for k in ("title", "level", "minutes", "problem", "summary", "catTip", "meow"): lines.append(f"{k.upper()}: {m.get(k)}")
    lines.append(f"RECALL: {m.get('recall')}"); lines.append(f"GUIDE: {json.dumps(m.get('guide'), ensure_ascii=False)}"); lines.append(f"ARCH: {m.get('archNodes')}")
    for q in m.get("quiz", []): lines.append(f"QUIZ: {q['prompt']} | {q['options']} | answer {q['answer']} | {q['explanation']}")
    for c in m.get("cards", []): lines.append(f"CARD: {c['q']} -> {c['a']}")
    lines.append(f"GLOSSARY: {m.get('glossary')}")
    for s in m.get("sources", []): lines.append(f"SRC: {s.get('status')} | {s['title'][:80]} | {s['url']}")
    parts.append("\n".join(lines) + "\n")
out.write_text("\n".join(parts)); print(out, out.stat().st_size, "bytes")
