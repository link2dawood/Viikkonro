-- This script runs after team-db.cases.sql in the disposable cluster only.
create function public.shift_test_command(org uuid, action text, data jsonb) returns jsonb language sql as $$
  select public.shift_command(org,action,data || jsonb_build_object('expected_version',(select version from public.team_organizations where id=org)))
$$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.team_create_organization('Shift Organization A',2027,'Shift Owner') as shift_org_a \gset
select public.team_command(:'shift_org_a','member','{"expected_version":1,"label":"Shift Employee"}');
select (public.team_snapshot(:'shift_org_a')->'members'->0->>'id') as shift_employee \gset
select (public.team_snapshot(:'shift_org_a')->'members'->1->>'id') as shift_owner \gset
reset role;
insert into public.team_memberships(organization_id,user_id,role,member_id) values(:'shift_org_a','00000000-0000-0000-0000-000000000004','employee',:'shift_employee'),(:'shift_org_a','00000000-0000-0000-0000-000000000003','manager',null);
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select public.team_create_organization('Shift Organization B',2027,'Other Owner') as shift_org_b \gset
select (public.team_snapshot(:'shift_org_b')->'members'->0->>'id') as shift_other_member \gset
select public.shift_test_command(:'shift_org_b','template','{"name":"Other night","kind":"night","start_time":"22:00","end_time":"06:00","end_day":1}');
select (public.shift_snapshot(:'shift_org_b')->'shift_templates'->0->>'id') as shift_other_template \gset
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.shift_test_command(:'shift_org_a','template','{"name":"Night","kind":"night","start_time":"22:00","end_time":"06:00","end_day":1}');
select (public.shift_snapshot(:'shift_org_a')->'shift_templates'->0->>'id') as shift_template \gset
select public.test_assert(jsonb_array_length(public.shift_snapshot(:'shift_org_a')->'shift_templates')=1,'manager creates shift template');
select public.test_denied(format('select public.shift_snapshot(%L)',:'shift_org_b'),'shift snapshot isolates tenants');
select public.test_denied('insert into public.team_shifts(organization_id) values(null)','direct shift writes denied');
select public.test_denied(format('select public.shift_test_command(%L,''shift'',%L::jsonb)',:'shift_org_a',jsonb_build_object('member_id',:'shift_employee','template_id',:'shift_other_template','starts_at','2027-01-01T20:00:00Z','ends_at','2027-01-02T04:00:00Z')::text),'foreign template blocked','23503');
select public.test_denied(format('select public.shift_test_command(%L,''shift'',%L::jsonb)',:'shift_org_a',jsonb_build_object('member_id',:'shift_other_member','template_id',:'shift_template','starts_at','2027-01-01T20:00:00Z','ends_at','2027-01-02T04:00:00Z')::text),'foreign shift employee blocked','P0001');
select public.shift_test_command(:'shift_org_a','shift',jsonb_build_object('member_id',:'shift_owner','template_id',:'shift_template','starts_at','2026-12-31T20:00:00Z','ends_at','2027-01-01T04:00:00Z','notes','private coworker note'));
select (public.shift_snapshot(:'shift_org_a')->'shifts'->0->>'id') as shift_id \gset
select public.shift_test_command(:'shift_org_a','shift',jsonb_build_object('member_id',:'shift_employee','template_id',:'shift_template','starts_at','2027-12-31T20:00:00Z','ends_at','2028-01-01T04:00:00Z','notes','own shift note'));
select public.test_assert(jsonb_array_length(public.shift_snapshot(:'shift_org_a')->'shifts')=2,'year snapshot retains crossing boundary shifts');
select public.shift_test_command(:'shift_org_a','availability',jsonb_build_object('member_id',:'shift_owner','starts_at','2027-01-01T00:00:00Z','ends_at','2027-01-01T12:00:00Z','notes','private availability note'));
select (public.shift_snapshot(:'shift_org_a')->'availability'->0->>'id') as shift_owner_availability \gset
select public.test_denied(format('select public.shift_test_command(%L,''remove_template'',%L::jsonb)',:'shift_org_a',jsonb_build_object('id',:'shift_template')::text),'used template deletion blocked','23503');
select public.test_denied(format('select public.shift_test_command(%L,''shift'',%L::jsonb)',:'shift_org_a',jsonb_build_object('member_id',:'shift_employee','template_id',:'shift_template','starts_at','2027-01-01T22:00:00','ends_at','2027-01-02T06:00:00')::text),'floating timestamps rejected','P0001');
select public.test_denied(format('select public.shift_test_command(%L,''shift'',%L::jsonb)',:'shift_org_a',jsonb_build_object('member_id',:'shift_employee','template_id',:'shift_template','starts_at','2027-01-01T20:00:00Z','ends_at','2027-01-01T20:00:00Z')::text),'empty interval rejected','23514');
select public.test_denied(format('select public.shift_test_command(%L,''shift'',%L::jsonb)',:'shift_org_a',jsonb_build_object('member_id',:'shift_employee','template_id',:'shift_template','starts_at','2027-01-01T20:00:00Z','ends_at','2027-01-03T20:00:00Z')::text),'oversized shift rejected','23514');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select public.test_assert((select count(*) from public.team_shifts)=1,'employee direct reads only own shift notes');
select public.test_assert(not(public.shift_snapshot(:'shift_org_a')::text like '%private coworker note%') and not(public.shift_snapshot(:'shift_org_a')::text like '%private availability note%'),'shared roster redacts coworker notes');
select public.test_denied(format('select public.shift_test_command(%L,''remove_shift'',%L::jsonb)',:'shift_org_a',jsonb_build_object('id',:'shift_id')::text),'employee cannot remove shift');
select public.test_denied(format('select public.shift_test_command(%L,''template'',%L::jsonb)',:'shift_org_a','{"name":"Attack"}'),'employee cannot manage templates');
select public.test_denied(format('select public.shift_test_command(%L,''shift'',%L::jsonb)',:'shift_org_a','{}'),'employee cannot assign own shift');
select public.test_denied(format('select public.shift_test_command(%L,''availability'',%L::jsonb)',:'shift_org_a',jsonb_build_object('member_id',:'shift_owner','starts_at','2027-01-02T00:00:00Z','ends_at','2027-01-02T12:00:00Z')::text),'employee cannot create coworker availability');
select public.test_denied(format('select public.shift_test_command(%L,''remove_availability'',%L::jsonb)',:'shift_org_a',jsonb_build_object('id',:'shift_owner_availability')::text),'employee cannot delete coworker availability');
select public.test_denied(format('select public.shift_test_command(%L,''availability'',%L::jsonb)',:'shift_org_a',jsonb_build_object('id',:'shift_owner_availability','member_id',:'shift_employee','starts_at','2027-01-02T00:00:00Z','ends_at','2027-01-02T12:00:00Z')::text),'employee cannot reassign coworker availability');
select public.shift_test_command(:'shift_org_a','availability',jsonb_build_object('member_id',:'shift_employee','starts_at','2027-01-02T00:00:00Z','ends_at','2027-01-02T12:00:00Z','notes','own availability'));
select public.test_assert((select count(*) from public.team_shift_availability)=1,'employee edits and reads own availability');
select (public.shift_snapshot(:'shift_org_a')->'availability'->1->>'id') as own_availability \gset
select public.shift_test_command(:'shift_org_a','remove_availability',jsonb_build_object('id',:'own_availability'));
select public.test_assert((select count(*) from public.team_shift_availability)=0,'employee deletes own availability');
select public.test_denied(format('select public.shift_command(%L,''availability'',%L::jsonb)',:'shift_org_a','{"expected_version":1}'),'shift stale writes rejected','40001');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.team_command(:'shift_org_a','settings',jsonb_build_object('expected_version',(select version from public.team_organizations where id=:'shift_org_a'),'name','Shift Organization A','calendar_year',2028,'min_coverage',2,'include_holidays',true));
select public.test_assert(jsonb_array_length(public.shift_snapshot(:'shift_org_a')->'shifts')=1,'new year excludes ended shifts but retains overnight boundary');
select public.shift_test_command(:'shift_org_a','shift',jsonb_build_object('member_id',:'shift_employee','template_id',:'shift_template','starts_at','2028-02-29T20:00:00Z','ends_at','2028-03-01T04:00:00Z'));
select public.test_assert(jsonb_array_length(public.shift_snapshot(:'shift_org_a')->'shifts')=2,'database accepts leap-day overnight shift');
select public.team_command(:'shift_org_a','revoke_access',jsonb_build_object('expected_version',(select version from public.team_organizations where id=:'shift_org_a'),'user_id','00000000-0000-0000-0000-000000000004'));
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select public.test_denied(format('select public.shift_snapshot(%L)',:'shift_org_a'),'shift revocation immediate');
select public.test_assert((select count(*) from public.team_shifts)=0,'shift RLS immediately respects revoked membership');
reset role;
set role anon;
select public.test_denied('select public.shift_snapshot(null)','anonymous shift snapshot denied');
select public.test_denied('select public.shift_command(null,''shift'',''{}'')','anonymous shift mutation denied');
select public.test_denied('select * from public.team_shifts','anonymous shift table denied');
reset role;
select public.test_assert(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'shift_%' and p.prosecdef and not('search_path=""'=any(p.proconfig))),'shift definer functions pinned');
