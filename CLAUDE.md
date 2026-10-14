# CLAUDE.md

Agency company profile website + admin CMS. Nuxt 4, Supabase, Nuxt UI v4, Tailwind v4.
The full spec lives in `docs/PRD.md`. Read the relevant section before building a feature.

## Commands
```bash
pnpm dev            # local dev server
pnpm lint           # eslint
pnpm typecheck      # vue-tsc
pnpm test           # vitest unit tests
pnpm test:e2e       # playwright
pnpm build          # production build (node-server preset)
supabase db reset   # apply migrations + seed locally
```
Run `pnpm lint && pnpm typecheck && pnpm test` before every commit.

## Architecture rules
Layered MVC. Dependencies flow one way:
`app/ → server/api → server/controllers → server/services → server/models → Supabase`

- `server/models/` is the only place that queries Supabase. One file per aggregate: `article.model.ts`.
- `server/services/` holds business logic. No `event`, no HTTP concerns.
- `server/controllers/` validates input with Zod, calls services/models, throws `createError`.
- `server/api/**` handlers are one line: call the controller.
- `app/` never queries Supabase for content. Use `useFetch`/`$fetch` against `/api/*`. The browser Supabase client is for auth only.
- `shared/` holds types, Zod schemas, formatters and constants. It imports nothing from `app/` or `server/`.
- Admin endpoints live under `server/api/admin/**` and are guarded by `server/middleware/admin-auth.ts` (requires `aal2`).

## Data access
- No N+1. Never `await` a model call inside `for`, `map`, `forEach` or `reduce`.
- Load relations with PostgREST embedding in one query. Aggregates come from SQL views or RPC in `supabase/migrations`.
- List endpoints select explicit columns and always paginate.
- Batch writes with array `upsert`.
- Every schema change is a new migration file. Never edit an applied migration.
- Every new table gets RLS enabled with policies in the same migration.

## Code style
- TypeScript strict. No `any`; use `unknown` and narrow.
- Clean, self-explanatory code. Do not add comments unless the reason is non-obvious.
- Files: kebab-case (`article.model.ts`). Components: PascalCase (`ArticleCard.vue`). Composables: `useX`.
- `<script setup lang="ts">` only. Props and emits typed with generics.
- Small functions, early returns, no nested ternaries.
- Reuse before creating: check `app/components/base` and `app/components/content` first. One card component per entity, reused everywhere it appears (`ArticleCard` serves archive, search, related and home).
- Block components live in `app/components/blocks/`, each with a Zod schema in `shared/schemas/blocks/`, registered in `registry.ts`.
- Icons: `<UIcon name="i-lucide-…">`. Brand/social icons: `i-simple-icons-…`. Do not install other icon packages.
- Styling: Tailwind utilities and Nuxt UI theme tokens in `app.config.ts`. No hard-coded hex colors in components.

## Content and formatting
- All copy, labels, slugs, validation messages and emails are in English.
- Dates and money go through `shared/utils/format.ts` only:
  - `formatDateTime` → `Wed, 14 Oct 2026 22:57`
  - `formatDate` → `Wed, 14 Oct 2026`
  - `formatCurrency` → `IDR 128,000`
- Timezone comes from site settings; never rely on the runtime default.
- Routes: archive `/articles`, single `/article/[slug]`, category `/articles/category/[slug]`.

## Anti-slop
Copy must be specific: what, for whom, which result. Do not use: unlock, unleash, elevate, empower, seamless, cutting-edge, next-level, revolutionize, game-changer, harness the power of, in today's fast-paced world, look no further, we've got you covered.
No rhetorical question openers, no triple-adjective stacks, no emoji as icons.

Visual: no purple/blue gradient blobs, no glassmorphism stacks, no sparkle icons, no repeated identical three-card rows. One neutral scale + one accent. Dark mode tuned, not inverted.

## Motion
- 150–300 ms, ease-out on enter.
- Cross-fade page transitions (View Transitions API).
- Reveal once per element, 8 px translate max. No parallax, no scale bounce.
- Respect `prefers-reduced-motion`.

## Images
- Uploads go through `server/services/media.service.ts` (sharp → WebP + 480/960/1440 variants).
- Render with `SmartImage` so `width`, `height` and `srcset` are always set. Alt text is required.

## Security
- Never expose `SUPABASE_SERVICE_KEY`, SMTP or Turnstile secrets to the client (`runtimeConfig` server keys only).
- Render HTML only after server-side sanitization. No `v-html` on raw input.
- Validate every request body, query and param with Zod in the controller.
- Public form submissions: verify Turnstile, check honeypot, rate limit.

## Errors
- Controllers throw `createError({ statusCode, message, data })`. Validation errors use `422` with `data.fields`.
- Map Supabase/Postgres errors through `server/utils/errors.ts`. Never leak raw DB messages.
- Admin UI surfaces errors with `useToastError`; forms show field-level errors.

## Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.
- One concern per commit.
- Never add `Co-Authored-By` or any other Anthropic/Claude attribution trailer or line to commit messages.
