create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  description text not null default '',
  meta_title text not null default '',
  meta_description text not null default '',
  meta_keywords text[] not null default '{}',
  canonical_url text not null default '',
  og_media_id uuid references public.media (id) on delete restrict,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  excerpt text not null default '',
  content_json jsonb not null default '{}'::jsonb,
  content_html text not null default '',
  cover_media_id uuid references public.media (id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  reading_minutes smallint not null default 1,
  meta_title text not null default '',
  meta_description text not null default '',
  meta_keywords text[] not null default '{}',
  canonical_url text not null default '',
  og_media_id uuid references public.media (id) on delete restrict,
  noindex boolean not null default false,
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
    || setweight(to_tsvector('english', coalesce(content_html, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint published_has_date check (status = 'draft' or published_at is not null)
);

create table public.article_categories (
  article_id uuid not null references public.articles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (article_id, category_id)
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$' and char_length(slug) <= 80),
  kind text not null default 'static' check (kind in ('home', 'service', 'static')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  meta_title text not null default '',
  meta_description text not null default '',
  meta_keywords text[] not null default '{}',
  canonical_url text not null default '',
  og_media_id uuid references public.media (id) on delete restrict,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create unique index pages_single_home_idx on public.pages (kind) where kind = 'home';

create table public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  type text not null,
  props jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  summary text not null default '',
  icon text not null default 'i-lucide-box',
  page_id uuid references public.pages (id) on delete set null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  submit_label text not null default 'Send',
  success_message text not null default 'Thanks. We will reply within one business day.',
  notify_emails text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  name text not null check (name ~ '^[a-z][a-z0-9_]*$'),
  label text not null,
  type text not null check (type in (
    'text', 'email', 'tel', 'url', 'textarea', 'select', 'radio',
    'checkbox', 'checkbox_group', 'number', 'budget_range', 'date'
  )),
  placeholder text not null default '',
  help_text text not null default '',
  options jsonb not null default '[]'::jsonb,
  required boolean not null default false,
  validation jsonb not null default '{}'::jsonb,
  width text not null default 'full' check (width in ('full', 'half')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, name)
);

create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  price bigint not null default 0 check (price >= 0),
  price_suffix text not null default '',
  description text not null default '',
  cta_label text not null default 'Get a quote',
  cta_form_id uuid references public.forms (id) on delete set null,
  is_popular boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, slug)
);

create table public.pricing_features (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  label text not null,
  group_label text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pricing_plan_features (
  plan_id uuid not null references public.pricing_plans (id) on delete cascade,
  feature_id uuid not null references public.pricing_features (id) on delete cascade,
  value_type text not null default 'check' check (value_type in ('check', 'cross', 'text')),
  value_text text not null default '',
  primary key (plan_id, feature_id)
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  thumbnail_media_id uuid not null references public.media (id) on delete restrict,
  external_url text not null check (external_url ~ '^https?://'),
  service_id uuid references public.services (id) on delete set null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_logos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_media_id uuid not null references public.media (id) on delete restrict,
  url text not null default '',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text not null default '',
  company text not null default '',
  avatar_media_id uuid references public.media (id) on delete restrict,
  quote text not null,
  rating smallint check (rating between 1 and 5),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  group_label text not null default '',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete restrict,
  data jsonb not null,
  name text not null default '',
  email text not null default '',
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost', 'spam')),
  note text not null default '',
  ip_hash text not null default '',
  user_agent text not null default '',
  source_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_status_published_idx on public.articles (status, published_at desc);
create index articles_search_idx on public.articles using gin (search);
create index article_categories_category_idx on public.article_categories (category_id, article_id);
create index page_blocks_page_position_idx on public.page_blocks (page_id, position);
create index form_fields_form_position_idx on public.form_fields (form_id, position);
create index services_position_idx on public.services (position);
create index pricing_plans_service_position_idx on public.pricing_plans (service_id, position);
create index pricing_features_service_position_idx on public.pricing_features (service_id, position);
create index portfolio_items_position_idx on public.portfolio_items (position);
create index portfolio_items_service_idx on public.portfolio_items (service_id);
create index client_logos_position_idx on public.client_logos (position);
create index testimonials_position_idx on public.testimonials (position);
create index faqs_position_idx on public.faqs (group_label, position);
create index submissions_status_created_idx on public.submissions (status, created_at desc);
create index submissions_form_idx on public.submissions (form_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'articles', 'pages', 'page_blocks', 'services', 'forms', 'form_fields',
    'pricing_plans', 'pricing_features', 'portfolio_items', 'client_logos',
    'testimonials', 'faqs', 'submissions'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t
    );
  end loop;

  foreach t in array array[
    'categories', 'articles', 'article_categories', 'pages', 'page_blocks', 'services',
    'forms', 'form_fields', 'pricing_plans', 'pricing_features', 'pricing_plan_features',
    'portfolio_items', 'client_logos', 'testimonials', 'faqs', 'submissions'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "admin manages %s" on public.%I for all to authenticated using (public.fn_is_admin()) with check (public.fn_is_admin())',
      t, t
    );
  end loop;
end;
$$;

create policy "categories are public" on public.categories
  for select to anon, authenticated using (true);

create policy "published articles are public" on public.articles
  for select to anon, authenticated using (status = 'published' and published_at <= now());

create policy "article categories of published articles are public" on public.article_categories
  for select to anon, authenticated using (
    exists (
      select 1 from public.articles a
      where a.id = article_id and a.status = 'published' and a.published_at <= now()
    )
  );

create policy "published pages are public" on public.pages
  for select to anon, authenticated using (status = 'published');

create policy "visible blocks of published pages are public" on public.page_blocks
  for select to anon, authenticated using (
    is_visible and exists (
      select 1 from public.pages p where p.id = page_id and p.status = 'published'
    )
  );

create policy "active services are public" on public.services
  for select to anon, authenticated using (is_active);

create policy "forms are public" on public.forms
  for select to anon, authenticated using (true);

create policy "form fields are public" on public.form_fields
  for select to anon, authenticated using (true);

create policy "pricing plans of active services are public" on public.pricing_plans
  for select to anon, authenticated using (
    exists (select 1 from public.services s where s.id = service_id and s.is_active)
  );

create policy "pricing features of active services are public" on public.pricing_features
  for select to anon, authenticated using (
    exists (select 1 from public.services s where s.id = service_id and s.is_active)
  );

create policy "pricing plan features are public" on public.pricing_plan_features
  for select to anon, authenticated using (true);

create policy "active portfolio items are public" on public.portfolio_items
  for select to anon, authenticated using (is_active);

create policy "active client logos are public" on public.client_logos
  for select to anon, authenticated using (is_active);

create policy "active testimonials are public" on public.testimonials
  for select to anon, authenticated using (is_active);

create policy "active faqs are public" on public.faqs
  for select to anon, authenticated using (is_active);

revoke select on public.forms from anon;
grant select (id, key, name, submit_label, success_message, created_at, updated_at) on public.forms to anon;
