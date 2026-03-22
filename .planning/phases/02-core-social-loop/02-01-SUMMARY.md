---
phase: 02-core-social-loop
plan: 01
subsystem: api
tags: [drizzle, zod, tanstack-query, rest-api, posts, validation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Users table schema, auth session (getSession), DB client, Zod validation pattern, SessionProvider"
provides:
  - "Post CRUD service layer (createPost, deletePost, getFeedPosts, getUserPosts, getUserPostCount, getUserByUsername)"
  - "REST API routes: GET/POST /api/posts, DELETE /api/posts/[id]"
  - "Zod createPostSchema for 1-280 char content validation"
  - "QueryProvider wrapper with TanStack Query"
  - "FeedPost type for feed/profile UI consumers"
affects: [02-core-social-loop, profile-page, feed-ui]

# Tech tracking
tech-stack:
  added: ["@tanstack/react-query", "date-fns", "lucide-react"]
  patterns: ["Service layer with JOIN queries (no N+1)", "Ownership-checked delete (WHERE id AND userId)", "QueryProvider with useState initialization pattern"]

key-files:
  created:
    - chirp/src/lib/validations/post.ts
    - chirp/src/lib/services/posts.ts
    - chirp/src/app/api/posts/route.ts
    - chirp/src/app/api/posts/[id]/route.ts
    - chirp/src/components/providers/QueryProvider.tsx
  modified:
    - chirp/package.json
    - chirp/src/app/layout.tsx

key-decisions:
  - "Used inline params type ({ params: Promise<{ id: string }> }) for DELETE route instead of RouteContext since types not yet generated for new route"
  - "Shared postWithAuthorSelect object between getFeedPosts and getUserPosts to avoid duplication"

patterns-established:
  - "Service layer pattern: business logic in /lib/services/, API routes thin and delegating"
  - "JOIN query pattern: innerJoin users table for author info, avoiding N+1"
  - "Ownership-checked operations: WHERE clause includes both resource ID and user ID"
  - "No passwordHash in any select outside auth code"

requirements-completed: [POST-01, POST-02, POST-03, PROF-01]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 02 Plan 01: Post API Backend Summary

**Post CRUD API with Zod validation, JOIN-based feed queries (no N+1), ownership-checked delete, and TanStack Query provider**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T17:09:28Z
- **Completed:** 2026-03-22T17:12:53Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Zod validation schema enforcing 1-280 character post content with trim
- Six service functions with efficient JOIN queries and ownership-checked delete
- REST API endpoints: authenticated feed listing, post creation with validation, ownership-checked deletion
- TanStack Query provider wrapping app with 30s stale time

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, create validation schema and service layer** - `c3d0107` (feat)
2. **Task 2: Create API routes and QueryProvider wrapper** - `18399cb` (feat)

## Files Created/Modified
- `chirp/package.json` - Added @tanstack/react-query, date-fns, lucide-react
- `chirp/src/lib/validations/post.ts` - Zod schema for post creation (1-280 chars)
- `chirp/src/lib/services/posts.ts` - Post CRUD service with JOIN queries, no passwordHash
- `chirp/src/app/api/posts/route.ts` - GET (feed) and POST (create) endpoints with auth
- `chirp/src/app/api/posts/[id]/route.ts` - DELETE endpoint with ownership check, async params
- `chirp/src/components/providers/QueryProvider.tsx` - TanStack Query client provider
- `chirp/src/app/layout.tsx` - Added QueryProvider wrapping inside SessionProvider

## Decisions Made
- Used inline params type pattern (`{ params: Promise<{ id: string }> }`) rather than `RouteContext` for the DELETE route, since RouteContext types are generated and the route didn't exist yet at creation time
- Extracted shared `postWithAuthorSelect` object to DRY up the select shape between getFeedPosts and getUserPosts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All API endpoints ready for the feed UI (Plan 02) to consume
- FeedPost type exported for TypeScript consumers
- QueryProvider active for client-side data fetching hooks
- Service functions available for profile page rendering

## Self-Check: PASSED

All 6 created files verified present. Both task commits (c3d0107, 18399cb) confirmed in git log.

---
*Phase: 02-core-social-loop*
*Completed: 2026-03-22*
