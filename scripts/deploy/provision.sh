#!/usr/bin/env bash
# Root-only server setup for an aaPanel VPS (docs/DEPLOYMENT-AAPANEL.md steps 1-6):
# deploy user, swap, bootstrap, .env, migrations, first deploy, PM2 on boot, Nginx site and SSL.
#
#   bash provision.sh <domain>          full setup; safe to run again
#   bash provision.sh <domain> nginx    only the Nginx site and SSL, e.g. after DNS starts pointing here
#
# Secrets are typed into the terminal, never echoed, and the database URL is not stored.
set -euo pipefail

DOMAIN="${1:-}"
MODE="${2:-full}"
COMPRO_HOME="${COMPRO_HOME:-/www/wwwroot/compro}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
REPO_URL="${REPO_URL:-https://github.com/zyemaindrawan/compro.git}"
NGINX_BIN="${NGINX_BIN:-/www/server/nginx/sbin/nginx}"
VHOST_DIR="${VHOST_DIR:-/www/server/panel/vhost/nginx}"
ENV_FILE="$COMPRO_HOME/.env"
REPO="$COMPRO_HOME/repo"
ACME_ROOT="$COMPRO_HOME/acme"
SITE_CONF="$VHOST_DIR/compro.conf"

log() { printf '\n[provision] %s\n' "$*"; }
fail() { printf '\n[provision] ERROR: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "run as root"
[[ "$DOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || fail "usage: bash provision.sh <domain> [full|nginx]"
[[ "$MODE" =~ ^(full|nginx)$ ]] || fail "mode must be full or nginx"
[ -e /dev/tty ] || fail "needs an interactive terminal"

as_deploy() {
  su - "$DEPLOY_USER" -s /bin/bash -c "export NVM_DIR=\"\$HOME/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" >/dev/null; $1"
}

ask() {
  local reply
  read -rp "$1" reply </dev/tty
  printf '%s' "$reply"
}

ask_secret() {
  local reply
  read -rsp "$1" reply </dev/tty
  printf '\n' >/dev/tty
  printf '%s' "$reply"
}

get_env() {
  awk -v k="$1" 'index($0, k "=") == 1 { print substr($0, length(k) + 2); exit }' "$ENV_FILE"
}

set_env() {
  local tmp
  tmp="$(mktemp)"
  KEY="$1" VALUE="$2" awk '
    BEGIN { k = ENVIRON["KEY"]; v = ENVIRON["VALUE"] }
    index($0, k "=") == 1 { print k "=" v; done = 1; next }
    { print }
    END { if (!done) print k "=" v }
  ' "$ENV_FILE" >"$tmp"
  cat "$tmp" >"$ENV_FILE"
  rm -f "$tmp"
}

clean_value() {
  printf '%s' "$1" | tr -d '\r\n\t ' | sed -E "s/^[\"']//; s/[\"']$//; s#/+\$##"
}

# Keeps a valid existing value; otherwise prompts until the input matches the pattern.
fill_env() {
  local key="$1" label="$2" pattern="$3" secret="${4:-}" value
  value="$(get_env "$key")"
  [[ "$value" =~ $pattern ]] && return 0
  [ -z "$value" ] || echo "$key in .env has an invalid format; enter it again."
  while true; do
    if [ -n "$secret" ]; then value="$(ask_secret "$label: ")"; else value="$(ask "$label: ")"; fi
    value="$(clean_value "$value")"
    [[ "$value" =~ $pattern ]] && break
    echo "Invalid format for $key (expected: $label). Try again."
  done
  set_env "$key" "$value"
}

install_packages() {
  local missing=()
  for pkg in "$@"; do command -v "$pkg" >/dev/null || missing+=("$pkg"); done
  [ ${#missing[@]} -eq 0 ] && return 0
  log "installing ${missing[*]}"
  if command -v apt-get >/dev/null; then
    apt-get update -qq >/dev/null
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${missing[@]}" >/dev/null
  else
    yum install -y -q "${missing[@]}"
  fi
}

setup_root() {
  install_packages git curl openssl
  id "$DEPLOY_USER" >/dev/null 2>&1 || { log "creating user $DEPLOY_USER"; useradd -m -s /bin/bash "$DEPLOY_USER"; }
  mkdir -p "$COMPRO_HOME"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$COMPRO_HOME"

  local mem_mb swap_mb
  mem_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
  swap_mb="$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo)"
  if [ $((mem_mb + swap_mb)) -lt 4000 ] && [ ! -e /swapfile ]; then
    log "adding 4 GB swap (RAM ${mem_mb} MB, swap ${swap_mb} MB)"
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
  fi
}

bootstrap() {
  if [ -d "$REPO/.git" ]; then
    as_deploy "git -C '$REPO' fetch --quiet origin main && git -C '$REPO' reset --quiet --hard origin/main"
  else
    as_deploy "git clone --quiet --branch main '$REPO_URL' '$REPO'"
  fi
  log "running bootstrap.sh as $DEPLOY_USER"
  as_deploy "bash '$REPO/scripts/deploy/bootstrap.sh'"
}

configure_env() {
  log "filling $ENV_FILE (values already set are kept; input is hidden for secrets)"
  set_env NUXT_SITE_URL "https://$DOMAIN"
  [ -n "$(get_env NUXT_TRUST_PROXY)" ] || set_env NUXT_TRUST_PROXY x-real-ip
  [ -n "$(get_env NUXT_IP_HASH_SALT)" ] || set_env NUXT_IP_HASH_SALT "$(openssl rand -base64 48 | tr -d '\n')"
  fill_env NUXT_SUPABASE_URL "Supabase project URL (https://<ref>.supabase.co, no trailing slash)" '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  fill_env NUXT_SUPABASE_KEY "Supabase publishable key (sb_publishable_... or legacy anon eyJ...)" '^(sb_publishable_|eyJ)[A-Za-z0-9._-]+$' secret
  fill_env NUXT_SUPABASE_SECRET_KEY "Supabase secret key (sb_secret_... or legacy service_role eyJ...)" '^(sb_secret_|eyJ)[A-Za-z0-9._-]+$' secret
  [ "$(get_env NUXT_SUPABASE_KEY)" != "$(get_env NUXT_SUPABASE_SECRET_KEY)" ] || fail "the publishable key and the secret key are identical; check $ENV_FILE"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"

  local empty
  empty="$(awk -F= '/^[A-Z_]+=$/ {print $1}' "$ENV_FILE" | tr '\n' ' ')"
  [ -z "$empty" ] || log "still empty (forms and email stay off until set): $empty"
}

has_ipv6_route() {
  ip -6 route show default 2>/dev/null | grep -q .
}

run_migrations() {
  local db_url seed_flag="" url_file
  log "database migrations"
  while true; do
    db_url="$(ask_secret "Postgres connection string (Supabase Session pooler; Enter to skip): ")"
    [ -z "$db_url" ] && { log "skipped migrations"; return 0; }
    if [[ "$db_url" == *@db.*.supabase.co* ]] && ! has_ipv6_route; then
      echo "That is the direct connection, which needs IPv6, and this server has no IPv6 route. Use the Session pooler string."
      continue
    fi
    break
  done
  [[ "$(ask "Load demo content from supabase/seed*.sql? [y/N] ")" =~ ^[Yy]$ ]] && seed_flag="--include-seed"

  url_file="$(mktemp)"
  printf '%s' "$db_url" >"$url_file"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$url_file"
  if ! as_deploy "cd '$REPO' && pnpm install --frozen-lockfile --prefer-offline --silent && pnpm exec supabase db push --yes $seed_flag --db-url \"\$(cat '$url_file')\""; then
    rm -f "$url_file"
    fail "migrations failed. The connection string must be percent-encoded; special characters in the password break it."
  fi
  rm -f "$url_file"
}

deploy() {
  log "deploying"
  as_deploy "bash '$REPO/scripts/deploy/deploy.sh'"
}

pm2_on_boot() {
  local node_bin
  node_bin="$(as_deploy 'dirname "$(command -v node)"')"
  log "enabling PM2 on boot for $DEPLOY_USER"
  env PATH="$PATH:$node_bin" "$node_bin/pm2" startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER" >/dev/null
  as_deploy 'pm2 save >/dev/null'
}

public_ip() {
  curl -4 -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true
}

points_here() {
  local ip="$2"
  [ -n "$ip" ] && getent ahostsv4 "$1" | awk '{print $1}' | grep -qx "$ip"
}

proxy_block() {
  cat <<'NGINX'
    location ^~ /.well-known/acme-challenge/ {
        root ACME_ROOT;
        default_type text/plain;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
NGINX
}

write_site_conf() {
  local names="$1" cert_name="$2"
  {
    echo "# Managed by scripts/deploy/provision.sh. Do not add this domain as an aaPanel site as well."
    echo "server {"
    echo "    listen 80;"
    echo "    server_name $names;"
    echo "    client_max_body_size 12m;"
    if [ -n "$cert_name" ]; then
      echo "    location ^~ /.well-known/acme-challenge/ { root ACME_ROOT; default_type text/plain; }"
      echo "    location / { return 301 https://\$host\$request_uri; }"
    else
      proxy_block
    fi
    echo "    access_log /www/wwwlogs/compro.log;"
    echo "    error_log /www/wwwlogs/compro.error.log;"
    echo "}"
    if [ -n "$cert_name" ]; then
      echo "server {"
      echo "    listen 443 ssl http2;"
      echo "    server_name $names;"
      echo "    ssl_certificate /etc/letsencrypt/live/$cert_name/fullchain.pem;"
      echo "    ssl_certificate_key /etc/letsencrypt/live/$cert_name/privkey.pem;"
      echo "    ssl_protocols TLSv1.2 TLSv1.3;"
      echo "    ssl_session_cache shared:compro_ssl:10m;"
      echo "    add_header Strict-Transport-Security \"max-age=31536000\" always;"
      echo "    client_max_body_size 12m;"
      proxy_block
      echo "    access_log /www/wwwlogs/compro.log;"
      echo "    error_log /www/wwwlogs/compro.error.log;"
      echo "}"
    fi
  } | sed "s#ACME_ROOT#$ACME_ROOT#g" >"$SITE_CONF.new"

  [ -f "$SITE_CONF" ] && cp "$SITE_CONF" "$SITE_CONF.bak"
  mv "$SITE_CONF.new" "$SITE_CONF"
  if ! "$NGINX_BIN" -t >/dev/null 2>&1; then
    "$NGINX_BIN" -t || true
    if [ -f "$SITE_CONF.bak" ]; then mv "$SITE_CONF.bak" "$SITE_CONF"; else rm -f "$SITE_CONF"; fi
    fail "nginx rejected the new config; previous config restored"
  fi
  "$NGINX_BIN" -s reload
  rm -f "$SITE_CONF.bak"
}

issue_certificate() {
  local names=("$@") args=() email
  install_packages certbot
  for name in "${names[@]}"; do args+=(-d "$name"); done
  email="$(ask "Email for Let's Encrypt expiry notices (Enter for none): ")"
  if [ -n "$email" ]; then args+=(-m "$email"); else args+=(--register-unsafely-without-email); fi
  certbot certonly --webroot -w "$ACME_ROOT" --cert-name "$DOMAIN" "${args[@]}" \
    --agree-tos --non-interactive --keep-until-expiring \
    --deploy-hook "$NGINX_BIN -s reload"
}

setup_nginx() {
  [ -x "$NGINX_BIN" ] || fail "Nginx not found at $NGINX_BIN. Install it from the aaPanel App Store."
  [ -d "$VHOST_DIR" ] || fail "$VHOST_DIR not found; set VHOST_DIR to aaPanel's nginx vhost directory"
  mkdir -p "$ACME_ROOT" /www/wwwlogs

  local ip names=("$DOMAIN")
  ip="$(public_ip)"
  points_here "www.$DOMAIN" "$ip" && names+=("www.$DOMAIN")

  log "Nginx site for ${names[*]} -> 127.0.0.1:3000"
  write_site_conf "${names[*]}" ""

  if ! points_here "$DOMAIN" "$ip"; then
    log "DNS for $DOMAIN does not point at this server (${ip:-unknown IP}) yet: serving HTTP only."
    log "after the A record is live, run: bash $REPO/scripts/deploy/provision.sh $DOMAIN nginx"
    return 0
  fi
  issue_certificate "${names[@]}"
  write_site_conf "${names[*]}" "$DOMAIN"
  log "HTTPS enabled; HTTP redirects to HTTPS"
}

verify() {
  local scheme=http
  grep -q 'listen 443' "$SITE_CONF" && scheme=https
  log "health via the app: $(curl -s --max-time 5 http://127.0.0.1:3000/api/health || echo unreachable)"
  log "health via Nginx:   $(curl -sk --max-time 5 --resolve "$DOMAIN:80:127.0.0.1" --resolve "$DOMAIN:443:127.0.0.1" -L "$scheme://$DOMAIN/api/health" || echo unreachable)"
}

if [ "$MODE" = full ]; then
  setup_root
  bootstrap
  configure_env
  run_migrations
  deploy
  pm2_on_boot
fi
setup_nginx
verify
log "done"
