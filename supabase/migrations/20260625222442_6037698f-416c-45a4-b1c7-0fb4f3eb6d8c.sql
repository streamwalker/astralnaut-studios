
CREATE TABLE public.visitor_hits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text,
  ip_hash text,
  user_agent text,
  path text,
  referrer text,
  country text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.visitor_hits TO authenticated;
GRANT ALL ON public.visitor_hits TO service_role;

ALTER TABLE public.visitor_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read visitor hits"
  ON public.visitor_hits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX visitor_hits_created_at_idx ON public.visitor_hits (created_at DESC);
CREATE INDEX visitor_hits_ip_idx ON public.visitor_hits (ip);
CREATE INDEX visitor_hits_ip_hash_idx ON public.visitor_hits (ip_hash);
