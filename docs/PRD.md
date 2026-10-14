# Product Requirements Document — Agency Company Profile

| Field | Value |
|---|---|
| Product | Company profile website + admin CMS for a software agency |
| Services offered | Web Development, Custom Applications, Android Development, Cloud Solutions |
| Market | Global (all public and admin copy, slugs and labels in English) |
| Stack | Nuxt 4 · Supabase (Postgres, Auth, Storage) · Nuxt UI v4 · Tailwind CSS v4 |
| Hosting | Hostinger Node.js hosting (Nitro `node-server` preset) |
| Status | Approved for implementation |
| Last updated | Thu, 15 Oct 2026 |

---

## 1. Overview

### 1.1 Problem
The agency needs a fast, credible website that converts global visitors into leads, plus a CMS that a single administrator can run from a phone or a laptop without touching code.

### 1.2 Goals
1. Convert visitors into qualified leads through Contact and Quotation forms and a WhatsApp shortcut.
2. Rank for service and topic keywords through structured content, articles and complete technical SEO.
3. Let one admin manage every piece of content, including page layout, without a developer.
4. Stay light: near-instant navigation and strong Core Web Vitals on mid-range mobile devices.

### 1.3 Success metrics
| Metric | Target |
|---|---|
| Lighthouse (mobile) Performance / SEO / Accessibility / Best Practices | ≥ 95 each on Home, Article, Pricing |
| LCP (p75, mobile) | < 2.0 s |
| CLS | < 0.05 |
| INP | < 200 ms |
| Initial JS on public pages | < 120 KB gzip |
| Client-side route change | < 150 ms perceived (prefetched) |
| Contact form spam reaching inbox | < 1 % of submissions |

### 1.4 Out of scope (v1)
- Multi-language content
- Multiple authors or editorial roles beyond a single admin
- Article comments
- Online payments or checkout
- Client portal / project tracking

---

## 2. Global conventions

### 2.1 Language
English only for content, UI labels, slugs, validation messages, emails and error pages.

### 2.2 Formatting
All formatting goes through shared formatters. Components never call `toLocaleString` directly.

| Formatter | Input | Output |
|---|---|---|
| `formatDateTime` | ISO timestamp | `Wed, 14 Oct 2026 22:57` |
| `formatDate` | ISO timestamp | `Wed, 14 Oct 2026` |
| `formatCurrency` | `128000` | `IDR 128,000` |
| `formatNumber` | `12500` | `12,500` |

- Built with `Intl.DateTimeFormat('en-GB', …).formatToParts()` and assembled explicitly, so output does not drift between Node and browser ICU versions.
- Timezone comes from `site_settings.timezone` (default `Asia/Jakarta`). The same value is used on server and client to prevent hydration mismatches.
- Currency: `Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })` prefixed with `IDR ` (regular space). No decimals.
- `<time datetime="…">` always carries the ISO value for SEO and accessibility.

### 2.3 URL and slug rules
- Lowercase, kebab-case, ASCII, English, max 80 chars.
- Auto-generated from the title, editable, unique per entity type.
- Changing a published slug creates a `301` entry in `redirects`.
- Article archive is plural (`/articles`), single article is singular (`/article/[slug]`).

---

## 3. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Nuxt 4 (Vue 3, Vite, Nitro) | Hybrid rendering via `routeRules` |
| UI kit | Nuxt UI v4 | Tailwind v4, accessible primitives, dashboard components, built-in color mode |
| Icons | `@nuxt/icon` + Iconify | 200k+ icons; Lucide as the primary set, Simple Icons for brand/social logos. Only used icons are bundled |
| Database | Supabase Postgres | RLS enabled on every table |
| Auth | Supabase Auth | Email + password, MFA TOTP, AAL2 enforcement |
| Storage | Supabase Storage | Public bucket `media`, private bucket `uploads-private` |
| Supabase client | `@supabase/ssr` + `@supabase/supabase-js`, server only | The browser never loads a Supabase client; session cookies are httpOnly |
| Validation | Zod | Shared between client forms and server controllers |
| Rich text | TipTap 3 via Nuxt UI `UEditor` | Stores JSON + HTML sanitized on the server with `sanitize-html` |
| Image processing | sharp | Server-side WebP conversion |
| Images on page | `@nuxt/image` | `srcset`, lazy loading, explicit dimensions |
| SEO | `@nuxtjs/seo` | Sitemap, robots, Schema.org, OG image, link checker |
| Security | `nuxt-security` | Headers, CSP, rate limiter, request size limits, XSS validator |
| Fonts | `@fontsource-variable/geist`, `@fontsource-variable/bricolage-grotesque` | Self-hosted variable fonts imported in CSS, no third-party font requests |
| Utilities | VueUse | |
| Mail | nodemailer over Brevo SMTP | Admin notifications |
| Anti-spam | Cloudflare Turnstile | Server-side token verification |
| Analytics | Umami | Script loaded only when `umami_website_id` is set |
| Quality | ESLint (`@nuxt/eslint`), `vue-tsc`, Vitest, Playwright | |

