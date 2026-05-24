
-- 1. Remove broad SELECT policies on storage.objects for public buckets.
-- Files in public buckets remain accessible via their public URL (CDN); removing
-- these policies only prevents enumerating/listing bucket contents through the API.
DROP POLICY IF EXISTS "Public read blog covers" ON storage.objects;
DROP POLICY IF EXISTS "Public read character art" ON storage.objects;
DROP POLICY IF EXISTS "Public read comic pages" ON storage.objects;

-- 2. Revoke EXECUTE on the admin-bootstrap trigger function from API roles.
-- It's only invoked by triggers and should never be callable from PostgREST.
REVOKE EXECUTE ON FUNCTION public.handle_new_admin_user() FROM PUBLIC, anon, authenticated;

-- 3. Harden raffle_entries to prevent any future exposure of AMOE (anonymous) rows.
-- 3a. Tighten the AMOE insert policy so user_id MUST be NULL on anonymous entries
--     (prevents an attacker from inserting a row attributed to another user).
DROP POLICY IF EXISTS "Public can submit free AMOE entries" ON public.raffle_entries;
CREATE POLICY "Public can submit free AMOE entries"
ON public.raffle_entries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  source = 'amoe'
  AND user_id IS NULL
  AND tier IS NULL
  AND email IS NOT NULL
  AND length(email) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (name IS NULL OR length(name) <= 200)
  AND week_key IS NOT NULL
  AND length(week_key) BETWEEN 6 AND 16
);

-- 3b. Make the "view own entries" policy explicit about requiring a non-null match
--     so AMOE rows (user_id IS NULL) can never accidentally be returned.
DROP POLICY IF EXISTS "Users can view own entries" ON public.raffle_entries;
CREATE POLICY "Users can view own entries"
ON public.raffle_entries
FOR SELECT
TO authenticated
USING (user_id IS NOT NULL AND auth.uid() = user_id);
