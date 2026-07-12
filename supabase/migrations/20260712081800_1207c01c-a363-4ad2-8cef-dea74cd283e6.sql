
-- ============================================================
-- Stage 4: Milestone Sweepstakes + Cameo Release Gate
-- ============================================================

-- --- Extend consent_events allowed event types --------------
ALTER TABLE public.consent_events
  DROP CONSTRAINT IF EXISTS consent_events_event_type_check;

ALTER TABLE public.consent_events
  ADD CONSTRAINT consent_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'signup_clickwrap'::text,
    'subscription_checkout'::text,
    'cancellation'::text,
    'renewal_reminder_sent'::text,
    'price_change_notice_sent'::text,
    'canon_terms_ack'::text,
    'sweepstakes_marketing_optin'::text
  ]));

-- ============================================================
-- 1. sweepstakes_promotions
-- ============================================================
CREATE TABLE public.sweepstakes_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_code text NOT NULL UNIQUE,      -- stable slug e.g. "milestone-10000"
  name text NOT NULL,
  prize_description text NOT NULL,
  arv text NOT NULL,                        -- approximate retail value (string; may include "USD")
  milestone_number integer NOT NULL,        -- 10000, 20000, ...
  period_open_at timestamptz,
  period_closed_at timestamptz,
  rules_version text NOT NULL,
  drawing_rule text NOT NULL,
  winner_process text NOT NULL,
  response_window_days integer NOT NULL,
  drawing_days_after_milestone integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  activation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,   -- frozen LEGAL_CONFIG fields at open
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sweepstakes_promotions_status_check
    CHECK (status = ANY (ARRAY['draft','open','closed','drawn','completed','voided']))
);

GRANT SELECT ON public.sweepstakes_promotions TO authenticated;
GRANT SELECT ON public.sweepstakes_promotions TO anon;
GRANT ALL ON public.sweepstakes_promotions TO service_role;

ALTER TABLE public.sweepstakes_promotions ENABLE ROW LEVEL SECURITY;

-- Public: only see promotions that have progressed past draft
CREATE POLICY "Public reads non-draft promotions"
  ON public.sweepstakes_promotions FOR SELECT
  TO anon, authenticated
  USING (status <> 'draft');

CREATE POLICY "Admins read all promotions"
  ON public.sweepstakes_promotions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Service role manages promotions"
  ON public.sweepstakes_promotions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER sweepstakes_promotions_set_updated_at
  BEFORE UPDATE ON public.sweepstakes_promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. sweepstakes_entries
-- ============================================================
CREATE TABLE public.sweepstakes_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.sweepstakes_promotions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entrant_email text NOT NULL,                                    -- normalized lowercase (enforced server-side)
  entrant_full_name text,
  entry_method text NOT NULL,
  eligibility_attested boolean NOT NULL DEFAULT false,
  attestation_text text NOT NULL,
  rules_version text NOT NULL,
  ip text,
  user_agent text,
  dedup_key text NOT NULL,                                        -- normalized email (or 'uid:'||user_id fallback)
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sweepstakes_entries_method_check
    CHECK (entry_method = ANY (ARRAY['subscriber_auto','free_form'])),
  CONSTRAINT sweepstakes_entries_attested_check
    CHECK (eligibility_attested = true),
  CONSTRAINT sweepstakes_entries_email_lower
    CHECK (entrant_email = lower(entrant_email))
);

-- The heart of parity: exactly one entry per (promotion, person).
CREATE UNIQUE INDEX sweepstakes_entries_unique_person
  ON public.sweepstakes_entries (promotion_id, dedup_key);

CREATE INDEX sweepstakes_entries_promo_created
  ON public.sweepstakes_entries (promotion_id, created_at);

GRANT SELECT ON public.sweepstakes_entries TO authenticated;
GRANT ALL ON public.sweepstakes_entries TO service_role;

ALTER TABLE public.sweepstakes_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own entries"
  ON public.sweepstakes_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all entries"
  ON public.sweepstakes_entries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Service role manages entries"
  ON public.sweepstakes_entries FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 3. sweepstakes_drawings
