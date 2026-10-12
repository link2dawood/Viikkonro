-- Additive Phase 9 migration. Apply after the team-leave migration.
create table public.team_shift_templates (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.team_organizations(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 60),
  kind text not null check(kind in ('morning','evening','night','custom')),
  start_time time not null, end_time time not null, end_day integer not null check(end_day in (0,1)),
  check(extract(second from start_time)=0 and extract(second from end_time)=0 and start_time<time '24:00' and end_time<time '24:00'),
  check((end_time-start_time)+end_day*interval '1 day'>interval '0' and (end_time-start_time)+end_day*interval '1 day'<=interval '36 hours'),
  unique(organization_id,id)
);
create table public.team_shifts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.team_organizations(id) on delete cascade,
  member_id uuid not null, template_id uuid not null, starts_at timestamptz not null, ends_at timestamptz not null,
  notes text not null default '' check(length(notes)<=500),
  check(ends_at>starts_at and ends_at-starts_at<=interval '36 hours'),
  check(starts_at>='2000-01-01T00:00:00Z'::timestamptz and ends_at<'2102-01-01T00:00:00Z'::timestamptz),
  foreign key(organization_id,member_id) references public.team_members(organization_id,id) on delete cascade,
  foreign key(organization_id,template_id) references public.team_shift_templates(organization_id,id)
);
create table public.team_shift_availability (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.team_organizations(id) on delete cascade,
  member_id uuid not null, starts_at timestamptz not null, ends_at timestamptz not null,
  notes text not null default '' check(length(notes)<=500),
  check(ends_at>starts_at and ends_at-starts_at<=interval '400 days'),
  check(starts_at>='2000-01-01T00:00:00Z'::timestamptz and ends_at<'2102-01-01T00:00:00Z'::timestamptz),
  foreign key(organization_id,member_id) references public.team_members(organization_id,id) on delete cascade
);
create index team_shifts_period on public.team_shifts(organization_id,starts_at,ends_at);
create index team_shift_availability_period on public.team_shift_availability(organization_id,starts_at,ends_at);
alter table public.team_shift_templates enable row level security;
alter table public.team_shifts enable row level security;
alter table public.team_shift_availability enable row level security;
create policy team_shift_template_read on public.team_shift_templates for select to authenticated using(private.team_role(organization_id) is not null);
-- Coworkers' scheduling is returned through a redacted RPC, never a table read
-- that also reveals their private notes.
create policy team_shift_read on public.team_shifts for select to authenticated using(private.team_role(organization_id) in ('owner','manager') or member_id=private.team_member(organization_id));
create policy team_shift_availability_read on public.team_shift_availability for select to authenticated using(private.team_role(organization_id) in ('owner','manager') or member_id=private.team_member(organization_id));
revoke all on public.team_shift_templates,public.team_shifts,public.team_shift_availability from public,anon,authenticated;
grant select on public.team_shift_templates,public.team_shifts,public.team_shift_availability to authenticated;

create function public.shift_snapshot(p_org uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare base jsonb:=public.team_snapshot(p_org); access_role text:=base->>'role'; person uuid:=(base->>'member_id')::uuid; y integer:=(base->'organization'->>'calendar_year')::integer; first_instant timestamptz; last_instant timestamptz;
begin
  first_instant:=make_date(y,1,1)::timestamp at time zone 'Europe/Helsinki';
  last_instant:=make_date(y+1,1,1)::timestamp at time zone 'Europe/Helsinki';
  return base || jsonb_build_object(
    -- A 36-hour shift crossing New Year can conflict outside the selected year.
    -- Fetch a two-day margin for conflict checks; the UI/export selects the year.
    'leaves',(select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'member_id',l.member_id,'start_date',l.start_date,'end_date',l.end_date,'status',l.status,'type_id',case when access_role in ('owner','manager') or l.member_id=person then l.type_id else null end) order by l.start_date,l.id),'[]'::jsonb) from public.team_leaves l where organization_id=p_org and start_date<=make_date(y+1,1,1)+2 and end_date>=make_date(y,1,1)-2 and (access_role in ('owner','manager') or l.member_id=person or l.status<>'rejected')),
    'closures',(select coalesce(jsonb_agg(to_jsonb(c) order by c.start_date),'[]'::jsonb) from public.team_closures c where organization_id=p_org and start_date<=make_date(y+1,1,1)+2 and end_date>=make_date(y,1,1)-2),
    'shift_templates',(select coalesce(jsonb_agg(to_jsonb(t) order by t.start_time,t.name),'[]'::jsonb) from public.team_shift_templates t where organization_id=p_org),
    'shifts',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'organization_id',s.organization_id,'member_id',s.member_id,'template_id',s.template_id,'starts_at',s.starts_at,'ends_at',s.ends_at,'notes',case when access_role in ('owner','manager') or s.member_id=person then s.notes else '' end) order by s.starts_at,s.id),'[]'::jsonb) from public.team_shifts s where organization_id=p_org and starts_at<last_instant+interval '2 days' and ends_at>first_instant-interval '2 days'),
    'availability',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'organization_id',s.organization_id,'member_id',s.member_id,'starts_at',s.starts_at,'ends_at',s.ends_at,'notes',case when access_role in ('owner','manager') or s.member_id=person then s.notes else '' end) order by s.starts_at,s.id),'[]'::jsonb) from public.team_shift_availability s where organization_id=p_org and starts_at<last_instant+interval '2 days' and ends_at>first_instant-interval '2 days')
  );
