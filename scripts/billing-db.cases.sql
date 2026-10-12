select id as billing_firm_a from public.team_organizations where name='Accounting Firm A' \gset
select id as billing_firm_b from public.team_organizations where name='Accounting Firm B' \gset
set role service_role;
select public.billing_account_create(:'billing_firm_a',null) as billing_a \gset
select public.billing_account_create(:'billing_firm_b',null) as billing_b \gset
select public.billing_account_create(null,'00000000-0000-0000-0000-000000000001') as billing_person \gset
select public.test_assert(public.billing_authorize(:'billing_a','00000000-0000-0000-0000-000000000001','manage'),'firm owner can manage billing');
select public.test_assert(not public.billing_authorize(:'billing_a','00000000-0000-0000-0000-000000000002','read'),'other firm cannot read billing');
select public.test_assert(public.billing_authorize(:'billing_a','00000000-0000-0000-0000-000000000003','read'),'manager can read billing');
select public.test_assert(not public.billing_authorize(:'billing_a','00000000-0000-0000-0000-000000000003','manage'),'manager cannot charge or refund');
select public.test_assert(not public.billing_authorize(:'billing_a','00000000-0000-0000-0000-000000000004','read'),'revoked client cannot read firm invoices');
select public.test_assert(not public.billing_authorize(:'billing_person','00000000-0000-0000-0000-000000000002','manage'),'personal account not transferable by caller');
select public.test_assert(not public.billing_authorize(:'billing_person','00000000-0000-0000-0000-000000000006','entitlement'),'unconfirmed account denied');
select public.test_assert(jsonb_array_length(public.billing_catalog_get()->'plans')=0,'migration launches no prices');
select public.test_assert((public.billing_state_commit(:'billing_a',0,jsonb_build_object('version',1,'accountId',:'billing_a','contracts','[]'::jsonb,'documents','[]'::jsonb,'trialUses','[]'::jsonb),'provider:event-1')->>'status')='ok','verified server event committed');
select public.test_assert((public.billing_state_commit(:'billing_a',0,jsonb_build_object('version',1,'accountId',:'billing_a','contracts','[]'::jsonb,'documents','[]'::jsonb,'trialUses','[]'::jsonb),'provider:event-1')->>'status')='duplicate','duplicate event cannot replay');
select public.test_assert((public.billing_state_commit(:'billing_a',0,jsonb_build_object('version',1,'accountId',:'billing_a','contracts','[]'::jsonb,'documents','[]'::jsonb,'trialUses','[]'::jsonb),null)->>'status')='conflict','stale billing state rejected');
select public.test_denied(format('select public.billing_state_commit(%L,0,%L::jsonb,%L)',:'billing_b',jsonb_build_object('version',1,'accountId',:'billing_b','contracts','[]'::jsonb,'documents','[]'::jsonb,'trialUses','[]'::jsonb)::text,'provider:event-1'),'verified event cannot move to another account');
select public.test_assert((public.billing_usage_consume(:'billing_a',1,'business-calendar-api','requests','[{"period":"minute","max":2},{"period":"month","max":3}]',2,clock_timestamp()+interval '1 day')->>'status')='ok','server consumes API minute and month quota');
select public.test_assert((public.billing_usage_consume(:'billing_a',1,'business-calendar-api','requests','[{"period":"minute","max":2},{"period":"month","max":3}]',2,clock_timestamp()+interval '1 day')->>'status')='usage_limit','API quota denied atomically');
select public.test_assert((public.billing_usage_consume(:'billing_b',0,'business-calendar-api','requests','[{"period":"minute","max":2},{"period":"month","max":3}]',1,clock_timestamp()+interval '1 day')->>'status')='ok','another account has independent limits');
select public.test_assert((public.billing_usage_consume(:'billing_a',0,'business-calendar-api','requests','[{"period":"minute","max":100}]',1,clock_timestamp()+interval '1 day')->>'status')='conflict','stale entitlement revision cannot increase limits');
select public.test_assert((public.billing_usage_consume(:'billing_a',1,'business-calendar-api','requests','[{"period":"minute","max":100}]',1,clock_timestamp()-interval '1 second')->>'status')='not_entitled','expiration rechecked after usage lock');
reset role;
select public.test_assert((select used from private.billing_usage where account_id=:'billing_a' and period='month')=2,'denied minute request does not consume monthly quota');
select public.test_denied(format('delete from public.team_organizations where id=%L',:'billing_firm_a'),'tenant deletion cannot silently erase billing records','23503');
set role authenticated;
select public.test_denied(format('select public.billing_state_get(%L)',:'billing_a'),'browser cannot read server ledger');
select public.test_denied('select public.billing_catalog_get()','browser cannot access unpublished prices');
select public.test_denied(format('select public.billing_authorize(%L,%L,%L)',:'billing_a','00000000-0000-0000-0000-000000000001','manage'),'browser cannot impersonate billing actor');
select public.test_denied('select * from private.billing_states','billing state has no browser table grants');
set role anon;
select public.test_denied(format('select public.billing_state_get(%L)',:'billing_b'),'anonymous cannot retrieve billing data');
reset role;
