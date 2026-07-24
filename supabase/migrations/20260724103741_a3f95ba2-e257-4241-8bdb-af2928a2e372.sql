
CREATE TABLE public.hero_logo_glow (
  series_slug text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  color text NOT NULL DEFAULT '#ffffff',
  intensity integer NOT NULL DEFAULT 55 CHECK (intensity BETWEEN 0 AND 100),
  spread integer NOT NULL DEFAULT 42 CHECK (spread BETWEEN 0 AND 200),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_logo_glow TO anon, authenticated;
GRANT ALL ON public.hero_logo_glow TO service_role;

ALTER TABLE public.hero_logo_glow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_logo_glow public read"
  ON public.hero_logo_glow FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "hero_logo_glow admin insert"
  ON public.hero_logo_glow FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "hero_logo_glow admin update"
  ON public.hero_logo_glow FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER hero_logo_glow_updated_at
  BEFORE UPDATE ON public.hero_logo_glow
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.hero_logo_glow (series_slug, enabled, color, intensity, spread) VALUES
  ('battlefield-atlantis', true,  '#e6f2ff', 55, 42),
  ('darker-ages',          false, '#ffffff', 40, 32),
  ('children-of-aquarius', false, '#7dd3fc', 40, 32);
