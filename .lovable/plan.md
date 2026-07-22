Plan: Add "About the Author" section to Children of Aquarius

Goal
----
Introduce a new "About the Author" band on `/children-of-aquarius` that uses the provided Air Force intelligence background to build mystery around the series, while keeping the framing legally safe and clearly separating documented career credentials from any suggested knowledge of classified UAP programs.

Where it goes
-------------
Insert a new section on `src/routes/children-of-aquarius.tsx` between the "Issue #1 Details" block and the "Meet the Cast" section, so it acts as a bridge from story setup to character exploration.

Copy strategy
-------------
Use the "Recommended core positioning" as the main body because it already contains the safest, most repeatable framing. Add one short advertising hook as a pull-quote for visual punch.

Main body:
- "Written by a former United States Air Force intelligence operator whose national-security career spanned more than three decades and included Top Secret/SCI access, Children of Aquarius brings an uncommon understanding of secrecy, compartmentalization, and classified operations to the UAP mystery."
- "As for what the author may know—directly or indirectly—about alleged U.S. Air Force UAP crash-retrieval and recovery efforts, he can neither officially confirm nor deny."

Pull quote:
- "Fiction informed by more than three decades inside the United States Air Force intelligence environment."

Implementation details
----------------------
1. Create a local `AuthorSection` component inside `src/routes/children-of-aquarius.tsx` (keeps the route self-contained and avoids adding a one-off shared component).
2. Style it consistently with the existing page:
   - `card-rwc` container with a left violet accent border (`border-l-4 border-violet-400`).
   - Eyebrow label "About the author" in the existing uppercase tracking style.
   - Body text uses the existing `text-[var(--ink2)]` color and comfortable line-height.
   - Pull quote styled with `font-black` and `text-[var(--gold)]` to match other highlighted phrases on the page.
3. Keep the section responsive: single column on mobile, no grid needed; max-width constrained with `max-w-3xl` or `measure` utility so long lines stay readable.
4. Do not alter the page's existing JSON-LD `author` field (already "Phil Russell"); the new section is presentation-only and does not change structured data.
5. Do not add i18n keys in this pass — the author positioning is English-first marketing copy and can be translated later if the i18n workflow is expanded.

Verification
------------
- Run TypeScript build to confirm no errors.
- Run a Playwright smoke test on `/children-of-aquarius` to verify the new section renders, contains the key phrases, and does not break layout or console.

Files changed
-------------
- `src/routes/children-of-aquarius.tsx`