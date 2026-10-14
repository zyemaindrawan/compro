create or replace function pg_temp.add_blocks(p_page_id uuid, p_blocks jsonb)
returns void
language sql
as $$
  insert into public.page_blocks (page_id, type, props, position)
  select p_page_id, b.block ->> 'type', b.block -> 'props', (b.ord - 1)::integer
  from jsonb_array_elements(p_blocks) with ordinality as b(block, ord);
$$;

create or replace function pg_temp.add_pricing(p_service_slug text, p_plans jsonb, p_features jsonb)
returns void
language plpgsql
as $$
declare
  v_service uuid;
  v_plan jsonb;
  v_feature jsonb;
  v_feature_id uuid;
  v_plan_ids uuid[] := '{}';
  v_value text;
  i integer;
begin
  select id into v_service from public.services where slug = p_service_slug;

  for v_plan in select * from jsonb_array_elements(p_plans) loop
    insert into public.pricing_plans (service_id, name, slug, price, price_suffix, description, is_popular, position)
    values (
      v_service, v_plan ->> 'name', v_plan ->> 'slug', (v_plan ->> 'price')::bigint, v_plan ->> 'suffix',
      v_plan ->> 'description', coalesce((v_plan ->> 'popular')::boolean, false), coalesce(array_length(v_plan_ids, 1), 0)
    )
    returning id into v_feature_id;
    v_plan_ids := v_plan_ids || v_feature_id;
  end loop;

  for v_feature in select * from jsonb_array_elements(p_features) loop
    insert into public.pricing_features (service_id, label, group_label, position)
    values (v_service, v_feature ->> 'label', coalesce(v_feature ->> 'group', ''),
      (select count(*) from public.pricing_features where service_id = v_service))
    returning id into v_feature_id;

    for i in 1 .. array_length(v_plan_ids, 1) loop
      v_value := v_feature -> 'values' ->> (i - 1);
      insert into public.pricing_plan_features (plan_id, feature_id, value_type, value_text)
      values (
        v_plan_ids[i], v_feature_id,
        case when v_value in ('check', 'cross') then v_value else 'text' end,
        case when v_value in ('check', 'cross') then '' else v_value end
      );
    end loop;
  end loop;
end;
$$;

select pg_temp.add_blocks((select id from public.pages where kind = 'home'), '[
  {"type": "hero", "props": {
    "eyebrow": "Software studio, Jakarta",
    "heading": "Web, mobile and cloud software, built to last.",
    "subheading": "We design, build and run web apps, Android apps and cloud infrastructure for companies that have outgrown templates and freelancers.",
    "primary": {"label": "Get a quote", "href": "/quote"},
    "secondary": {"label": "See our work", "href": "/portfolio"},
    "media_id": null}},
  {"type": "services_grid", "props": {
    "heading": "What we build",
    "intro": "Four practices, one team. Most projects combine two of them.",
    "service_ids": []}},
  {"type": "stats", "props": {
    "heading": "Track record",
    "items": [
      {"value": "60+", "label": "Projects shipped"},
      {"value": "9", "label": "Years in business"},
      {"value": "4.8/5", "label": "Average client rating"},
      {"value": "< 1 day", "label": "First reply to a brief"}]}},
  {"type": "latest_articles", "props": {"heading": "From the blog", "limit": 3, "category_slug": ""}},
  {"type": "cta", "props": {
    "heading": "Have a project in mind?",
    "body": "Send a short brief. You get a scoped estimate within two business days.",
    "primary": {"label": "Request a quote", "href": "/quote"}}}
]'::jsonb);

with page as (
  insert into public.pages (title, slug, kind, status, meta_description)
  values ('About', 'about', 'static', 'published', 'Who we are, how we work and what we will not take on.')
  returning id
)
select pg_temp.add_blocks((select id from page), '[
  {"type": "hero", "props": {
    "eyebrow": "About",
    "heading": "A small team that ships and stays",
    "subheading": "Designers, engineers and one project lead per client. The people who quote your project are the people who build it.",
    "primary": {"label": "", "href": ""}, "secondary": {"label": "", "href": ""}, "media_id": null}},
  {"type": "rich_text", "props": {
    "content_json": {"type": "doc", "content": []},
    "content_html": "<h2>How we work</h2><p>Every project starts with a paid discovery week: we map the users, the data and the risky parts, then agree on a fixed scope for the first release.</p><p>We ship in two-week cycles and demo working software at the end of each one. You get access to the repository, the issue tracker and the staging site from day one.</p><h2>What we will not take on</h2><ul><li>Projects without a person on your side who can make decisions.</li><li>Clones of another product with the logo swapped.</li><li>Work we cannot maintain after launch.</li></ul>"}},
  {"type": "cta", "props": {
    "heading": "Want to talk it through?",
    "body": "A 30-minute call is usually enough to tell whether we are a fit.",
    "primary": {"label": "Contact us", "href": "/contact"}}}
]'::jsonb);

