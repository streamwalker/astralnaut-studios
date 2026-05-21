
-- Series
CREATE TABLE public.series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  genre text,
  status text NOT NULL DEFAULT 'active',
  logline text,
  tagline text,
  cover_path text,
  logo_path text,
  comp_titles text[] DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  launch_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read series" ON public.series FOR SELECT USING (true);
CREATE POLICY "Admins manage series" ON public.series FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER set_updated_at_series BEFORE UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Issues
CREATE TABLE public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  issue_number int NOT NULL,
  title text NOT NULL,
  subtitle text,
  slug text NOT NULL,
  free_pages numeric NOT NULL DEFAULT 9,
  paid_pages int NOT NULL DEFAULT 0,
  total_pages numeric NOT NULL DEFAULT 0,
  release_status text,
  cover_path text,
  variant_cover_paths text[] DEFAULT '{}',
  drop_cadence text,
  paid_release_start date,
  paid_release_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id, issue_number),
  UNIQUE (slug)
);
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read issues" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Admins manage issues" ON public.issues FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER set_updated_at_issues BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Issue weekly drops
CREATE TABLE public.issue_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  week int NOT NULL,
  patron_date date NOT NULL,
  reader_date date NOT NULL,
  pages int[] NOT NULL,
  UNIQUE(issue_id, week)
);
ALTER TABLE public.issue_drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read drops" ON public.issue_drops FOR SELECT USING (true);
CREATE POLICY "Admins manage drops" ON public.issue_drops FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Factions
CREATE TABLE public.factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  acro text,
  summary text,
  emblem_path text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id, slug)
);
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read factions" ON public.factions FOR SELECT USING (true);
CREATE POLICY "Admins manage factions" ON public.factions FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Characters: link to series
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.series(id) ON DELETE SET NULL;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS faction text;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS transmedium boolean DEFAULT false;

-- Comics: free/paid + tier-staggered drop date + issue link
ALTER TABLE public.comics ADD COLUMN IF NOT EXISTS issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE;
ALTER TABLE public.comics ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;
ALTER TABLE public.comics ADD COLUMN IF NOT EXISTS drop_at timestamptz;

-- Subscriber tier
CREATE TYPE public.sub_tier AS ENUM ('reader','initiate','patron');
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS tier public.sub_tier;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT false;

-- Milestones
CREATE TABLE public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  current_count int NOT NULL DEFAULT 0,
  target_count int NOT NULL DEFAULT 1000,
  ends_at date,
  rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read milestones" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "Admins manage milestones" ON public.milestones FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER set_updated_at_milestones BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Editable site copy
