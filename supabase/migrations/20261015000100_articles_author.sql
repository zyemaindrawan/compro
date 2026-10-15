alter table public.site_settings
  alter column site_name set default 'TokoDesign',
  alter column title_template set default '%s · TokoDesign';

update public.site_settings
set site_name = 'TokoDesign', title_template = '%s · TokoDesign'
where id = 1 and site_name = 'Agency';

alter table public.articles
  add column author_id uuid references public.admin_profiles (user_id) on delete set null;

create index articles_author_idx on public.articles (author_id);

revoke select on public.admin_profiles from anon;
grant select (user_id, display_name, bio, avatar_media_id) on public.admin_profiles to anon;

create policy "author profiles are public" on public.admin_profiles
  for select to anon using (true);
