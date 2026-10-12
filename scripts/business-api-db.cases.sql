-- Run only inside the disposable cluster created by team-db.cases.mjs.
select public.test_assert(not has_function_privilege('anon','public.business_api_consume(text,text)','execute'),'anonymous cannot bypass API gateway');
select public.test_assert(not has_function_privilege('authenticated','public.business_api_issue(text)','execute'),'authenticated users cannot issue keys');
select public.test_assert(not has_function_privilege('authenticated','public.business_api_revoke(uuid)','execute'),'authenticated users cannot revoke keys');
select public.test_assert(not has_table_privilege('service_role','private.business_api_keys','select'),'service gateway cannot read key table directly');
select public.test_assert(not has_table_privilege('authenticated','private.business_api_usage','select'),'usage is not publicly readable');
set role service_role;
select public.business_api_issue('Test integration') as issued \gset
select (:'issued'::jsonb->>'id') as key_id, (:'issued'::jsonb->>'key') as raw_key \gset
reset role;
select encode(extensions.digest(:'raw_key','sha256'),'hex') as key_hash \gset
select public.test_assert((select key_hash=:'key_hash' and key_hash <> :'raw_key' from private.business_api_keys where id=:'key_id'),'only key digest stored');
update private.business_api_keys set minute_limit=2,month_limit=3 where id=:'key_id';
set role service_role;
select public.business_api_consume(:'key_hash','week') as first \gset
select public.business_api_consume(:'key_hash','holidays') as second \gset
select public.business_api_consume(:'key_hash','week') as limited \gset
reset role;
select public.test_assert(:'first'::jsonb->>'status'='ok' and (:'first'::jsonb->>'minuteRemaining')::int=1,'first request atomically counted');
select public.test_assert(:'second'::jsonb->>'status'='ok','second request succeeds');
select public.test_assert(:'limited'::jsonb->>'status'='rate_limit','minute limit enforced');
select public.test_assert((select month_used=2 from private.business_api_keys where id=:'key_id'),'rejected requests do not consume successful quota');
update private.business_api_keys set minute_start=now()-interval '2 minutes' where id=:'key_id';
set role service_role;
select public.business_api_consume(:'key_hash','calendar') as third \gset
select public.business_api_consume(:'key_hash','week') as monthly \gset
reset role;
select public.test_assert(:'third'::jsonb->>'status'='ok','minute window resets');
select public.test_assert(:'monthly'::jsonb->>'status'='usage_limit','monthly quota enforced across endpoints');
select public.test_assert((select sum(requests)=3 from private.business_api_usage where key_id=:'key_id'),'usage aggregates match accepted requests');
update private.business_api_keys set month_start='2000-01-01',minute_start=now()-interval '2 minutes' where id=:'key_id';
set role service_role;
select public.business_api_consume(:'key_hash','week') as reset_month \gset
select public.business_api_consume(repeat('a',64),'week') as unknown_key \gset
select public.business_api_consume(:'key_hash','team_snapshot') as unknown_endpoint \gset
select public.business_api_revoke(:'key_id');
select public.business_api_consume(:'key_hash','week') as revoked \gset
reset role;
select public.test_assert(:'reset_month'::jsonb->>'status'='ok','month window resets');
select public.test_assert(:'unknown_key'::jsonb->>'status'='invalid_key','unknown keys rejected');
select public.test_assert(:'unknown_endpoint'::jsonb->>'status'='invalid_key','private endpoint names rejected');
select public.test_assert(:'revoked'::jsonb->>'status'='invalid_key','revocation immediate');
update private.business_api_keys set enabled=true,expires_at=now()-interval '1 second' where id=:'key_id';
set role service_role;
select public.business_api_consume(:'key_hash','week') as expired \gset
reset role;
select public.test_assert(:'expired'::jsonb->>'status'='invalid_key','expiration enforced by database clock');
delete from private.business_api_keys where id=:'key_id';
select public.test_assert((select count(*)=0 from private.business_api_usage where key_id=:'key_id'),'deleting key deletes its usage');
