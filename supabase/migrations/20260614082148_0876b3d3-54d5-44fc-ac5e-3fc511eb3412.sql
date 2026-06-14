
-- 1. site_stats: single source of truth for headline numbers
CREATE TABLE public.site_stats (
  id int PRIMARY KEY DEFAULT 1,
  subscriber_count int NOT NULL DEFAULT 0,
  campaign_goal int NOT NULL DEFAULT 1000,
  pages_published int NOT NULL DEFAULT 52,
  series_live int NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_stats_singleton CHECK (id = 1)
);

GRANT SELECT ON public.site_stats TO anon;
GRANT SELECT ON public.site_stats TO authenticated;
GRANT ALL ON public.site_stats TO service_role;

ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_stats public read" ON public.site_stats
  FOR SELECT USING (true);
CREATE POLICY "site_stats admin write" ON public.site_stats
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_stats (id, subscriber_count, campaign_goal, pages_published, series_live)
VALUES (1, 0, 1000, 52, 3)
ON CONFLICT (id) DO NOTHING;

-- 2. Active-subscriber count function (single source of truth)
CREATE OR REPLACE FUNCTION public.get_active_subscriber_count()
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT user_id)::int
  FROM public.subscriptions
  WHERE status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > now());
$$;

GRANT EXECUTE ON FUNCTION public.get_active_subscriber_count() TO anon, authenticated;

-- 3. leads: re-engagement email list (free readers + raffle)
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL CHECK (source IN ('free_act_wall','free_raffle')),
  series_slug text,
  last_page int,
  confirmed boolean NOT NULL DEFAULT false,
  confirm_token uuid NOT NULL DEFAULT gen_random_uuid(),
  unsub_token uuid NOT NULL DEFAULT gen_random_uuid(),
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, source)
);

CREATE INDEX leads_series_confirmed_idx ON public.leads (series_slug, confirmed);
CREATE INDEX leads_confirm_token_idx ON public.leads (confirm_token);
CREATE INDEX leads_unsub_token_idx ON public.leads (unsub_token);

GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- anon + authenticated may insert their own captures; nothing else
CREATE POLICY "leads anon insert" ON public.leads
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "leads authed insert" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (true);
-- Reads/updates restricted to admin or service role
CREATE POLICY "leads admin read" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "leads admin update" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Add 'paused' to the allowed subscription statuses set if there's a check.
--    The existing subscriptions table uses free-text status, so no change needed.
