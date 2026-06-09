-- 1) Remove direct subscriber read of paid comic rows.
DROP POLICY IF EXISTS "Subscribers can read published paid comics" ON public.comics;

-- 2) Tighten newsletter subscribe insert.
DROP POLICY IF EXISTS "Public subscribe" ON public.subscribers;

CREATE POLICY "Public subscribe"
ON public.subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  confirmed = false
  AND active = false
  AND (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  )
  AND email IS NOT NULL
  AND char_length(email) BETWEEN 3 AND 254
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);
