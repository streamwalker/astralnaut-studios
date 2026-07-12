
CREATE TABLE public.community_attestations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth DATE NOT NULL,
  attested_18_plus BOOLEAN NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_attestations_must_be_adult CHECK (attested_18_plus = true)
);

GRANT SELECT, INSERT ON public.community_attestations TO authenticated;
GRANT ALL ON public.community_attestations TO service_role;

ALTER TABLE public.community_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own community attestation"
  ON public.community_attestations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own community attestation"
  ON public.community_attestations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND attested_18_plus = true);

CREATE TRIGGER set_community_attestations_updated_at
  BEFORE UPDATE ON public.community_attestations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
