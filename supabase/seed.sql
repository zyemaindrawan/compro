update public.site_settings
set
  site_name = 'Northwind Studio',
  title_template = '%s · Northwind Studio',
  tagline = 'Web, mobile and cloud software, built to last.',
  description = 'A software studio that designs, builds and runs web applications, Android apps and cloud infrastructure for growing companies.',
  email = 'hello@example.com',
  phone = '+62 21 5000 1234',
  whatsapp_number = '6281200001234',
  whatsapp_message = 'Hi, I would like to discuss a project.',
  address = 'Jl. Jend. Sudirman No. 1, Jakarta 10220, Indonesia',
  work_hours = '[
    {"day": "mon", "open": "09:00", "close": "18:00", "closed": false},
    {"day": "tue", "open": "09:00", "close": "18:00", "closed": false},
    {"day": "wed", "open": "09:00", "close": "18:00", "closed": false},
    {"day": "thu", "open": "09:00", "close": "18:00", "closed": false},
    {"day": "fri", "open": "09:00", "close": "17:00", "closed": false},
    {"day": "sat", "open": "", "close": "", "closed": true},
    {"day": "sun", "open": "", "close": "", "closed": true}
  ]'::jsonb
where id = 1;

insert into public.social_links (platform, label, url, icon, position) values
  ('linkedin', 'LinkedIn', 'https://www.linkedin.com/company/example', 'i-simple-icons-linkedin', 0),
  ('github', 'GitHub', 'https://github.com/example', 'i-simple-icons-github', 1),
  ('instagram', 'Instagram', 'https://www.instagram.com/example', 'i-simple-icons-instagram', 2);

insert into public.services (name, slug, summary, icon, position) values
  ('Web Development', 'web-development', 'Marketing sites, portals and SaaS products built with Nuxt, Laravel and Postgres.', 'i-lucide-monitor-smartphone', 0),
  ('Custom Applications', 'custom-applications', 'Internal tools, ERP modules and workflow automation shaped around how your team works.', 'i-lucide-blocks', 1),
  ('Android Development', 'android-development', 'Native Kotlin apps with offline sync, push notifications and Play Store release management.', 'i-lucide-smartphone', 2),
  ('Cloud Solutions', 'cloud-solutions', 'Infrastructure on AWS, GCP and VPS: migrations, CI/CD, monitoring and cost reviews.', 'i-lucide-cloud', 3);

insert into public.pages (title, slug, kind, status) values
  ('Home', 'home', 'home', 'published');

with f as (
  insert into public.forms (key, name, submit_label, success_message)
  values ('contact', 'Contact', 'Send message', 'Thanks for reaching out. We reply within one business day.')
  returning id
)
insert into public.form_fields (form_id, name, label, type, placeholder, required, width, position)
select f.id, v.name, v.label, v.type, v.placeholder, v.required, v.width, v.position
from f, (values
  ('name', 'Name', 'text', 'Jane Cooper', true, 'half', 0),
  ('email', 'Email', 'email', 'jane@company.com', true, 'half', 1),
  ('company', 'Company', 'text', 'Company name', false, 'full', 2),
  ('message', 'Message', 'textarea', 'Tell us about your project', true, 'full', 3)
) as v(name, label, type, placeholder, required, width, position);

with f as (
  insert into public.forms (key, name, submit_label, success_message)
  values ('quotation', 'Request a quote', 'Request quote', 'Thanks. We will send a scoped estimate within two business days.')
  returning id
)
insert into public.form_fields (form_id, name, label, type, placeholder, options, required, width, position)
select f.id, v.name, v.label, v.type, v.placeholder, v.options::jsonb, v.required, v.width, v.position
from f, (values
  ('name', 'Name', 'text', 'Jane Cooper', '[]', true, 'half', 0),
  ('email', 'Email', 'email', 'jane@company.com', '[]', true, 'half', 1),
  ('service', 'Service', 'select', 'Choose a service', '[{"label":"Web Development","value":"web-development"},{"label":"Custom Applications","value":"custom-applications"},{"label":"Android Development","value":"android-development"},{"label":"Cloud Solutions","value":"cloud-solutions"}]', true, 'half', 2),
  ('budget', 'Budget', 'budget_range', '', '[{"label":"Under IDR 25,000,000","value":"lt-25m"},{"label":"IDR 25,000,000 - 100,000,000","value":"25m-100m"},{"label":"Over IDR 100,000,000","value":"gt-100m"}]', false, 'half', 3),
  ('details', 'Project details', 'textarea', 'Goals, timeline, links to references', '[]', true, 'full', 4)
) as v(name, label, type, placeholder, options, required, width, position);