with page as (
  insert into public.pages (title, slug, kind, status, meta_description)
  values ('Privacy Policy', 'privacy-policy', 'static', 'published', 'What personal data this site collects and how it is used.')
  returning id
)
select pg_temp.add_blocks((select id from page), '[
  {"type": "rich_text", "props": {
    "content_json": {"type": "doc", "content": []},
    "content_html": "<h2>Privacy Policy</h2><p>This template must be reviewed by your legal adviser before launch.</p><h3>What we collect</h3><p>When you send the contact or quotation form we store the details you enter, a hash of your IP address and your browser name, so we can reply and block abuse.</p><h3>Analytics</h3><p>We use Umami to count visits. It does not set cookies and does not collect personal data.</p><h3>How long we keep it</h3><p>Form submissions are kept for 24 months, then deleted.</p><h3>Your rights</h3><p>Email us to see, correct or delete the data we hold about you.</p>"}}
]'::jsonb);

do $$
declare
  v_service record;
  v_page uuid;
  v_details jsonb := '{
    "web-development": {"sub": "Marketing sites, customer portals and SaaS products, built with Nuxt, Laravel and Postgres and handed over with documentation.", "body": "<h2>Typical projects</h2><ul><li>Company sites with a CMS your team edits without us.</li><li>Customer portals that connect to your ERP or CRM.</li><li>SaaS products from first release to the first thousand users.</li></ul><h2>Stack</h2><p>Nuxt or Next on the front end, Laravel or Node on the back end, Postgres for data. We choose what your team can maintain after launch.</p>"},
    "custom-applications": {"sub": "Internal tools, approval flows and ERP modules shaped around how your team already works.", "body": "<h2>Typical projects</h2><ul><li>Purchase and approval workflows replacing spreadsheets and email.</li><li>Inventory and warehouse modules connected to accounting.</li><li>Dashboards that pull data from several systems into one view.</li></ul><h2>How we start</h2><p>We sit with the people who will use the tool for a day before writing a line of code.</p>"},
    "android-development": {"sub": "Native Kotlin apps with offline sync, push notifications and Play Store release management.", "body": "<h2>Typical projects</h2><ul><li>Field apps that keep working without signal and sync later.</li><li>Customer apps with payments, loyalty and push notifications.</li><li>Companion apps for existing web platforms.</li></ul><h2>After launch</h2><p>We handle Play Store reviews, crash monitoring and Android version updates.</p>"},
    "cloud-solutions": {"sub": "Infrastructure on AWS, Google Cloud and VPS providers: migrations, CI/CD, monitoring and cost reviews.", "body": "<h2>Typical projects</h2><ul><li>Moving a single server to managed services without downtime.</li><li>CI/CD pipelines that deploy on every merge.</li><li>Monthly cost reviews that cut unused resources.</li></ul><h2>On call</h2><p>Retainer clients get alerting and a named engineer during business hours.</p>"}
  }';
begin
  for v_service in select id, name, slug from public.services loop
    insert into public.pages (title, slug, kind, status, meta_description)
    values (v_service.name, 'services/' || v_service.slug, 'service', 'published', v_details -> v_service.slug ->> 'sub')
    returning id into v_page;

    update public.services set page_id = v_page where id = v_service.id;

    perform pg_temp.add_blocks(v_page, jsonb_build_array(
      jsonb_build_object('type', 'hero', 'props', jsonb_build_object(
        'eyebrow', 'Services', 'heading', v_service.name, 'subheading', v_details -> v_service.slug ->> 'sub',
        'primary', jsonb_build_object('label', 'Get a quote', 'href', '/quote'),
        'secondary', jsonb_build_object('label', 'See pricing', 'href', '/pricing'),
        'media_id', null)),
      jsonb_build_object('type', 'rich_text', 'props', jsonb_build_object(
        'content_json', '{"type": "doc", "content": []}'::jsonb, 'content_html', v_details -> v_service.slug ->> 'body')),
      jsonb_build_object('type', 'pricing_table', 'props', jsonb_build_object(
        'heading', 'Pricing', 'intro', 'Fixed prices for a defined scope. Larger work is quoted after a discovery week.', 'service_id', v_service.id)),
      jsonb_build_object('type', 'cta', 'props', jsonb_build_object(
        'heading', 'Not sure which plan fits?', 'body', 'Describe what you need and we will recommend one.',
        'primary', jsonb_build_object('label', 'Request a quote', 'href', '/quote')))
    ));
  end loop;
