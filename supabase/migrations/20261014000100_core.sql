create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null unique,
  alt text not null default '',
  width integer,
  height integer,
  size_bytes integer not null,
  mime text not null,
  variants jsonb not null default '[]'::jsonb,
  blurhash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  bio text not null default '',
  avatar_media_id uuid references public.media (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.fn_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
    and exists (
      select 1 from public.admin_profiles where user_id = (select auth.uid())
    );
$$;

revoke all on function public.fn_is_admin() from public;
grant execute on function public.fn_is_admin() to anon, authenticated;

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default 'Agency',
  title_template text not null default '%s · Agency',
  tagline text not null default '',
  description text not null default '',
  logo_light_media_id uuid references public.media (id) on delete restrict,
  logo_dark_media_id uuid references public.media (id) on delete restrict,
  favicon_media_id uuid references public.media (id) on delete restrict,
  default_og_media_id uuid references public.media (id) on delete restrict,
  phone text not null default '',
  whatsapp_number text not null default '',
  whatsapp_message text not null default '',
  email text not null default '',
  address text not null default '',
  map_url text not null default '',
  work_hours jsonb not null default '[]'::jsonb,
  timezone text not null default 'Asia/Jakarta',
  umami_website_id text not null default '',
  umami_script_url text not null default 'https://cloud.umami.is/script.js',
  marquee jsonb not null default '{"autoplay": true, "speed": 40, "pause_on_hover": true}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text not null,
  url text not null,
  icon text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code smallint not null default 301 check (status_code in (301, 302, 308)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger media_updated_at before update on public.media
  for each row execute function public.set_updated_at();
create trigger admin_profiles_updated_at before update on public.admin_profiles
  for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
create trigger social_links_updated_at before update on public.social_links
  for each row execute function public.set_updated_at();
create trigger redirects_updated_at before update on public.redirects
  for each row execute function public.set_updated_at();

create index social_links_position_idx on public.social_links (position);
create index media_created_at_idx on public.media (created_at desc);

alter table public.media enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.social_links enable row level security;
alter table public.redirects enable row level security;

create policy "media is public" on public.media
  for select to anon, authenticated using (true);
create policy "admin manages media" on public.media
  for all to authenticated using (public.fn_is_admin()) with check (public.fn_is_admin());

create policy "admin reads own profile" on public.admin_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "admin updates own profile" on public.admin_profiles
  for update to authenticated
  using (user_id = (select auth.uid()) and public.fn_is_admin())
  with check (user_id = (select auth.uid()));

create policy "settings are public" on public.site_settings
  for select to anon, authenticated using (true);
create policy "admin updates settings" on public.site_settings
  for update to authenticated using (public.fn_is_admin()) with check (public.fn_is_admin());

create policy "active social links are public" on public.social_links
  for select to anon, authenticated using (is_active or public.fn_is_admin());
create policy "admin manages social links" on public.social_links
  for all to authenticated using (public.fn_is_admin()) with check (public.fn_is_admin());

create policy "redirects are public" on public.redirects
  for select to anon, authenticated using (true);
create policy "admin manages redirects" on public.redirects
  for all to authenticated using (public.fn_is_admin()) with check (public.fn_is_admin());

insert into public.site_settings (id) values (1);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp', 'image/svg+xml', 'image/png']);

create policy "admin reads media objects" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.fn_is_admin());
create policy "admin uploads media objects" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.fn_is_admin());
create policy "admin updates media objects" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.fn_is_admin());
create policy "admin deletes media objects" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.fn_is_admin());
