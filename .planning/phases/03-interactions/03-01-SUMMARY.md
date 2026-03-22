---
phase: 03-interactions
plan: 01
subsystem: api
tags: [drizzle, sqlite, likes, retweets, replies, subqueries, next-api-routes]

# Dependency graph
requires:
  - phase: 02-posting
    provides: "posts service layer, API route patterns, FeedPost type, PostFeed/ProfilePostList components"
provides:
  - "Enriched FeedPost type with interaction counts and user-state booleans"
  - "toggleLike service function"
  - "createRetweet/deleteRetweet service functions"
  - "createReply/getReplies service functions"
  - "API routes: /api/posts/[id]/like, /api/posts/[id]/retweet, /api/posts/[id]/replies"
  - "currentUserId wired through feed and profile queries"
affects: [03-02, 03-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Enriched subquery pattern: raw SQL subqueries in Drizzle select for derived counts"
    - "Boolean coercion pattern: SQLite returns 0/1 for EXISTS, coerce with !! in mapRow"
    - "Self-join via subquery: avoid Drizzle alias issues by using raw SQL for self-referencing posts table"

key-files:
  created:
    - "chirp/src/lib/services/likes.ts"
    - "chirp/src/lib/services/retweets.ts"
    - "chirp/src/app/api/posts/[id]/like/route.ts"
    - "chirp/src/app/api/posts/[id]/retweet/route.ts"
    - "chirp/src/app/api/posts/[id]/replies/route.ts"
  modified:
    - "chirp/src/lib/services/posts.ts"
    - "chirp/src/app/api/posts/route.ts"
    - "chirp/src/app/(auth)/feed/page.tsx"
    - "chirp/src/app/(auth)/profile/[username]/page.tsx"

key-decisions:
  - "Used raw SQL subqueries instead of Drizzle db.$count() for self-referencing counts to avoid table alias ambiguity"
  - "Used scalar subqueries for retweet resolution instead of LEFT JOINs to keep Drizzle select API clean"
  - "mapRow helper function centralizes type coercion for SQLite boolean values"

patterns-established:
  - "Enriched query pattern: single query with scalar subqueries for counts and boolean flags"
  - "Service toggle pattern: check-existing then insert/delete with count return"
  - "Nested API route pattern: /api/posts/[id]/like, /retweet, /replies following same auth+params structure"

requirements-completed: [INTR-01, INTR-02, INTR-03, INTR-04]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 3 Plan 1: Interaction Backend Summary

**Enriched feed query with likeCount/replyCount/repostCount subqueries, toggleLike/createRetweet/deleteRetweet services, reply CRUD, and three new API routes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T18:01:41Z
- **Completed:** 2026-03-22T18:03:59Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Extended FeedPost type from 6 fields to 20+ fields including interaction counts, user-state booleans, and retweet resolution fields
- Created like toggle service that inserts/deletes rows and returns new count
- Created retweet service with self-retweet guard (D-14) and duplicate prevention
- Created reply service with createReply and getReplies functions
- Added three new API routes (like, retweet, replies) following established auth+params pattern
- Wired currentUserId through all feed and profile queries for personalized interaction state

## Task Commits

Each task was committed atomically:

1. **Task 1: Enrich FeedPost type and create like/retweet/reply service functions** - `7ddcc65` (feat)
2. **Task 2: Create API routes for like, retweet, replies and wire currentUserId** - `87b22bd` (feat)

## Files Created/Modified
- `chirp/src/lib/services/posts.ts` - Enriched FeedPost type, enriched feed/profile queries with subqueries, createReply, getReplies
- `chirp/src/lib/services/likes.ts` - toggleLike service (insert/delete toggle with count return)
- `chirp/src/lib/services/retweets.ts` - createRetweet (with self-retweet/duplicate guards), deleteRetweet
- `chirp/src/app/api/posts/[id]/like/route.ts` - POST handler for like toggle
- `chirp/src/app/api/posts/[id]/retweet/route.ts` - POST/DELETE handlers for retweet
- `chirp/src/app/api/posts/[id]/replies/route.ts` - GET/POST handlers for replies with validation
- `chirp/src/app/api/posts/route.ts` - Passes currentUserId to getFeedPosts
- `chirp/src/app/(auth)/feed/page.tsx` - Passes userId to getFeedPosts for enriched state
- `chirp/src/app/(auth)/profile/[username]/page.tsx` - Passes currentUserId to getUserPosts

## Decisions Made
- Used raw SQL subqueries (`sql<number>`) instead of `db.$count()` for replyCount and repostCount to avoid ambiguity when the posts table references itself
- Used scalar subqueries for retweet resolution (originalContent, originalAuthorUsername, etc.) instead of LEFT JOINs to keep the Drizzle query builder API clean and avoid self-join complexity
- Created a centralized `mapRow` helper that coerces SQLite 0/1 integers to JavaScript booleans for likedByMe/repostedByMe fields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All backend services and API routes are ready for UI plans 03-02 (action bar components) and 03-03 (reply/retweet display)
- FeedPost type provides all data needed for rendering interaction counts, toggle states, and retweet content
- No blockers

## Self-Check: PASSED

All created files verified to exist on disk. All commit hashes verified in git log.

---
*Phase: 03-interactions*
*Completed: 2026-03-22*
