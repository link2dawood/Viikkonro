-- Additive client-company boundaries. Existing leave/shift permissions are unchanged.
create table public.business_firms (
  organization_id uuid primary key references public.team_organizations(id) on delete cascade,
  plan text not null default 'free_preview' check(plan='free_preview'),
  client_limit integer not null default 1000 check(client_limit between 1 and 1000)
);
create table public.business_clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.business_firms(organization_id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 80),
  version integer not null default 1,
  unique(organization_id,id)
);
create table public.business_client_roles (
  client_id uuid not null references public.business_clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check(role in ('client_admin','editor','viewer')),
  primary key(client_id,user_id)
);
create table public.business_calendars (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.business_clients(id) on delete cascade,
  year integer not null check(year between 2000 and 2100),
  configuration jsonb not null check(jsonb_typeof(configuration)='object' and octet_length(configuration::text)<=1048576),
  version integer not null default 1,
  unique(client_id,year), unique(client_id,id)
);
create table public.business_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.business_firms(organization_id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 80),
  configuration jsonb not null check(octet_length(configuration::text)<=20000),
  unique(organization_id,id)
);
create table public.business_audit (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.business_firms(organization_id) on delete cascade,
  client_id uuid, actor_id uuid, action text not null, target_id uuid,
  recorded_at timestamptz not null default clock_timestamp(),
  foreign key(organization_id,client_id) references public.business_clients(organization_id,id) on delete cascade
);
create table public.business_exports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.business_clients(id) on delete cascade,
  calendar_id uuid not null, actor_id uuid not null,
  calendar_version integer not null, format text not null check(format in ('pdf','xlsx','csv','ics')),
  artifact_sha256 text not null check(artifact_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'prepared' check(status='prepared'),
  recorded_at timestamptz not null default clock_timestamp(),
  foreign key(client_id,calendar_id) references public.business_calendars(client_id,id) on delete cascade
);
create index business_client_roles_user on public.business_client_roles(user_id);
create index business_clients_firm on public.business_clients(organization_id);
create index business_audit_client on public.business_audit(client_id,id desc);
create index business_exports_client on public.business_exports(client_id,recorded_at desc);

create function private.business_membership_audit() returns trigger language plpgsql security definer set search_path='' as $$
declare firm uuid; target uuid;
begin
  if tg_op='DELETE' then firm:=old.organization_id;target:=old.user_id; else firm:=new.organization_id;target:=new.user_id; end if;
  if exists(select 1 from public.business_firms where organization_id=firm) then
    insert into public.business_audit(organization_id,actor_id,action,target_id) values(firm,auth.uid(),'organization_access_'||lower(tg_op),target);
  end if;
  return null;
end $$;
revoke all on function private.business_membership_audit() from public,anon,authenticated;
create trigger business_membership_audit after insert or update or delete on public.team_memberships for each row execute function private.business_membership_audit();

create function private.business_role(p_client uuid) returns text language sql stable security definer set search_path='' as $$
  select case when private.team_role(c.organization_id)='owner' then 'firm_owner'
    when private.team_role(c.organization_id)='manager' then 'firm_manager' else r.role end
  from public.business_clients c left join public.business_client_roles r on r.client_id=c.id and r.user_id=auth.uid()
  join auth.users u on u.id=auth.uid() and u.email_confirmed_at is not null where c.id=p_client
$$;
revoke all on function private.business_role(uuid) from public,anon;
grant execute on function private.business_role(uuid) to authenticated;

alter table public.business_firms enable row level security;
alter table public.business_clients enable row level security;
alter table public.business_client_roles enable row level security;
alter table public.business_calendars enable row level security;
alter table public.business_templates enable row level security;
alter table public.business_audit enable row level security;
alter table public.business_exports enable row level security;
revoke all on public.business_firms,public.business_clients,public.business_client_roles,public.business_calendars,public.business_templates,public.business_audit,public.business_exports from public,anon,authenticated,service_role;
revoke all on sequence public.business_audit_id_seq from public,anon,authenticated,service_role;
grant select on public.business_firms,public.business_clients,public.business_client_roles,public.business_calendars,public.business_templates,public.business_audit,public.business_exports to authenticated;
create policy business_firm_read on public.business_firms for select to authenticated using(private.team_role(organization_id) in ('owner','manager'));
create policy business_client_read on public.business_clients for select to authenticated using(private.business_role(id) is not null);
create policy business_role_read on public.business_client_roles for select to authenticated using(private.business_role(client_id) in ('firm_owner','client_admin') or (user_id=auth.uid() and private.business_role(client_id) is not null));
create policy business_calendar_read on public.business_calendars for select to authenticated using(private.business_role(client_id) is not null);
create policy business_template_read on public.business_templates for select to authenticated using(private.team_role(organization_id) in ('owner','manager'));
create policy business_audit_read on public.business_audit for select to authenticated using(case when client_id is null then private.team_role(organization_id) in ('owner','manager') else private.business_role(client_id) is not null end);
create policy business_export_read on public.business_exports for select to authenticated using(private.business_role(client_id) is not null);