---

## 4. Architecture

### 4.1 MVC mapping
The project follows a layered MVC structure adapted to Nuxt 4. Dependencies point one way only.

```
View (app/)  →  API route  →  Controller  →  Service  →  Model  →  Supabase
                      ↘ shared/ (types, schemas, formatters) used by every layer ↙
```

| Layer | Location | Responsibility | Must not |
|---|---|---|---|
| Model | `server/models/` | Every Supabase query. Returns typed data. One file per aggregate (`article.model.ts`) | Contain business rules or know about HTTP |
| Service | `server/services/` | Business logic: slug generation, image pipeline, mail, cache purge, Turnstile, sanitization | Read `event`, touch request/response |
| Controller | `server/controllers/` | Parse + validate input (Zod), call services/models, shape the response, throw `createError` | Query the DB directly |
| Route | `server/api/**` | One-line handler that calls the controller | Hold logic |
| View | `app/pages`, `app/components`, `app/layouts` | Rendering and interaction | Call Supabase for content data |
| Shared | `shared/` | Types, Zod schemas, formatters, constants | Import from `app/` or `server/` |

### 4.2 Directory layout
```
.
├── app/
│   ├── assets/css/main.css
│   ├── components/
│   │   ├── base/          AppLogo, ThemeToggle, AppPagination, EmptyState, SectionHeader, SmartImage
│   │   ├── content/       ArticleCard, ArticleGrid, PortfolioCard, PricingTable, LogoMarquee, TestimonialCard, FaqList
│   │   ├── blocks/        BlockHero, BlockRichText, BlockFaq, … + registry.ts
│   │   ├── forms/         DynamicForm, DynamicField
│   │   ├── layout/        SiteHeader, SiteFooter, MobileNav, WhatsAppButton
│   │   └── admin/         AdminSidebar, DataTable, MediaPicker, SeoFieldset, SlugInput, RichEditor, BlockEditor
│   ├── composables/       useSiteSettings, useSeo, useArticles, useAdminApi, useToastError
│   ├── layouts/           default.vue, admin.vue, auth.vue
│   ├── middleware/        admin.ts (route guard, client side)
│   ├── pages/
│   ├── plugins/
│   ├── app.config.ts
│   └── error.vue
├── server/
│   ├── api/
│   │   ├── public/        read-only endpoints for the site
│   │   └── admin/         authenticated CRUD endpoints
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── middleware/        admin-auth.ts (AAL2 check for /api/admin/**)
│   ├── routes/            rss.xml.ts
│   └── utils/             supabase.ts, errors.ts, require-admin.ts, pagination.ts
├── shared/
│   ├── types/
│   ├── schemas/           article.schema.ts, settings.schema.ts, blocks/*.schema.ts …
│   ├── utils/             format.ts, slug.ts
│   └── constants.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/                 unit/, e2e/
├── docs/PRD.md
└── nuxt.config.ts
```

### 4.3 Request flow example
`GET /article/build-a-pwa`:
1. Page calls `useFetch('/api/public/articles/build-a-pwa')`.
2. Route → `articleController.showPublic(event)`.
3. Controller validates the slug, calls `articleModel.findPublishedBySlug(slug)`.
4. Model runs **one** query with embedded relations (categories, OG media).
5. Controller also calls `articleModel.findRelated(id, categoryIds, 3)` (single RPC).
6. Response cached by Nitro SWR; page renders `ArticleBody` + `ArticleGrid`.

