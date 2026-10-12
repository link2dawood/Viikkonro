-- All writes use checked, transactional RPCs. RLS protects direct reads too.
create schema if not exists private;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.team_organizations (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
  name text not null check (length(trim(name)) between 1 and 80),
  calendar_year integer not null check (calendar_year between 2000 and 2100),
  min_coverage integer not null default 1 check (min_coverage between 0 and 500),
  include_holidays boolean not null default true, version integer not null default 1
);
create table public.team_departments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.team_organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60), unique(organization_id,id)
);
create table public.team_members (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.team_organizations(id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 80), department_id uuid,
  job_role text not null default '' check (length(job_role)<=60), active boolean not null default true,
  unique(organization_id,id), foreign key(organization_id,department_id) references public.team_departments(organization_id,id)
);
create table public.team_memberships (
  organization_id uuid not null references public.team_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','employee')), member_id uuid,
  primary key(organization_id,user_id), unique(organization_id,member_id),
  foreign key(organization_id,member_id) references public.team_members(organization_id,id)
);
create table public.team_absence_types (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.team_organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  kind text not null check (kind in ('vacation','personal','custom')), unique(organization_id,id)
);
create table public.team_leaves (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.team_organizations(id) on delete cascade,
  member_id uuid not null, type_id uuid not null, start_date date not null, end_date date not null,
  status text not null check(status in ('pending','approved','rejected')),
  check(end_date>=start_date and end_date-start_date<400), unique(organization_id,id),
  foreign key(organization_id,member_id) references public.team_members(organization_id,id),
  foreign key(organization_id,type_id) references public.team_absence_types(organization_id,id)
);
create table public.team_closures (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.team_organizations(id) on delete cascade,
  label text not null check(length(trim(label)) between 1 and 80), start_date date not null, end_date date not null,
  check(end_date>=start_date and end_date-start_date<400), unique(organization_id,id)
);
create table public.team_invites (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.team_organizations(id) on delete cascade,
  email text not null check(length(email) between 3 and 254), member_id uuid not null,
  role text not null check(role in ('manager','employee')), token_hash bytea not null unique,
  expires_at timestamptz not null default (now()+interval '7 days'),
  foreign key(organization_id,member_id) references public.team_members(organization_id,id)
);
create index team_leaves_period on public.team_leaves(organization_id,start_date,end_date);
create index team_memberships_user on public.team_memberships(user_id);

create function private.team_role(org uuid) returns text language sql stable security definer set search_path='' as $$
  select m.role from public.team_memberships m join auth.users u on u.id=m.user_id
  where m.organization_id=org and m.user_id=(select auth.uid()) and u.email_confirmed_at is not null
$$;
create function private.team_member(org uuid) returns uuid language sql stable security definer set search_path='' as $$
  select m.member_id from public.team_memberships m where m.organization_id=org and m.user_id=(select auth.uid())
    and private.team_role(org) is not null
$$;
revoke all on function private.team_role(uuid), private.team_member(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.team_role(uuid), private.team_member(uuid) to authenticated;

alter table public.team_organizations enable row level security;
alter table public.team_departments enable row level security;
alter table public.team_members enable row level security;
alter table public.team_memberships enable row level security;
alter table public.team_absence_types enable row level security;
alter table public.team_leaves enable row level security;
alter table public.team_closures enable row level security;
alter table public.team_invites enable row level security;
create policy team_org_read on public.team_organizations for select to authenticated using(private.team_role(id) is not null);
create policy team_department_read on public.team_departments for select to authenticated using(private.team_role(organization_id) is not null);
create policy team_member_read on public.team_members for select to authenticated using(private.team_role(organization_id) is not null);
create policy team_membership_read on public.team_memberships for select to authenticated using(private.team_role(organization_id)='owner' or (user_id=auth.uid() and private.team_role(organization_id) is not null));
create policy team_type_read on public.team_absence_types for select to authenticated using(private.team_role(organization_id) is not null);
create policy team_leave_read on public.team_leaves for select to authenticated using(private.team_role(organization_id) in ('owner','manager') or member_id=private.team_member(organization_id));
create policy team_closure_read on public.team_closures for select to authenticated using(private.team_role(organization_id) is not null);
-- No direct invite reads, writes or public/anonymous access.
revoke all on public.team_organizations,public.team_departments,public.team_members,public.team_memberships,public.team_absence_types,public.team_leaves,public.team_closures,public.team_invites from public,anon,authenticated;
grant select on public.team_organizations,public.team_departments,public.team_members,public.team_memberships,public.team_absence_types,public.team_leaves,public.team_closures to authenticated;

create function public.team_list_organizations() returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'role',m.role) order by o.name),'[]'::jsonb)
  from public.team_organizations o join public.team_memberships m on m.organization_id=o.id
  where m.user_id=auth.uid() and private.team_role(o.id) is not null
