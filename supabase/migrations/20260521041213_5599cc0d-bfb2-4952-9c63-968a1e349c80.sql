
-- Set search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Lock down has_role execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Replace permissive INSERT policies with role+validation scoped ones
DROP POLICY "Anyone can subscribe" ON public.subscribers;
CREATE POLICY "Public subscribe" ON public.subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND confirmed = false
  );

DROP POLICY "Anyone can send contact" ON public.contact_messages;
CREATE POLICY "Public contact" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND length(name) BETWEEN 1 AND 200
    AND email IS NOT NULL AND length(email) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND message IS NOT NULL AND length(message) BETWEEN 1 AND 5000
    AND (subject IS NULL OR length(subject) <= 300)
  );

-- Remove broad listing on public buckets (files still served via public CDN URLs)
DROP POLICY "Public read comic-pages" ON storage.objects;
DROP POLICY "Public read characters bucket" ON storage.objects;
DROP POLICY "Public read blog-covers" ON storage.objects;
