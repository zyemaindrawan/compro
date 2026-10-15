# Deployment: VPS with aaPanel

This guide runs the site on a VPS managed with aaPanel, with Nginx in front and PM2 running the Node server. It is an alternative to [`DEPLOYMENT.md`](DEPLOYMENT.md) (Hostinger). Sections 1, 2, 4 and 6 of that guide still apply: the Supabase project, third-party services, first admin and go-live checks.

Steps marked **check in aaPanel** depend on screens that vary between aaPanel versions. Follow the labels your panel shows.

## Layout on the server

Everything lives under one directory, `/www/wwwroot/compro` by default (`COMPRO_HOME`):

| Path | Purpose |
|---|---|
| `.env` | Production environment, mode 600. Read at build time and at runtime. |
| `repo/` | Git checkout of `main`, where builds run |
| `live/` | The build that is served (`live/server/index.mjs`) |
| `prev/` | The previous build, used for automatic rollback |

The app listens on `127.0.0.1:3000` only. Nginx is the public entry point.

## Requirements

- Linux VPS with aaPanel, Nginx installed from the aaPanel App Store, and `git`.
- **Memory**: about 3 GB is free during the build. With less than 4 GB of RAM, add swap first (step 1). Without it, the build can be killed halfway; the running site is not affected when that happens.
- **DNS**: the domain's A record points at the VPS.

## Quick setup with `provision.sh`

`scripts/deploy/provision.sh` runs steps 1–6 below in one go as root: deploy user, swap, bootstrap, `.env`, migrations, first deploy, PM2 on boot, and an Nginx site that proxies to the app. When the domain already points at the server, it also issues a Let's Encrypt certificate with certbot and redirects HTTP to HTTPS.

```bash
curl -fsSL https://raw.githubusercontent.com/zyemaindrawan/compro/main/scripts/deploy/provision.sh -o /root/provision.sh
bash /root/provision.sh your-domain.com
```

- **Prompts**: it asks for the Supabase URL and keys and for the Postgres connection string (Session pooler, percent-encoded). Input for secrets is hidden. The connection string is used for the migration only and is not stored.
- **Re-running**: the script is safe to run again. Values already in `.env` are kept, and pressing Enter at the connection-string prompt skips migrations.
- **SSL later**: if DNS is not pointing at the server yet, the site is served over HTTP only. Once the A record is live, run `bash /www/wwwroot/compro/repo/scripts/deploy/provision.sh your-domain.com nginx`.
- **Nginx file**: the site is written to `/www/server/panel/vhost/nginx/compro.conf`, outside aaPanel's site list. Do not also add the domain under **Website → Add site**.

The manual steps follow.

## 1. Root steps (once)

Run these as root, either in the aaPanel terminal or over SSH:

```bash
# Dedicated user without sudo; deploys run as this user
useradd -m -s /bin/bash deploy
mkdir -p /www/wwwroot/compro && chown deploy:deploy /www/wwwroot/compro

# SSH key login for deploy (paste the public key, one line)
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys

# Swap, only if RAM is under 4 GB and `free -h` shows no swap
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Use a key pair made only for this server. Do not reuse your personal key, and never share a private key in chat or commit it.

## 2. Bootstrap as `deploy`

```bash
su - deploy        # or: ssh deploy@your-server
git clone https://github.com/zyemaindrawan/compro.git /www/wwwroot/compro/repo
bash /www/wwwroot/compro/repo/scripts/deploy/bootstrap.sh
```

`bootstrap.sh` can be run again safely. It does the following:
- Installs nvm, Node 22, pnpm and PM2 for the `deploy` user. It does not touch aaPanel's own Node installs.
- Clones the repo if it is missing.
- Creates `.env` from `.env.example`.
- Prints a `pm2 startup` command. Run that command as root once, so the app starts again after a reboot.

## 3. Environment

Edit `/www/wwwroot/compro/.env` and set every variable from the table in [`DEPLOYMENT.md` → Environment variables](DEPLOYMENT.md#environment-variables).

For aaPanel, set this as well:

```bash
NUXT_TRUST_PROXY=x-real-ip
```

aaPanel's reverse proxy sends the visitor IP in `X-Real-IP`. Confirm it with the diagnostics endpoint (step 7) after the first deploy.
- If the site is also behind Cloudflare's proxy (orange cloud), use `cf-connecting-ip` instead.

## 4. Site and reverse proxy in aaPanel

1. **Website → Add site**:
   - **Domain**: your domain, plus `www` if you want it.
   - **PHP**: "Static" or "Pure static". *Check in aaPanel.*
   - **Database**: none.
2. **Site settings → SSL**:
   - Issue a Let's Encrypt certificate for the domain.
   - Enable **Force HTTPS**.
3. **Site settings → Reverse proxy → Add**:
   - **Target URL**: `http://127.0.0.1:3000`.
   - **Sent domain**: `$host`.
   - **Cache**: off. The app caches public data itself, and public HTML must not be cached, because it carries the session state.
