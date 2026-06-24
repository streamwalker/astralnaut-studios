## Change 1 — Hero rotator tagline (Battlefield Atlantis slot)

File: `src/components/home/HeroRotator.tsx` (line 43)

Replace the BA slot `tagline`:

- From: "Earth's mightiest pilots scramble against a War-of-the-Worlds extinction event. The first act is free."
- To: **"The world before our world began. Meet the heroes of old who paved the way for our world today. The First Act is Free."**

## Change 2 — Series card blurb (Battlefield Atlantis logline)

The text in screenshot 2 is the BA `logline` stored in the database; it renders inside the Battlefield Atlantis series card on the landing page (and anywhere else `listSeries` is consumed).

Add a new migration `supabase/migrations/<timestamp>_update_ba_logline.sql` that runs:

```sql
UPDATE public.series
SET logline = 'Twenty-five thousand years ago, our galaxy was known as the Nerrian Galaxy. The planets Earth, Ares, and Mars are hosts to a technologically advanced society of human beings and many other alien races. Zeus and the Allies — Astra and Orion the Hunter — are sanctioned by the TPC to handle threats too great for the Nerrian Defense Force to handle alone.'
WHERE slug = 'battlefield-atlantis';
```

No schema changes, no policy changes — content only.

## Out of scope (ask if you want these too)

- The BA route's `<meta name="description">` (line 21 of `src/routes/battlefield-atlantis.tsx`) and the in-page hero paragraph (line 191) still contain the older "Saantris Station / Coalition splits" copy. They are not in either screenshot, so I'll leave them alone unless you'd like them rewritten to match the new tone.
