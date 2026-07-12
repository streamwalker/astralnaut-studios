
-- 1. cookie_consents ----------------------------------------------------------
CREATE TABLE public.cookie_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  necessary BOOLEAN NOT NULL DEFAULT true,
  functional BOOLEAN NOT NULL DEFAULT false,
  analytics BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL CHECK (source IN ('banner_accept_all','banner_reject_all','customize','withdraw','gpc','initial')),
  gpc_derived BOOLEAN NOT NULL DEFAULT false,
  policy_version TEXT NOT NULL,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cookie_consents_user_created_idx ON public.cookie_consents (user_id, created_at DESC);
CREATE INDEX cookie_consents_session_created_idx ON public.cookie_consents (session_id, created_at DESC);
GRANT INSERT ON public.cookie_consents TO anon, authenticated;
GRANT SELECT ON public.cookie_consents TO authenticated;
GRANT ALL ON public.cookie_consents TO service_role;
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log their own cookie consent" ON public.cookie_consents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users read their own cookie consent" ON public.cookie_consents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all cookie consents" ON public.cookie_consents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. dsar_verification_tokens ------------------------------------------------
CREATE TABLE public.dsar_verification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dsar_request_id UUID NOT NULL REFERENCES public.dsar_requests(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX dsar_vt_request_idx ON public.dsar_verification_tokens (dsar_request_id);
GRANT ALL ON public.dsar_verification_tokens TO service_role;
ALTER TABLE public.dsar_verification_tokens ENABLE ROW LEVEL SECURITY;
-- No app-role policies: tokens are handled server-side via service role.

-- 3. moderation_reports ------------------------------------------------------
CREATE TABLE public.moderation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_kind TEXT NOT NULL CHECK (content_kind IN ('letter','letter_comment','profile','other')),
  content_ref TEXT NOT NULL,                              -- table+id string
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT,
  reason TEXT NOT NULL CHECK (reason IN (
    'harassment','hate_speech','sexual_exploitation','doxing','impersonation',
    'spam','malware','piracy_or_unauthorized_copies','infringement','self_harm','other'
  )),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','actioned','dismissed')),
  reviewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX moderation_reports_status_idx ON public.moderation_reports (status, created_at DESC);
GRANT INSERT ON public.moderation_reports TO authenticated;
GRANT SELECT, UPDATE ON public.moderation_reports TO authenticated;
GRANT ALL ON public.moderation_reports TO service_role;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can file a report" ON public.moderation_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());
CREATE POLICY "Reporter reads own reports" ON public.moderation_reports FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid());
CREATE POLICY "Admin reads all reports" ON public.moderation_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin updates reports" ON public.moderation_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_moderation_reports_updated
BEFORE UPDATE ON public.moderation_reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. user_suspensions --------------------------------------------------------
CREATE TABLE public.user_suspensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  moderator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,                                    -- null = indefinite
  lifted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX user_suspensions_user_idx ON public.user_suspensions (user_id, starts_at DESC);
GRANT SELECT ON public.user_suspensions TO authenticated;
GRANT ALL ON public.user_suspensions TO service_role;
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own suspensions" ON public.user_suspensions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admin reads all suspensions" ON public.user_suspensions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_user_suspensions_updated
BEFORE UPDATE ON public.user_suspensions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper used by posting paths to honour suspensions.
CREATE OR REPLACE FUNCTION public.is_user_suspended(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_suspensions
    WHERE user_id = _user_id
      AND lifted_at IS NULL
      AND starts_at <= now()
      AND (ends_at IS NULL OR ends_at > now())
  );
$$;

-- 5. dmca_notices ------------------------------------------------------------
CREATE TABLE public.dmca_notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_id TEXT NOT NULL UNIQUE DEFAULT ('DMCA-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  kind TEXT NOT NULL CHECK (kind IN ('notice','counter_notice')),
  complainant_name TEXT NOT NULL,
  complainant_email TEXT NOT NULL,
  complainant_address TEXT,
  complainant_phone TEXT,
  acting_on_behalf_of TEXT,
  work_identified TEXT NOT NULL,
  infringing_url TEXT NOT NULL,
  good_faith_statement BOOLEAN NOT NULL,
  accuracy_statement BOOLEAN NOT NULL,
  consent_to_jurisdiction BOOLEAN,             -- counter-notice only
  signature_text TEXT NOT NULL,
  original_notice_ref TEXT,                    -- counter-notices reference the original
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','under_review','forwarded','resolved','withdrawn','invalid')),
  reviewer_notes TEXT,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.dmca_notices TO anon, authenticated;
GRANT ALL ON public.dmca_notices TO service_role;
ALTER TABLE public.dmca_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can file a DMCA notice" ON public.dmca_notices FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin reads all DMCA notices" ON public.dmca_notices FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin updates DMCA notices" ON public.dmca_notices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_dmca_notices_updated
BEFORE UPDATE ON public.dmca_notices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. issues: photosensitivity flags -----------------------------------------
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS photosensitivity_warning BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flashing_notes TEXT;

-- 7. consent_events: allow cookie_consent_update event type ------------------
DO $$
DECLARE constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_schema='public' AND tc.table_name='consent_events' AND tc.constraint_type='CHECK'
  LIMIT 1;
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.consent_events DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.consent_events
  ADD CONSTRAINT consent_events_event_type_check CHECK (event_type IN (
    'signup_clickwrap',
    'checkout_consent',
    'subscription_cancel',
    'canon_terms_ack',
    'sweepstakes_marketing_optin',
    'community_guidelines_ack',
    'cookie_consent_update'
  ));
