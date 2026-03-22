---
phase: 03-interactions
verified: 2026-03-22T12:00:00Z
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "Click the heart button on any post in /feed"
    expected: "Button turns red, like count increments. Clicking again turns it gray and decrements."
    why_human: "Optimistic update + API round-trip requires a running browser session"
  - test: "Click the reply icon on any post — type text and click Reply"
    expected: "Reply composer appears inline. Submitting posts the reply. 'Show replies (1)' button appears."
    why_human: "Composer state toggle, fetch call, and query invalidation require a running browser"
  - test: "Click the retweet icon on a post you did not author"
    expected: "Icon turns green, repost count increments. Clicking again un-retweets."
    why_human: "POST/DELETE toggle and optimistic update require a running browser"
  - test: "Click the quote icon on any post — type a comment and click Post"
    expected: "Modal opens with embedded original post preview. Submitting creates a quote-tweet visible in the feed with embedded card."
    why_human: "Dialog lifecycle, embedded preview, and feed re-render require a running browser"
  - test: "Attempt to retweet your own post"
    expected: "Retweet button is visually disabled (greyed out) and unclickable."
    why_human: "Conditional disabled state and CSS rendering require a live browser"
  - test: "Post a reply on a post that already has replies, then click 'Show replies'"
    expected: "The new reply appears in the thread below the parent post."
    why_human: "Query invalidation and thread rendering require a running browser"
---

# Phase 03: Interactions Verification Report

**Phase Goal:** Users can engage with posts through likes, replies, retweets, and quote-tweets, completing the social feedback loop
**Verified:** 2026-03-22
**Status:** human_needed — all automated checks pass, 6 human-testable behaviors remain
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A user can like or unlike a post, with accurate counts | VERIFIED | `toggleLike` service does DB check/insert/delete + COUNT(*) query; API route calls it and returns `{liked, likeCount}`; `PostFeed` and `ProfilePostList` both wire `onLike` to `POST /api/posts/:id/like` with optimistic update |
| 2 | A user can reply to a post and view replies inline | VERIFIED | `createReply` inserts with `parentId`; `getReplies` queries by `parentId`; `ReplyComposer` POSTs to `/api/posts/:id/replies`; `ReplyThread` GETs and renders replies; `PostCard` wires the toggle |
| 3 | A user can retweet (or un-retweet) any post they don't own | VERIFIED | `createRetweet` and `deleteRetweet` services handle DB operations; API route handles POST/DELETE; self-retweet blocked at service layer; `PostFeed`/`ProfilePostList` both wire `onRetweet` via `retweetMutation` |
| 4 | A user can quote-tweet a post with added commentary | VERIFIED | `createQuoteTweetSchema` validates content+repostOfId; `POST /api/posts` stores post with both `content` and `repostOfId` set; `QuoteComposer` dialog sends correct payload; `PostCard` renders embedded `EmbeddedPost` for quote-tweets |

**Score:** 4/4 truths supported by code evidence

---

### Required Artifacts