$$;
create function public.team_create_organization(p_name text,p_year integer,p_label text) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid; person uuid;
begin
  perform 1 from auth.users where id=auth.uid() and email_confirmed_at is not null for update;
  if not found then raise exception 'Forbidden' using errcode='42501'; end if;
  if (select count(*) from public.team_memberships where user_id=auth.uid() and role='owner')>=10 then raise exception 'Organization limit'; end if;
  insert into public.team_organizations(owner_id,name,calendar_year) values(auth.uid(),trim(p_name),p_year) returning id into org;
  insert into public.team_members(organization_id,label) values(org,trim(p_label)) returning id into person;
  insert into public.team_memberships values(org,auth.uid(),'owner',person);
  insert into public.team_absence_types(organization_id,name,kind) values(org,'Vuosiloma','vacation'),(org,'Henkilökohtainen vapaa','personal');
  return org;
end $$;

create function public.team_snapshot(p_org uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare access_role text:=private.team_role(p_org); person uuid:=private.team_member(p_org); y integer;
begin
  if access_role is null then raise exception 'Forbidden' using errcode='42501'; end if;
  select calendar_year into y from public.team_organizations where id=p_org;
  return jsonb_build_object(
    'organization',(select jsonb_build_object('id',id,'name',name,'calendar_year',calendar_year,'min_coverage',min_coverage,'include_holidays',include_holidays,'version',version) from public.team_organizations where id=p_org),
    'role',access_role,'member_id',person,
    'departments',(select coalesce(jsonb_agg(to_jsonb(d) order by d.name),'[]'::jsonb) from public.team_departments d where organization_id=p_org),
    'members',(select coalesce(jsonb_agg(to_jsonb(m) order by m.label),'[]'::jsonb) from public.team_members m where organization_id=p_org),
    'types',(select coalesce(jsonb_agg(to_jsonb(t) order by t.name),'[]'::jsonb) from public.team_absence_types t where organization_id=p_org),
    'leaves',(select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'member_id',l.member_id,'start_date',l.start_date,'end_date',l.end_date,'status',l.status,'type_id',case when access_role in ('owner','manager') or l.member_id=person then l.type_id else null end) order by l.start_date,l.id),'[]'::jsonb) from public.team_leaves l where organization_id=p_org and start_date<=make_date(y,12,31) and end_date>=make_date(y,1,1) and (access_role in ('owner','manager') or l.member_id=person or l.status<>'rejected')),
    'closures',(select coalesce(jsonb_agg(to_jsonb(c) order by c.start_date),'[]'::jsonb) from public.team_closures c where organization_id=p_org and start_date<=make_date(y,12,31) and end_date>=make_date(y,1,1)),
    'memberships',case when access_role='owner' then (select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) from public.team_memberships m where organization_id=p_org) else '[]'::jsonb end,
    'invites',case when access_role='owner' then (select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'email',i.email,'role',i.role,'member_id',i.member_id,'expires_at',i.expires_at)),'[]'::jsonb) from public.team_invites i where organization_id=p_org and expires_at>now()) else '[]'::jsonb end
  );
end $$;