4. Open the proxy's configuration file and check that it sends these headers. Add any that are missing:
   ```nginx
   proxy_set_header Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```
5. **Site settings → Config file**: media uploads go up to 10 MB, so the site's `server` block needs a larger body limit than the default:
   ```nginx
   client_max_body_size 12m;
   ```

## 5. Database migrations

Run migrations from the VPS. Use the connection string from Supabase: **Project Settings → Database → Connection string**, the session pooler variant, with your database password filled in.

```bash
cd /www/wwwroot/compro/repo
pnpm exec supabase db push --db-url "postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres"
```

Type the password on the server only, never in chat. Run this before the first deploy, and again whenever a release adds files under `supabase/migrations`.

## 6. Deploy

```bash
bash /www/wwwroot/compro/repo/scripts/deploy/deploy.sh
```

What `deploy.sh` does:
1. Fetches `main` and resets the checkout to it.
2. Installs dependencies with the frozen lockfile.
3. Builds with `NODE_OPTIONS=--max-old-space-size=3072`, which can be overridden.
4. Swaps `live/` and `prev/` only when the build succeeds.
5. Starts or reloads PM2.
6. Waits up to 30 s for `/api/health`.

How it judges the new release:
- **200**: deploy succeeded.
- **503**: the app is up but the database is unreachable. This is reported as a warning and the release stays live, because it is not a code fault.
- **Anything else**: the script prints the last 40 log lines and rolls back to `prev/`.
- A failed build never touches the running site.

Two deploys cannot run at the same time; a lock file stops the second one.

Useful commands as `deploy`:

```bash
pm2 status                 # process state
pm2 logs compro            # live logs
cat /www/wwwroot/compro/live/REVISION   # commit that is live
```

## 7. After the first deploy

1. Open `https://your-domain.com/api/health`. It should return `{"status":"ok","database":true}`.
2. Create the first admin (DEPLOYMENT.md §4) and sign in.
3. Open `/api/admin/diagnostics/request`. `resolvedIp` must show your own public IP, not `127.0.0.1`.
   - If it does not, the `X-Real-IP` header is missing from the proxy (step 4.4), or `NUXT_TRUST_PROXY` is wrong.
4. Run the go-live checks in DEPLOYMENT.md §6.

## Updating

Push to `main`, then run `deploy.sh` again, either over SSH or from the aaPanel terminal as `deploy`.

To deploy automatically on every push, add a webhook with aaPanel's **Webhook** app. *Check in aaPanel.* Set its script to:

```bash
su - deploy -c 'bash /www/wwwroot/compro/repo/scripts/deploy/deploy.sh' >> /www/wwwroot/compro/deploy.log 2>&1
```

Then add the webhook URL to the GitHub repository under **Settings → Webhooks**, for push events only.
