#!/usr/bin/env python3
"""Record or verify the md5 of every reviewed lesson bundle.

    python3 -I plan/refresh_review_hashes.py            # rewrite plan/review-hashes.json from the bundles on disk
    python3 -I plan/refresh_review_hashes.py --verify   # list reviewed bundles edited since their hash was recorded

A lesson counts as reviewed when plan/status.json gives content/lessons/<slug>.mdx the status
"reviewed" or "integration-ready". Its bundle is drafts/<module>/<slug>/{lesson.mdx,meta.json}; the 23
improved existing lessons live in plan/base-lessons/<slug>.mdx and are hashed there. Exit code 1 in
--verify mode means at least one reviewed file changed after review and needs a second look.
"""
import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
STATUS = ROOT / "plan" / "status.json"
HASHES = ROOT / "plan" / "review-hashes.json"
REVIEWED = {"reviewed", "integration-ready"}


def md5(path: pathlib.Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def reviewed_files() -> dict[str, str]:
    status = json.loads(STATUS.read_text())
    out: dict[str, str] = {}
    for key, entry in status.items():
        if not key.startswith("content/lessons/") or entry.get("status") not in REVIEWED:
            continue
        slug = key.removeprefix("content/lessons/").removesuffix(".mdx")
        bundles = list((ROOT / "drafts").glob(f"*/{slug}/lesson.mdx"))
        if bundles:
            for f in (bundles[0], bundles[0].with_name("meta.json")):
                out[str(f.relative_to(ROOT))] = md5(f)
            continue
        base = ROOT / "plan" / "base-lessons" / f"{slug}.mdx"
        if base.exists():
            out[str(base.relative_to(ROOT))] = md5(base)
    return dict(sorted(out.items()))


def main() -> int:
    current = reviewed_files()
    if "--verify" in sys.argv:
        recorded = json.loads(HASHES.read_text()) if HASHES.exists() else {}
        changed = [p for p, h in current.items() if recorded.get(p) != h]
        for p in changed:
            print(("edited since review: " if p in recorded else "not yet hashed: ") + p)
        print(f"{len(current)} reviewed files, {len(changed)} differ from plan/review-hashes.json")
        return 1 if changed else 0
    HASHES.write_text(json.dumps(current, indent=1) + "\n")
    print(f"recorded {len(current)} file hashes in {HASHES.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