end;
$$;

select pg_temp.add_pricing('web-development',
  '[{"name": "Launch", "slug": "launch", "price": 12500000, "suffix": "/ project", "description": "A focused marketing site for a new product or company."},
    {"name": "Business", "slug": "business", "price": 35000000, "suffix": "/ project", "description": "A full company site your team updates through the CMS.", "popular": true},
    {"name": "Platform", "slug": "platform", "price": 120000000, "suffix": "starting / project", "description": "Portals and SaaS products with accounts, payments and integrations."}]',
  '[{"label": "Pages included", "group": "Scope", "values": ["Up to 5", "Up to 15", "Custom"]},
    {"label": "Content management", "group": "Scope", "values": ["cross", "check", "check"]},
    {"label": "User accounts and roles", "group": "Scope", "values": ["cross", "cross", "check"]},
    {"label": "Technical SEO setup", "group": "Quality", "values": ["check", "check", "check"]},
    {"label": "Third-party integrations", "group": "Quality", "values": ["cross", "1", "Unlimited"]},
    {"label": "Support after launch", "group": "Support", "values": ["30 days", "90 days", "6 months"]}]');

select pg_temp.add_pricing('custom-applications',
  '[{"name": "Module", "slug": "module", "price": 45000000, "suffix": "/ project", "description": "One workflow, such as approvals or stock requests, built end to end."},
    {"name": "System", "slug": "system", "price": 150000000, "suffix": "/ project", "description": "Several connected modules replacing a spreadsheet-driven process.", "popular": true},
    {"name": "Retainer", "slug": "retainer", "price": 25000000, "suffix": "/ month", "description": "A dedicated engineer for ongoing changes to an existing system."}]',
  '[{"label": "Discovery week", "group": "Scope", "values": ["check", "check", "cross"]},
    {"label": "Workflows covered", "group": "Scope", "values": ["1", "Up to 6", "As needed"]},
    {"label": "Role-based access", "group": "Scope", "values": ["check", "check", "check"]},
    {"label": "Data migration", "group": "Scope", "values": ["cross", "check", "check"]},
    {"label": "Training sessions", "group": "Support", "values": ["1", "3", "Monthly"]},
    {"label": "Response time", "group": "Support", "values": ["2 business days", "1 business day", "Same day"]}]');

select pg_temp.add_pricing('android-development',
  '[{"name": "MVP", "slug": "mvp", "price": 60000000, "suffix": "/ project", "description": "A first release with the core flow, ready for the Play Store."},
    {"name": "Production", "slug": "production", "price": 140000000, "suffix": "/ project", "description": "Offline sync, notifications and analytics for a growing user base.", "popular": true},
    {"name": "Care", "slug": "care", "price": 12000000, "suffix": "/ month", "description": "Updates, crash fixes and Android version upgrades for a live app."}]',
  '[{"label": "Screens included", "group": "Scope", "values": ["Up to 10", "Up to 30", "cross"]},
    {"label": "Offline sync", "group": "Scope", "values": ["cross", "check", "check"]},
    {"label": "Push notifications", "group": "Scope", "values": ["check", "check", "check"]},
    {"label": "Play Store release", "group": "Delivery", "values": ["check", "check", "check"]},
    {"label": "Crash monitoring", "group": "Delivery", "values": ["cross", "check", "check"]},
    {"label": "Support after launch", "group": "Support", "values": ["30 days", "90 days", "Ongoing"]}]');

select pg_temp.add_pricing('cloud-solutions',
  '[{"name": "Review", "slug": "review", "price": 7500000, "suffix": "/ one-off", "description": "An audit of your current setup with a written cost and risk report."},
    {"name": "Migration", "slug": "migration", "price": 40000000, "suffix": "/ project", "description": "Move to managed services with CI/CD and monitoring in place.", "popular": true},
    {"name": "Managed", "slug": "managed", "price": 9500000, "suffix": "/ month", "description": "We run, patch and watch your infrastructure."}]',
  '[{"label": "Cost report", "group": "Scope", "values": ["check", "check", "Monthly"]},
    {"label": "Zero-downtime migration", "group": "Scope", "values": ["cross", "check", "cross"]},
    {"label": "CI/CD pipeline", "group": "Scope", "values": ["cross", "check", "check"]},
    {"label": "Monitoring and alerts", "group": "Operations", "values": ["cross", "check", "check"]},
    {"label": "Security patches", "group": "Operations", "values": ["cross", "cross", "check"]},
    {"label": "On-call hours", "group": "Operations", "values": ["cross", "cross", "Business hours"]}]');
