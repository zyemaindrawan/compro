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
| M5 SEO audit, performance, deployment | Next |

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
```

## Deployment (Hostinger Node.js)

1. Create a Supabase project, run the migrations (`supabase link` then `supabase db push`), and enable TOTP MFA under Authentication → MFA.
2. Disable public sign-ups in Supabase Authentication settings.
3. Set the variables from `.env.example` in the Hostinger app settings. Use the production URL for `NUXT_SITE_URL`.
   - Turnstile: create a widget for the production domain in the Cloudflare dashboard and set `NUXT_PUBLIC_TURNSTILE_SITE_KEY` and `NUXT_TURNSTILE_SECRET_KEY`.
   - Brevo: create an SMTP key, verify the sender domain (SPF, DKIM, DMARC) and set `NUXT_SMTP_USER`, `NUXT_SMTP_PASS` and `NUXT_SMTP_FROM`.
   - `NUXT_IP_HASH_SALT`: a long random string. It hashes visitor IPs and signs the form timing token.
   - Forms return `503` in production until the Turnstile keys and the salt are set.
4. Build with `pnpm build` and start with `node .output/server/index.mjs`.
5. Create the first admin with `pnpm admin:create` from a machine that has the production keys.
