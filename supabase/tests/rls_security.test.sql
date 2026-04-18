begin;
select plan(12);

-- 1. Setup Test Users
insert into auth.users (id, email)
values 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user.a@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user.b@example.com')
on conflict (id) do nothing;

-- 2. Setup Test Data (using service role or superuser to bypass RLS initially)
set local role postgres;

insert into public.properties (id, owner_user_id, postal_code)
values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '90210');

insert into public.projects (id, property_id, name)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'User A Kitchen');

insert into public.properties (id, owner_user_id, postal_code)
values ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '10001');

insert into public.projects (id, property_id, name)
values ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'User B Bathroom');

-- 3. TEST AS USER A
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

select results_eq(
  'select name from public.projects',
  array['User A Kitchen'],
  'User A should only see their own project'
);

select results_eq(
  'select postal_code from public.properties',
  array['90210'],
  'User A should only see their own property'
);

-- Test DELETE attempt across users
select results_eq(
  'delete from public.projects where id = ''44444444-4444-4444-4444-444444444444'' returning id',
  'select id from public.projects where false',
  'User A should not be able to delete User B project'
);

-- 4. TEST AS USER B
set local "request.jwt.claims" = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

select results_eq(
  'select name from public.projects',
  array['User B Bathroom'],
  'User B should only see their own project'
);

-- 5. TEST AS ANON (Public)
set local role anon;
set local "request.jwt.claims" = '{}';

select results_eq(
  'select count(*)::int from public.projects',
  array[0],
  'Anon user should see 0 projects'
);

select results_eq(
  'select count(*)::int from public.properties',
  array[0],
  'Anon user should see 0 properties'
);

-- 6. TEST CROSS-USER INSERT (should fail RLS)
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

-- Trying to insert a project into User B's property
prepare cross_insert as insert into public.projects (property_id, name) values ('33333333-3333-3333-3333-333333333333', 'Hacked Project');
select throws_ok('cross_insert', 'new row violates row-level security policy for table "projects"', 'User A should fail to insert project into User B property');

-- 7. TEST SCOPE ITEMS ISOLATION
set local role postgres;
insert into public.scope_items (project_id, category, description)
values ('22222222-2222-2222-2222-222222222222', 'Cabinets', 'Oak cabinets');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

select is_empty(
  'select * from public.scope_items',
  'User B should see no scope items from User A projects'
);

-- 8. TEST INVOICES ISOLATION
set local role postgres;
insert into public.invoices (project_id, vendor_name, total)
values ('22222222-2222-2222-2222-222222222222', 'Home Depot', 500);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

select is_empty(
  'select * from public.invoices',
  'User B should see no invoices from User A projects'
);

-- 9. TEST MARKETING LEADS (Restricted to service_role)
set local role anon;
prepare restricted_insert as insert into public.marketing_leads (email, source) values ('lead@test.com', 'web');
select throws_ok(
  'restricted_insert',
  'new row violates row-level security policy for table "marketing_leads"',
  'Anon user should NOT be able to insert marketing leads directly via PostgREST'
);

-- 10. TEST USER SUBSCRIPTIONS
set local role postgres;
insert into public.user_subscriptions (user_id, plan, status)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'architect', 'active');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
select results_eq(
  'select plan from public.user_subscriptions',
  array['architect'],
  'User A should see their own subscription'
);

set local "request.jwt.claims" = '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';
select is_empty(
  'select * from public.user_subscriptions',
  'User B should not see User A subscription'
);


select * from finish();
rollback;
