-- Server-owned billing state. Browser keys cannot read or mutate payment data.
create table private.billing_catalog (
  singleton boolean primary key default true check(singleton),
  configuration jsonb not null check(jsonb_typeof(configuration)='object')
);
insert into private.billing_catalog(configuration) values('{"version":1,"products":[],"plans":[]}');
create table private.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.team_organizations(id) on delete restrict,
  user_id uuid references auth.users(id) on delete restrict,
  check(num_nonnulls(organization_id,user_id)=1),
  unique(organization_id), unique(user_id)
);
create table private.billing_states (
  account_id uuid primary key references private.billing_accounts(id) on delete cascade,
  revision bigint not null default 0,
  state jsonb not null check(jsonb_typeof(state)='object' and octet_length(state::text)<=10485760)
);
create table private.billing_events (
  event_key text primary key check(length(event_key) between 1 and 260),
  account_id uuid not null references private.billing_accounts(id) on delete cascade,
  recorded_at timestamptz not null default clock_timestamp()
);
create table private.billing_usage (
  account_id uuid not null references private.billing_accounts(id) on delete cascade,
  product_id text not null, usage_key text not null,
  period text not null check(period in ('minute','month')),
  window_start timestamptz not null,
  used bigint not null check(used>=0),
  primary key(account_id,product_id,usage_key,period,window_start)
);
alter table private.billing_catalog enable row level security;
alter table private.billing_accounts enable row level security;
alter table private.billing_states enable row level security;
alter table private.billing_events enable row level security;
alter table private.billing_usage enable row level security;
revoke all on private.billing_catalog,private.billing_accounts,private.billing_states,private.billing_events,private.billing_usage from public,anon,authenticated,service_role;

