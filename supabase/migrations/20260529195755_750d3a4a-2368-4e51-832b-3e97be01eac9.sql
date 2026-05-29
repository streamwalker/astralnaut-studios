DROP POLICY IF EXISTS "Public can insert analytics events" ON public.analytics_events;
CREATE POLICY "Public can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  ((user_id IS NULL) OR (user_id = auth.uid()))
  AND session_id IS NOT NULL
  AND length(session_id) BETWEEN 6 AND 128
  AND session_id ~ '^[A-Za-z0-9_-]+$'
  AND event_type IS NOT NULL
  AND length(event_type) BETWEEN 1 AND 64
  AND length(path) <= 500
  AND (target IS NULL OR length(target) <= 500)
  AND (referrer IS NULL OR length(referrer) <= 1000)
  AND (user_agent IS NULL OR length(user_agent) <= 1000)
  AND (duration_ms IS NULL OR (duration_ms >= 0 AND duration_ms <= 86400000))
);