create function public.business_list() returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'firms',(select coalesce(jsonb_agg(jsonb_build_object('id',f.organization_id,'name',o.name,'role',private.team_role(f.organization_id),'plan',f.plan,'clientLimit',f.client_limit) order by o.name),'[]'::jsonb)
      from public.business_firms f join public.team_organizations o on o.id=f.organization_id where private.team_role(o.id) in ('owner','manager')),
    'clients',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'firmId',c.organization_id,'name',c.name,'role',private.business_role(c.id)) order by c.name),'[]'::jsonb)
      from public.business_clients c where private.business_role(c.id) is not null)
  )
$$;

create function public.business_firm_command(p_org uuid,p_action text,p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare access_role text; target uuid; config jsonb; limit_count integer;
begin
  perform 1 from public.team_organizations where id=p_org for update;
  access_role:=private.team_role(p_org);
  if access_role is null or access_role not in ('owner','manager') then raise exception 'Forbidden' using errcode='42501'; end if;
  if p_action='enable' then
    if access_role<>'owner' then raise exception 'Forbidden' using errcode='42501'; end if;
    insert into public.business_firms(organization_id) values(p_org) on conflict do nothing;
    target:=p_org;
  elsif p_action='create_client' then
    select client_limit into limit_count from public.business_firms where organization_id=p_org;
    if limit_count is null then raise exception 'Forbidden' using errcode='42501'; end if;
    if (select count(*) from public.business_clients where organization_id=p_org)>=limit_count then raise exception 'Client limit' using errcode='22023'; end if;
    insert into public.business_clients(organization_id,name) values(p_org,trim(p_data->>'name')) returning id into target;
  elsif p_action='save_template' then
    if not exists(select 1 from public.business_firms where organization_id=p_org) then raise exception 'Forbidden' using errcode='42501'; end if;
    if (select count(*) from public.business_templates where organization_id=p_org)>=100 then raise exception 'Template limit' using errcode='22023'; end if;
    config:=p_data->'configuration';
    if jsonb_typeof(config) is distinct from 'object' or config->>'version' is distinct from '1' then raise exception 'Configuration' using errcode='22023'; end if;
    -- Never copy names, logos, dates or custom events into a shared firm template.
    config:=jsonb_build_object('version',1,'year',2027,'dayRuleMode',config->'dayRuleMode','theme',config->'theme','layout',config->'layout',
      'include',jsonb_build_object('weekNumbers',true,'holidays',coalesce(config#>'{include,holidays}','true'::jsonb),'flagDays',coalesce(config#>'{include,flagDays}','false'::jsonb),'paydays',null,'schoolHolidays',null),
      'branding',jsonb_build_object('companyName','','logo',null,'primaryColor',config#>'{branding,primaryColor}','accentColor',config#>'{branding,accentColor}'),
      'events','[]'::jsonb,'periods','[]'::jsonb,'paydayDates','[]'::jsonb,'product',null);
    insert into public.business_templates(organization_id,name,configuration) values(p_org,trim(p_data->>'name'),config) returning id into target;
  elsif p_action='remove_template' then
    if access_role<>'owner' then raise exception 'Forbidden' using errcode='42501'; end if;
    delete from public.business_templates where organization_id=p_org and id=(p_data->>'id')::uuid returning id into target;
    if target is null then raise exception 'Forbidden' using errcode='42501'; end if;
  else raise exception 'Action' using errcode='22023'; end if;
  insert into public.business_audit(organization_id,client_id,actor_id,action,target_id) values(p_org,case when p_action='create_client' then target else null end,auth.uid(),p_action,target);
  return target;
end $$;

create function public.business_templates_list(p_org uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if private.team_role(p_org) is null or private.team_role(p_org) not in ('owner','manager') then raise exception 'Forbidden' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'configuration',configuration) order by name),'[]'::jsonb) from public.business_templates where organization_id=p_org);
end $$;

create function public.business_snapshot(p_client uuid,p_year integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare access_role text; firm uuid;
begin
  access_role:=private.business_role(p_client);
  if access_role is null then raise exception 'Forbidden' using errcode='42501'; end if;
  if p_year is null or p_year not between 2000 and 2100 then raise exception 'Year' using errcode='22023'; end if;
  select organization_id into firm from public.business_clients where id=p_client;
  return jsonb_build_object('role',access_role,'firmVersion',(select version from public.team_organizations where id=firm),
    'client',(select jsonb_build_object('id',id,'firmId',organization_id,'name',name,'version',version) from public.business_clients where id=p_client),
    'year',p_year,'calendar',(select jsonb_build_object('id',id,'version',version,'configuration',configuration) from public.business_calendars where client_id=p_client and year=p_year),
    'firmAudit',case when access_role in ('firm_owner','firm_manager') then (select coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) from (select id,actor_id,action,target_id,client_id,recorded_at from public.business_audit where organization_id=firm order by id desc limit 100) a) else '[]'::jsonb end,
    'access',case when access_role in ('firm_owner','client_admin') then (select coalesce(jsonb_agg(jsonb_build_object('userId',r.user_id,'role',r.role,'email',u.email)),'[]'::jsonb) from public.business_client_roles r join auth.users u on u.id=r.user_id where r.client_id=p_client) else '[]'::jsonb end,
    'audit',(select coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) from (select id,actor_id,action,target_id,recorded_at from public.business_audit where client_id=p_client order by id desc limit 100) a),
    'exports',(select coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) from (select id,actor_id,calendar_version,format,status,recorded_at from public.business_exports where client_id=p_client order by recorded_at desc limit 100) e)
  );
