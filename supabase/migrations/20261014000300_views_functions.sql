create view public.v_category_counts
with (security_invoker = true)
as
select
  c.id,
  c.name,
  c.slug,
  count(a.id) filter (where a.status = 'published' and a.published_at <= now())::integer as article_count
from public.categories c
left join public.article_categories ac on ac.category_id = c.id
left join public.articles a on a.id = ac.article_id
group by c.id;

create view public.v_dashboard_stats
with (security_invoker = true)
as
select
  (select count(*) from public.articles where status = 'published')::integer as published_articles,
  (select count(*) from public.articles where status = 'draft')::integer as draft_articles,
  (select count(*) from public.submissions where status = 'new')::integer as new_submissions,
  (select count(*) from public.submissions where created_at >= now() - interval '30 days')::integer as submissions_30d,
  (select count(*) from public.media)::integer as media_files;

create or replace function public.fn_related_articles(p_article_id uuid, p_limit integer default 3)
returns setof public.articles
language sql
stable
security invoker
set search_path = ''
as $$
  select a.*
  from public.articles a
  left join public.article_categories ac
    on ac.article_id = a.id
    and ac.category_id in (
      select category_id from public.article_categories where article_id = p_article_id
    )
  where a.id <> p_article_id
    and a.status = 'published'
    and a.published_at <= now()
  group by a.id
  order by count(ac.category_id) desc, a.published_at desc
  limit least(greatest(p_limit, 1), 12);
$$;

create or replace function public.fn_search_articles(p_query text, p_limit integer default 12, p_offset integer default 0)
returns table (id uuid, rank real, total_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select websearch_to_tsquery('english', p_query) as query
  ),
  matches as (
    select a.id, ts_rank_cd(a.search, q.query) as rank, a.published_at
    from public.articles a, q
    where a.status = 'published'
      and a.published_at <= now()
      and a.search @@ q.query
  )
  select m.id, m.rank, count(*) over () as total_count
  from matches m
  order by m.rank desc, m.published_at desc
  limit least(greatest(p_limit, 1), 48)
  offset greatest(p_offset, 0);
$$;

grant select on public.v_category_counts to anon, authenticated;
grant select on public.v_dashboard_stats to authenticated;
revoke select on public.v_dashboard_stats from anon;
