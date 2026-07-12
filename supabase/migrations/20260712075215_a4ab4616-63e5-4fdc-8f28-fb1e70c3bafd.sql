
CREATE TABLE IF NOT EXISTS public.dsar_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id text NOT NULL UNIQUE DEFAULT ('DSAR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  request_type text NOT NULL CHECK (request_type IN ('access','correct','delete','portability','opt_out_sale','opt_out_profiling','appeal','other')),
  requester_email text NOT NULL,
  region text,
  details text,
  authorized_agent boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','failed')),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','in_review','completed','denied','withdrawn')),
  response_notes text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.dsar_requests TO authenticated;
GRANT INSERT ON public.dsar_requests TO anon;
GRANT ALL ON public.dsar_requests TO service_role;

ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a DSAR" ON public.dsar_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read DSARs" ON public.dsar_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update DSARs" ON public.dsar_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_dsar_requests_updated_at
  BEFORE UPDATE ON public.dsar_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
