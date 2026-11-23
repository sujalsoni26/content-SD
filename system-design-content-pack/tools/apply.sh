#!/usr/bin/env bash
# Copy the pack's repository-mirrored files into a checkout of box-by-box-system-design and run its checks.
#   tools/apply.sh /path/to/repo-checkout [--no-check]
# Copies content/, data/, types/, scripts/ and components/ (only the files the pack contains; nothing is deleted),
# then runs `npm run check` (typecheck + lint + content validation) unless --no-check is given.
set -euo pipefail
PACK="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:?usage: tools/apply.sh <repo-checkout> [--no-check]}"
for d in content data types scripts components; do
  if [ -d "$PACK/$d" ]; then
    mkdir -p "$TARGET/$d"
    rsync -a "$PACK/$d/" "$TARGET/$d/"
    echo "copied $d/"
  fi
done
if [ "${2:-}" != "--no-check" ]; then
  cd "$TARGET" && npm run check
fi