create function public.team_command(p_org uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare access_role text; person uuid; row_id uuid; result jsonb:='{}'; token text; current_version integer; existing public.team_leaves;
begin
  -- Serialize organization changes, then recheck membership after acquiring the lock.
  select version into current_version from public.team_organizations where id=p_org for update;
  access_role:=private.team_role(p_org); person:=private.team_member(p_org);
  if access_role is null then raise exception 'Forbidden' using errcode='42501'; end if;
  if (p_data->>'expected_version')::integer is distinct from current_version then raise exception 'Stale calendar' using errcode='40001'; end if;
  if p_action in ('settings','member','remove_member','department','remove_department','type','remove_type','invite','revoke_invite','role','revoke_access','delete_organization') and access_role<>'owner' then raise exception 'Forbidden' using errcode='42501'; end if;
  if p_action in ('closure','remove_closure') and access_role not in ('owner','manager') then raise exception 'Forbidden' using errcode='42501'; end if;
  row_id:=nullif(p_data->>'id','')::uuid;
  case p_action
  when 'settings' then update public.team_organizations set name=trim(p_data->>'name'),calendar_year=(p_data->>'calendar_year')::integer,min_coverage=(p_data->>'min_coverage')::integer,include_holidays=(p_data->>'include_holidays')::boolean where id=p_org;
  when 'department' then
    if row_id is null then insert into public.team_departments(organization_id,name) values(p_org,trim(p_data->>'name'));
    else update public.team_departments set name=trim(p_data->>'name') where organization_id=p_org and id=row_id; if not found then raise exception 'Not found'; end if; end if;
  when 'remove_department' then
    update public.team_members set department_id=null where organization_id=p_org and department_id=row_id;
    delete from public.team_departments where organization_id=p_org and id=row_id;
  when 'member' then
    if row_id is null then insert into public.team_members(organization_id,label,department_id,job_role,active) values(p_org,trim(p_data->>'label'),nullif(p_data->>'department_id','')::uuid,coalesce(p_data->>'job_role',''),coalesce((p_data->>'active')::boolean,true));
    else update public.team_members set label=trim(p_data->>'label'),department_id=nullif(p_data->>'department_id','')::uuid,job_role=coalesce(p_data->>'job_role',''),active=coalesce((p_data->>'active')::boolean,true) where organization_id=p_org and id=row_id; if not found then raise exception 'Not found'; end if; end if;
    if (select count(*) from public.team_members where organization_id=p_org)>500 then raise exception 'Team limit'; end if;
  when 'remove_member' then
    if exists(select 1 from public.team_memberships where organization_id=p_org and member_id=row_id and role='owner') then raise exception 'Owner cannot be removed'; end if;
    delete from public.team_memberships where organization_id=p_org and member_id=row_id;
    delete from public.team_invites where organization_id=p_org and member_id=row_id;
    delete from public.team_leaves where organization_id=p_org and member_id=row_id;
    delete from public.team_members where organization_id=p_org and id=row_id;
  when 'type' then
    if row_id is null then insert into public.team_absence_types(organization_id,name,kind) values(p_org,trim(p_data->>'name'),'custom');
    else update public.team_absence_types set name=trim(p_data->>'name') where organization_id=p_org and id=row_id; if not found then raise exception 'Not found'; end if; end if;
    if (select count(*) from public.team_absence_types where organization_id=p_org)>50 then raise exception 'Type limit'; end if;
  when 'remove_type' then delete from public.team_absence_types where organization_id=p_org and id=row_id;
  when 'closure' then
    if row_id is null then insert into public.team_closures(organization_id,label,start_date,end_date) values(p_org,trim(p_data->>'label'),(p_data->>'start_date')::date,(p_data->>'end_date')::date);
    else update public.team_closures set label=trim(p_data->>'label'),start_date=(p_data->>'start_date')::date,end_date=(p_data->>'end_date')::date where organization_id=p_org and id=row_id; if not found then raise exception 'Not found'; end if; end if;
    if (select count(*) from public.team_closures where organization_id=p_org)>1000 then raise exception 'Closure limit'; end if;
  when 'remove_closure' then delete from public.team_closures where organization_id=p_org and id=row_id;
  when 'leave' then
    if not exists(select 1 from public.team_members where organization_id=p_org and id=(p_data->>'member_id')::uuid and active) then raise exception 'Inactive or missing member'; end if;
    if access_role='employee' and ((p_data->>'member_id')::uuid is distinct from person or p_data->>'status' is distinct from 'pending') then raise exception 'Forbidden' using errcode='42501'; end if;
    if row_id is not null then
      select * into existing from public.team_leaves where organization_id=p_org and id=row_id;
      if not found then raise exception 'Not found'; end if;
      if access_role='employee' and (existing.member_id is distinct from person or existing.status<>'pending') then raise exception 'Forbidden' using errcode='42501'; end if;
      update public.team_leaves set member_id=(p_data->>'member_id')::uuid,type_id=(p_data->>'type_id')::uuid,start_date=(p_data->>'start_date')::date,end_date=(p_data->>'end_date')::date,status=p_data->>'status' where organization_id=p_org and id=row_id;
    else insert into public.team_leaves(organization_id,member_id,type_id,start_date,end_date,status) values(p_org,(p_data->>'member_id')::uuid,(p_data->>'type_id')::uuid,(p_data->>'start_date')::date,(p_data->>'end_date')::date,p_data->>'status'); end if;
    if (select count(*) from public.team_leaves where organization_id=p_org)>10000 then raise exception 'Leave limit'; end if;
  when 'remove_leave' then
    select * into existing from public.team_leaves where organization_id=p_org and id=row_id;
    if not found then raise exception 'Not found'; end if;
    if access_role='employee' and (existing.member_id is distinct from person or existing.status<>'pending') then raise exception 'Forbidden' using errcode='42501'; end if;
    delete from public.team_leaves where organization_id=p_org and id=row_id;
  when 'invite' then
    if p_data->>'role' not in ('manager','employee') then raise exception 'Invalid role'; end if;
    if exists(select 1 from public.team_memberships where organization_id=p_org and member_id=(p_data->>'member_id')::uuid) then raise exception 'Member already linked'; end if;
    token:=encode(extensions.gen_random_bytes(32),'hex');
    delete from public.team_invites where organization_id=p_org and member_id=(p_data->>'member_id')::uuid;
    insert into public.team_invites(organization_id,email,member_id,role,token_hash) values(p_org,lower(trim(p_data->>'email')),(p_data->>'member_id')::uuid,p_data->>'role',extensions.digest(token,'sha256'));
    result:=jsonb_build_object('token',token);
  when 'revoke_invite' then delete from public.team_invites where organization_id=p_org and id=row_id;
  when 'role' then
    if p_data->>'role' not in ('manager','employee') then raise exception 'Invalid role'; end if;
    update public.team_memberships set role=p_data->>'role' where organization_id=p_org and user_id=(p_data->>'user_id')::uuid and role<>'owner';
    if not found then raise exception 'Not found'; end if;
  when 'revoke_access' then
    delete from public.team_memberships where organization_id=p_org and user_id=(p_data->>'user_id')::uuid and role<>'owner';
    if not found then raise exception 'Not found'; end if;
  when 'delete_organization' then delete from public.team_organizations where id=p_org; return result;
  else raise exception 'Unknown action';
  end case;
  update public.team_organizations set version=version+1 where id=p_org;
  return result;
end $$;

create function public.team_accept_invite(p_token text) returns uuid language plpgsql security definer set search_path='' as $$
declare invitation public.team_invites; org uuid; account_email text;
begin
  if p_token !~ '^[0-9a-f]{64}$' then raise exception 'Invalid invitation'; end if;
  select lower(email) into account_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if account_email is null then raise exception 'Forbidden' using errcode='42501'; end if;
  select organization_id into org from public.team_invites where token_hash=extensions.digest(p_token,'sha256');
  perform 1 from public.team_organizations where id=org for update;
  select * into invitation from public.team_invites where organization_id=org and token_hash=extensions.digest(p_token,'sha256') for update;
  if not found or invitation.expires_at<=now() or invitation.email<>account_email then raise exception 'Invalid invitation'; end if;
  insert into public.team_memberships(organization_id,user_id,role,member_id) values(org,auth.uid(),invitation.role,invitation.member_id);
  delete from public.team_invites where id=invitation.id;
  update public.team_organizations set version=version+1 where id=org;
  return org;
end $$;

revoke all on function public.team_list_organizations(),public.team_create_organization(text,integer,text),public.team_snapshot(uuid),public.team_command(uuid,text,jsonb),public.team_accept_invite(text) from public,anon;
grant execute on function public.team_list_organizations(),public.team_create_organization(text,integer,text),public.team_snapshot(uuid),public.team_command(uuid,text,jsonb),public.team_accept_invite(text) to authenticated;