| Artifact | Purpose | Status | Details |
|----------|---------|--------|---------|
| `src/app/api/posts/[id]/like/route.ts` | Toggle like endpoint | VERIFIED | 27 lines; auth-gated POST; calls `toggleLike` service; returns `{liked, likeCount}` |
| `src/app/api/posts/[id]/retweet/route.ts` | Toggle retweet endpoint | VERIFIED | 63 lines; auth-gated POST/DELETE; calls `createRetweet`/`deleteRetweet`; handles 400 for own posts/duplicates |
| `src/app/api/posts/[id]/replies/route.ts` | Fetch and create replies | VERIFIED | 60 lines; auth-gated GET/POST; calls `getReplies`/`createReply`; validates content via `createPostSchema` |
| `src/lib/services/likes.ts` | Like toggle DB logic | VERIFIED | 32 lines; checks existing, inserts or deletes, returns COUNT(*) — real DB queries throughout |
| `src/lib/services/retweets.ts` | Retweet create/delete DB logic | VERIFIED | 53 lines; self-retweet prevention, duplicate prevention, insert/delete via Drizzle |
| `src/lib/services/posts.ts` | Feed/reply/post service layer | VERIFIED | 155 lines; `createReply`, `getReplies`, `createPost`, `getFeedPosts` all use enriched subquery selects with `likeCount`, `replyCount`, `repostCount`, `likedByMe`, `repostedByMe` |
| `src/components/posts/ActionBar.tsx` | Per-post like/reply/retweet/quote buttons | VERIFIED | 97 lines; all four buttons rendered; like shows filled heart when `likedByMe`; retweet green when `repostedByMe`; retweet disabled when `isOwnPost` |
| `src/components/posts/ReplyComposer.tsx` | Inline reply entry | VERIFIED | 104 lines; POSTs to `/api/posts/:id/replies`; invalidates `["posts"]` query on success |
| `src/components/posts/ReplyThread.tsx` | Reply thread renderer | VERIFIED | 61 lines; `useQuery` fetches `/api/posts/:id/replies`; renders `PostCard` for each reply |
| `src/components/posts/QuoteComposer.tsx` | Quote-tweet modal | VERIFIED | 156 lines; `<dialog>` with `showModal()`; POSTs to `/api/posts` with `content` + `repostOfId`; shows `EmbeddedPost` preview |
| `src/components/posts/EmbeddedPost.tsx` | Embedded original post display | VERIFIED | 38 lines; renders author, timestamp, content in a bordered box |
| `src/components/posts/PostCard.tsx` | Post renderer with interaction wiring | VERIFIED | 174 lines; conditionally renders `EmbeddedPost` for quote-tweets; toggles `ReplyComposer`; mounts `ReplyThread`; passes all handlers to `ActionBar` |
| `src/components/posts/PostFeed.tsx` | Feed with react-query mutations | VERIFIED | 198 lines; `likeMutation`, `retweetMutation`, `deleteMutation` all wired to API; optimistic updates with rollback |
| `src/components/posts/ProfilePostList.tsx` | Profile page post list with interactions | VERIFIED | 132 lines; mirrors PostFeed interaction logic with optimistic updates for like/retweet/delete |
| `src/lib/validations/post.ts` | Post and quote-tweet Zod schemas | VERIFIED | `createPostSchema` (content 1-280 chars), `createQuoteTweetSchema` (extends with repostOfId) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ActionBar.tsx` | `PostCard.tsx` | `onLike(postId)` prop callback | WIRED | Line 77-82: `onClick={() => onLike(postId)}`; PostCard passes to `PostFeed`'s `likeMutation` |
| `PostFeed.tsx` | `POST /api/posts/:id/like` | `likeMutation.mutationFn` | WIRED | Line 58: `fetch(\`/api/posts/${postId}/like\`, { method: "POST" })` |
| `like/route.ts` | `likes` table | `toggleLike(userId, postId)` | WIRED | Line 17 calls service; service lines 7-20 query and mutate `likes` table via Drizzle |
| `ReplyComposer.tsx` | `POST /api/posts/:id/replies` | `fetch` in `handleSubmit` | WIRED | Line 34: `fetch(\`/api/posts/${parentPostId}/replies\`, { method: "POST" })` |
| `replies/route.ts` | `posts` table (parentId set) | `createReply(userId, parentPostId, content)` | WIRED | Line 51: service inserts with `parentId` set |
| `ReplyThread.tsx` | `GET /api/posts/:id/replies` | `useQuery` fetch | WIRED | Line 26: `fetch(\`/api/posts/${parentPostId}/replies\`)` |
| `PostCard.tsx` | `ReplyComposer` / `ReplyThread` | Internal `showReplyComposer` / `showReplies` state | WIRED | Lines 122-123: `onReply !== undefined` guard triggers `setShowReplyComposer`; lines 149-169 conditionally mount both |
| `PostFeed.tsx` | `POST /api/posts/:id/retweet` | `retweetMutation.mutationFn` | WIRED | Line 97: `fetch(\`/api/posts/${postId}/retweet\`, { method })` with POST/DELETE toggle |
| `retweet/route.ts` | `posts` table (repostOfId, null content) | `createRetweet(userId, originalPostId)` | WIRED | Service line 34: inserts with `repostOfId` and `content: null` |
| `QuoteComposer.tsx` | `POST /api/posts` | `fetch` in `handleSubmit` | WIRED | Line 65: `fetch("/api/posts", { body: JSON.stringify({ content, repostOfId }) })` |
| `posts/route.ts` POST | `posts` table (repostOfId + content) | `createPost(userId, content, repostOfId)` | WIRED | Line 51: passes `repostOfId` to `createPost`; service inserts with both fields |
| `PostCard.tsx` | `EmbeddedPost` | `isQuoteTweet` guard | WIRED | Lines 100-107: renders `EmbeddedPost` when `repostOfId !== null && content !== null` |
| `ActionBar.tsx` | retweet disabled for own posts | `disabled={isOwnPost}` prop | WIRED | Line 51: button is disabled; PostCard sets `isOwnPost` from `currentUserId === post.userId` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `ActionBar.tsx` | `likeCount`, `likedByMe`, `repostCount`, `repostedByMe` | `enrichedPostSelect` subqueries in `posts.ts` | Yes — `COUNT(*)` and `CASE WHEN EXISTS` subqueries against live `likes` and `posts` tables | FLOWING |
| `ActionBar.tsx` | `replyCount` | `enrichedPostSelect` subquery `(SELECT COUNT(*) FROM posts p2 WHERE p2.parent_id = ...)` | Yes — live DB subquery | FLOWING |
| `ReplyThread.tsx` | `replies` | `useQuery` → `GET /api/posts/:id/replies` → `getReplies()` → Drizzle query with `eq(posts.parentId, postId)` | Yes — real DB query | FLOWING |
| `PostCard.tsx` | `originalContent`, `originalAuthorUsername` (quote-tweet) | `enrichedPostSelect` self-join subqueries on `posts.repostOfId` | Yes — raw SQL subqueries resolve original post data | FLOWING |
| `toggleLike` return value | `likeCount` after toggle | `SELECT COUNT(*) FROM likes WHERE post_id = ?` executed synchronously after insert/delete | Yes — live COUNT after mutation | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: PARTIALLY EXECUTED — server not running; module-level and DB checks only.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `likes` table has unique index (prevents duplicate likes) | SQLite introspection | `UNIQUE INDEX likes_user_post_idx ON likes(user_id, post_id)` confirmed | PASS |
| `posts` table has `parent_id` column for replies | SQLite introspection | `parent_id integer` with FK to `posts.id` and index `posts_parent_id_idx` | PASS |
| `posts` table has `repost_of_id` column for retweets/quotes | SQLite introspection | `repost_of_id integer` with FK to `posts.id` | PASS |
| `toggleLike` service is synchronous (no async keyword) | Source inspection | No `async` or `Promise` keywords in `likes.ts` — correct for `better-sqlite3` | PASS |
| `createRetweet` blocks self-retweet | Source inspection | Lines 13-15: `if (!original \|\| original.userId === userId) return { success: false }` | PASS |
| `createRetweet` blocks duplicate retweet | Source inspection | Lines 18-32: existing check returns `{ success: false }` | PASS |
| `createQuoteTweetSchema` validates `repostOfId` | Source inspection | `repostOfId: z.number().int().positive()` in `post.ts` | PASS |
| `PostFeed` has query invalidation after like/retweet | Source inspection | `onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] })` in all mutations | PASS |
| Live server endpoints | curl (server not running) | SKIPPED — requires running dev server | SKIP |

---

### Requirements Coverage

No REQUIREMENTS.md or ROADMAP.md exists in this project repository. Requirement IDs INTR-01 through INTR-04 were provided in the verification prompt. Coverage is mapped from prompt intent and the phase goal.

| Requirement | Description (inferred from phase goal + context) | Status | Evidence |
|-------------|--------------------------------------------------|--------|----------|
| INTR-01 | User can like and unlike posts | SATISFIED | `toggleLike` service + `/api/posts/:id/like` POST endpoint + `ActionBar` heart button with `likedByMe` state; like count updated from live DB COUNT(*) |
| INTR-02 | User can reply to posts and see replies | SATISFIED | `createReply`/`getReplies` services + `/api/posts/:id/replies` GET/POST + `ReplyComposer` + `ReplyThread` + `PostCard` toggle logic |
| INTR-03 | User can retweet (and un-retweet) posts | SATISFIED | `createRetweet`/`deleteRetweet` services + `/api/posts/:id/retweet` POST/DELETE + `PostFeed`/`ProfilePostList` `retweetMutation` with POST/DELETE toggle; self-retweet blocked |
| INTR-04 | User can quote-tweet a post with added commentary | SATISFIED | `createQuoteTweetSchema` + `POST /api/posts` with `repostOfId`+`content` + `QuoteComposer` modal + `EmbeddedPost` render in `PostCard` |

**Note:** No REQUIREMENTS.md or ROADMAP.md exists in this repository. Requirement descriptions are inferred from the phase goal. If these IDs have formal definitions elsewhere, cross-reference manually.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `PostFeed.tsx` | 173-175 | `onReply={(id) => { /* noop */ }}` | Info | Intentional design: `PostCard` owns reply composer state — it checks `onReply !== undefined` (line 122) and uses the prop's presence as a feature flag to enable the internal toggle. The noop satisfies the defined-check. Not a stub. |
| `ProfilePostList.tsx` | 107-109 | Same `onReply` noop pattern | Info | Same intentional pattern as `PostFeed.tsx`. |
| `app/layout.tsx` | 17-18 | `metadata.title = "Create Next App"` | Info | Cosmetic boilerplate; no functional impact on interactions |

No blocker or warning anti-patterns found. All service calls are synchronous (correct for `better-sqlite3`). No empty returns that flow to user-visible output. No hardcoded empty data arrays passed to interaction components.

---

### Human Verification Required

#### 1. Like Toggle

**Test:** Log in and navigate to `/feed`. Click the heart icon on any post.
**Expected:** Heart turns red and like count increments. Clicking again turns it grey and decrements. The state persists on page reload (confirmed from DB).
**Why human:** Optimistic update visual feedback and HTTP round-trip require a running browser session.

#### 2. Reply Flow

**Test:** Click the reply (speech bubble) icon on any post. Type "test reply" and click Reply.
**Expected:** Reply composer appears inline below the post. After submitting, the composer closes and "Show replies (1)" appears. Clicking it expands the reply thread.
**Why human:** State management, fetch call, and DOM re-render require a live browser.

#### 3. Retweet Toggle

**Test:** Click the retweet icon on a post you did not author.
**Expected:** Icon turns green, repost count increments. Clicking again un-retweets (DELETE call), icon returns to grey.
**Why human:** POST/DELETE toggle and optimistic state update require a running browser.

#### 4. Quote-Tweet

**Test:** Click the quote (speech bubble with quote) icon on any post. Enter commentary text. Click Post.
**Expected:** Modal opens showing the original post embedded at the bottom. After submitting, a new post appears in the feed with the original post shown in an embedded card.
**Why human:** Dialog lifecycle (`showModal()`), embedded preview rendering, and feed invalidation require a running browser.

#### 5. Self-Retweet Prevention

**Test:** View your own posts in the feed. Check the retweet button.
**Expected:** Retweet button is visually disabled (greyed, cursor-not-allowed). Clicking it does nothing.
**Why human:** CSS `disabled` prop rendering and click-blocking require a live browser.

#### 6. Reply Thread Persistence

**Test:** Submit a reply on a post, navigate away to `/profile/:username`, then return to `/feed`.
**Expected:** The reply count on the original post reflects the new reply. "Show replies" reveals it.
**Why human:** Query cache invalidation and feed re-fetch across navigation require a running session.

---

### Gaps Summary

No gaps. All four observable truths are supported by substantive, wired, and data-flowing implementations.

The interaction system is complete end-to-end:
- **Likes:** DB-backed toggle with accurate live counts and `likedByMe` state derived from subqueries
- **Replies:** Inline composer, thread rendering, GET/POST endpoints, parentId-based DB storage
- **Retweets:** Plain retweet via `repostOfId`+null content, un-retweet via DELETE, self-retweet blocked at service layer
- **Quote-tweets:** `QuoteComposer` modal, `EmbeddedPost` display, validated via `createQuoteTweetSchema`

Six items are routed to human verification because they require a running Next.js server and browser. These are behavioral confirmation tests, not implementation gaps.

---

_Verified: 2026-03-22_
_Verifier: Claude (gsd-verifier)_