### 4.4 Data access rules (N+1 free)
- One query per page section. Relations are loaded through PostgREST embedding:
  `select('id, title, slug, excerpt, published_at, cover:media(*), categories(id, name, slug)')`.
- Aggregates (article count per category, related articles, dashboard stats) come from SQL views or RPC functions, never from loops.
- Lists always paginate (`range`) and select explicit columns, never `*` on list endpoints.
- Batch writes (`upsert` arrays) for ordering, plan features, form fields and page blocks.
- Code review rule: no `await` of a model call inside `for`, `map` or `forEach`.

### 4.5 Rendering and caching
| Route | Mode |
|---|---|
| Public pages | SSR on every request, data from cached public APIs |
| `/api/public/**` | `defineCachedEventHandler` in the `public` cache group (layout 1 h, articles 10 min), read with an anonymous Supabase client |
| `/rss.xml`, `/sitemap.xml` | Cached 1 h |
| `/admin/**` | Client-only (`ssr: false`), `noindex`, with an SPA loading screen |

Full-page HTML caching (route-level SWR) is intentionally not used: the SSR payload carries the visitor's auth state, so a cached page rendered for a signed-in admin could leak to anonymous visitors. Caching the data layer instead keeps pages fast without that risk. Every admin write that changes public content calls `cacheService.purgePublic()`.

---

## 5. Data model

All tables: `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz` (trigger). Content tables add `updated_by uuid references auth.users`.

### 5.1 Tables
| Table | Key columns |
|---|---|
| `admin_profiles` | `user_id` (pk, fk auth.users), `display_name`, `avatar_media_id`, `bio` |
| `site_settings` | single row: `site_name`, `title_template`, `tagline`, `logo_light_media_id`, `logo_dark_media_id`, `favicon_media_id`, `default_og_media_id`, `phone`, `whatsapp_number`, `whatsapp_message`, `email`, `address`, `map_url`, `work_hours jsonb`, `timezone`, `umami_website_id`, `umami_script_url`, `marquee jsonb` (autoplay, speed, pause_on_hover) |
| `social_links` | `platform`, `label`, `url`, `icon` (Iconify name), `position`, `is_active` |
| `media` | `path`, `bucket`, `alt`, `width`, `height`, `size_bytes`, `mime`, `variants jsonb` (480/960/1440 paths), `blurhash` |
| `categories` | `name`, `slug` unique, `description`, SEO fields |
| `articles` | `title`, `slug` unique, `excerpt`, `content_json jsonb`, `content_html text`, `cover_media_id`, `status` (`draft`/`published`), `published_at`, `reading_minutes`, SEO fields |
| `article_categories` | `article_id`, `category_id` (composite pk) |
| `services` | `name`, `slug`, `summary`, `icon`, `page_id` (detail page built with blocks), `position`, `is_active` |
| `pricing_plans` | `service_id`, `name`, `price`, `price_suffix` (e.g. `/ project`), `description`, `cta_label`, `cta_form_id`, `is_popular`, `position` |
| `pricing_features` | `service_id`, `label`, `group_label`, `position` |
| `pricing_plan_features` | `plan_id`, `feature_id`, `value_type` (`check`/`cross`/`text`), `value_text` |
| `portfolio_items` | `title`, `thumbnail_media_id`, `external_url`, `service_id`, `position`, `is_active` |
| `client_logos` | `name`, `logo_media_id`, `url` (optional), `position`, `is_active` |
| `testimonials` | `author_name`, `author_role`, `company`, `avatar_media_id`, `quote`, `rating`, `position`, `is_active` |
| `faqs` | `question`, `answer`, `group_label`, `position`, `is_active` |
| `pages` | `title`, `slug` unique, `kind` (`home`/`service`/`static`), `status`, SEO fields |
| `page_blocks` | `page_id`, `type`, `props jsonb`, `position`, `is_visible` |
| `forms` | `key` unique (`contact`, `quotation`), `name`, `submit_label`, `success_message`, `notify_emails text[]` |
| `form_fields` | `form_id`, `name`, `label`, `type`, `placeholder`, `options jsonb`, `required`, `validation jsonb`, `width` (`full`/`half`), `position` |
| `submissions` | `form_id`, `data jsonb`, `email`, `name`, `status` (`new`/`contacted`/`won`/`lost`/`spam`), `note`, `ip_hash`, `user_agent`, `source_path` |
| `redirects` | `from_path` unique, `to_path`, `status_code` |

