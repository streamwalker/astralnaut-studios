
-- Drop redundant service-role catch-all policies (service_role bypasses RLS)
DROP POLICY IF EXISTS "Service role manages releases" ON public.appearance_releases;
DROP POLICY IF EXISTS "Service role manages cameo candidates" ON public.cameo_candidates;
DROP POLICY IF EXISTS "Service role manages consent events" ON public.consent_events;
DROP POLICY IF EXISTS "Service role manages promotions" ON public.sweepstakes_promotions;
DROP POLICY IF EXISTS "Service role manages entries" ON public.sweepstakes_entries;
DROP POLICY IF EXISTS "Service role manages drawings" ON public.sweepstakes_drawings;

-- Tighten public INSERT policies with basic validation instead of WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can submit a DSAR" ON public.dsar_requests;
CREATE POLICY "Anyone can submit a DSAR"
  ON public.dsar_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    requester_email IS NOT NULL
    AND length(requester_email) BETWEEN 3 AND 320
    AND requester_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND request_type IS NOT NULL
    AND length(request_type) BETWEEN 1 AND 64
    AND (details IS NULL OR length(details) <= 10000)
    AND verification_status = 'unverified'
    AND status IN ('received', 'pending')
  );

DROP POLICY IF EXISTS "Anyone can log their own cookie consent" ON public.cookie_consents;
CREATE POLICY "Anyone can log their own cookie consent"
  ON public.cookie_consents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    policy_version IS NOT NULL
    AND length(policy_version) BETWEEN 1 AND 32
    AND (user_id IS NULL OR user_id = auth.uid())
    AND (session_id IS NULL OR length(session_id) <= 128)
  );

DROP POLICY IF EXISTS "Anyone can file a DMCA notice" ON public.dmca_notices;
CREATE POLICY "Anyone can file a DMCA notice"
  ON public.dmca_notices
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    complainant_email IS NOT NULL
    AND length(complainant_email) BETWEEN 3 AND 320
    AND complainant_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND complainant_name IS NOT NULL
    AND length(complainant_name) BETWEEN 1 AND 200
    AND work_identified IS NOT NULL
    AND length(work_identified) BETWEEN 1 AND 10000
    AND infringing_url IS NOT NULL
    AND length(infringing_url) BETWEEN 1 AND 4000
    AND good_faith_statement = true
    AND accuracy_statement = true
    AND consent_to_jurisdiction = true
    AND signature_text IS NOT NULL
    AND length(signature_text) BETWEEN 1 AND 200
    AND status IN ('received', 'pending')
  );