end $$;

create function public.shift_command(p_org uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare access_role text; person uuid; row_id uuid:=nullif(p_data->>'id','')::uuid; current_version integer; previous_member uuid; start_instant timestamptz; end_instant timestamptz;
begin
  select version into current_version from public.team_organizations where id=p_org for update;
  access_role:=private.team_role(p_org); person:=private.team_member(p_org);
  if access_role is null then raise exception 'Forbidden' using errcode='42501'; end if;
  if p_action not in ('availability','remove_availability') and access_role not in ('owner','manager') then raise exception 'Forbidden' using errcode='42501'; end if;
  if (p_data->>'expected_version')::integer is distinct from current_version then raise exception 'Stale calendar' using errcode='40001'; end if;
  if p_action in ('shift','availability') then
    if not exists(select 1 from public.team_members where organization_id=p_org and id=(p_data->>'member_id')::uuid and active) then raise exception 'Inactive or missing member'; end if;
    -- Require explicit offsets; never interpret a browser's floating timestamp
    -- in the database session's time zone. JS resolves Helsinki DST first.
    if coalesce(p_data->>'starts_at','') !~ 'T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$' or coalesce(p_data->>'ends_at','') !~ 'T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception 'Explicit time zone required'; end if;
    start_instant:=(p_data->>'starts_at')::timestamptz; end_instant:=(p_data->>'ends_at')::timestamptz;
  end if;
  case p_action
  when 'template' then
    if row_id is null then insert into public.team_shift_templates(organization_id,name,kind,start_time,end_time,end_day) values(p_org,trim(p_data->>'name'),p_data->>'kind',(p_data->>'start_time')::time,(p_data->>'end_time')::time,(p_data->>'end_day')::integer);
    else update public.team_shift_templates set name=trim(p_data->>'name'),kind=p_data->>'kind',start_time=(p_data->>'start_time')::time,end_time=(p_data->>'end_time')::time,end_day=(p_data->>'end_day')::integer where organization_id=p_org and id=row_id; if not found then raise exception 'Not found'; end if; end if;
    if (select count(*) from public.team_shift_templates where organization_id=p_org)>100 then raise exception 'Template limit'; end if;
  when 'remove_template' then delete from public.team_shift_templates where organization_id=p_org and id=row_id; if not found then raise exception 'Not found'; end if;
  when 'shift' then
    if row_id is null then insert into public.team_shifts(organization_id,member_id,template_id,starts_at,ends_at,notes) values(p_org,(p_data->>'member_id')::uuid,(p_data->>'template_id')::uuid,start_instant,end_instant,coalesce(p_data->>'notes',''));
    else update public.team_shifts set member_id=(p_data->>'member_id')::uuid,template_id=(p_data->>'template_id')::uuid,starts_at=start_instant,ends_at=end_instant,notes=coalesce(p_data->>'notes','') where organization_id=p_org and id=row_id; if not found then raise exception 'Not found'; end if; end if;
    if (select count(*) from public.team_shifts where organization_id=p_org)>20000 then raise exception 'Shift limit'; end if;
  when 'remove_shift' then delete from public.team_shifts where organization_id=p_org and id=row_id; if not found then raise exception 'Not found'; end if;
  when 'availability' then
    if access_role='employee' and (p_data->>'member_id')::uuid is distinct from person then raise exception 'Forbidden' using errcode='42501'; end if;
    if row_id is null then insert into public.team_shift_availability(organization_id,member_id,starts_at,ends_at,notes) values(p_org,(p_data->>'member_id')::uuid,start_instant,end_instant,coalesce(p_data->>'notes',''));
    else
      select member_id into previous_member from public.team_shift_availability where organization_id=p_org and id=row_id;
      if not found then raise exception 'Not found'; end if;
      if access_role='employee' and previous_member is distinct from person then raise exception 'Forbidden' using errcode='42501'; end if;
      update public.team_shift_availability set member_id=(p_data->>'member_id')::uuid,starts_at=start_instant,ends_at=end_instant,notes=coalesce(p_data->>'notes','') where organization_id=p_org and id=row_id;
    end if;
    if (select count(*) from public.team_shift_availability where organization_id=p_org)>10000 then raise exception 'Availability limit'; end if;
  when 'remove_availability' then
    select member_id into previous_member from public.team_shift_availability where organization_id=p_org and id=row_id;
    if not found then raise exception 'Not found'; end if;
    if access_role='employee' and previous_member is distinct from person then raise exception 'Forbidden' using errcode='42501'; end if;
    delete from public.team_shift_availability where organization_id=p_org and id=row_id;
  else raise exception 'Unknown action';
  end case;
  update public.team_organizations set version=version+1 where id=p_org;
  return '{}'::jsonb;
end $$;
revoke all on function public.shift_snapshot(uuid),public.shift_command(uuid,text,jsonb) from public,anon;
grant execute on function public.shift_snapshot(uuid),public.shift_command(uuid,text,jsonb) to authenticated;
