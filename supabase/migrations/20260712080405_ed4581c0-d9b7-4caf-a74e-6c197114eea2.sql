
CREATE TABLE public.consent_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('signup_clickwrap','subscription_checkout','cancellation','renewal_reminder_sent','price_change_notice_sent')),
  terms_version TEXT,
  privacy_version TEXT,
  subscription_policy_version TEXT,
  renewal_disclosure_version TEXT,
  plan_id TEXT,
  plan_name TEXT,
  billing_interval TEXT,
  displayed_price NUMERIC(10,2),
  currency TEXT,
  effective_end_date TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  consent_text TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_events_user ON public.consent_events(user_id, event_type, created_at DESC);

GRANT SELECT ON public.consent_events TO authenticated;
GRANT ALL ON public.consent_events TO service_role;

ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own consent events"
  ON public.consent_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only the service role writes/updates/deletes; no direct client mutation.
CREATE POLICY "Service role manages consent events"
  ON public.consent_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
