create or replace view public.v_category_counts
with (security_invoker = true)
as
select
  c.id,
  c.name,
  c.slug,
  count(a.id) filter (where a.status = 'published' and a.published_at <= now())::integer as article_count,
  c.description
from public.categories c
left join public.article_categories ac on ac.category_id = c.id
left join public.articles a on a.id = ac.article_id
group by c.id;
