
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  path text NOT NULL,
  target text,
  duration_ms integer,
  referrer text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_path ON public.analytics_events(path);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert analytics events"
ON public.analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN ('pageview','click','page_leave','session_end')
  AND length(session_id) BETWEEN 6 AND 64
  AND length(path) BETWEEN 1 AND 500
  AND (target IS NULL OR length(target) <= 300)
  AND (duration_ms IS NULL OR (duration_ms >= 0 AND duration_ms <= 86400000))
  AND (referrer IS NULL OR length(referrer) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
);

CREATE POLICY "Admins read analytics events"
ON public.analytics_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
