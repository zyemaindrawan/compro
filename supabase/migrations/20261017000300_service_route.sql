-- Service pages move from /services/:slug to /service/:slug. The /services index stays.

-- Redirects that already point at a service page follow it to the new path.
update public.redirects
set to_path = '/service/' || substring(to_path from 11)
where to_path like '/services/%';

-- Every current service URL keeps working with a permanent redirect.
insert into public.redirects (from_path, to_path, status_code)
select '/services/' || slug, '/service/' || slug, 301
from public.services
on conflict (from_path) do nothing;

-- Links saved in CMS blocks, including the HTML inside rich text, are rewritten to the new path.
update public.page_blocks
set props = replace(props::text, '"/services/', '"/service/')::jsonb
where props::text like '%"/services/%';
