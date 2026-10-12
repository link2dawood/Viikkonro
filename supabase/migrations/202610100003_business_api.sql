-- Independent API metering; no organization or private planner data is exposed.
create schema if not exists private;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table private.business_api_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text unique not null check (key_hash ~ '^[a-f0-9]{64}$'),
  label text not null check (length(trim(label)) between 1 and 100),
  tier text not null default 'free' check (tier in ('free','paid_preview')),
  enabled boolean not null default true,
  expires_at timestamptz not null default (now() + interval '90 days'),
  minute_limit integer not null default 30 check (minute_limit between 1 and 1000),
  month_limit integer not null default 10000 check (month_limit between 1 and 1000000),
  minute_start timestamptz, minute_used integer not null default 0,
  month_start date, month_used integer not null default 0,
  created_at timestamptz not null default now()
);
create table private.business_api_usage (
  key_id uuid not null references private.business_api_keys(id) on delete cascade,
  month date not null, endpoint text not null,
  requests bigint not null default 0,
  primary key(key_id,month,endpoint)
);
alter table private.business_api_keys enable row level security;
alter table private.business_api_usage enable row level security;
revoke all on private.business_api_keys, private.business_api_usage from public,anon,authenticated,service_role;

-- Operator provisions an expiring free key. The raw secret is returned once.
create function public.business_api_issue(p_label text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare secret text; key_id uuid;
begin
  secret := 'vnr_' || encode(extensions.gen_random_bytes(32),'hex');
  insert into private.business_api_keys(key_hash,label)
    values(encode(extensions.digest(secret,'sha256'),'hex'),p_label) returning id into key_id;
  return jsonb_build_object('id',key_id,'key',secret,'tier','free');
end $$;

create function public.business_api_revoke(p_id uuid) returns void
language sql security definer set search_path = '' as $$
  update private.business_api_keys set enabled=false where id=p_id;
$$;

create function public.business_api_consume(p_hash text,p_endpoint text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare k private.business_api_keys%rowtype; instant timestamptz; minute_at timestamptz; month_at date; retry integer;
begin
  if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_endpoint is null or
     p_endpoint not in ('calendar','holidays','working-days','week','paydays','flag-days','school-holidays') then
    return jsonb_build_object('status','invalid_key');
  end if;
  select * into k from private.business_api_keys where key_hash=p_hash for update;
  instant := clock_timestamp(); -- Read after the lock; concurrent workers share one clock/window.
  if not found or not k.enabled or k.expires_at <= instant then return jsonb_build_object('status','invalid_key'); end if;
  minute_at := date_trunc('minute',instant at time zone 'UTC') at time zone 'UTC';
  month_at := date_trunc('month',instant at time zone 'UTC')::date;
  if k.minute_start is distinct from minute_at then k.minute_start:=minute_at; k.minute_used:=0; end if;
  if k.month_start is distinct from month_at then k.month_start:=month_at; k.month_used:=0; end if;
  if k.month_used >= k.month_limit then
    retry := greatest(1,ceil(extract(epoch from ((month_at + interval '1 month') at time zone 'UTC')-instant))::integer);
    return jsonb_build_object('status','usage_limit','retryAfter',retry);
  end if;
  if k.minute_used >= k.minute_limit then
    retry := greatest(1,ceil(extract(epoch from (minute_at+interval '1 minute')-instant))::integer);
    return jsonb_build_object('status','rate_limit','retryAfter',retry);
  end if;
  update private.business_api_keys set minute_start=minute_at,minute_used=k.minute_used+1,
    month_start=month_at,month_used=k.month_used+1 where id=k.id;
  insert into private.business_api_usage(key_id,month,endpoint,requests) values(k.id,month_at,p_endpoint,1)
    on conflict(key_id,month,endpoint) do update set requests=private.business_api_usage.requests+1;
  return jsonb_build_object('status','ok','minuteLimit',k.minute_limit,'minuteRemaining',k.minute_limit-k.minute_used-1,
    'monthLimit',k.month_limit,'monthRemaining',k.month_limit-k.month_used-1);
end $$;

revoke all on function public.business_api_issue(text), public.business_api_revoke(uuid), public.business_api_consume(text,text) from public,anon,authenticated;
grant execute on function public.business_api_issue(text), public.business_api_revoke(uuid), public.business_api_consume(text,text) to service_role;
-- No checkout, billing provider or automatic paid entitlement is enabled.
