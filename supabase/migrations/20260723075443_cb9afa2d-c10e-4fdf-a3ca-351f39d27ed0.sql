
CREATE TABLE public.outreach_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  site_name text,
  contact_name text,
  contact_email text,
  tier smallint NOT NULL DEFAULT 2 CHECK (tier BETWEEN 1 AND 3),
  category text,
  status text NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect','contacted','replied','negotiating','published','declined','dead')),
  notes text,
  link_acquired boolean NOT NULL DEFAULT false,
  link_acquired_url text,
  link_acquired_at timestamptz,
  last_contacted_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_prospects TO authenticated;
GRANT ALL ON public.outreach_prospects TO service_role;

ALTER TABLE public.outreach_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read outreach prospects"
  ON public.outreach_prospects FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert outreach prospects"
  ON public.outreach_prospects FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update outreach prospects"
  ON public.outreach_prospects FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete outreach prospects"
  ON public.outreach_prospects FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER outreach_prospects_updated_at
  BEFORE UPDATE ON public.outreach_prospects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX outreach_prospects_status_idx ON public.outreach_prospects(status);
CREATE INDEX outreach_prospects_tier_idx ON public.outreach_prospects(tier);
