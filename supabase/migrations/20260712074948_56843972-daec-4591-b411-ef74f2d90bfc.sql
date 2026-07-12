CREATE TABLE public.cameo_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth date NOT NULL,
  attested_18_plus boolean NOT NULL DEFAULT false,
  full_legal_name text NOT NULL,
  display_name text NOT NULL,
  likeness_notes text,
  reference_url text,
  release_signed boolean NOT NULL DEFAULT false,
  ip text,
  user_agent text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cameo_attested_18_plus CHECK (attested_18_plus = true),
  CONSTRAINT cameo_release_signed CHECK (release_signed = true),
  CONSTRAINT cameo_status_allowed CHECK (status IN ('pending','approved','rejected','drawn'))
);

GRANT SELECT, INSERT ON public.cameo_submissions TO authenticated;
GRANT ALL ON public.cameo_submissions TO service_role;

ALTER TABLE public.cameo_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own cameo submissions"
  ON public.cameo_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own cameo submissions"
  ON public.cameo_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all cameo submissions"
  ON public.cameo_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update cameo submissions"
  ON public.cameo_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER cameo_submissions_set_updated_at
  BEFORE UPDATE ON public.cameo_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();