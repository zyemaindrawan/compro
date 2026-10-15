# Agency website + CMS

Company profile site and admin dashboard for a software agency. Nuxt 4, Supabase, Nuxt UI v4.

- Product spec: [`docs/PRD.md`](docs/PRD.md)
- Coding rules: [`CLAUDE.md`](CLAUDE.md)

## Status

| Milestone | State |
|---|---|
| M1 Foundation: auth with mandatory TOTP, rate limiting, settings, media pipeline, layouts, error page | Done |
| M2 Articles: categories, TipTap editor, archive, search, related, RSS, sitemap, 301 redirects | Done |
| M3 Block builder, home, static pages, services, pricing | Done |
| M4 Portfolio, clients, testimonials, FAQ, form builder, submissions inbox, Turnstile, email notifications | Done |
| M5 Launch: trusted proxy IP, redirects admin, query budgets, SEO audit, E2E suite, performance, health check, deployment guide | Done in code; production deploy pending |

The seeded stats, prices, testimonials, FAQs and page copy are placeholders. Replace them under **Pages**, **Pricing**, **Testimonials** and **FAQs** before launch, and have the privacy policy reviewed. Portfolio items and client logos start empty because they need images.

## Requirements

- Node 22 or newer, pnpm 10
- Docker (for the local Supabase stack)

## Local setup

```bash
pnpm install
pnpm db:start                 # prints the API URL and keys
cp .env.example .env          # fill NUXT_SUPABASE_KEY (publishable) and NUXT_SUPABASE_SECRET_KEY
pnpm db:reset                 # migrations + seed
pnpm admin:create you@company.com "Your Name"
pnpm dev
```

Open `http://localhost:3000/admin`, sign in with the printed temporary password, scan the QR code with an authenticator app, then change the password under **Account & security**.

Forms work locally without extra keys: Turnstile falls back to Cloudflare's always-pass test keys and notification emails are written to the server log instead of being sent.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
node scripts/perf/initial-js.mjs     # fails if a public page ships more than 200 KB gzip of JS
```

### End-to-end tests

The Playwright suite runs against the production build with local Supabase, a Turnstile mock and query counting enabled. It recreates a test admin (`e2e-admin@example.test`) on every run.

```bash
pnpm db:start
pnpm build
pnpm test:e2e
```

Set `PW_CHROMIUM_PATH` when Playwright's bundled browser is not installed (for example `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`).

SEO audit of any running site: `node scripts/seo-audit.mjs http://localhost:3100`.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the Hostinger Node.js Web App setup, environment variables, the trusted proxy header and the go-live checklist.
