
-- 1. Carousel slides table
CREATE TABLE public.carousel_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.carousel_slides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.carousel_slides TO authenticated;
GRANT ALL ON public.carousel_slides TO service_role;

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published slides"
  ON public.carousel_slides FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins read all slides"
  ON public.carousel_slides FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage slides"
  ON public.carousel_slides FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER carousel_slides_updated_at
  BEFORE UPDATE ON public.carousel_slides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Seed slides (matches current cover-fan.tsx ordering, with BA main = new Primary Cover A)
INSERT INTO public.carousel_slides (image_path, alt, sort_order, is_published) VALUES
  ('battlefield-atlantis/issue-1/primary-cover-a.png', 'Battlefield Atlantis Issue 1 — Primary Cover', 10, true),
  ('battlefield-atlantis/issue-1/variant-cover-2.png', 'Battlefield Atlantis Issue 1 — Variant Cover', 20, true),
  ('battlefield-atlantis/issue-1/ryuken-crew-cover.png', 'Battlefield Atlantis Issue 1 — Ryuken Crew Cover', 30, true),
  ('/__l5e/assets-v1/f31da12a-8056-4f8c-a723-84aad3d6c0e2/darker-ages-issue-1-cover.png', 'Darker Ages Issue 1 — The Astral Temptation', 40, true),
  ('children-of-aquarius/issue-1/main-cover.png', 'Children of Aquarius Issue 1', 50, true),
  ('children-of-aquarius/issue-1/variant-a.png', 'Children of Aquarius Issue 1 — Variant A', 60, true),
  ('children-of-aquarius/issue-1/variant-b.png', 'Children of Aquarius Issue 1 — Variant B', 70, true);

-- 3. Update BA Issue 1 main cover_path
UPDATE public.issues
   SET cover_path = 'battlefield-atlantis/issue-1/primary-cover-a.png'
 WHERE series_id = '16fcc5a9-4356-48fb-9bec-3cedc1929f3d'
   AND issue_number = 1;

-- 4. Seed Children of Aquarius characters
INSERT INTO public.characters (slug, series_id, name, role, faction, short_description, bio, portrait_path, sort_order, is_published) VALUES
  ('coa-michael',           'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Michael', 'Heart of Christ', 'The Trinity', 'A thoughtful Brooklyn 15-year-old, fiercely loyal and driven by justice.', 'Michael is the Heart of the Trinity — compassion, conscience, and the moral center of the Christ Child''s three-fold expression in the Aquarian Age.', 'characters/children-of-aquarius/michael.png', 10, true),
  ('coa-lila',              'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Lila', 'Michael''s Friend', 'Brooklyn Circle', 'Sharp-witted voice of reason. Skeptical, ambitious, three steps ahead.', 'Lila reads people the way other kids read screens. She is the first to see the pattern, and the last to admit she is afraid of it.', 'characters/children-of-aquarius/lila.png', 20, true),
  ('coa-jon-monarch',       'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Jon Monarch', 'Cybernetic Operative', 'Operatives', 'Resurrected after 25,000 years. Shifts timelines and realities at will.', 'Jon Monarch returned to a world that buried him long ago. He moves between timelines with the casual cruelty of a man who has already paid every price.', 'characters/children-of-aquarius/jon-monarch.png', 30, true),
  ('coa-father-blaire',     'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Father Alistaire Blaire', 'Protector of the Trinity', 'Excommunicated Clergy', 'Excommunicated immortal priest guarding the Christ Child across centuries.', 'Excommunicated by Rome, sustained by something older. Blaire has guarded the Trinity for longer than any church has existed.', 'characters/children-of-aquarius/father-blaire.png', 40, true),
  ('coa-edmund-burke',      'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Edmund Burke', 'Strategic Operative', 'Operatives', 'Tactical, composed, and lethal in a bespoke three-piece suit.', 'Where Jon improvises, Burke plans. He arrives early, leaves late, and never raises his voice.', 'characters/children-of-aquarius/edmund-burke.png', 50, true),
  ('coa-simon-olatunji',    'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Simon Olatunji', 'The Hand of Christ', 'The Trinity', 'A rescued herald-protector whose faith, strength, and purpose make him a living shield.', 'The Hand acts. Simon''s strength is faith made physical — the Trinity''s shield in the field.', 'characters/children-of-aquarius/simon-olatunji.png', 60, true),
  ('coa-stacey',            'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Stacey', 'Michael''s Friend', 'Brooklyn Circle', 'Warm, upbeat, and brave under pressure—the glue that keeps the friend group together.', 'Stacey holds the circle. The first to crack a joke, the last to leave a friend behind.', 'characters/children-of-aquarius/stacey.png', 70, true),
  ('coa-annie',             'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Annie', 'Guide and Peacemaker', 'Brooklyn Circle', 'Grounded, intuitive, and quietly magnetic, bringing empathy and wisdom wherever she goes.', 'Annie''s gift is presence. People tell her things they have not told themselves.', 'characters/children-of-aquarius/annie.png', 80, true),
  ('coa-gil',               'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Gil', 'Michael''s Father Figure', 'Brooklyn Circle', 'A retired fire chief with quiet strength, hidden history, and an instinct to protect.', 'A retired fire chief who walked into more burning buildings than anyone remembers. He is not finished walking in.', 'characters/children-of-aquarius/gil.png', 90, true),
  ('coa-jeff',              'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Jeff', 'Troubled Teen', 'Brooklyn Circle', 'Guarded, observant, and creative—a Brooklyn outsider carrying more anger than he shows.', 'Jeff sees what others miss because he has spent his life being missed. The anger is loud. The art is louder.', 'characters/children-of-aquarius/jeff.png', 100, true),
  ('coa-ryoko-phase-one',   'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Ryoko Tsurayaba', 'The Head of Christ — Phase One', 'The Trinity', 'Quietly intense 13-year-old psionic from Japan. Telekinesis, psychometry, and glimpses of past and future.', 'The Head perceives. Ryoko''s mind reaches through time the way other minds reach through a room.', 'characters/children-of-aquarius/ryoko-phase-one.png', 110, true),
  ('coa-ryoko-tactical',    'dc1d26ce-8db9-43c4-9855-69752d9dc312', 'Ryoko Tsurayaba', 'The Head of Christ — Tactical Ops', 'The Trinity', 'Disciplined and calm under pressure. Precision force manipulation, levitation, and battlefield awareness.', 'Phase Two Ryoko has been trained. The same gift, weaponized — and held in check by the same quiet center.', 'characters/children-of-aquarius/ryoko-tactical-ops.png', 120, true);
