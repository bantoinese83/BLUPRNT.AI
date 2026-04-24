begin;
select plan(5);

-- 1. Setup Test User and Project
insert into auth.users (id, email)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'test.logic@example.com')
on conflict (id) do nothing;

insert into public.properties (id, owner_user_id, postal_code)
values ('11111111-2222-3333-4444-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '90210');

insert into public.projects (id, property_id, name)
values ('22222222-3333-4444-5555-666666666666', '11111111-2222-3333-4444-555555555555', 'Test Project Logic');

-- 2. Test recalc_project_totals
insert into public.scope_items (project_id, category, description, total_cost_min, total_cost_max)
values 
  ('22222222-3333-4444-5555-666666666666', 'Kitchen', 'Cabinets', 1000, 1500),
  ('22222222-3333-4444-5555-666666666666', 'Kitchen', 'Countertops', 2000, 3000);

select recalc_project_totals('22222222-3333-4444-5555-666666666666');

select results_eq(
  'select estimated_min_total, estimated_max_total from public.projects where id = ''22222222-3333-4444-5555-666666666666''',
  'select 3000::numeric, 4500::numeric',
  'recalc_project_totals should correctly sum scope items'
);

-- 3. Test reserve_architect_invoice_upload_slot
-- First, ensure user has a subscription record
insert into public.user_subscriptions (user_id, plan, status, invoice_uploads_count)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'architect', 'active', 0);

-- Call with max_uploads = 5
select results_eq(
  'select * from reserve_architect_invoice_upload_slot(''cccccccc-cccc-cccc-cccc-cccccccccccc'', 5)',
  'select true, 1',
  'Should allow upload when under limit'
);

-- Update count to 4
update public.user_subscriptions set invoice_uploads_count = 4 where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

select results_eq(
  'select * from reserve_architect_invoice_upload_slot(''cccccccc-cccc-cccc-cccc-cccccccccccc'', 5)',
  'select true, 5',
  'Should allow 5th upload when limit is 5'
);

-- Now at limit (5)
select results_eq(
  'select * from reserve_architect_invoice_upload_slot(''cccccccc-cccc-cccc-cccc-cccccccccccc'', 5)',
  'select false, 5',
  'Should NOT allow 6th upload when limit is 5'
);

-- Test with expired subscription
update public.user_subscriptions set status = 'past_due', current_period_end = now() - interval '1 day' where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

select results_eq(
  'select * from reserve_architect_invoice_upload_slot(''cccccccc-cccc-cccc-cccc-cccccccccccc'', 10)',
  'select false, 5',
  'Should NOT allow upload with expired/past_due subscription'
);

select * from finish();
rollback;
