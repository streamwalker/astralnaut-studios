
CREATE TYPE public.media_asset_type AS ENUM ('issue_cover','carousel_slide','character_portrait');

CREATE TABLE public.media_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type public.media_asset_type NOT NULL,
  asset_id uuid NOT NULL,
  image_path text,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX media_versions_asset_idx ON public.media_versions (asset_type, asset_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_versions TO authenticated;
GRANT ALL ON public.media_versions TO service_role;

ALTER TABLE public.media_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view media versions"
  ON public.media_versions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert media versions"
  ON public.media_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media versions"
  ON public.media_versions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