-- ============================================================
CREATE TABLE public.sweepstakes_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.sweepstakes_promotions(id) ON DELETE RESTRICT,
  drawn_at timestamptz NOT NULL DEFAULT now(),
  drawn_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entrant_count integer NOT NULL,
  entry_set_commitment text NOT NULL,        -- SHA-256(hex) over ordered entry IDs
  selection_seed text NOT NULL,              -- crypto random hex
  winner_index integer NOT NULL,
  selected_entry_id uuid REFERENCES public.sweepstakes_entries(id) ON DELETE RESTRICT,
  alternate_entry_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  method_description text NOT NULL,
  audit_record jsonb NOT NULL DEFAULT '{}'::jsonb,
  winner_notified_at timestamptz,
  winner_response_deadline timestamptz,
  winner_status text NOT NULL DEFAULT 'pending',   -- pending|notified|confirmed|forfeited|awarded
  final_winner_entry_id uuid REFERENCES public.sweepstakes_entries(id) ON DELETE RESTRICT,
  CONSTRAINT sweepstakes_drawings_status_check
    CHECK (winner_status = ANY (ARRAY['pending','notified','confirmed','forfeited','awarded']))
);

-- One drawing per promotion (rerun requires void + new promotion).
CREATE UNIQUE INDEX sweepstakes_drawings_one_per_promo
  ON public.sweepstakes_drawings (promotion_id);

GRANT SELECT ON public.sweepstakes_drawings TO authenticated;
GRANT ALL ON public.sweepstakes_drawings TO service_role;

ALTER TABLE public.sweepstakes_drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read drawings"
  ON public.sweepstakes_drawings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Service role manages drawings"
  ON public.sweepstakes_drawings FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 4. appearance_releases
-- ============================================================
CREATE TABLE public.appearance_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_full_legal_name text NOT NULL,
  person_email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  release_document_path text,                  -- storage path or external reference
  release_document_sha256 text,
  signed_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  revocation_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appearance_releases_status_check
    CHECK (status = ANY (ARRAY['pending','signed','verified','revoked']))
);

CREATE INDEX appearance_releases_person_email_idx
  ON public.appearance_releases (lower(person_email));

GRANT SELECT ON public.appearance_releases TO authenticated;
GRANT ALL ON public.appearance_releases TO service_role;

ALTER TABLE public.appearance_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own releases"
  ON public.appearance_releases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all releases"
  ON public.appearance_releases FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Service role manages releases"
  ON public.appearance_releases FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER appearance_releases_set_updated_at
  BEFORE UPDATE ON public.appearance_releases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. cameo_candidates (production pipeline with release gate)
-- ============================================================
CREATE TABLE public.cameo_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.cameo_submissions(id) ON DELETE SET NULL,
  person_full_legal_name text NOT NULL,
  person_email text NOT NULL,
  appearance_release_id uuid REFERENCES public.appearance_releases(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending_release',
  editorial_notes text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cameo_candidates_status_check
    CHECK (status = ANY (ARRAY['pending_release','under_review','ready_for_production','rejected','withdrawn']))
);

GRANT SELECT ON public.cameo_candidates TO authenticated;
GRANT ALL ON public.cameo_candidates TO service_role;

ALTER TABLE public.cameo_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read cameo candidates"
  ON public.cameo_candidates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Service role manages cameo candidates"
  ON public.cameo_candidates FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER cameo_candidates_set_updated_at
  BEFORE UPDATE ON public.cameo_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enforcement: a candidate can only reach 'ready_for_production' after
-- a signed AND verified appearance release is attached.
CREATE OR REPLACE FUNCTION public.enforce_cameo_release_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_release public.appearance_releases;
BEGIN
  IF NEW.status = 'ready_for_production' THEN
    IF NEW.appearance_release_id IS NULL THEN
      RAISE EXCEPTION 'Cameo candidate % cannot be ready_for_production without an appearance release', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT * INTO v_release
    FROM public.appearance_releases
    WHERE id = NEW.appearance_release_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'appearance_release % not found', NEW.appearance_release_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
    IF v_release.status <> 'verified' THEN
      RAISE EXCEPTION 'appearance_release % must be verified (current status: %)',
        v_release.id, v_release.status
        USING ERRCODE = 'check_violation';
    END IF;
    IF v_release.signed_at IS NULL OR v_release.verified_at IS NULL THEN
      RAISE EXCEPTION 'appearance_release % must be both signed and verified', v_release.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cameo_candidates_release_gate
  BEFORE INSERT OR UPDATE ON public.cameo_candidates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_cameo_release_gate();
