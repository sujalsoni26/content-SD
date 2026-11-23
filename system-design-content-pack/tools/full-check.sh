#!/usr/bin/env bash
# End-to-end verification of the pack against a scratch checkout of the app (which has run `npm ci`
# and, for the Mermaid parse check, `npm install --no-save jsdom`).
#
#   tools/full-check.sh /path/to/scratch-checkout [port]
#
# 1. merges the bundles and applies them to the checkout, running `npm run check` there
# 2. regenerates the roadmap, index, status and QA metrics documents
# 3. parses every Mermaid chart with the app's Mermaid
# 4. builds the app, serves it, renders every lesson page in headless Chrome and checks every chart
# 5. copies the check output into qa/render-check/
# Exit code is non-zero if any step fails. Run from the pack root.
set -euo pipefail
PACK="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${1:?scratch checkout path}"
PORT="${2:-3111}"
cd "$PACK"
if lsof -ti tcp:"$PORT" >/dev/null 2>&1; then echo "port $PORT is already in use; stop that server or pass another port" >&2; exit 2; fi
PIDFILE="$(mktemp)"
echo "== 1. merge, apply, npm run check"
python3 -I plan/merge_bundles.py --check | tail -5 | tee qa/render-check/check-output.txt
echo "== 2. regenerate documents"
python3 -I plan/build_plan.py >/dev/null && python3 -I plan/emit_docs.py | tail -1
python3 -I plan/qa_metrics.py | tail -3
echo "== 3. parse every chart"
node tools/mermaid-check.mjs "$REPO" content/lessons plan/base-lessons | tail -1 | tee qa/render-check/mermaid-check.txt
echo "== 4. build, serve, render"
( cd "$REPO" && npm run build 2>&1 | tail -3 )
( cd "$REPO" && npm run start -- -p "$PORT" >/dev/null 2>&1 & echo $! > "$PIDFILE" )
for i in $(seq 1 60); do curl -s -o /dev/null "http://localhost:$PORT/learn" && break; sleep 1; done
set +e
node tools/render-check.mjs "http://localhost:$PORT" content/lessons > qa/render-check/render-check.txt 2>&1
RC=$?
set -e
tail -1 qa/render-check/render-check.txt
kill "$(cat "$PIDFILE")" 2>/dev/null || true
lsof -ti tcp:"$PORT" | xargs kill 2>/dev/null || true   # next-server is a child of npm; make sure it goes too
rm -f "$PIDFILE"
echo "== done (render check exit $RC)"
exit $RC
