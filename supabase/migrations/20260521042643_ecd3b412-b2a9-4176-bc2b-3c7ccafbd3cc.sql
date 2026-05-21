-- Auto-assign admin role on signup for the designated admin email
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'phil@streamwalkers.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_admin_user();

-- Admin storage write policies for the three public asset buckets
CREATE POLICY "Admins can upload comic pages"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'comic-pages' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update comic pages"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'comic-pages' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete comic pages"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'comic-pages' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload character art"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'characters' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update character art"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'characters' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete character art"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'characters' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload blog covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog covers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'blog-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blog-covers' AND public.has_role(auth.uid(), 'admin'));

-- Public read access on the public buckets (CDN URLs still work, but listing via API also needs SELECT)
CREATE POLICY "Public read comic pages"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'comic-pages');

CREATE POLICY "Public read character art"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'characters');

CREATE POLICY "Public read blog covers"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'blog-covers');