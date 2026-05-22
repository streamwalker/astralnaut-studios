
-- Subscriptions table for Stripe
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  product_id text not null,
  price_id text not null,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  shipping_name text,
  shipping_line1 text,
  shipping_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text,
  environment text not null default 'sandbox',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_id on public.subscriptions(stripe_subscription_id);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

create policy "Admins read all subscriptions"
  on public.subscriptions for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.has_active_subscription(
  user_uuid uuid,
  check_env text default 'live'
)
returns boolean language sql security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
    and environment = check_env
    and (
      (status in ('active', 'trialing') and (current_period_end is null or current_period_end > now()))
      or (status = 'canceled' and current_period_end > now())
    )
  );
$$;

-- Raffle entries table
create table public.raffle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  name text,
  week_key text not null, -- e.g. '2026-W21'
  source text not null check (source in ('paid_tier', 'amoe')),
  tier text,
  created_at timestamptz not null default now()
);

create index idx_raffle_entries_week on public.raffle_entries(week_key);
create index idx_raffle_entries_email_week on public.raffle_entries(email, week_key, source);
create index idx_raffle_entries_user on public.raffle_entries(user_id);

-- Enforce one AMOE entry per email per week
create unique index uniq_raffle_amoe_per_email_week
  on public.raffle_entries(email, week_key)
  where source = 'amoe';

alter table public.raffle_entries enable row level security;

create policy "Users can view own entries"
  on public.raffle_entries for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins read all entries"
  on public.raffle_entries for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Service role manages entries"
  on public.raffle_entries for all
  using (auth.role() = 'service_role');

create policy "Public can submit free AMOE entries"
  on public.raffle_entries for insert
  to anon, authenticated
  with check (
    source = 'amoe'
    and email is not null
    and length(email) between 3 and 320
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and (name is null or length(name) <= 200)
    and week_key is not null
    and length(week_key) between 6 and 16
    and tier is null
  );
