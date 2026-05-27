
DROP POLICY IF EXISTS "Public can insert analytics events" ON public.analytics_events;
CREATE POLICY "Public can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Public subscribe" ON public.subscribers;
CREATE POLICY "Public subscribe"
ON public.subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (confirmed = false AND active = false);