**SEO fields** (shared column set): `meta_title`, `meta_description`, `meta_keywords text[]`, `canonical_url`, `og_media_id`, `noindex boolean`.

### 5.2 Indexes
- Unique on every `slug`, `forms.key`, `redirects.from_path`.
- `articles (status, published_at desc)`.
- `article_categories (category_id, article_id)`.
- `page_blocks (page_id, position)`, `form_fields (form_id, position)`.
- `submissions (status, created_at desc)`.
- Full-text: generated `tsvector` column on `articles` (title A, excerpt B, content_html C) with GIN index for search.

### 5.3 Views and functions
- `v_category_counts` — published article count per category.
- `fn_related_articles(article_id, limit)` — shares most categories, newest first.
- `fn_search_articles(query, limit, offset)` — `websearch_to_tsquery` ranked results with total count.
- `v_dashboard_stats` — counts for articles, submissions by status, last 30 days.
- `fn_is_admin()` — `exists (select 1 from admin_profiles where user_id = auth.uid()) and auth.jwt()->>'aal' = 'aal2'`.

### 5.4 Row Level Security
| Table group | Public (`anon`) | Admin |
|---|---|---|
| Content (articles, pages, categories, …) | `select` where published / active | All, via `fn_is_admin()` |
| `site_settings`, `social_links`, `media` | `select` | All, via `fn_is_admin()` |
| `submissions` | none (insert goes through server with service role after Turnstile) | All, via `fn_is_admin()` |
| `admin_profiles` | none | Own row |

The service-role key is used only inside `server/` for operations that must bypass RLS (submission insert, cache-safe public reads if needed). It is never exposed to the client.

---

## 6. Public website

### 6.1 Routes
| Route | Content |
|---|---|
| `/` | Home page built from blocks |
| `/services` | Service index (cards for the four services) |
| `/services/[slug]` | Service detail page built from blocks |
| `/pricing` | Pricing tabs per service with comparison table |
| `/portfolio` | Portfolio grid with service filter chips (`?service=web-development`) |
| `/articles` | Article archive, paginated (`?page=2`), search (`?q=…`) |
| `/articles/category/[slug]` | Category archive |
| `/article/[slug]` | Single article |
| `/contact` | Contact info + `contact` form + map link |
| `/quote` | `quotation` form |
| `/[...slug]` | Static pages (About, Privacy Policy, Terms…) |
| `/rss.xml` | Articles RSS 2.0 feed (latest 20) |
| `/sitemap.xml`, `/robots.txt` | Generated |

### 6.2 Global layout
- **Header**: logo (light/dark variant), primary nav, theme toggle, "Get a quote" button. Sticky with a subtle border once scrolled. Mobile: slide-over menu.
- **Footer**: tagline, services links, company links, contact details, work hours, dynamic social icons, copyright year.
- **WhatsApp button**: floating, bottom-right, opens `https://wa.me/{number}?text={encoded default message}`. Hidden when no number is set.
- **Theme**: system preference by default; toggle persists choice. No flash of wrong theme (class set before paint).

### 6.3 Home page (default block order, editable)
1. Hero — headline, sub-headline, two CTAs, optional visual.
2. Client logos marquee.
3. Services grid (4 services).
4. Stats (projects shipped, years, retention…).
5. Portfolio highlights (latest 6).
6. Testimonials.
7. Latest articles (3, `ArticleCard`).
8. FAQ.
9. CTA band → `/quote`.

### 6.4 Articles
- Archive grid uses `ArticleGrid` → `ArticleCard` (cover, category chips, title, excerpt, `formatDate`, reading time).
- Search uses Postgres full-text; empty query shows the archive; no results shows `EmptyState` with category suggestions.
- Single article: title, categories, date, reading time, cover, body (sanitized HTML, styled with a prose class), share links, author box (single admin), "Read more" with 3 related articles via `ArticleGrid`.
- Category archive shows category description and its own SEO fields.

### 6.5 Portfolio
Card: WebP thumbnail, title, service label, external-link icon. Clicking opens `external_url` in a new tab with `rel="noopener noreferrer"`. Filter chips per service, URL-synced, no page reload.