CREATE TABLE public.site_copy (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_copy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read copy" ON public.site_copy FOR SELECT USING (true);
CREATE POLICY "Admins manage copy" ON public.site_copy FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER set_updated_at_site_copy BEFORE UPDATE ON public.site_copy FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed series
INSERT INTO public.series (slug,name,genre,status,logline,comp_titles,sort_order,launch_label) VALUES
('battlefield-atlantis','Battlefield Atlantis','Sci-fi space opera','active','Twenty-five thousand years before the present, Saantris Station is destroyed and Vrenoa City falls. The Tri-Planetary Coalition splits. Poseidon demands annihilation; Zeus refuses paralysis. The Alympian Guard forms.',ARRAY['Battlestar Galactica','Stargate','Foundation','Dune'],1,'Issue 1 active'),
('children-of-aquarius','Children of Aquarius','Esoteric thriller','active','A priest gifts three young humans the powers of Christ to find and protect the Christ child during the Piscean-to-Aquarian Age transition. The Three do not know each other. They do not yet know what they are.',ARRAY['The Da Vinci Code','Project Hail Mary','Legion'],2,'Issue 1 — paid release begins 2026-06-09'),
('darker-ages','Darker Ages','Dark medieval fantasy','pre-launch','After the protective magic of the old age has died, what was held back is loose.',ARRAY['The Witcher','Berserk','The Last Kingdom'],3,'October 2026')
ON CONFLICT (slug) DO NOTHING;

-- Seed issues
INSERT INTO public.issues (series_id, issue_number, title, subtitle, slug, free_pages, paid_pages, total_pages, release_status, drop_cadence, paid_release_start, paid_release_end)
SELECT id, 1, 'Only One Will Rule', NULL, 'battlefield-atlantis-issue-1', 9.5, 11, 20.5, 'First 9.5 pages live. Paid release scheduled.', '4 pages/week over ~3 weeks. Patron Tue · Initiate Wed · Reader Thu.', NULL, NULL
FROM public.series WHERE slug='battlefield-atlantis' ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.issues (series_id, issue_number, title, subtitle, slug, free_pages, paid_pages, total_pages, release_status, drop_cadence, paid_release_start, paid_release_end)
SELECT id, 1, 'The Age Begins', 'The Age Begins · The Child Awakens', 'children-of-aquarius-issue-1', 9, 15, 24, 'First 9 pages live. Paid release begins 2026-06-09.', '3 pages/week over 5 weeks. Patron Tue · Initiate Wed · Reader Thu.', '2026-06-09', '2026-07-09'
FROM public.series WHERE slug='children-of-aquarius' ON CONFLICT (slug) DO NOTHING;

-- COA weekly drops
INSERT INTO public.issue_drops (issue_id, week, patron_date, reader_date, pages)
SELECT i.id, w.week, w.patron_date, w.reader_date, w.pages
FROM public.issues i
CROSS JOIN (VALUES
  (1,'2026-06-09'::date,'2026-06-11'::date,ARRAY[10,11,12]),
  (2,'2026-06-16'::date,'2026-06-18'::date,ARRAY[13,14,15]),
  (3,'2026-06-23'::date,'2026-06-25'::date,ARRAY[16,17,18]),
  (4,'2026-06-30'::date,'2026-07-02'::date,ARRAY[19,20,21]),
  (5,'2026-07-07'::date,'2026-07-09'::date,ARRAY[22,23,24])
) AS w(week,patron_date,reader_date,pages)
WHERE i.slug='children-of-aquarius-issue-1'
ON CONFLICT DO NOTHING;

-- Factions (BA)
INSERT INTO public.factions (series_id, slug, name, acro, summary, sort_order)
SELECT id,'ndf','Nerrian Defense Force','VIGILANT · PROTECT · PREVAIL','Earth''s first line of transmedium defense. Born after the Atlantis incident.',1
FROM public.series WHERE slug='battlefield-atlantis' ON CONFLICT DO NOTHING;
INSERT INTO public.factions (series_id, slug, name, acro, summary, sort_order)
SELECT id,'tpc','Tri-Planetary Coalition','UNITY · DIPLOMACY · COMMERCE','Three worlds. One coalition. Limitless reach. Governs the accord between Earth, Mars, and Ares.',2
FROM public.series WHERE slug='battlefield-atlantis' ON CONFLICT DO NOTHING;

-- Link existing COA comics to the new issue + mark free
UPDATE public.comics c
SET issue_id = (SELECT id FROM public.issues WHERE slug='children-of-aquarius-issue-1'),
    is_free = (c.page_number <= 9),
    published_at = COALESCE(c.published_at, now())
WHERE c.slug LIKE 'children-of-aquarius%' OR c.image_path LIKE 'children-of-aquarius%';

-- Milestone
INSERT INTO public.milestones (slug,name,current_count,target_count,ends_at,rewards,is_active) VALUES
('atlantis-rising','Atlantis Rising',624,1000,'2026-06-21',
 '[{"at":250,"reward":"Steam cards (raffled)"},{"at":500,"reward":"Signed prints (raffled)"},{"at":750,"reward":"Wacom tablet (raffled)"},{"at":1000,"reward":"PlayStation 5 (raffled, single winner)"}]'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;

-- Site copy seeds
INSERT INTO public.site_copy (key,value) VALUES
('home.hero.eyebrow','New episodes every week · Netflix for comics'),
('home.hero.title','The next page only drops here.'),
('home.hero.sub','Five new pages a week. Motion-enhanced art. Creator commentary. Subscriber-only votes that change the canon. Real prizes for real readers — PlayStation 5 unlocks at 1,000 subscribers.'),
('home.cta.primary','Read the first act free'),
('home.cta.secondary','See pricing'),
('industry.hero.title','Three properties. One disclosure-era slate.'),
('industry.hero.sub','Hard sci-fi space opera. Esoteric thriller. Dark medieval fantasy. Owned 100% by Astralnaut Studios LLC. Available for film, television, animation, streaming, video game, and audio drama adaptation.')
ON CONFLICT (key) DO NOTHING;
