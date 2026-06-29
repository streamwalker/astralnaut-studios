## Change

Repoint the header's "Start reading →" button (currently `/reader/battlefield-atlantis/1`) so it sends the reader to "The Slate" section on the landing page instead of dropping them into Battlefield Atlantis #1.

## Implementation

In `src/components/site-header.tsx`:

- Replace the `<Link to="/reader/$series/$issue" params={…}>Start reading →</Link>` at the end of the header with a smart navigator:
  - On the home route (`/`), render an `<a href="#slate">` that smooth-scrolls to the Slate section (matches the existing "Browse the slate" CTA pattern in `src/routes/index.tsx`).
  - On any other route, render `<Link to="/" hash="slate">` so it lands on the home page already scrolled to The Slate.
- Keep the existing `.btn-cta` styling, label, and `hidden sm:inline-flex` visibility unchanged.

No other buttons, routes, or business logic touched.