### 6.6 Pricing
- Tabs: Web Development · Custom Applications · Android Development · Cloud Solutions (from `services`).
- Each tab: 3–4 plan cards (name, `IDR 12,500,000`, suffix, description, CTA). One plan can be flagged **Popular**.
- Comparison table below the cards: rows = features (optionally grouped), columns = plans, cells = check / cross / short text.
- Mobile: cards stack; the table becomes a plan selector + single-column feature list (no horizontal scroll trap).
- CTA links to `/quote?plan={plan-slug}` which pre-fills the quotation form.

### 6.7 Client logos marquee
- Image-only logos, grayscale with color on hover (respecting dark mode via `filter`).
- CSS-only infinite loop (duplicated track, `@keyframes translateX`), speed and autoplay from settings, pause on hover/focus.
- `prefers-reduced-motion`: static wrapping grid instead of animation.

### 6.8 Forms
- `DynamicForm` renders any form from its `form_fields` definition.
- Supported field types: `text`, `email`, `tel`, `url`, `textarea`, `select`, `radio`, `checkbox`, `checkbox_group`, `number`, `budget_range`, `date`.
- Validation: Zod schema generated from field definitions, same generator on client and server.
- Spam protection: Turnstile widget (managed mode), hidden honeypot field, minimum fill time (3 s), rate limit 3 submissions / minute / IP.
- On success: inline success state with the form's `success_message`; admin notification email sent via Brevo SMTP to `notify_emails` (fallback: settings email). Email failure does not lose the submission.

---

## 7. Admin panel

### 7.1 General
- Route prefix `/admin`, layout `admin.vue`, client-rendered, `noindex`.
- Mobile-first: sidebar collapses into a drawer below `lg`; data tables switch to stacked cards below `md`; primary actions sit in a sticky bottom bar on mobile.
- Every list: search, filter by status, sort, pagination, bulk delete with confirmation.
- Every form: unsaved-changes guard, `Ctrl/Cmd+S` to save, field-level errors, toast on success/failure.
- Timestamps shown with `formatDateTime`.

### 7.2 Modules
| Module | Capabilities |
|---|---|
| Dashboard | Stats (published articles, new submissions, submissions last 30 days), latest 5 submissions, quick links |
| Articles | CRUD, TipTap editor, cover picker, multi-category select, slug input, SEO fieldset, draft/published, preview |
| Categories | CRUD, slug, description, SEO fieldset, article count |
| Pages | CRUD for `home`, `service`, `static` pages; block editor (add, reorder by drag, duplicate, hide, delete); SEO fieldset; live preview |
| Services | CRUD, icon picker (Iconify search), link to detail page, ordering |
| Pricing | Per service: plans CRUD, features CRUD, feature matrix editor (grid of cells), popular flag, ordering |
| Portfolio | CRUD, thumbnail, external URL, service, ordering |
| Client Logos | Upload, name, optional URL, drag ordering, active toggle; marquee settings (autoplay, speed, pause on hover) |
| Testimonials | CRUD, avatar, rating, ordering |
| FAQs | CRUD, group, ordering |
| Forms | Edit form meta and fields (type, label, placeholder, options, required, width, ordering) |
| Submissions | Inbox with status filter, detail drawer, status change, internal note, CSV export, mark as spam |
| Media | Grid library, upload (multi), alt text edit, usage-safe delete, copy URL |
| Settings | Identity (site name, title template, tagline, logos, favicon, default OG image), Contact (phone, WhatsApp, default WhatsApp message, email, address, map URL, work hours per day), Social links (dynamic list: platform, URL, icon, order, active), Analytics (Umami ID + script URL), Localization (timezone) |
| Account | Display name, avatar, bio, change password (requires the current password), move 2FA to a new device (verify the new factor before the old one is removed), sign out other sessions |
| Redirects | List and edit 301 entries (auto-created on slug change) |

### 7.3 Block builder
Each block type = one Vue component + one Zod props schema + one admin editor form, wired in a single registry.

