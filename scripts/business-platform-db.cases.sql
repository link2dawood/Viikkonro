-- Dedicated firms preserve the older leave/shift concurrency fixtures.
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.team_create_organization('Accounting Firm A',2027,'Firm owner') as firm_a \gset
select public.business_firm_command(:'firm_a','enable','{}');
select public.business_firm_command(:'firm_a','create_client','{"name":"Client A"}') as client_a \gset
select public.business_firm_command(:'firm_a','create_client','{"name":"Client B"}') as client_b \gset
select public.business_client_command(:'client_a','grant_access','{"email":"employee@example.test","role":"client_admin"}');
select public.business_client_command(:'client_b','grant_access','{"email":"outsider@example.test","role":"viewer"}');
select public.business_client_command(:'client_a','save_calendar','{"year":2027,"expected_version":0,"configuration":{"version":1,"year":2027,"dayRuleMode":"FINLAND_WORKDAY","include":{"holidays":true,"flagDays":false},"branding":{"companyName":"PRIVATE CLIENT A","primaryColor":"#1f7a5c","logo":null},"theme":"classic","layout":{"id":"year-glance","paper":"A4"},"events":[{"id":"secret","date":"2027-06-01","title":"SECRET CLIENT A"}],"periods":[],"paydayDates":[]}}');
select public.business_firm_command(:'firm_a','save_template',jsonb_build_object('name','Common design','configuration',public.business_snapshot(:'client_a',2027)#>'{calendar,configuration}')) as template_a \gset
select public.test_assert((public.business_templates_list(:'firm_a')->0#>>'{configuration,branding,companyName}')='','template strips client name');
select public.test_assert(jsonb_array_length(public.business_templates_list(:'firm_a')->0#>'{configuration,events}')=0,'template strips client events');
select public.test_assert((public.business_templates_list(:'firm_a')->0#>'{configuration,branding,logo}')='null'::jsonb,'template strips client logo');
select public.test_assert((public.business_snapshot(:'client_a',2027)->>'role')='firm_owner','firm owner manages own clients');
select public.test_assert(jsonb_array_length(public.business_snapshot(:'client_a',2027)->'audit')>=2,'server records client actions');
select public.test_denied(format('update public.business_clients set name=%L where id=%L','Forged',:'client_a'),'direct client writes revoked');
select public.test_denied('delete from public.business_audit','audit tampering revoked');
select public.test_assert(not has_sequence_privilege('authenticated','public.business_audit_id_seq','UPDATE'),'audit sequence cannot be rewritten');
select public.test_assert(not has_sequence_privilege('anon','public.business_audit_id_seq','USAGE'),'anonymous cannot manipulate audit sequence');
select public.test_assert(not has_table_privilege('service_role','public.business_calendars','SELECT'),'unneeded server role has no direct calendar privilege');
select public.test_denied('update public.business_firms set client_limit=1000','billing entitlement cannot be changed by browser');

set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
select public.team_create_organization('Accounting Firm B',2027,'Other owner') as firm_b \gset
select public.business_firm_command(:'firm_b','enable','{}');
select public.business_firm_command(:'firm_b','create_client','{"name":"Client C"}') as client_c \gset
select public.test_denied(format('select public.business_snapshot(%L,2027)',:'client_a'),'other firm cannot read client');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_a','grant_access','{"email":"owner-b@example.test","role":"client_admin"}'),'other firm cannot grant itself access');
select public.test_denied(format('select public.business_templates_list(%L)',:'firm_a'),'other firm cannot read templates');
select public.test_denied(format('select public.business_firm_command(%L,%L,%L::jsonb)',:'firm_b','remove_template',jsonb_build_object('id',:'template_a')::text),'template ID cannot cross firm boundary');
select public.test_denied(format('select public.business_firm_command(%L,%L,%L::jsonb)',:'firm_a','remove_template',jsonb_build_object('id',:'template_a')::text),'other firm cannot remove template');
select public.test_assert((select count(*) from public.business_clients)=1,'RLS limits firm B to own company');
select public.test_assert((select count(*) from public.business_calendars)=0,'RLS hides firm A calendar');
select public.test_assert((select count(*) from public.business_audit where client_id=:'client_a')=0,'RLS hides other company audit');

set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select public.test_assert(jsonb_array_length(public.business_list()->'clients')=1,'client admin lists only assigned client');
select public.test_assert(jsonb_array_length(public.business_list()->'firms')=0,'client has no firm-level visibility');
select public.test_assert((public.business_snapshot(:'client_a',2027)->>'role')='client_admin','client admin role applies only to client A');
select public.test_assert(jsonb_array_length(public.business_snapshot(:'client_a',2027)->'firmAudit')=0,'client admin cannot see firm-wide audit');
select public.test_denied(format('select public.business_snapshot(%L,2027)',:'client_b'),'client A cannot access sibling company');
select public.test_assert((select count(*) from public.business_client_roles where client_id=:'client_b')=0,'RLS hides sibling access assignments');
select public.test_denied(format('select public.business_templates_list(%L)',:'firm_a'),'client cannot read firm template library');
select public.test_denied(format('select public.business_firm_command(%L,%L,%L::jsonb)',:'firm_a','create_client','{"name":"Escalation"}'),'client cannot create sibling');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_a','grant_access','{"email":"employee@example.test","role":"client_admin"}'),'client admin cannot rewrite own role');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_a','grant_access','{"email":"outsider@example.test","role":"client_admin"}'),'client admin cannot grant another admin');
select public.business_client_command(:'client_a','grant_access','{"email":"manager@example.test","role":"editor"}');

set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.test_assert((public.business_snapshot(:'client_a',2027)->>'role')='editor','client editor can access assigned calendar');
select public.test_denied(format('select public.business_snapshot(%L,2027)',:'client_c'),'client editor cannot access another firm');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_a','grant_access','{"email":"manager@example.test","role":"client_admin"}'),'editor cannot escalate permissions');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_a','save_calendar','{"year":2027,"expected_version":0,"configuration":{"version":1,"year":2027}}'),'stale calendar edit rejected','40001');
select public.business_client_command(:'client_a','export_record',jsonb_build_object('year',2027,'expected_version',1,'format','ics','sha256',repeat('a',64)));
select public.test_assert(jsonb_array_length(public.business_snapshot(:'client_a',2027)->'exports')=1,'authorized export preparation recorded');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_b','export_record',jsonb_build_object('year',2027,'expected_version',1,'format','ics','sha256',repeat('a',64))::text),'export cannot target another client');
select public.test_denied('insert into public.business_exports(client_id,calendar_id,actor_id,calendar_version,format,artifact_sha256) values(gen_random_uuid(),gen_random_uuid(),auth.uid(),1,''ics'',repeat(''a'',64))','direct export-history writes revoked');

set request.jwt.claim.sub='00000000-0000-0000-0000-000000000005';
select public.test_assert((public.business_snapshot(:'client_b',2027)->>'role')='viewer','client viewer reads assigned calendar');
select public.test_denied(format('select public.business_snapshot(%L,2027)',:'client_a'),'viewer cannot read client A data or history');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_b','save_calendar','{"year":2027,"expected_version":0,"configuration":{"version":1,"year":2027}}'),'viewer cannot save');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_b','delete_client','{}'),'viewer cannot delete company');
select public.test_assert((select count(*) from public.business_audit where client_id=:'client_a')=0,'viewer cannot see other client audit');
select public.test_assert((select count(*) from public.business_exports)=0,'viewer cannot see other client export history');

set request.jwt.claim.sub='00000000-0000-0000-0000-000000000006';
select public.test_assert(jsonb_array_length(public.business_list()->'clients')=0,'unverified user cannot list clients');
select public.test_denied(format('select public.business_snapshot(%L,2027)',:'client_a'),'unverified user denied private snapshot');
set role anon;
select public.test_denied('select public.business_list()','anonymous cannot enumerate firms');
reset role;
-- Restore verified owner; grant a firm manager without changing existing fixtures.
insert into public.team_members(organization_id,label) values(:'firm_a','Firm manager') returning id as manager_member \gset
insert into public.team_memberships(organization_id,user_id,role,member_id) values(:'firm_a','00000000-0000-0000-0000-000000000003','manager',:'manager_member');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.test_assert(jsonb_array_length(public.business_list()->'clients')=2,'firm manager sees own firm clients');
select public.test_assert((select count(*) from public.business_audit where organization_id=:'firm_a' and action='organization_access_insert')=1,'organization role assignment is audited');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_b','grant_access','{"email":"manager@example.test","role":"client_admin"}'),'firm manager cannot administer client roles');
select public.test_denied(format('select public.business_client_command(%L,%L,%L::jsonb)',:'client_b','delete_client','{}'),'firm manager cannot delete company');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.business_client_command(:'client_a','revoke_access','{"userId":"00000000-0000-0000-0000-000000000004"}');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
select public.test_denied(format('select public.business_snapshot(%L,2027)',:'client_a'),'client revocation immediately denies snapshot');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
select public.business_client_command(:'client_b','delete_client','{}');
select public.test_assert(jsonb_array_length(public.business_list()->'clients')=1,'client deletion preserves sibling');
select public.test_assert((public.business_snapshot(:'client_a',2027)#>>'{calendar,configuration,branding,companyName}')='PRIVATE CLIENT A','client A data preserved after sibling deletion');
reset role;
select public.test_assert((select count(*) from public.business_clients where id=:'client_c')=1,'client deletion preserves other firm');
