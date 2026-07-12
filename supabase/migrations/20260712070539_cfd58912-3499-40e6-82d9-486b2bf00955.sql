
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS issn TEXT;

ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS internal_identifier TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS volume INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS publication_year INTEGER NOT NULL DEFAULT 2026;

CREATE UNIQUE INDEX IF NOT EXISTS issues_internal_identifier_key
  ON public.issues (internal_identifier)
  WHERE internal_identifier IS NOT NULL;

-- Backfill existing issues
UPDATE public.issues i
SET internal_identifier = 'BFA-V' || lpad(i.volume::text, 2, '0') || '-I' || lpad(i.issue_number::text, 3, '0') || '-WEB'
FROM public.series s
WHERE s.id = i.series_id AND s.slug = 'battlefield-atlantis' AND i.internal_identifier IS NULL;

UPDATE public.issues i
SET internal_identifier = 'COA-V' || lpad(i.volume::text, 2, '0') || '-I' || lpad(i.issue_number::text, 3, '0') || '-WEB'
FROM public.series s
WHERE s.id = i.series_id AND s.slug = 'children-of-aquarius' AND i.internal_identifier IS NULL;

UPDATE public.issues i
SET internal_identifier = 'DA-V' || lpad(i.volume::text, 2, '0') || '-I' || lpad(i.issue_number::text, 3, '0') || '-WEB'
FROM public.series s
WHERE s.id = i.series_id AND s.slug = 'darker-ages' AND i.internal_identifier IS NULL;
