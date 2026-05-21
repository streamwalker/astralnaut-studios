## Goal
Make page 10 of Battlefield Atlantis Issue 1 free to read.

## Why it's currently locked
The reader's free/locked gate uses `Math.floor(issue.free_pages)`. The issue currently has `free_pages = 9.5`, so `floor = 9` — page 10 is locked even though its `comics` row already has `is_free = true` and is published.

## Change
Single data update to the `issues` row for `battlefield-atlantis-issue-1`:

- `free_pages`: 9.5 → 10
- `paid_pages`: 11 → 10 (keeps total at 20.5)
- `total_pages`: unchanged (20.5)

No code changes. The Battlefield Atlantis landing page and reader both read `free_pages` from the DB and will reflect the unlock immediately (KV stat shows "10", page grid marks page 10 FREE, reader serves the image instead of the paywall).

## Out of scope
- No change to drop schedule / `issue_drops`.
- No change to other series or issues.
