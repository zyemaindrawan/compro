#!/usr/bin/env bash
# Build the latest main and switch the served output only when the build succeeds.
# Runs on the VPS as the deploy user: bash "$COMPRO_HOME/repo/scripts/deploy/deploy.sh"
set -euo pipefail

COMPRO_HOME="${COMPRO_HOME:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
COMPRO_PORT="${COMPRO_PORT:-3000}"
BRANCH="${DEPLOY_BRANCH:-main}"
REPO="$COMPRO_HOME/repo"
LIVE="$COMPRO_HOME/live"
PREV="$COMPRO_HOME/prev"
ECOSYSTEM="$REPO/scripts/deploy/ecosystem.config.cjs"
export COMPRO_HOME COMPRO_PORT

log() { printf '[deploy %s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
fail() { log "ERROR: $*"; exit 1; }

if [ -z "${NVM_DIR:-}" ] && [ -d "$HOME/.nvm" ]; then export NVM_DIR="$HOME/.nvm"; fi
# shellcheck disable=SC1091
if [ -n "${NVM_DIR:-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh" >/dev/null; fi

for cmd in git node pnpm pm2 curl; do
  command -v "$cmd" >/dev/null || fail "$cmd not found. Run scripts/deploy/bootstrap.sh first."
done
[ -f "$COMPRO_HOME/.env" ] || fail "$COMPRO_HOME/.env is missing. See docs/DEPLOYMENT-AAPANEL.md."

exec 9>"$COMPRO_HOME/.deploy.lock"
flock -n 9 || fail "another deploy is running"

health_code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$COMPRO_PORT/api/health" || true
}

# 200 = healthy, 503 = app up but database unreachable (not a code fault), anything else = broken.
wait_for_app() {
  local code=000
  for _ in $(seq 1 30); do
    code="$(health_code)"
    case "$code" in
      200 | 503) echo "$code"; return 0 ;;
    esac
    sleep 1
  done
  echo "$code"
  return 1
}

start_or_reload() {
  if pm2 describe compro >/dev/null 2>&1; then
    pm2 reload "$ECOSYSTEM" --update-env >/dev/null
  else
    pm2 start "$ECOSYSTEM" >/dev/null
  fi
  pm2 save >/dev/null
}

log "fetching $BRANCH"
git -C "$REPO" fetch --quiet origin "$BRANCH"
git -C "$REPO" reset --quiet --hard "origin/$BRANCH"
log "commit $(git -C "$REPO" log -1 --format='%h %s')"

ln -sfn "$COMPRO_HOME/.env" "$REPO/.env"

log "installing dependencies"
(cd "$REPO" && pnpm install --frozen-lockfile --prefer-offline)

log "building"
rm -rf "$REPO/.output"
(cd "$REPO" && NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=3072}" pnpm build) || fail "build failed; the site keeps serving the current release"
[ -f "$REPO/.output/server/index.mjs" ] || fail "build produced no .output/server/index.mjs"

log "switching release"
rm -rf "$PREV"
if [ -d "$LIVE" ]; then mv "$LIVE" "$PREV"; fi
mv "$REPO/.output" "$LIVE"
git -C "$REPO" rev-parse HEAD > "$LIVE/REVISION"

start_or_reload

if code="$(wait_for_app)"; then
  [ "$code" = 503 ] && log "WARNING: app is up but /api/health reports the database as unreachable"
  log "done: $(cat "$LIVE/REVISION") is live on 127.0.0.1:$COMPRO_PORT"
  exit 0
fi

log "health check failed (HTTP $code); rolling back"
pm2 logs compro --lines 40 --nostream || true
if [ -d "$PREV" ]; then
  rm -rf "$LIVE"
  mv "$PREV" "$LIVE"
  start_or_reload
  wait_for_app >/dev/null && log "rolled back to $(cat "$LIVE/REVISION" 2>/dev/null || echo 'previous release')"
fi
exit 1
