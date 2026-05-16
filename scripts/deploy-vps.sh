#!/usr/bin/env bash
# Push current main to GitHub then trigger a remote rebuild on the VPS.
# Requires the `kawalec-vps` SSH host alias and that the remote stack lives
# under /root/stacks/bannerwright/ with a deploy.sh inside.
set -euo pipefail

REMOTE_HOST="${BANNERWRIGHT_REMOTE_HOST:-kawalec-vps}"
REMOTE_DIR="${BANNERWRIGHT_REMOTE_DIR:-/root/stacks/bannerwright}"
URL="${BANNERWRIGHT_URL:-https://bannerwright.com}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree not clean — commit or stash first." >&2
  exit 1
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