| Type | Props (summary) |
|---|---|
| `hero` | eyebrow, heading, subheading, primary/secondary CTA, media, alignment |
| `rich_text` | TipTap content |
| `image_text` | media, heading, body, CTA, image side |
| `services_grid` | heading, intro, service ids (or all) |
| `pricing_table` | service id or all (tabbed) |
| `portfolio_grid` | heading, limit, service filter, show filter chips |
| `latest_articles` | heading, limit, category id |
| `client_logos` | heading, use marquee |
| `testimonials` | heading, ids or limit |
| `faq` | heading, group or ids (emits FAQPage JSON-LD) |
| `stats` | items: value, label |
| `cta` | heading, body, button label, link |
| `form` | form key, heading, intro |

Rules:
- Blocks below the fold are lazy-hydrated.
- Data for all data-driven blocks on a page is fetched in **one** server call that groups ids by type (no per-block queries).
- Unknown or invalid block props fail validation on save; at render time they are skipped and logged, never crash the page.

---

## 8. Content editor (TipTap)
- Extensions: headings (H2–H4), bold, italic, link, lists, blockquote, code block (with language), horizontal rule, image (from media library), table, YouTube embed.
- Pasted images are uploaded through the media pipeline and converted to WebP.
- Server stores `content_json` (source of truth) and `content_html` (sanitized via an allowlist: tags, attributes, `https` links only, iframe only from youtube-nocookie.com).
- Reading time computed on save (220 wpm).
- External links get `rel="noopener noreferrer"` and `target="_blank"`.

---

## 9. Media pipeline
1. Admin uploads (max 10 MB, `image/jpeg|png|webp|avif|gif|svg+xml`).
2. Server validates MIME by magic bytes, not by extension.
3. Raster images → sharp: auto-rotate, strip metadata, resize to max 2400 px, encode WebP (quality 80), plus variants at 480/960/1440 px. Animated GIF → animated WebP.
4. SVG (logos only) is sanitized and stored as-is.
5. Upload to Supabase Storage `media/{yyyy}/{mm}/{uuid}.webp`, insert `media` row with width, height, size, blurhash.
6. Frontend `SmartImage` renders `srcset` from variants with explicit `width`/`height` to avoid CLS.
7. Deleting media referenced by content is blocked with a list of where it is used.

Hostinger note: sharp ships prebuilt Linux x64 binaries; install with `--os=linux --cpu=x64` during build if building on a different OS.

---

## 10. SEO

### 10.1 Per-page metadata
Every article, category, page and service supports: meta title, meta description, keywords, canonical URL, OG image, noindex. Fallback chain: entity field → derived (title, excerpt, cover) → site settings.

### 10.2 Technical
- `useSeoMeta` for title, description, Open Graph, Twitter card; title template from settings (`%s · Site Name`).
- Canonical URL on every page; pagination pages canonical to themselves; query-filtered portfolio canonical to `/portfolio`.
- Dynamic `sitemap.xml` from DB (published only, `lastmod` = `updated_at`), excludes `noindex`.
- `robots.txt` disallows `/admin` and `/api`.
- OG image: uploaded image or generated template (`nuxt-og-image`) with title + site name.
- JSON-LD: `Organization` + `WebSite` (with `SearchAction`) site-wide, `Article`, `BreadcrumbList`, `Service`, `FAQPage`, `ItemList` for archives.
- Semantic HTML: single `h1`, ordered heading levels, `<article>`, `<nav>`, `<time>`.
- 301 redirects from `redirects` table applied in server middleware before routing.
- RSS link tag in `<head>`.
- Image `alt` required at upload.

### 10.3 Content guidance (shown as hints in admin)
- Meta title ≤ 60 chars, description 120–160 chars, with live counters.
- Slug ≤ 80 chars.
- Warning when an article has no category, no cover or no meta description.

---

