# Shared comic reader

Battlefield Atlantis and Children of Aquarius use the same reader route. The refreshed issue header provides a series switcher, page selector, thumbnail browser, reading progress, and account-scoped resume position. Single-page reading retains zoom, pan, fullscreen, and keyboard controls; continuous reading tracks the visible page. Selecting a locked page from continuous mode opens the existing access/paywall view rather than silently clamping to an unrelated page.

Thumbnails use only cover/public-preview paths or paths returned by the existing entitlement function. Unpublished/future free-page paths are stripped from the public issue bundle. The existing subscriber tier and release-date rules remain in `comic-pages.functions.ts` and `page-access.ts`.

Failed artwork displays a retry control. Page effects are opt-in; development FX controls are no longer part of the reader UI. Original comic files, issue records, subscriptions, release schedules, and uploaded content are not changed by this release.
