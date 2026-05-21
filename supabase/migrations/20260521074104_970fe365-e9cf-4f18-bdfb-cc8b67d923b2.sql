
CREATE TABLE public.growth_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  subs integer,
  emails integer,
  ewr integer,
  discord integer,
  nps integer,
  cac numeric,
  churn numeric,
  mrr numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.growth_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read growth_kpis" ON public.growth_kpis FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage growth_kpis" ON public.growth_kpis FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE INDEX idx_growth_kpis_recorded_at ON public.growth_kpis(recorded_at DESC);

CREATE TABLE public.growth_sprint_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week integer NOT NULL UNIQUE,
  dates text NOT NULL,
  outcome text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.growth_sprint_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sprint_weeks" ON public.growth_sprint_weeks FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage sprint_weeks" ON public.growth_sprint_weeks FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_growth_sprint_weeks_updated_at BEFORE UPDATE ON public.growth_sprint_weeks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.growth_sprint_weeks (week, dates, outcome) VALUES
(1,  'May 21–27',     'Ship COA paid release page UI. Stand up Discord. 50 seed-list DMs.'),
(2,  'May 28–Jun 3',  'Publish founder essay #1. Email welcome sequence live.'),
(3,  'Jun 4–10',      'COA pages 10–12 release. Founder essay #2. Daily TikTok organic begins.'),
(4,  'Jun 11–17',     'BA Issue #2 page-bank build. Essay #3. First Discord live Q&A.'),
(5,  'Jun 18–24',     'Meta Ads test ($1K). r/comicbooks introduction post.'),
(6,  'Jun 25–Jul 1',  'TikTok Ads test ($500). Pitch 10 podcasts. 2 micro-influencer partners.'),
(7,  'Jul 2–8',       'Reddit Ads test ($500). First PS5 raffle. First Founder Letter.'),
(8,  'Jul 9–15',      'COA Issue #1 closes. Issue #2 teaser. Press kit out.'),
(9,  'Jul 16–22',     'BA Issue #2 launch week. Variant covers drop. Influencer push.'),
(10, 'Jul 23–29',     'Cross-promo with 3 indie comics creators. Email list audit.'),
(11, 'Jul 30–Aug 5',  'First quarterly print fulfillment. Patron retention survey.'),
(12, 'Aug 6–12',      'YouTube long-form essay #1 publishes. SEO sweep on landing pages.'),
(13, 'Aug 13–19',     '90-day retrospective. Phase 2 planning. Public milestone post.');
