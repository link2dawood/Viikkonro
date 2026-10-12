select public.test_assert(not has_table_privilege('anon','private.commerce_purchases','select'),'anonymous purchase records inaccessible');
select public.test_assert(not has_table_privilege('authenticated','private.commerce_purchases','select'),'authenticated users cannot read guest customers');
select public.test_assert(not has_table_privilege('authenticated','private.commerce_invoice_outbox','update'),'browser cannot change delivery status');
select public.test_assert((select relrowsecurity from pg_class where oid='private.commerce_purchases'::regclass),'purchase records have RLS');
select public.test_assert(not has_function_privilege('anon','public.commerce_record_purchase(jsonb)','execute'),'anonymous cannot forge purchases');
select public.test_assert(not has_function_privilege('authenticated','public.commerce_invoice_claim(uuid)','execute'),'organization owners cannot send customer invoices');
set role authenticated;
select public.test_denied('select public.commerce_record_purchase(''{}''::jsonb)','actual browser RPC cannot forge purchase');
select public.test_denied('select * from private.commerce_purchases','actual browser query cannot list contacts');
select public.test_denied('select public.commerce_revoke_marketing(''buyer@example.test'')','browser cannot change another customer consent');
reset role;

select jsonb_build_object(
 'order_id','10000000-0000-4000-8000-000000000001','provider','polar','environment','production',
 'customer_id','20000000-0000-4000-8000-000000000001','checkout_id','30000000-0000-4000-8000-000000000001',
 'product_id','company-calendar','provider_product_id','40000000-0000-4000-8000-000000000001',
 'price_id','50000000-0000-4000-8000-000000000001','contract_id','60000000-0000-4000-8000-000000000001',
 'calendar_year',2027,'email','buyer@example.test','billing_address','{}'::jsonb,'currency','EUR',
 'subtotal_cents',2311,'tax_cents',589,'total_cents',2900,'refunded_cents',0,
 'purchased_at','2026-10-11T12:00:00Z','provider_updated_at','2026-10-11T12:00:00Z'
) as purchase_fixture \gset
set role service_role;
select public.test_denied(format('select public.commerce_record_purchase(%L::jsonb)',
  (:'purchase_fixture'::jsonb || '{"marketing_consent":true,"marketing_consent_at":"2026-10-11T12:00:00Z"}')::text),
  'NULL consent version is rejected at database boundary','23514');
select public.commerce_record_purchase(:'purchase_fixture'::jsonb);
select public.commerce_record_purchase(:'purchase_fixture'::jsonb);
reset role;
select public.test_assert((select count(*) from private.commerce_purchases)=1,'webhook replay creates one purchase');
select public.test_assert((select count(*) from private.commerce_invoice_outbox)=1,'webhook replay creates one invoice job');
select public.test_assert((select not marketing_consent from private.commerce_purchases limit 1),'no promotional consent by default');
set role service_role;
select public.commerce_invoice_claim('10000000-0000-4000-8000-000000000001')->>'token' as invoice_token \gset
select public.test_assert(public.commerce_invoice_claim('10000000-0000-4000-8000-000000000001')->>'status'='busy','concurrent invoice claim is denied');
select public.test_denied('select public.commerce_invoice_complete(''10000000-0000-4000-8000-000000000001'',''90000000-0000-4000-8000-000000000001'',''message'')','stale claim cannot mark invoice sent','P0001');
select public.commerce_invoice_release('10000000-0000-4000-8000-000000000001',:'invoice_token');
select public.commerce_invoice_claim('10000000-0000-4000-8000-000000000001')->>'token' as invoice_token \gset
select public.commerce_invoice_complete('10000000-0000-4000-8000-000000000001',:'invoice_token','test-message');
select public.test_assert(public.commerce_invoice_claim('10000000-0000-4000-8000-000000000001')->>'status'='sent','sent invoice is not resubmitted');
reset role;
select public.test_assert((select attempts=2 and submitted_at is not null from private.commerce_invoice_outbox limit 1),'failure retry and submission recorded');

set role service_role;
select public.commerce_record_purchase(:'purchase_fixture'::jsonb || '{"order_id":"10000000-0000-4000-8000-000000000002","marketing_consent":true,"marketing_consent_version":"planning-offers-fi-v1","marketing_consent_at":"2026-10-11T11:59:00Z"}');
select public.commerce_revoke_marketing('buyer@example.test');
select public.commerce_record_purchase(:'purchase_fixture'::jsonb || '{"order_id":"10000000-0000-4000-8000-000000000002","marketing_consent":true,"marketing_consent_version":"planning-offers-fi-v1","marketing_consent_at":"2026-10-11T11:59:00Z"}');
reset role;
select public.test_assert((select marketing_revoked_at is not null from private.commerce_purchases where order_id='10000000-0000-4000-8000-000000000002'),'webhook replay cannot reverse consent withdrawal');
select public.test_assert((select marketing_consent_version='planning-offers-fi-v1' from private.commerce_purchases where order_id='10000000-0000-4000-8000-000000000002'),'consent version retained');
set role service_role;
select public.commerce_record_purchase(:'purchase_fixture'::jsonb || '{"order_id":"10000000-0000-4000-8000-000000000002","refunded_cents":2900,"provider_updated_at":"2026-10-12T12:00:00Z"}');
select public.commerce_record_purchase(:'purchase_fixture'::jsonb || '{"order_id":"10000000-0000-4000-8000-000000000002"}');
reset role;
select public.test_assert((select refunded_cents=2900 from private.commerce_purchases where order_id='10000000-0000-4000-8000-000000000002'),'older delivery cannot undo refund');
set role service_role;
select public.test_assert(public.commerce_invoice_claim('10000000-0000-4000-8000-000000000002')->>'status'='cancelled','refund before sending cancels invoice email');
select public.commerce_record_purchase(:'purchase_fixture'::jsonb || '{"order_id":"10000000-0000-4000-8000-000000000003"}');
reset role;