end $$;

create function public.business_client_command(p_client uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare firm uuid; access_role text; target uuid; calendar public.business_calendars%rowtype; target_role text; config jsonb; y integer;
begin
  select organization_id into firm from public.business_clients where id=p_client;
  if firm is null then raise exception 'Forbidden' using errcode='42501'; end if;
  -- Shared lock order makes organization revocation authoritative before every write.
  perform 1 from public.team_organizations where id=firm for update;
  perform 1 from public.business_clients where id=p_client for update;
  access_role:=private.business_role(p_client);
  if access_role is null then raise exception 'Forbidden' using errcode='42501'; end if;
  if p_action in ('grant_access','revoke_access') then
    if access_role not in ('firm_owner','client_admin') then raise exception 'Forbidden' using errcode='42501'; end if;
    if p_action='grant_access' then
      select id into target from auth.users where lower(email)=lower(trim(p_data->>'email')) and email_confirmed_at is not null;
      target_role:=p_data->>'role';
      if target is null or target_role is null or target_role not in ('client_admin','editor','viewer') then raise exception 'Access request' using errcode='22023'; end if;
    else target:=(p_data->>'userId')::uuid; end if;
    if access_role='client_admin' and (target=auth.uid() or target_role='client_admin' or exists(select 1 from public.business_client_roles where client_id=p_client and user_id=target and role='client_admin')) then raise exception 'Forbidden' using errcode='42501'; end if;
    if p_action='grant_access' and not exists(select 1 from public.business_client_roles where client_id=p_client and user_id=target) and (select count(*) from public.business_client_roles where client_id=p_client)>=1000 then raise exception 'Access limit' using errcode='22023'; end if;
    if p_action='grant_access' then insert into public.business_client_roles(client_id,user_id,role) values(p_client,target,target_role) on conflict(client_id,user_id) do update set role=excluded.role;
    else delete from public.business_client_roles where client_id=p_client and user_id=target; if not found then raise exception 'Forbidden' using errcode='42501'; end if; end if;
  elsif p_action in ('save_calendar','export_record') then
    y:=(p_data->>'year')::integer;
    if y is null or y not between 2000 and 2100 then raise exception 'Year' using errcode='22023'; end if;
    select * into calendar from public.business_calendars where client_id=p_client and year=y;
    if coalesce(calendar.version,0) is distinct from (p_data->>'expected_version')::integer then raise exception 'Stale calendar' using errcode='40001'; end if;
    if p_action='save_calendar' then
      if access_role='viewer' then raise exception 'Forbidden' using errcode='42501'; end if;
      config:=p_data->'configuration';
      if jsonb_typeof(config) is distinct from 'object' or config->>'version' is distinct from '1' or (config->>'year')::integer is distinct from y then raise exception 'Configuration' using errcode='22023'; end if;
      insert into public.business_calendars(client_id,year,configuration) values(p_client,y,config) on conflict(client_id,year) do update set configuration=excluded.configuration,version=public.business_calendars.version+1 returning id into target;
    else
      if calendar.id is null then raise exception 'Calendar required' using errcode='22023'; end if;
      insert into public.business_exports(client_id,calendar_id,actor_id,calendar_version,format,artifact_sha256) values(p_client,calendar.id,auth.uid(),calendar.version,p_data->>'format',p_data->>'sha256') returning id into target;
    end if;
  elsif p_action='delete_client' then
    if access_role<>'firm_owner' then raise exception 'Forbidden' using errcode='42501'; end if;
    delete from public.business_clients where id=p_client;
    insert into public.business_audit(organization_id,actor_id,action,target_id) values(firm,auth.uid(),p_action,p_client);
    return jsonb_build_object('deleted',true);
  else raise exception 'Action' using errcode='22023'; end if;
  update public.business_clients set version=version+1 where id=p_client;
  insert into public.business_audit(organization_id,client_id,actor_id,action,target_id) values(firm,p_client,auth.uid(),p_action,target);
  return jsonb_build_object('id',target);
end $$;
revoke all on function public.business_list(),public.business_firm_command(uuid,text,jsonb),public.business_templates_list(uuid),public.business_snapshot(uuid,integer),public.business_client_command(uuid,text,jsonb) from public,anon;
grant execute on function public.business_list(),public.business_firm_command(uuid,text,jsonb),public.business_templates_list(uuid),public.business_snapshot(uuid,integer),public.business_client_command(uuid,text,jsonb) to authenticated;
