# Real World Comics — Clone Plan

A pixel-faithful rebuild of realworldcomics.com on TanStack Start with a Lovable Cloud backend so you can publish new comic pages, manage the archive, and collect newsletter signups without touching code.

> Note: I couldn't reach the live site (timeouts), so the page list below is the standard webcomic structure. When you upload screenshots/assets, I'll lock the exact layout, typography, color tokens, and section order to match 1:1 before building.

## Pages (TanStack file routes)

```text
src/routes/
  __root.tsx           shared header, footer, nav
  index.tsx            / — latest comic, hero, recent strips
  about.tsx            /about — creator bio, story behind the comic
  comics.tsx           /comics — full archive grid (thumbnails, filters)
  comics.$slug.tsx     /comics/:slug — single comic reader (prev/first/next/last)
  characters.tsx       /characters — cast list
  characters.$slug.tsx /characters/:slug — character bio page
  blog.tsx             /blog — news/posts index
  blog.$slug.tsx       /blog/:slug — single post
  shop.tsx             /shop — merch/print listings (link-out or Stripe later)
  contact.tsx          /contact — contact form
  _authenticated/admin.tsx              admin dashboard
  _authenticated/admin.comics.tsx       upload/edit comics
  _authenticated/admin.posts.tsx        manage blog posts
  _authenticated/admin.subscribers.tsx  newsletter list
  login.tsx            /login — admin sign-in
  api/public/newsletter.ts              public subscribe endpoint
```

Each route gets its own `head()` metadata (title, description, og tags). Comic and blog routes derive `og:image` from the page's cover art.

## Backend (Lovable Cloud)

Tables:
- `comics` — id, slug, title, page_number, image_path, alt_text, transcript, published_at, chapter
- `chapters` — id, title, order
- `characters` — id, slug, name, bio, portrait_path
- `blog_posts` — id, slug, title, body_md, cover_path, published_at
- `subscribers` — id, email, confirmed, created_at
- `contact_messages` — id, name, email, message, created_at
- `user_roles` — admin role table (separate, never on profiles)

Storage buckets:
- `comic-pages` (public read)
- `characters` (public read)
- `blog-covers` (public read)

Auth: email/password + Google sign-in for the admin (you). Public pages are anonymous. RLS:
- All content tables: public SELECT on `published_at <= now()`
- All writes: restricted to `has_role(auth.uid(), 'admin')`
- `subscribers`/`contact_messages`: anon INSERT only; admin SELECT

Server functions (`src/lib/*.functions.ts`):
- `getLatestComic`, `getComicBySlug` (with prev/next), `listComics`
- `listCharacters`, `getCharacter`
- `listPosts`, `getPost`
- `subscribeToNewsletter`, `submitContact`
- Admin: `uploadComic`, `updateComic`, `deleteComic`, `upsertPost`, `upsertCharacter`

## Comic reader UX

- Click image → next page
- Keyboard arrows for prev/next
- First / Prev / Archive / Next / Latest button row
- Hover/click to reveal transcript (accessibility)
- Permalink + social share buttons per page

## Design tokens

Once you send screenshots, I'll extract the exact palette, typography, and spacing into `src/styles.css` as `oklch` tokens (no hard-coded colors in components). All UI built with the existing shadcn primitives + Tailwind utilities.

## Build order

1. Enable Lovable Cloud + migrations (tables, RLS, buckets, admin role)
2. Public layout: header/nav/footer, home, about, contact
3. Comic archive + reader with prev/next navigation
4. Characters + blog
5. Admin auth + dashboard (upload comics, manage posts/characters, view subscribers)
6. Newsletter + contact form wiring
7. SEO metadata + OG images per route
8. Polish pass against your screenshots until pixel-faithful

## What I need from you to start

1. Screenshots of every page on realworldcomics.com you want matched
2. Logo (SVG preferred) + any brand fonts
3. A starter set of comic page images with titles + dates (even 5–10 to seed)
4. The email you want to sign in as the admin

Drop those in the next message and I'll proceed.