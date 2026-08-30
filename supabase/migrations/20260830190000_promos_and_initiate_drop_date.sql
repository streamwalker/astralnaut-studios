-- Admin-editable announcements, and one additive column for the drop schedule.
--
-- Context. Two surfaces had rotted because their text was hardcoded in the
-- React tree with no way for an admin to change it:
--
--   * the sitewide PromoBar, whose copy was a literal default prop
--   * the Battlefield Atlantis release schedule ("issue completes end of
--     July", "Next drop · Pages 10-13"), a const map in the route file
--
-- The schedule half needs no new table. public.issue_drops already exists,
-- is already joined into getIssueBundle, and is already consumed correctly by
-- /children-of-aquarius. Battlefield Atlantis simply ignored it and hardcoded
-- dates instead. The fix there is application-side: read the rows that the
-- loader is already fetching.
--
-- The only genuinely missing pieces are a table for dated announcements, and
-- an initiate_date on issue_drops so the per-tier drop card can be driven by
-- data rather than by three hardcoded rows.

-- ---------------------------------------------------------------- promos ---
--
-- A dated queue, not a single editable row. A single row means a
-- date-stamped announcement stays up until someone remembers to take it
-- down, which is exactly how "issue completes end of July" survived into
-- August. With a window, the announcement retires itself.

CREATE TABLE public.promos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message     text NOT NULL,
  href        text,
  cta         text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  priority    integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promos_message_not_blank CHECK (length(btrim(message)) > 0),
  CONSTRAINT promos_window_ordered
    CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

COMMENT ON TABLE public.promos IS
  'Queue for the sitewide announcement bar. The site renders the highest-priority row whose window contains now(). NULL starts_at means already running; NULL ends_at means runs until deactivated.';

CREATE INDEX promos_live_idx ON public.promos (is_active, priority DESC, starts_at DESC);

CREATE TRIGGER promos_set_updated_at
  BEFORE UPDATE ON public.promos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

-- Public SELECT is scoped to the live window, matching the author_bio_variants
-- convention of not exposing inactive rows. Server functions use the service
-- role and bypass this, so it is defence in depth rather than the gate.
CREATE POLICY "Live promos are public"
  ON public.promos FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >  now())
  );

CREATE POLICY "Admins manage promos"
  ON public.promos FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- No seed row. The bar falls back to its existing evergreen copy when the
-- queue is empty, so shipping this changes nothing visible until an admin
-- schedules something.

-- --------------------------------------------------- issue_drops.initiate ---
--
-- Additive and nullable. issue_drops has carried patron_date and reader_date
-- since 20260521044023; the middle tier was never stored, so the Battlefield
-- Atlantis page hardcoded all three rows. Callers fall back to patron_date + 1
-- day when this is NULL, which is what the hardcoded copy asserted anyway
-- (Patron Tue · Initiate Wed · Reader Thu). Existing rows are unaffected.

ALTER TABLE public.issue_drops ADD COLUMN initiate_date date;

COMMENT ON COLUMN public.issue_drops.initiate_date IS
  'Date the Initiate tier receives this batch. NULL means "the day after patron_date"; callers apply that fallback.';
