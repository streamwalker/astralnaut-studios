
DROP POLICY IF EXISTS "leads anon insert" ON public.leads;
DROP POLICY IF EXISTS "leads authed insert" ON public.leads;

CREATE POLICY "leads anon insert" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (
    confirmed = false
    AND notified_at IS NULL
    AND email IS NOT NULL
    AND length(email) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND source IN ('free_act_wall','free_raffle')
    AND (series_slug IS NULL OR length(series_slug) <= 100)
    AND (last_page IS NULL OR (last_page >= 0 AND last_page <= 100000))
  );

CREATE POLICY "leads authed insert" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    confirmed = false
    AND notified_at IS NULL
    AND email IS NOT NULL
    AND length(email) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND source IN ('free_act_wall','free_raffle')
    AND (series_slug IS NULL OR length(series_slug) <= 100)
    AND (last_page IS NULL OR (last_page >= 0 AND last_page <= 100000))
  );
