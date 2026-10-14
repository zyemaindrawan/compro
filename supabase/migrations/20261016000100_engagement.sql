alter table public.submissions
  add column service_slug text not null default '',
  add column plan_slug text not null default '';

create index submissions_form_created_idx on public.submissions (form_id, created_at desc);

create view public.v_submission_counts
with (security_invoker = true)
as
select
  count(*) filter (where status = 'new')::integer as new,
  count(*) filter (where status = 'contacted')::integer as contacted,
  count(*) filter (where status = 'won')::integer as won,
  count(*) filter (where status = 'lost')::integer as lost,
  count(*) filter (where status = 'spam')::integer as spam,
  count(*) filter (where status <> 'spam')::integer as all_but_spam
from public.submissions;

revoke select on public.v_submission_counts from anon;
grant select on public.v_submission_counts to authenticated;

create function public.fn_reorder(p_table text, p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_table not in ('portfolio_items', 'client_logos', 'testimonials', 'faqs') then
    raise exception 'unsupported table %', p_table using errcode = '22023';
  end if;
  execute format(
    'update public.%I set position = array_position($1, id) - 1 where id = any($1)',
    p_table
  ) using p_ids;
end;
$$;

revoke execute on function public.fn_reorder(text, uuid[]) from public, anon;
grant execute on function public.fn_reorder(text, uuid[]) to authenticated;
