-- 1. Comics: gate paid pages behind active subscription
DROP POLICY IF EXISTS "Public can read published comics" ON public.comics;

CREATE POLICY "Public can read published free comics"
ON public.comics
FOR SELECT
TO anon, authenticated
USING (
  published_at IS NOT NULL
  AND published_at <= now()
  AND is_free = true
);

CREATE POLICY "Subscribers can read published paid comics"
ON public.comics
FOR SELECT
TO authenticated
USING (
  published_at IS NOT NULL
  AND published_at <= now()
  AND is_free = false
  AND (
    public.has_active_subscription(auth.uid(), 'live')
    OR public.has_active_subscription(auth.uid(), 'sandbox')
  )
);

-- 2. Subscribers: block UPDATE from anon/authenticated (only service_role / admin paths allowed)
CREATE POLICY "No user updates to subscribers"
ON public.subscribers
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 3. Raffle entries: prevent duplicate AMOE submissions per (email, week_key)
CREATE UNIQUE INDEX IF NOT EXISTS raffle_entries_amoe_email_week_unique
ON public.raffle_entries (lower(email), week_key)
WHERE source = 'amoe';
