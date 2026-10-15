# Deployment: Hostinger Node.js Web App

This guide deploys the site to a Hostinger **Node.js Web App** (hPanel) with a hosted Supabase project.
Steps marked **check in hPanel** depend on screens I could not see while writing this. Follow the labels Hostinger shows if they differ.

## 1. Supabase (production project)

1. Create a project in the region closest to your visitors (Singapore for Indonesia).
2. Link and push the schema from your machine:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
   Do not run `seed.sql` against production unless you want the placeholder content. It is safe to run once on an empty project and then edit everything in the admin.
3. Authentication settings:
   - **Sign-ups**: disable "Allow new users to sign up".
   - **MFA**: enable TOTP (enroll and verify).
   - **URL configuration**: set the Site URL to your production URL.
4. Note the project URL, the **publishable** key and the **secret** key (Project Settings → API Keys).

## 2. Third-party services

| Service | What to do | Variables |
|---|---|---|
| Cloudflare Turnstile | Add a widget for the production domain, mode "Managed" | `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, `NUXT_TURNSTILE_SECRET_KEY` |
| Brevo | Create an SMTP key, verify the sender domain with SPF, DKIM and DMARC DNS records | `NUXT_SMTP_HOST=smtp-relay.brevo.com`, `NUXT_SMTP_PORT=587`, `NUXT_SMTP_USER`, `NUXT_SMTP_PASS`, `NUXT_SMTP_FROM` |
| Umami (optional) | Create a website and copy its ID | Set in the admin under **Settings → Analytics** |

## 3. Create the app in hPanel

- **Source**: connect the GitHub repository and the branch to deploy, or upload the project. *Check in hPanel.*
- **Node.js version**: 24 if offered, otherwise 22. The app needs Node 22 or newer.
- **Package manager**: pnpm. If hPanel only offers npm, set the install command to `corepack enable && pnpm install --frozen-lockfile`. *Check in hPanel.*
- **Build command**: `pnpm build`
- **Start command / entry file**: `node .output/server/index.mjs`. Hostinger provides `PORT`; the server reads it.

### Environment variables

Set these in the app's environment settings. `NUXT_SITE_URL` and `NUXT_SUPABASE_URL` are also read **during the build** (they end up in the Content Security Policy and image settings), and the build fails without them.

| Variable | Value |
|---|---|
| `NUXT_SITE_URL` | `https://your-domain.com` (no trailing slash) |
| `NUXT_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NUXT_SUPABASE_KEY` | Supabase publishable key |
| `NUXT_SUPABASE_SECRET_KEY` | Supabase secret key (server only) |
| `NUXT_SMTP_*` | See the Brevo row above |
| `NUXT_TURNSTILE_SECRET_KEY`, `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | See the Turnstile row above |
| `NUXT_IP_HASH_SALT` | A random string of at least 32 characters, e.g. `openssl rand -base64 48` |
| `NUXT_TRUST_PROXY` | Set in step 5 below |

Never set `NUXT_DB_QUERY_LOG` in production. It is for tests only: it exposes query counts and lets any request purge the public cache.

### If the build runs out of memory

1. First try adding `NODE_OPTIONS=--max-old-space-size=3072` to the environment and building again.
2. If it still fails, download the `.output` artifact from the GitHub Actions run for the commit.
   - The artifact was built with placeholder URLs, so it is only usable if you rebuild with the real URLs.
   - Alternatively, build locally with the production variables and upload `.output`.
3. Then set the start command to `node .output/server/index.mjs`.

## 4. First admin

From your machine, with the production keys in a local env file, run:
```bash
node --env-file=.env.production scripts/create-admin.mjs you@company.com "Your Name"
```
Then sign in at `/admin/login` with the printed temporary password. Scan the QR code, then change the password under **Account & security**.

## 5. Trusted proxy header (rate limits)

Rate limits and the stored IP hash need the visitor's real IP. Behind Hostinger's proxy the socket address belongs to the proxy, so until this is set every visitor shares one rate-limit bucket. The admin dashboard lists this item under **Launch checklist**.

1. Sign in as admin and open `https://your-domain.com/api/admin/diagnostics/request`.
2. Compare `socketAddress` with the headers. Open the same URL from a second network, for example phone data, and find the header that changes to your real public IP each time:
   - If `x-real-ip` holds your IP, set `NUXT_TRUST_PROXY=x-real-ip`.
   - If only `x-forwarded-for` does, set `NUXT_TRUST_PROXY=xff:1`. This reads the right-most entry, the one Hostinger's proxy appended; clients can forge the left-most entries.
   - If the site sits behind Cloudflare's proxy as well, use `NUXT_TRUST_PROXY=cf-connecting-ip`.
3. Restart the app and reload the diagnostics page: `resolvedIp` should show your IP.
4. Confirm the limit works. Sign in with a wrong password six times in a row and the seventh attempt returns "Too many attempts". Then confirm a different network can still sign in.

## 6. Go-live checks

- [ ] `GET /api/health` returns `{"status":"ok","database":true}`. Point uptime monitoring at it.
- [ ] Admin dashboard: **Launch checklist** is gone (default social image uploaded, SMTP, Turnstile, salt, trusted proxy).
- [ ] Contact form: submit a real message. It appears under **Submissions** and the email arrives (check spam folders the first time).
- [ ] Quote form from a pricing card: the picked plan shows, and the submission stores service and plan.
- [ ] SEO audit from your machine: `node scripts/seo-audit.mjs https://your-domain.com` reports no errors.
- [ ] Google Rich Results Test passes for an article URL and for the home page (FAQ).
- [ ] PageSpeed Insights (mobile) for `/`, `/articles`, one article and `/pricing`. Compare with PRD §14.1.
- [ ] Search Console: add the property and submit `https://your-domain.com/sitemap.xml`.

## Updating

Push to the deployed branch and redeploy from hPanel (or let auto-deploy run if enabled).
- New migrations go out with `npx supabase db push` **before** the new build starts.
- Public pages cache API data for up to an hour, and admin saves purge that cache. A restart also clears it.