create function public.billing_account_create(p_organization uuid,p_user uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
  insert into private.billing_accounts(organization_id,user_id) values(p_organization,p_user) returning id into target;
  insert into private.billing_states(account_id,state) values(target,jsonb_build_object('version',1,'accountId',target,'contracts','[]'::jsonb,'documents','[]'::jsonb,'trialUses','[]'::jsonb));
  return target;
end $$;
create function public.billing_catalog_get() returns jsonb
language sql stable security definer set search_path='' as $$ select configuration from private.billing_catalog where singleton $$;
create function public.billing_authorize(p_account uuid,p_actor uuid,p_permission text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from private.billing_accounts a join auth.users u on u.id=p_actor and u.email_confirmed_at is not null
    where a.id=p_account and p_permission in ('manage','read','entitlement') and
    (a.user_id=p_actor or exists(select 1 from public.team_memberships m where m.organization_id=a.organization_id and m.user_id=p_actor and
      (m.role='owner' or (m.role='manager' and p_permission in ('read','entitlement')) or (m.role='employee' and p_permission='entitlement')))
     or (p_permission='entitlement' and exists(select 1 from public.business_client_roles r join public.business_clients c on c.id=r.client_id where c.organization_id=a.organization_id and r.user_id=p_actor))))
$$;
create function public.billing_state_get(p_account uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  select jsonb_build_object('revision',revision,'state',state) into result from private.billing_states where account_id=p_account;
  if result is null then raise exception 'Billing account unavailable' using errcode='22023'; end if;
  return result;
end $$;
create function public.billing_state_commit(p_account uuid,p_revision bigint,p_state jsonb,p_event text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_revision bigint; old_account uuid;
begin
  select revision into current_revision from private.billing_states where account_id=p_account for update;
  if not found then raise exception 'Billing account unavailable' using errcode='22023'; end if;
  if p_event is not null then
    select account_id into old_account from private.billing_events where event_key=p_event;
    if found then
      if old_account<>p_account then raise exception 'Event account mismatch' using errcode='42501'; end if;
      return '{"status":"duplicate"}'::jsonb;
    end if;
  end if;
  if current_revision is distinct from p_revision then return '{"status":"conflict"}'::jsonb; end if;
  if jsonb_typeof(p_state) is distinct from 'object' or p_state->>'version' is distinct from '1' or p_state->>'accountId' is distinct from p_account::text or
    jsonb_typeof(p_state->'contracts') is distinct from 'array' or jsonb_typeof(p_state->'documents') is distinct from 'array' or jsonb_typeof(p_state->'trialUses') is distinct from 'array' then raise exception 'Billing state' using errcode='22023'; end if;
  if p_event is not null then insert into private.billing_events(event_key,account_id) values(p_event,p_account); end if;
  update private.billing_states set state=p_state,revision=revision+1 where account_id=p_account;
  return jsonb_build_object('status','ok','revision',current_revision+1);
end $$;
create function public.billing_usage_consume(p_account uuid,p_revision bigint,p_product text,p_key text,p_limits jsonb,p_amount integer,p_expires timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_revision bigint; instant timestamptz; item jsonb; start_at timestamptz; previous bigint; maximum bigint; rows jsonb:='[]'::jsonb;
begin
  select revision into current_revision from private.billing_states where account_id=p_account for update;
  if not found then raise exception 'Billing account unavailable' using errcode='22023'; end if;
  if current_revision is distinct from p_revision then return '{"status":"conflict"}'::jsonb; end if;
  instant:=clock_timestamp();
  if p_expires is null or p_expires<=instant then return '{"status":"not_entitled"}'::jsonb; end if;
  if p_amount is null or p_amount not between 1 and 1000000 or p_product is null or p_product!~'^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$' or p_key is null or p_key!~'^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$' or
    jsonb_typeof(p_limits) is distinct from 'array' then raise exception 'Usage parameters' using errcode='22023'; end if;
  if jsonb_array_length(p_limits) not between 1 and 2 or (select count(distinct e->>'period') from jsonb_array_elements(p_limits) e)<>jsonb_array_length(p_limits) then raise exception 'Usage limits' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(p_limits) loop
    if item->>'period' not in ('minute','month') or item->>'period' is null or item->>'max' is null then raise exception 'Usage period' using errcode='22023'; end if;
    maximum:=(item->>'max')::bigint;
    if maximum not between 0 and 1000000000 then raise exception 'Usage max' using errcode='22023'; end if;
    start_at:=date_trunc(item->>'period',instant at time zone 'UTC') at time zone 'UTC';
    select used into previous from private.billing_usage where account_id=p_account and product_id=p_product and usage_key=p_key and period=item->>'period' and window_start=start_at;
    previous:=coalesce(previous,0);
    if previous+p_amount>maximum then return jsonb_build_object('status','usage_limit','period',item->>'period','limit',maximum,'used',previous); end if;
    rows:=rows||jsonb_build_array(jsonb_build_object('period',item->>'period','max',maximum,'used',previous+p_amount,'start',start_at));
  end loop;
  for item in select value from jsonb_array_elements(rows) loop
    insert into private.billing_usage(account_id,product_id,usage_key,period,window_start,used) values(p_account,p_product,p_key,item->>'period',(item->>'start')::timestamptz,(item->>'used')::bigint)
      on conflict(account_id,product_id,usage_key,period,window_start) do update set used=excluded.used;
  end loop;
  return jsonb_build_object('status','ok','windows',rows);
end $$;
revoke all on function public.billing_account_create(uuid,uuid),public.billing_catalog_get(),public.billing_authorize(uuid,uuid,text),public.billing_state_get(uuid),public.billing_state_commit(uuid,bigint,jsonb,text),public.billing_usage_consume(uuid,bigint,text,text,jsonb,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.billing_account_create(uuid,uuid),public.billing_catalog_get(),public.billing_authorize(uuid,uuid,text),public.billing_state_get(uuid),public.billing_state_commit(uuid,bigint,jsonb,text),public.billing_usage_consume(uuid,bigint,text,text,jsonb,integer,timestamptz) to service_role;
