-- Service pages are served at /service/:slug; their page slugs, shown and used as the
-- address in the admin editor, follow the same prefix.
update public.pages
set slug = 'service/' || substring(slug from 10)
where kind = 'service' and slug like 'services/%';
