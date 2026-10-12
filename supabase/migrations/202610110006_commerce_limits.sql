-- Private, anonymous checkout abuse protection. No email/company/calendar data.
create table public.commerce_rate_windows (
  bucket text not null,
  action text not null,
  window_start timestamptz not null,
  requests integer not null,
  primary key (bucket, action, window_start)
);
alter table public.commerce_rate_windows enable row level security;
revoke all on public.commerce_rate_windows from public, anon, authenticated;
create function public.commerce_consume(p_bucket text, p_action text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer; max_requests integer;
begin
  if p_bucket !~ '^[a-f0-9]{64}$' then raise exception 'invalid bucket'; end if;
  max_requests := case p_action when 'checkout' then 6 when 'status' then 60
    when 'export' then 20 when 'restore' then 10 when 'catalog' then 60 else 0 end;
  if max_requests = 0 then raise exception 'invalid action'; end if;
  delete from public.commerce_rate_windows where window_start < now() - interval '1 day';
  insert into public.commerce_rate_windows values(p_bucket,p_action,date_trunc('minute',now()),1)
  on conflict (bucket,action,window_start) do update
    set requests = public.commerce_rate_windows.requests + 1
  returning requests into n;
  return n <= max_requests;
end $$;
revoke all on function public.commerce_consume(text,text) from public,anon,authenticated;
grant execute on function public.commerce_consume(text,text) to service_role;
