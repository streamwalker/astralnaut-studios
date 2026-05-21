## Live, animated subscriber count

Replace the "Subscribers" stat on the landing page with a real count from the database, animated counting up from 0 when the hero loads.

### What changes

**1. New server function `getSubscriberCount`** in `src/lib/public.functions.ts`
- Uses `supabaseAdmin` with `.select('id', { count: 'exact', head: true }).eq('confirmed', true)` to return only the number, not the rows (keeps emails private).
- Returns `{ count: number }`.

**2. New `<CountUp />` component** in `src/components/count-up.tsx`
- Props: `value: number`, `duration?: number` (default 1500ms).
- Animates from 0 → value using `requestAnimationFrame` with ease-out cubic.
- Respects `prefers-reduced-motion` (shows final value immediately).
- Formats with `toLocaleString()` for thousands separators.

**3. Update `src/routes/index.tsx`**
- Add a `useQuery` for `getSubscriberCount`.
- Pass the count into the existing `<Stat label="Subscribers" />` via `<CountUp />`.
- Fallback to milestone count (or 0) while loading so layout doesn't jump.

### Out of scope
- No DB schema changes (the `subscribers` table and RLS already exist; the count is exposed via a server function so RLS stays intact and emails are never sent to the client).
- No changes to the milestone strip, hero copy, or other stats.
- No real-time/websocket updates — count refreshes on page load and on React Query refetch.