
CREATE TABLE public.author_faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.author_faq_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.author_faq_items TO authenticated;
GRANT ALL ON public.author_faq_items TO service_role;

ALTER TABLE public.author_faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active FAQ items"
  ON public.author_faq_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all FAQ items"
  ON public.author_faq_items FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert FAQ items"
  ON public.author_faq_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update FAQ items"
  ON public.author_faq_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete FAQ items"
  ON public.author_faq_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER author_faq_items_set_updated_at
  BEFORE UPDATE ON public.author_faq_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.author_faq_items (question, answer, sort_order) VALUES
('How does the author’s background inform the story?',
 'Phil Russell spent more than three decades in U.S. Air Force intelligence and special-access programs. That experience shaped the way characters handle classified information, compartmentalized operations, and the quiet discipline of people who live inside secrets. The rituals of security, the weight of need-to-know, and the moral tension between disclosure and protection all come from direct familiarity with that world.',
 10),
('Is Children of Aquarius based on real UAP crash-retrieval programs?',
 'The novel is a work of fiction. It draws on the author’s knowledge of intelligence culture and security procedure, but any resemblance to specific government programs, recovered materials, or alleged crash-retrieval efforts is a narrative device. The author can neither confirm nor deny the existence of such programs.',
 20),
('Why the ''neither confirm nor deny'' stance?',
 'It is both a narrative boundary and a professional one. The story is meant to entertain, provoke questions, and honor the mindset of people who guard sensitive information — not to serve as a source document. That boundary protects both the fiction and the real-world obligations that inspired it.',
 30),
('Should readers treat the book as fact or speculation?',
 'As fiction. The book blends esoteric symbolism, religious prophecy, and intelligence tradecraft into a thriller, but it is not reporting, testimony, or disclosure. Readers are invited to enjoy the mystery without mistaking it for evidence.',
 40);
