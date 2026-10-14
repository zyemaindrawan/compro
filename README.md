# Agency website + CMS

Company profile site and admin dashboard for a software agency. Nuxt 4, Supabase, Nuxt UI v4.

- Product spec: [`docs/PRD.md`](docs/PRD.md)
- Coding rules: [`CLAUDE.md`](CLAUDE.md)

## Status

| Milestone | State |
|---|---|
| M1 Foundation: auth with mandatory TOTP, rate limiting, settings, media pipeline, layouts, error page | Done |
| M2 Articles | Next |
| M3 Pages, services, pricing | Planned |
| M4 Portfolio, clients, testimonials, FAQ, forms | Planned |
| M5 SEO audit, performance, deployment | Planned |

Links in the public navigation point to pages that arrive in M2 to M4 and return 404 until then.

## Requirements

- Node 22 or newer, pnpm 10
- Docker (for the local Supabase stack)

## Local setup

```bash
pnpm install
pnpm db:start                 # prints the API URL and keys
cp .env.example .env          # fill NUXT_PUBLIC_SUPABASE_KEY (publishable) and NUXT_SUPABASE_SECRET_KEY
pnpm db:reset                 # migrations + seed
pnpm admin:create you@company.com "Your Name"
pnpm dev
```

Open `http://localhost:3000/admin`, sign in with the printed temporary password, scan the QR code with an authenticator app, then change the password under **Account & security**.

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
4. Build with `pnpm build` and start with `node .output/server/index.mjs`.
5. Create the first admin with `pnpm admin:create` from a machine that has the production keys.
