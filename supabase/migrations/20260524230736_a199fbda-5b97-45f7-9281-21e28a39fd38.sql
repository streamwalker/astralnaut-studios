
create table if not exists public.storage_access_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  bucket text not null default 'comic-pages',
  path text not null,
  user_id uuid,
  ip text,
  user_agent text,
  referer text,
  is_free boolean,
  comic_id uuid
);

create index if not exists idx_storage_access_logs_created on public.storage_access_logs (created_at desc);
create index if not exists idx_storage_access_logs_user on public.storage_access_logs (user_id, created_at desc);
create index if not exists idx_storage_access_logs_ip on public.storage_access_logs (ip, created_at desc);

alter table public.storage_access_logs enable row level security;

create policy "Admins read access logs"
on public.storage_access_logs for select to authenticated
using (has_role(auth.uid(), 'admin'::app_role));

create policy "Service role manages access logs"
on public.storage_access_logs for all to public
using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null,
  severity text not null default 'medium',
  actor_user_id uuid,
  actor_ip text,
  details jsonb not null default '{}'::jsonb,
  acknowledged_at timestamptz,
  acknowledged_by uuid
);

create index if not exists idx_security_alerts_created on public.security_alerts (created_at desc);

alter table public.security_alerts enable row level security;

create policy "Admins read alerts"
on public.security_alerts for select to authenticated
using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins acknowledge alerts"
on public.security_alerts for update to authenticated
using (has_role(auth.uid(), 'admin'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Service role manages alerts"
on public.security_alerts for all to public
using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function public.detect_storage_access_bursts(
  window_seconds int default 60,
  threshold int default 40
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count int := 0;
begin
  -- Burst per user
  with bursts as (
    select user_id, count(distinct path) as distinct_paths
    from public.storage_access_logs
    where created_at > now() - make_interval(secs => window_seconds)
      and user_id is not null
    group by user_id
    having count(distinct path) > threshold
  )
  insert into public.security_alerts (kind, severity, actor_user_id, details)
  select 'storage_access_burst_user', 'high', b.user_id,
    jsonb_build_object('distinct_paths', b.distinct_paths, 'window_seconds', window_seconds, 'threshold', threshold)
  from bursts b
  where not exists (
    select 1 from public.security_alerts a
    where a.kind = 'storage_access_burst_user'
      and a.actor_user_id = b.user_id
      and a.created_at > now() - make_interval(secs => window_seconds)
  );
  get diagnostics inserted_count = row_count;

  -- Burst per IP (anon or signed-in)
  with bursts as (
    select ip, count(distinct path) as distinct_paths
    from public.storage_access_logs
    where created_at > now() - make_interval(secs => window_seconds)
      and ip is not null
    group by ip
    having count(distinct path) > threshold
  )
  insert into public.security_alerts (kind, severity, actor_ip, details)
  select 'storage_access_burst_ip', 'high', b.ip,
    jsonb_build_object('distinct_paths', b.distinct_paths, 'window_seconds', window_seconds, 'threshold', threshold)
  from bursts b
  where not exists (
    select 1 from public.security_alerts a
    where a.kind = 'storage_access_burst_ip'
      and a.actor_ip = b.ip
      and a.created_at > now() - make_interval(secs => window_seconds)
  );

  return inserted_count;
end;
$$;

revoke execute on function public.detect_storage_access_bursts(int, int) from anon, authenticated;
