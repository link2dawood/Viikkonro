-- Test fixture identities are synthetic. Run only in the isolated test cluster.
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-0000-0000-000000000001','owner-a@example.test',now()),
 ('00000000-0000-0000-0000-000000000002','owner-b@example.test',now()),
 ('00000000-0000-0000-0000-000000000003','manager@example.test',now()),
 ('00000000-0000-0000-0000-000000000004','employee@example.test',now()),
 ('00000000-0000-0000-0000-000000000005','outsider@example.test',now()),
 ('00000000-0000-0000-0000-000000000006','unconfirmed@example.test',null);
create function public.test_assert(condition boolean,label text) returns void language plpgsql as $$ begin if condition is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
create function public.test_denied(statement text,label text,expected_state text default '42501') returns void language plpgsql as $$
declare denied boolean:=false; actual_state text;
begin
  begin execute statement; exception when others then get stacked diagnostics actual_state=returned_sqlstate; denied:=actual_state=any(string_to_array(expected_state,',')); end;
  perform public.test_assert(denied,format('%s (expected SQLSTATE %s, received %s)',label,expected_state,coalesce(actual_state,'no error')));
end $$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.team_create_organization('Organization A',2027,'Owner A') as org_a \gset
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select public.team_create_organization('Organization B',2027,'Owner B') as org_b \gset
select public.team_command(:'org_b','department','{"expected_version":1,"name":"Department B"}');
select (public.team_snapshot(:'org_b')->'departments'->0->>'id') as department_b \gset
select (public.team_snapshot(:'org_b')->'members'->0->>'id') as member_b \gset
select (public.team_snapshot(:'org_b')->'types'->0->>'id') as type_b \gset
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.test_assert(jsonb_array_length(public.team_list_organizations())=1,'owner sees own organization only');
select public.test_assert((select count(*) from public.team_organizations)=1,'RLS hides other tenant organization');
select public.test_denied(format('select public.team_snapshot(%L)',:'org_b'),'RPC denies other tenant');
select public.test_denied(format('update public.team_organizations set name=''attack'' where id=%L',:'org_a'),'direct writes denied');
select public.test_denied(format('insert into public.team_memberships values(%L,auth.uid(),''owner'',null)',:'org_b'),'cannot self-enrol as owner');
select public.team_command(:'org_a','member',jsonb_build_object('expected_version',1,'label','Employee A'));
select public.team_command(:'org_a','member',jsonb_build_object('expected_version',2,'label','Manager A'));
select (public.team_snapshot(:'org_a')->'members'->0->>'id') as employee_member \gset
select (public.team_snapshot(:'org_a')->'members'->1->>'id') as manager_member \gset
select (public.team_snapshot(:'org_a')->'members'->2->>'id') as owner_member \gset
select (public.team_snapshot(:'org_a')->'types'->0->>'id') as type_a \gset
select public.test_denied(format('select public.team_command(%L,''member'',%L::jsonb)',:'org_a',jsonb_build_object('expected_version',3,'label','Cross tenant','department_id',:'department_b')::text),'composite tenant foreign key rejects foreign department','23503');
select public.test_denied(format('select public.team_command(%L,''leave'',%L::jsonb)',:'org_a',jsonb_build_object('expected_version',3,'member_id',:'member_b','type_id',:'type_a','start_date','2027-07-01','end_date','2027-07-10','status','approved')::text),'foreign member rejected','P0001');
select public.test_denied(format('select public.team_command(%L,''leave'',%L::jsonb)',:'org_a',jsonb_build_object('expected_version',3,'member_id',:'employee_member','type_id',:'type_b','start_date','2027-07-01','end_date','2027-07-10','status','approved')::text),'foreign absence type rejected','23503');
select public.team_command(:'org_a','invite',jsonb_build_object('expected_version',3,'member_id',:'employee_member','role','employee','email','employee@example.test'))->>'token' as employee_token \gset
select public.team_command(:'org_a','invite',jsonb_build_object('expected_version',4,'member_id',:'manager_member','role','manager','email','manager@example.test'))->>'token' as manager_token \gset
select public.test_assert(not(public.team_snapshot(:'org_a')::text like '%token_hash%'),'snapshot never exposes invite token hashes');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000005';
select public.test_denied(format('select public.team_accept_invite(%L)',:'employee_token'),'invitation is email bound','P0001');
select public.test_assert((select count(*) from public.team_members)=0,'outsider sees no member data');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select public.team_accept_invite(:'employee_token');
select public.test_denied(format('select public.team_accept_invite(%L)',:'employee_token'),'invitation cannot be replayed','P0001');
select public.test_denied(format('select public.team_command(%L,''settings'',%L::jsonb)',:'org_a','{"expected_version":6,"name":"Attack","calendar_year":2028,"min_coverage":0,"include_holidays":false}'),'employee cannot change organization settings');
select public.test_denied(format('select public.team_command(%L,''role'',%L::jsonb)',:'org_a','{"expected_version":6,"user_id":"00000000-0000-0000-0000-000000000004","role":"manager"}'),'employee cannot escalate role');
select public.test_denied(format('select public.team_command(%L,''leave'',%L::jsonb)',:'org_a',jsonb_build_object('expected_version',6,'member_id',:'employee_member','type_id',:'type_a','start_date','2027-07-01','end_date','2027-07-10','status','approved')::text),'employee cannot self approve');
select public.test_denied(format('select public.team_command(%L,''leave'',%L::jsonb)',:'org_a',jsonb_build_object('expected_version',6,'member_id',:'owner_member','type_id',:'type_a','start_date','2027-07-01','end_date','2027-07-10','status','pending')::text),'employee cannot edit another member');
select public.team_command(:'org_a','leave',jsonb_build_object('expected_version',6,'member_id',:'employee_member','type_id',:'type_a','start_date','2027-07-01','end_date','2027-07-10','status','pending'));
select (public.team_snapshot(:'org_a')->'leaves'->0->>'id') as employee_leave \gset
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.team_accept_invite(:'manager_token');
select public.test_denied(format('select public.team_command(%L,''invite'',%L::jsonb)',:'org_a','{"expected_version":8}'),'manager cannot grant access');
select public.test_denied(format('select public.team_command(%L,''delete_organization'',%L::jsonb)',:'org_b','{"expected_version":1}'),'manager cannot delete another tenant');
select public.team_command(:'org_a','leave',jsonb_build_object('expected_version',8,'id',:'employee_leave','member_id',:'employee_member','type_id',:'type_a','start_date','2027-07-01','end_date','2027-07-10','status','approved'));
select public.team_command(:'org_a','leave',jsonb_build_object('expected_version',9,'member_id',:'manager_member','type_id',:'type_a','start_date','2027-07-01','end_date','2027-07-10','status','approved'));
select public.test_assert((select count(*) from public.team_leaves)=2,'manager can read own tenant leave reasons');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select public.test_assert((select count(*) from public.team_leaves)=1,'employee direct reads reveal own reasons only');
select public.test_assert((select count(*) from jsonb_array_elements(public.team_snapshot(:'org_a')->'leaves') l where l->>'member_id'<>:'employee_member' and l->>'type_id' is not null)=0,'shared availability redacts coworkers absence types');
select public.test_denied(format('select public.team_command(%L,''remove_leave'',%L::jsonb)',:'org_a',jsonb_build_object('expected_version',10,'id',:'employee_leave')::text),'employee cannot delete approved leave');
select public.test_denied(format('select public.team_command(%L,''leave'',%L::jsonb)',:'org_a',jsonb_build_object('expected_version',10,'id',:'employee_leave','member_id',:'employee_member','type_id',:'type_a','start_date','2027-07-01','end_date','2027-07-10','status','pending')::text),'employee cannot rewrite approved leave');
select public.test_denied(format('select public.team_command(%L,''remove_leave'',%L::jsonb)',:'org_a',jsonb_build_object('expected_version',9,'id',:'employee_leave')::text),'stale writes rejected','40001');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.test_denied(format('select public.team_command(%L,''role'',%L::jsonb)',:'org_a','{"expected_version":10,"user_id":"00000000-0000-0000-0000-000000000001","role":"employee"}'),'last owner cannot be demoted','P0001');
select public.team_command(:'org_a','revoke_access','{"expected_version":10,"user_id":"00000000-0000-0000-0000-000000000004"}');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select public.test_denied(format('select public.team_snapshot(%L)',:'org_a'),'revoked membership loses access immediately');
select public.test_assert((select count(*) from public.team_leaves)=0,'revocation affects RLS without JWT refresh');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000006';
select public.test_denied('select public.team_create_organization(''Attack'',2027,''Unconfirmed'')','unconfirmed account cannot create organization');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.team_command(:'org_a','member','{"expected_version":11,"label":"Late invite"}');
select (public.team_snapshot(:'org_a')->'members'->1->>'id') as late_member \gset
select public.team_command(:'org_a','invite',jsonb_build_object('expected_version',12,'member_id',:'late_member','role','employee','email','outsider@example.test'))->>'token' as late_token \gset
reset role;
update public.team_invites set expires_at=now()-interval '1 hour' where token_hash=extensions.digest(:'late_token','sha256');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000005';
select public.test_denied(format('select public.team_accept_invite(%L)',:'late_token'),'expired invitation denied','P0001');
reset role;
set role anon;
select public.test_denied('select public.team_list_organizations()','anonymous RPC denied');
select public.test_denied('select * from public.team_members','anonymous table access denied');
reset role;
select public.test_assert(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.proname like 'team_%' and p.prosecdef and not('search_path=""'=any(p.proconfig))),'definer functions have pinned empty search path');
