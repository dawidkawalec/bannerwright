#!/usr/bin/env bash
# One-shot: stage everything → commit → push → remote rebuild → verify.
# Usage:
#   pnpm ship "fix: typo in landing"
#   pnpm ship                              # opens $EDITOR for the message
set -euo pipefail

REMOTE_HOST="${BANNERWRIGHT_REMOTE_HOST:-kawalec-vps}"
REMOTE_DIR="${BANNERWRIGHT_REMOTE_DIR:-/root/stacks/bannerwright}"
URL="${BANNERWRIGHT_URL:-https://bannerwright.kawalec.pl}"

cd "$(git rev-parse --show-toplevel)"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "→ staging everything…"
  git add -A
  if [[ $# -ge 1 && -n "$1" ]]; then
    git commit -m "$1"
  else
    git commit
  fi
else
  echo "→ working tree clean — shipping current HEAD"
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "→ pushing $BRANCH to origin…"
git push origin "$BRANCH"

echo "→ remote deploy on $REMOTE_HOST:$REMOTE_DIR …"
ssh "$REMOTE_HOST" "$REMOTE_DIR/deploy.sh"

echo "→ smoke test $URL/api/health …"
curl -fsS --max-time 15 "$URL/api/health"
echo
echo "✓ live: $URL"