## 11. Security
| Area | Requirement |
|---|---|
| Authentication | Supabase Auth email + password, called from server routes (`/api/auth/*`) so rate limits apply. Public sign-up is disabled; admins are created with `pnpm admin:create`, which also creates the `admin_profiles` row |
| 2FA | TOTP MFA mandatory. First login forces enrollment (QR + manual secret). Admin APIs and RLS require `aal2` |
| Session | Supabase session cookies set by the server only: httpOnly, SameSite=Lax, Secure in production, 12 h lifetime. Changing the password signs out other sessions |
| Rate limiting | `nuxt-security` rateLimiter: login and MFA 5 req/min/IP, form submit 3 req/min/IP, admin API 60 req/min/IP, uploads 30 req/min/IP, public API 120 req/min/IP. Supabase Auth's own limits stay enabled. The default store is in-memory, which fits a single Hostinger Node process |
| Headers | CSP (nonce-based), HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, frame-ancestors `none` |
| Input | Zod validation on every controller; request body size limit 1 MB (uploads 10 MB) |
| Output | Sanitized HTML only; no `v-html` on unsanitized data |
| Secrets | Service-role key, SMTP and Turnstile secrets in server runtime config only |
| Privacy | Submission IP stored as salted SHA-256 hash |
| Audit | `updated_by` + `updated_at` on content tables |

---

## 12. Design direction

### 12.1 Principles
- Typography leads. Large, confident headings with a tight scale; generous whitespace; strong grid.
- Restrained palette: one neutral scale + one accent. Accent used for actions and focus, not decoration.
- Real material: actual project screenshots, real client logos, specific numbers. No stock 3D illustrations.
- Depth through borders, subtle layering and contrast, not heavy shadows.
- Dark mode designed, not inverted: tuned surfaces, reduced image brightness, adjusted accent.

### 12.2 Anti-slop rules (visual)
- No purple-to-blue gradient blobs, no floating orbs, no glassmorphism stacks.
- No emoji as icons or bullets.
- No "sparkle" AI iconography.
- No identical three-card rows repeated down the page; vary section layout.
- No fake dashboards or lorem ipsum in screenshots.

### 12.3 Anti-slop rules (copy)
- Say what the agency does, for whom, with what result. Prefer concrete nouns and numbers.
- Banned phrases: "unlock", "unleash", "elevate", "empower", "seamless", "cutting-edge", "next-level", "revolutionize", "game-changer", "in today's fast-paced world", "look no further", "we've got you covered", "take your business to the next level", "harness the power of".
- No rhetorical question openers, no triple-adjective stacks, no em-dash chains.
- Headlines ≤ 10 words; body sentences ≤ 25 words on marketing pages.

### 12.4 Motion
- Durations 150–300 ms, `ease-out` for enter, `ease-in` for exit.
- Page transitions via the View Transitions API (`experimental.viewTransition`), cross-fade only.
- Scroll reveal: fade + 8 px translate, once per element, only for section headings and cards.
- Hover: color/border/translate-y 2 px. No scale bounces, no parallax, no cursor effects.
- `prefers-reduced-motion: reduce` disables all non-essential motion.

### 12.5 Accessibility
- WCAG 2.2 AA contrast in both themes.
- Full keyboard navigation, visible focus rings, skip link.
- Forms: labels always visible, errors announced via `aria-live`.

---

## 13. Error handling
| Situation | Behaviour |
|---|---|
| 404 | `error.vue` with site layout, short message, search box, links to Home/Articles/Contact |
| 500 / 503 | Calm message, retry button, contact email; no stack traces in production |
| API validation error | `422` with `{ message, fields: { name: message } }`; forms map to field errors |
| Auth error | `401` → redirect to `/admin/login`; `403` (aal1) → redirect to MFA step |
| Rate limited | `429` with retry-after; UI shows "Too many attempts. Try again in N seconds." |
| Supabase/Postgres errors | Mapped in `server/utils/errors.ts` (unique violation → "This slug is already in use", FK violation → "This item is still used by …") |
| Network failure (admin) | Toast with retry action; unsaved form data kept |
| Missing settings | Components degrade gracefully (no WhatsApp button, no socials) instead of failing |

All server errors are logged with route, user id (if any) and a request id that is also returned in the response for support.

---

## 14. Performance requirements
- Public pages ship no admin code (admin components lazy-loaded under `/admin` only).
- Nuxt UI components imported on demand; icons bundled per usage.
- Fonts: max 2 families, `woff2`, subset Latin, preloaded for LCP text.
- LCP image (hero/cover) preloaded with `fetchpriority="high"`; all other images lazy.
- Prefetch links on visibility/hover (Nuxt default) for instant navigation.
- Payload: public API responses select only needed columns.
- Umami script `defer`, loaded after hydration.
- Static assets are pre-compressed (`compressPublicAssets`); SSR HTML is compressed with Brotli or gzip by `server/plugins/compress-html.ts`.
- The public header is plain markup with a CSS-only services menu; Nuxt UI overlay-heavy components stay out of public pages.

