
ALTER TABLE public.outreach_prospects
  ADD COLUMN IF NOT EXISTS link_check_status text NOT NULL DEFAULT 'unchecked'
    CHECK (link_check_status IN ('unchecked','ok','redirect','broken','error')),
  ADD COLUMN IF NOT EXISTS link_check_http_status integer,
  ADD COLUMN IF NOT EXISTS link_last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS link_failure_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS link_check_note text;

CREATE INDEX IF NOT EXISTS outreach_prospects_link_check_idx
  ON public.outreach_prospects(link_acquired, link_last_checked_at);
