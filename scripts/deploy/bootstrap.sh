#!/usr/bin/env bash
# One-time setup for the deploy user on the VPS: Node via nvm, pnpm, PM2 and the repo checkout.
# Safe to run again. Does not need root; it prints the root-only steps it cannot do.
set -euo pipefail

COMPRO_HOME="${COMPRO_HOME:-/www/wwwroot/compro}"
REPO_URL="${REPO_URL:-https://github.com/zyemaindrawan/compro.git}"
NODE_MAJOR="${NODE_MAJOR:-22}"
NVM_VERSION="v0.40.3"
PNPM_VERSION="10.28.0"

log() { printf '[bootstrap] %s\n' "$*"; }

if [ ! -d "$COMPRO_HOME" ] || [ ! -w "$COMPRO_HOME" ]; then
  log "ERROR: $COMPRO_HOME must exist and be writable by $(whoami). As root: mkdir -p $COMPRO_HOME && chown $(whoami): $COMPRO_HOME"
  exit 1
fi
command -v git >/dev/null || { log "ERROR: git is not installed (as root: apt-get install -y git)"; exit 1; }

export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  log "installing nvm $NVM_VERSION"
  curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VERSION/install.sh" | PROFILE=/dev/null bash
fi
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

if ! nvm ls "$NODE_MAJOR" >/dev/null 2>&1; then
  log "installing Node $NODE_MAJOR"
  nvm install "$NODE_MAJOR"
fi
nvm alias default "$NODE_MAJOR" >/dev/null
nvm use default >/dev/null

if [ "$(pnpm --version 2>/dev/null || true)" != "$PNPM_VERSION" ]; then
  log "installing pnpm $PNPM_VERSION"
  npm install -g "pnpm@$PNPM_VERSION" >/dev/null
fi
command -v pm2 >/dev/null || { log "installing PM2"; npm install -g pm2 >/dev/null; }

if ! grep -q 'NVM_DIR/nvm.sh' "$HOME/.bashrc" 2>/dev/null; then
  # shellcheck disable=SC2016
  printf '\nexport NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"\n' >> "$HOME/.bashrc"
fi

if [ ! -d "$COMPRO_HOME/repo/.git" ]; then
  log "cloning $REPO_URL"
  git clone --branch main "$REPO_URL" "$COMPRO_HOME/repo"
fi

[ -f "$COMPRO_HOME/.env" ] || {
  cp "$COMPRO_HOME/repo/.env.example" "$COMPRO_HOME/.env"
  chmod 600 "$COMPRO_HOME/.env"
  log "created $COMPRO_HOME/.env from .env.example: fill in the production values before deploying"
}

mem_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
swap_mb="$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo)"
log "node $(node --version), pnpm $(pnpm --version), pm2 $(pm2 --version), RAM ${mem_mb} MB, swap ${swap_mb} MB"
if [ $((mem_mb + swap_mb)) -lt 4000 ]; then
  log "WARNING: RAM + swap is under 4 GB and the build may run out of memory. Add swap as root (see docs/DEPLOYMENT-AAPANEL.md)."
fi

log "remaining root step, once: make PM2 start on boot by running the command printed by:"
log "  pm2 startup systemd -u $(whoami) --hp $HOME"
log "next: edit $COMPRO_HOME/.env, then run bash $COMPRO_HOME/repo/scripts/deploy/deploy.sh"
