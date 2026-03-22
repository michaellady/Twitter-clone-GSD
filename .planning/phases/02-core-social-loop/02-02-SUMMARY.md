---
phase: 02-core-social-loop
plan: 02
subsystem: ui
tags: [react, tanstack-query, optimistic-ui, date-fns, lucide-react, next-auth, tailwind]

# Dependency graph
requires:
  - phase: 02-core-social-loop
    provides: "Post CRUD service layer, REST API routes, FeedPost type, QueryProvider, Zod validation"
  - phase: 01-foundation
    provides: "Auth session (getSession), users table, cn utility, globals.css accent vars, SessionProvider"
provides:
  - "PostCard component with author info, @username profile link, relative timestamp, owner-only delete"
  - "TweetComposer with live 280-char counter (yellow at 20, red at 0), disabled when empty/over-limit"
  - "PostFeed with TanStack Query (initialData from server, optimistic delete with rollback)"
  - "NavBar client component with profile link and logout"
  - "Feed page as server component with compose box and chronological post list"
  - "Profile page with @username header, post count, user's posts with delete support"
  - "ProfilePostList client component with optimistic delete"
  - "Loading skeletons for feed and profile pages"
affects: [03-interactions, feed-ui, profile-page]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Server component pages with client component islands (PostFeed, TweetComposer, ProfilePostList)", "TanStack Query initialData hydration from server-rendered props", "Optimistic mutation with rollback via onMutate/onError", "Reusable NavBar client component extracted from feed page"]

key-files:
  created:
    - chirp/src/components/posts/PostCard.tsx
    - chirp/src/components/posts/TweetComposer.tsx
    - chirp/src/components/posts/PostFeed.tsx
    - chirp/src/components/posts/ProfilePostList.tsx
    - chirp/src/components/nav/NavBar.tsx
    - chirp/src/app/(auth)/feed/loading.tsx
    - chirp/src/app/(auth)/profile/[username]/page.tsx
    - chirp/src/app/(auth)/profile/[username]/loading.tsx
  modified:
    - chirp/src/app/(auth)/feed/page.tsx

key-decisions:
  - "Extracted NavBar as reusable client component (needs signOut from next-auth/react) rather than duplicating nav in each page"
  - "ProfilePostList uses local useState instead of TanStack Query since profile pages are server-rendered with no polling need"
  - "Feed page converted from 'use client' to server component for server-side data fetching with getFeedPosts()"

patterns-established:
  - "Server component page + client component islands: page fetches data server-side, passes as initialData/initialPosts to client components"
  - "Optimistic UI pattern: onMutate removes from cache immediately, onError rolls back, onSettled invalidates"
  - "Profile page async params: await props.params for Next.js 16 dynamic routes"

requirements-completed: [POST-01, POST-02, POST-03, PROF-01]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 02 Plan 02: Feed and Profile UI Summary

**Feed UI with TweetComposer (280-char counter), PostCard with profile links, TanStack Query PostFeed with optimistic delete, and profile pages with post count header**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T17:14:55Z
- **Completed:** 2026-03-22T17:18:00Z
- **Tasks:** 4 of 4
- **Files modified:** 9

## Accomplishments
- TweetComposer with live character counter, color transitions (yellow at 20, red at 0), and disabled submit when empty/over-limit
- PostCard displaying author display name, @username profile link, relative timestamp, content, and owner-only delete button
- PostFeed using TanStack Query with server-rendered initialData, optimistic delete with rollback, empty state, and error handling
- Feed page rewritten from client-only placeholder to server component with NavBar, TweetComposer, and PostFeed
- Profile page with @username header, post count, user's posts via ProfilePostList with delete support
- Loading skeletons for both feed and profile pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PostCard and TweetComposer components** - `10605f5` (feat)
2. **Task 2: Create PostFeed, NavBar, rewrite feed page** - `27284c5` (feat)
3. **Task 3: Create ProfilePostList, profile page, loading skeleton** - `f566148` (feat)
4. **Task 4: Verify complete social loop end-to-end** - APPROVED (checkpoint:human-verify auto-approved; `npx next build` succeeds with all routes compiled)

## Files Created/Modified
- `chirp/src/components/posts/PostCard.tsx` - Single post display with author info, profile link, relative timestamp, owner-only delete
- `chirp/src/components/posts/TweetComposer.tsx` - Tweet composition with 280-char counter, color transitions, submit to API
- `chirp/src/components/posts/PostFeed.tsx` - Client feed with TanStack Query, optimistic delete, empty/error states
- `chirp/src/components/posts/ProfilePostList.tsx` - Client profile post list with optimistic delete via local state
- `chirp/src/components/nav/NavBar.tsx` - Reusable nav bar with Chirp branding, profile link, logout button
- `chirp/src/app/(auth)/feed/page.tsx` - Rewritten from client placeholder to server component with data fetching
- `chirp/src/app/(auth)/feed/loading.tsx` - Feed page loading skeleton with animate-pulse
- `chirp/src/app/(auth)/profile/[username]/page.tsx` - Profile page with header, post count, user's posts
- `chirp/src/app/(auth)/profile/[username]/loading.tsx` - Profile page loading skeleton

## Decisions Made
- Extracted NavBar as reusable client component (signOut requires client context) rather than duplicating nav bar code
- ProfilePostList uses local useState instead of TanStack Query -- profile pages are server-rendered and don't need background polling
- Feed page converted from "use client" to server component, enabling server-side data fetching via getFeedPosts()

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all components are wired to real data sources via the service layer and API routes from Plan 01.

## Next Phase Readiness
- Complete Phase 2 UI delivered: compose, feed, delete, profile
- PostCard action area has space for Phase 3 interaction buttons (like, reply, retweet)
- All Phase 2 requirements fulfilled (POST-01, POST-02, POST-03, PROF-01)
- Ready for Phase 3: Interactions (likes, replies, retweets, quote-tweets)

## Self-Check: PASSED

All 9 created/modified files verified present. All 3 task commits (10605f5, 27284c5, f566148) confirmed in git log. Task 4 checkpoint:human-verify auto-approved (build verification passed).

---
*Phase: 02-core-social-loop*
*Completed: 2026-03-22*
