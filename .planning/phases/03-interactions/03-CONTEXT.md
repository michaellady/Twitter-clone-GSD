# Phase 3: Interactions - Context

**Gathered:** 2026-03-22 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can engage with posts through likes, replies, retweets, and quote-tweets. No follows, no notifications, no DMs — those are out of scope for v1.

</domain>

<decisions>
## Implementation Decisions

### Like Behavior
- **D-01:** Heart icon with like count on every post card. Toggle: red filled when liked, gray outline when not
- **D-02:** Optimistic UI — count updates immediately on click, rolls back on API failure
- **D-03:** Like state persists on refresh (server-rendered initial state)
- **D-04:** Simple color toggle, no animation — keeps implementation straightforward for learning project

### Reply Threading
- **D-05:** Single-level threading only — replies show directly under parent post, no nested replies-to-replies
- **D-06:** Click reply icon on a post to expand an inline composer below that post
- **D-07:** After submitting reply, it appears immediately under the parent post
- **D-08:** Reply count shown on post card next to reply icon
- **D-09:** Replies use the same PostCard component but with visual indentation and "Replying to @username" header

### Retweet Display
- **D-10:** Retweet is a reference, not a content copy — uses `repostOfId` column from schema
- **D-11:** Retweet appears in feed with "↻ @username retweeted" header above the original post content
- **D-12:** Simple toggle — click retweet icon to retweet/undo, no confirmation dialog
- **D-13:** Retweet count shown on post card
- **D-14:** Cannot retweet your own post

### Quote-Tweet UI
- **D-15:** Click quote icon to open a compose dialog/modal with embedded preview of the original post
- **D-16:** Quote-tweet displays as your text above, with original post as a nested embedded card below
- **D-17:** Quote-tweet is a new post with `repostOfId` set AND has its own content (distinguishes from plain retweet which has no content)
- **D-18:** Character limit applies to the quote text only, not the embedded content

### Claude's Discretion
- Exact icon choices (lucide-react icons for heart, reply, retweet, quote)
- Action bar layout and spacing on post cards
- Reply composer styling details
- Quote-tweet modal/dialog implementation approach
- Loading/error states for interaction mutations
- How to display interaction counts (abbreviated for large numbers or exact)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 2 patterns (established)
- `chirp/src/components/posts/PostCard.tsx` — Existing post card to extend with action bar
- `chirp/src/components/posts/PostFeed.tsx` — TanStack Query pattern for feed with optimistic updates
- `chirp/src/components/posts/TweetComposer.tsx` — Compose pattern to reuse for replies and quotes
- `chirp/src/lib/services/posts.ts` — Service layer pattern with JOIN queries
- `chirp/src/app/api/posts/route.ts` — API route pattern
- `chirp/src/app/api/posts/[id]/route.ts` — API route with params pattern

### Database schema
- `chirp/src/lib/db/schema.ts` — likes table (userId, postId, createdAt), posts.repostOfId for retweets, posts.parentId for replies

### Requirements
- `.planning/REQUIREMENTS.md` — INTR-01, INTR-02, INTR-03, INTR-04

### Research
- `.planning/research/ARCHITECTURE.md` — Interaction data model patterns
- `.planning/research/PITFALLS.md` — Retweet as reference not copy, derived counts not stored columns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PostCard.tsx` — Extend with action bar (like, reply, retweet, quote buttons with counts)
- `TweetComposer.tsx` — Reuse for reply composer (same 280-char limit, same form pattern)
- `PostFeed.tsx` — TanStack Query pattern with optimistic updates (extend for likes/retweets)
- `ProfilePostList.tsx` — Also needs action bar integration
- Service layer pattern (`services/posts.ts`) — Follow for `services/likes.ts`, `services/retweets.ts`
- API route pattern — Follow for `/api/posts/[id]/like`, `/api/posts/[id]/retweet`

### Established Patterns
- Optimistic UI via TanStack Query `onMutate` + rollback (from PostFeed delete)
- Server-rendered initial data passed as `initialData` to client queries
- react-hook-form + Zod for form validation
- `cn()` for conditional Tailwind classes

### Integration Points
- PostCard action bar: add like/reply/retweet/quote buttons below post content
- Feed queries: extend to include like count, reply count, retweet count, and current user's like/retweet state
- Reply view: need a post detail page or expandable thread under each post
- New API routes: `/api/posts/[id]/like`, `/api/posts/[id]/retweet`, `/api/posts/[id]/replies`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — auto mode used recommended defaults for all decisions.

</specifics>

<deferred>
## Deferred Ideas

None — auto mode stayed within phase scope

</deferred>

---

*Phase: 03-interactions*
*Context gathered: 2026-03-22 (auto mode)*
