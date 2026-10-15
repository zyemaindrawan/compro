create or replace view public.v_dashboard_stats
with (security_invoker = true)
as
select
  (select count(*) from public.articles where status = 'published')::integer as published_articles,
  (select count(*) from public.articles where status = 'draft')::integer as draft_articles,
  (select count(*) from public.submissions where status = 'new')::integer as new_submissions,
  (select count(*) from public.submissions where created_at >= now() - interval '30 days')::integer as submissions_30d,
  (select count(*) from public.media)::integer as media_files,
  coalesce((select default_og_media_id is not null from public.site_settings where id = 1), false) as has_default_og;
