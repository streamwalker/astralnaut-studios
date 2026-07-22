
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.author_bio_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  eyebrow TEXT NOT NULL DEFAULT 'About the author',
  pull_quote TEXT,
  body TEXT NOT NULL,
  disclaimer TEXT,
  cta_label TEXT,
  cta_href TEXT,
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 0 AND weight <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.author_bio_variants TO anon, authenticated;
GRANT ALL ON public.author_bio_variants TO service_role;

ALTER TABLE public.author_bio_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active author bio variants are public"
  ON public.author_bio_variants FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage author bio variants"
  ON public.author_bio_variants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_author_bio_variants_updated_at
  BEFORE UPDATE ON public.author_bio_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.author_bio_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES public.author_bio_variants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression','conversion')),
  page_path TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_author_bio_events_variant ON public.author_bio_events(variant_id, event_type);
CREATE INDEX idx_author_bio_events_created ON public.author_bio_events(created_at DESC);

GRANT INSERT ON public.author_bio_events TO anon, authenticated;
GRANT ALL ON public.author_bio_events TO service_role;

ALTER TABLE public.author_bio_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log author bio events"
  ON public.author_bio_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (event_type IN ('impression','conversion'));

CREATE POLICY "Admins can read author bio events"
  ON public.author_bio_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.author_bio_variants (slug, label, pull_quote, body, disclaimer, cta_label, cta_href, weight, sort_order) VALUES
(
  'core',
  'Core positioning',
  'Fiction informed by more than three decades inside the United States Air Force intelligence environment.',
  E'Written by a former United States Air Force intelligence operator whose national-security career spanned more than three decades and included Top Secret/SCI access, *Children of Aquarius* brings an uncommon understanding of secrecy, compartmentalization, and classified operations to the UAP mystery.\n\nAs for what the author may know — directly or indirectly — about alleged U.S. Air Force UAP crash-retrieval and recovery efforts, **he can neither officially confirm nor deny.**',
  E'**Fiction disclaimer.** *Children of Aquarius* is a work of fiction. The author''s background is presented for narrative atmosphere and credibility only; it does not confirm, deny, or imply access to any actual classified program, UAP crash-retrieval effort, or recovery operation.',
  'Read Issue #1',
  '/reader/children-of-aquarius/1',
  1, 0
),
(
  'promo',
  'Promotional (stronger)',
  'Thirty years inside the black world. One story he''s finally allowed to tell.',
  E'The author spent more than three decades operating inside the United States Air Force intelligence community, holding Top Secret/SCI clearances across mission sets most Americans will never read about.\n\n*Children of Aquarius* channels that lived experience — compartmentalization, denied programs, the quiet grammar of secrecy — into a UAP thriller that reads uncomfortably close to the real thing.\n\nAsk him whether any of it actually happened, and **he will neither confirm nor deny.**',
  E'**Fiction disclaimer.** *Children of Aquarius* is a work of fiction. Any resemblance to classified programs, UAP crash-retrieval efforts, or recovery operations is presented for narrative atmosphere only and does not confirm or imply access to any such activity.',
  'Start reading free',
  '/reader/children-of-aquarius/1',
  1, 1
),
(
  'back-cover',
  'Back-cover (compact)',
  NULL,
  E'A 30-year U.S. Air Force intelligence veteran with Top Secret/SCI access turns his lived understanding of secrecy and denied programs into a UAP thriller. On whether any of it is real — **he can neither confirm nor deny.**',
  E'*Children of Aquarius* is a work of fiction.',
  NULL, NULL,
  1, 2
);