---

### 14.1 Measured status (after M2, production build, Lighthouse mobile, local)
| Page | Performance | Accessibility | Best practices | SEO | Initial JS (gzip) |
|---|---|---|---|---|---|
| `/` | 84–86 | 96 → fixed | 100 | 100 | 186 KB |
| `/articles` | 79 | 96 → fixed | 100 | 100 | ~190 KB |
| `/article/[slug]` | 74–81 | 100 | 100 | 100 | 196 KB |

The JavaScript budget (120 KB) and the Performance target (95) are not met yet. Nuxt, Vue and the router alone are about 100 KB gzip, and Nuxt UI's app providers add about 50 KB. Closing the gap is part of M5 and needs a decision on how much of Nuxt UI public pages may use.

## 15. Environment and deployment
- Nitro preset `node-server`; start command `node .output/server/index.mjs`; Node 24 LTS (Node 22 if that is the newest Hostinger offers).
- Environment variables: `NUXT_SITE_URL`, `NUXT_SUPABASE_URL`, `NUXT_SUPABASE_KEY` (publishable key), `NUXT_SUPABASE_SECRET_KEY`, `NUXT_SMTP_HOST` (`smtp-relay.brevo.com`), `NUXT_SMTP_PORT` (587), `NUXT_SMTP_USER`, `NUXT_SMTP_PASS`, `NUXT_SMTP_FROM`, `NUXT_TURNSTILE_SECRET_KEY`, `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, `NUXT_IP_HASH_SALT`.
- Supabase migrations versioned in `supabase/migrations`; `seed.sql` creates default settings, the four services, `home` page with default blocks, `contact` and `quotation` forms.
- Brevo: verify sender domain (SPF, DKIM, DMARC) before go-live.
- CSP `connect-src` allows Umami Cloud. A self-hosted Umami needs its host added in `nuxt.config.ts`.
- Environments: local (Supabase CLI), staging, production.

---

## 16. Milestones
| # | Scope | Exit criteria |
|---|---|---|
| M1 Foundation | Project setup, lint/typecheck/test tooling, Supabase schema + RLS, auth with mandatory TOTP, admin layout, Settings, Media pipeline, public layout, theme toggle, error page | Admin can log in with 2FA, edit settings and upload images that become WebP |
| M2 Articles | Categories, Articles with TipTap, archive, category archive, search, single article, related, RSS | Article published from admin appears on site with full SEO tags |
| M3 Pages | Block builder, Home, Services, static pages, Pricing module | Home and service pages fully editable from admin |
| M4 Engagement | Portfolio, Client logos marquee, Testimonials, FAQ, Form builder, Submissions inbox, Brevo notifications, Turnstile | Contact and Quotation submissions arrive in inbox and email |
| M5 Launch | Sitemap, JSON-LD audit, redirects, performance tuning, accessibility pass, E2E tests, Hostinger deployment | All acceptance criteria below pass on production |

---

## 17. Acceptance criteria
1. Admin access requires password + TOTP; an `aal1` session cannot read or write admin data (verified at API and RLS level).
2. Repeated failed logins are throttled (`429`) after 5 attempts per minute.
3. Every uploaded raster image is stored as WebP with variants and dimensions.
4. Dates render as `Wed, 14 Oct 2026 22:57` and prices as `IDR 128,000` everywhere, identical on server and client.
5. `/articles` lists posts; `/article/[slug]` renders a single post; old slugs redirect with `301`.
6. Every public page has a unique title, description, canonical, OG tags and valid JSON-LD (Rich Results Test passes for Article and FAQPage).
7. No page issues more than one DB query per section (verified by query logging in tests).
8. Dark/light toggle works without a flash of wrong theme and persists across visits.
9. Admin is fully usable at 360 px width.
10. Contact and Quotation forms reject bot submissions (missing Turnstile token, filled honeypot) and accept valid ones; admin receives an email.
11. Client logos animate in a seamless loop, pause on hover, and render static under reduced motion.
12. Lighthouse mobile ≥ 95 on Home, `/articles`, an article page and `/pricing`.
13. 404 and 500 pages render with site navigation and no stack trace.
