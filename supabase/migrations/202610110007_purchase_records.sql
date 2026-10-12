-- Guest purchase records and invoice outbox. Never browser-readable, including
-- organization owners. No raw provider payloads, calendar data or card data.
create schema if not exists private;
create table private.commerce_purchases (
  order_id uuid primary key,
  provider text not null check (provider = 'polar'),
  environment text not null check (environment in ('production','sandbox')),
  customer_id uuid not null,
  checkout_id uuid not null,
  product_id text not null check (product_id = 'company-calendar'),
  provider_product_id uuid not null,
  price_id uuid not null,
  contract_id uuid not null,
  calendar_year integer not null check (calendar_year between 2020 and 2100),
  email text not null check (length(email) <= 254 and email !~ E'[\n\r]' and email like '%@%'),
  billing_name text check (length(billing_name) <= 300),
  billing_address jsonb not null default '{}',
  tax_id jsonb,
  currency text not null check (currency = 'EUR'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  tax_cents integer not null check (tax_cents >= 0),
  total_cents integer not null check (total_cents > 0),
  refunded_cents integer not null check (refunded_cents >= 0),
  invoice_number text,
  purchased_at timestamptz not null,
  provider_updated_at timestamptz not null,
  marketing_consent boolean not null default false,
  marketing_consent_version text,
  marketing_consent_at timestamptz,
  marketing_revoked_at timestamptz,
  recorded_at timestamptz not null default now(),
  constraint explicit_marketing_consent check (not marketing_consent or
    (marketing_consent_version = 'planning-offers-fi-v1' and marketing_consent_at is not null))
);
create index commerce_purchases_customer on private.commerce_purchases(customer_id);
create index commerce_purchases_email on private.commerce_purchases(email);

create table private.commerce_invoice_outbox (
  order_id uuid primary key references private.commerce_purchases(order_id),
  status text not null default 'pending' check (status in ('pending','processing','sent','cancelled')),
  attempts integer not null default 0,
  claim_token uuid,
  lease_until timestamptz,
  submitted_at timestamptz,
  message_id text,
  last_error_code text,
  updated_at timestamptz not null default now()
);
alter table private.commerce_purchases enable row level security;
alter table private.commerce_invoice_outbox enable row level security;
revoke all on private.commerce_purchases,private.commerce_invoice_outbox from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert,update,delete on private.commerce_purchases,private.commerce_invoice_outbox to service_role;

create function public.commerce_record_purchase(p_record jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare r private.commerce_purchases;
begin
  if octet_length(p_record::text) > 16384 then raise exception 'record too large'; end if;
  r := jsonb_populate_record(null::private.commerce_purchases,p_record);
  insert into private.commerce_purchases (
    order_id,provider,environment,customer_id,checkout_id,product_id,provider_product_id,
    price_id,contract_id,calendar_year,email,billing_name,billing_address,tax_id,currency,
    subtotal_cents,tax_cents,total_cents,refunded_cents,invoice_number,purchased_at,
    provider_updated_at,marketing_consent,marketing_consent_version,marketing_consent_at
  ) values (
    r.order_id,r.provider,r.environment,r.customer_id,r.checkout_id,r.product_id,r.provider_product_id,
    r.price_id,r.contract_id,r.calendar_year,lower(r.email),r.billing_name,r.billing_address,r.tax_id,r.currency,
    r.subtotal_cents,r.tax_cents,r.total_cents,r.refunded_cents,r.invoice_number,r.purchased_at,
    r.provider_updated_at,coalesce(r.marketing_consent,false),r.marketing_consent_version,r.marketing_consent_at
  ) on conflict (order_id) do update set
    email=excluded.email,billing_name=excluded.billing_name,billing_address=excluded.billing_address,
    tax_id=excluded.tax_id,refunded_cents=excluded.refunded_cents,invoice_number=excluded.invoice_number,
    provider_updated_at=excluded.provider_updated_at
    -- Existing consent (including withdrawal) cannot be overwritten by retries.
    where excluded.provider_updated_at >= private.commerce_purchases.provider_updated_at;
  insert into private.commerce_invoice_outbox(order_id) values(r.order_id) on conflict do nothing;
  update private.commerce_invoice_outbox o set status='cancelled',claim_token=null,lease_until=null,updated_at=now()
    from private.commerce_purchases p where p.order_id=o.order_id and p.order_id=r.order_id
      and p.refunded_cents >= p.total_cents and o.status <> 'sent';
  return true;
end $$;

create function public.commerce_invoice_claim(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare job private.commerce_invoice_outbox; token uuid;
begin
  select * into job from private.commerce_invoice_outbox where order_id=p_order_id for update;
  if not found then raise exception 'unknown order'; end if;
  if job.status in ('sent','cancelled') then return jsonb_build_object('status',job.status); end if;
  if job.status='processing' and job.lease_until > now() then return jsonb_build_object('status','busy'); end if;
  token := gen_random_uuid();
  update private.commerce_invoice_outbox set status='processing',claim_token=token,
    lease_until=now()+interval '3 minutes',attempts=attempts+1,updated_at=now() where order_id=p_order_id;
  return jsonb_build_object('status','claimed','token',token);
end $$;

create function public.commerce_invoice_complete(p_order_id uuid,p_token uuid,p_message_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if length(p_message_id) > 200 or p_message_id is null then raise exception 'invalid message'; end if;
  update private.commerce_invoice_outbox set status='sent',submitted_at=now(),message_id=p_message_id,
    claim_token=null,lease_until=null,last_error_code=null,updated_at=now()
    where order_id=p_order_id and claim_token=p_token and status='processing';
  if not found then raise exception 'stale claim'; end if;
  return true;
end $$;

create function public.commerce_invoice_release(p_order_id uuid,p_token uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update private.commerce_invoice_outbox set status='pending',claim_token=null,lease_until=null,
    last_error_code='invoice_delivery_pending',updated_at=now()
    where order_id=p_order_id and claim_token=p_token and status='processing';
  return found;
end $$;

create function public.commerce_revoke_marketing(p_email text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update private.commerce_purchases set marketing_revoked_at=now() where email=lower(p_email);
  return found;
end $$;

revoke all on function public.commerce_record_purchase(jsonb),public.commerce_invoice_claim(uuid),
  public.commerce_invoice_complete(uuid,uuid,text),public.commerce_invoice_release(uuid,uuid),
  public.commerce_revoke_marketing(text) from public,anon,authenticated;
grant execute on function public.commerce_record_purchase(jsonb),public.commerce_invoice_claim(uuid),
  public.commerce_invoice_complete(uuid,uuid,text),public.commerce_invoice_release(uuid,uuid),
  public.commerce_revoke_marketing(text) to service_role;
