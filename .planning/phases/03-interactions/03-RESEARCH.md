# Phase 3: Interactions - Research

**Researched:** 2026-03-22
**Domain:** Social post interactions (likes, replies, retweets, quote-tweets) with optimistic UI
**Confidence:** HIGH

## Summary

Phase 3 adds four interaction features to the existing Chirp post system: likes, replies, retweets, and quote-tweets. The database schema already exists with the correct structure -- `likes` table with unique constraint on `(userId, postId)`, `posts.parentId` for replies, and `posts.repostOfId` for retweets/quote-tweets. The distinction between a plain retweet (repostOfId set, content null) and a quote-tweet (repostOfId set, content non-null) is already modeled in the schema.

The primary technical challenge is extending the existing feed query to include interaction counts (like count, reply count, retweet count) and current-user interaction state (liked by me, retweeted by me) without introducing N+1 queries. Drizzle ORM's `db.$count()` utility and raw `sql` template literals handle this cleanly. The secondary challenge is implementing optimistic UI for toggle operations (like/unlike, retweet/unretweet) using the TanStack Query mutation pattern already established in PostFeed.tsx.

All four features follow the same architectural pattern: service function -> API route -> TanStack Query mutation -> optimistic cache update -> UI toggle. The existing codebase has established patterns for every layer. No new libraries are needed.

**Primary recommendation:** Extend the existing `FeedPost` type to include interaction counts and user-state booleans, enrich the feed query in `posts.ts` using `db.$count()` and `sql<boolean>` EXISTS subqueries, then build each interaction feature as a service + API route + UI component following the established patterns.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Heart icon with like count on every post card. Toggle: red filled when liked, gray outline when not
- **D-02:** Optimistic UI -- count updates immediately on click, rolls back on API failure
- **D-03:** Like state persists on refresh (server-rendered initial state)
- **D-04:** Simple color toggle, no animation -- keeps implementation straightforward for learning project
- **D-05:** Single-level threading only -- replies show directly under parent post, no nested replies-to-replies
- **D-06:** Click reply icon on a post to expand an inline composer below that post
- **D-07:** After submitting reply, it appears immediately under the parent post
- **D-08:** Reply count shown on post card next to reply icon
- **D-09:** Replies use the same PostCard component but with visual indentation and "Replying to @username" header
- **D-10:** Retweet is a reference, not a content copy -- uses `repostOfId` column from schema
- **D-11:** Retweet appears in feed with "repost icon @username retweeted" header above the original post content
- **D-12:** Simple toggle -- click retweet icon to retweet/undo, no confirmation dialog
- **D-13:** Retweet count shown on post card
- **D-14:** Cannot retweet your own post
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

### Deferred Ideas (OUT OF SCOPE)
None -- auto mode stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTR-01 | User can like/unlike any post | Likes table with unique constraint exists; toggle via INSERT/DELETE on likes table; optimistic UI via TanStack Query onMutate pattern; `db.$count()` for like counts |
| INTR-02 | User can reply to any post | posts.parentId column exists; reply is a new post with parentId set; inline composer reuses TweetComposer pattern; single-level threading via WHERE parentId = postId |
| INTR-03 | User can retweet a post | posts.repostOfId column exists; retweet is a new post with repostOfId set and content null; unique constraint needed on (userId, repostOfId) at app level; feed display shows "retweeted" header |
| INTR-04 | User can quote-tweet (retweet with added comment) | Same repostOfId column; quote-tweet has repostOfId set AND content non-null; modal composer with embedded original post preview; creates standard post row |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Learning project**: Favor clarity and simplicity over production-hardening
- **Local only**: No deployment, no CI/CD
- **Stack**: Next.js 16 + SQLite (better-sqlite3) + Drizzle ORM + next-auth v4 + Tailwind v4 + TanStack Query
- **Next.js 16 warning**: APIs, conventions, and file structure may differ from training data. Read relevant guides in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
- **GSD workflow**: Use GSD commands for all changes; do not make direct repo edits outside GSD workflow
- **Service layer pattern**: Business logic in `/lib/services/`, API routes thin and delegating
- **Schema decision**: Single posts table with nullable `parentId` (replies) and `repostOfId` (retweets) -- must not be split
- **Auth pattern**: `(session.user as any)` cast for custom id/username fields
- **Params pattern**: Next.js 16 uses `params: Promise<{ id: string }>` (must await params)

## Standard Stack

No new packages are needed for Phase 3. Everything uses existing installed libraries.

### Core (already installed)
| Library | Version | Purpose for Phase 3 |
|---------|---------|---------------------|
| drizzle-orm | 0.45.1 | `db.$count()` for interaction counts, `sql<boolean>` for EXISTS subqueries, INSERT/DELETE for likes and retweets |
| @tanstack/react-query | 5.94.5 | `useMutation` with optimistic updates for like/unlike, retweet/unretweet; cache invalidation on reply/quote submit |
| lucide-react | 0.577.0 | Heart, MessageCircle, Repeat2, Quote icons for action bar |
| zod | 4.3.6 | Validation schemas for reply content, quote-tweet content |
| react-hook-form | 7.72.0 | Reply composer and quote-tweet composer form state (reuse TweetComposer pattern) |

### Icon Recommendations (Claude's Discretion)
| Action | Icon | Filled State | Color |
|--------|------|-------------|-------|
| Like | `Heart` | `fill="currentColor"` when liked | red-500 when liked, slate-400 default |
| Reply | `MessageCircle` | n/a (no toggle) | slate-400 default, blue-500 hover |
| Retweet | `Repeat2` | n/a (color change) | green-500 when retweeted, slate-400 default |
| Quote | `Quote` or `MessageSquareQuote` | n/a | slate-400 default, blue-500 hover |

## Architecture Patterns

### Recommended File Structure for Phase 3

```
chirp/src/
├── lib/
│   ├── services/
│   │   ├── posts.ts              # MODIFY: enrich FeedPost type with counts + user state
│   │   ├── likes.ts              # NEW: toggleLike, isLikedByUser
│   │   └── retweets.ts           # NEW: createRetweet, deleteRetweet, isRetweetedByUser
│   └── validations/
│       └── post.ts               # MODIFY: add replySchema, quoteTweetSchema
├── components/
│   └── posts/
│       ├── PostCard.tsx           # MODIFY: add ActionBar, handle retweet/quote display
│       ├── ActionBar.tsx          # NEW: like/reply/retweet/quote buttons with counts
│       ├── ReplyComposer.tsx      # NEW: inline composer for replies (reuses TweetComposer pattern)
│       ├── ReplyThread.tsx        # NEW: list of replies below a post
│       ├── QuoteComposer.tsx      # NEW: modal composer with embedded preview
│       ├── EmbeddedPost.tsx       # NEW: compact read-only post card for quote-tweet display
│       ├── PostFeed.tsx           # MODIFY: optimistic like/retweet mutations
│       └── ProfilePostList.tsx    # MODIFY: integrate action bar
├── app/
│   └── api/
│       └── posts/
│           └── [id]/
│               ├── route.ts       # EXISTING: DELETE handler
│               ├── like/
│               │   └── route.ts   # NEW: POST (toggle like)
│               ├── retweet/
│               │   └── route.ts   # NEW: POST (create retweet), DELETE (remove retweet)
│               └── replies/
│                   └── route.ts   # NEW: GET (list replies), POST (create reply)
```

### Pattern 1: Enriched Feed Query with Interaction Counts

**What:** Extend the existing `getFeedPosts()` to return like count, reply count, retweet count, and boolean flags for current user's like/retweet state -- all in a single query.

**When to use:** Every feed query and profile query must include this enrichment.

**Example:**
```typescript
// Source: Drizzle ORM docs (https://orm.drizzle.team/docs/query-utils)
// + https://orm.drizzle.team/docs/sql

import { db } from "@/lib/db/client";
import { posts, users, likes } from "@/lib/db/schema";
import { eq, desc, isNull, and, sql } from "drizzle-orm";

export type FeedPost = {
  id: number;
  content: string | null;
  createdAt: string;
  userId: number;
  parentId: number | null;
  repostOfId: number | null;
  authorUsername: string;
  authorDisplayName: string | null;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  likedByMe: boolean;
  repostedByMe: boolean;
};

export function getFeedPosts(page: number = 1, currentUserId?: number): FeedPost[] {
  return db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      userId: posts.userId,
      parentId: posts.parentId,
      repostOfId: posts.repostOfId,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
      likeCount: db.$count(likes, eq(likes.postId, posts.id)),
      replyCount: db.$count(posts, eq(posts.parentId, posts.id)),
      // Note: replyCount subquery references posts twice -- may need alias
      repostCount: sql<number>`(SELECT COUNT(*) FROM posts p2 WHERE p2.repost_of_id = ${posts.id} AND p2.content IS NULL)`,
      likedByMe: sql<boolean>`EXISTS(SELECT 1 FROM likes WHERE likes.user_id = ${currentUserId ?? 0} AND likes.post_id = ${posts.id})`,
      repostedByMe: sql<boolean>`EXISTS(SELECT 1 FROM posts p3 WHERE p3.repost_of_id = ${posts.id} AND p3.user_id = ${currentUserId ?? 0} AND p3.content IS NULL)`,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(isNull(posts.parentId)) // top-level posts only
    .orderBy(desc(posts.createdAt))
    .limit(POSTS_PER_PAGE)
    .offset((page - 1) * POSTS_PER_PAGE)
    .all();
}
```

**CRITICAL NOTE:** The `replyCount` subquery that references `posts` while also selecting FROM `posts` requires a raw SQL subquery with table alias (e.g., `p2`) rather than `db.$count()` to avoid ambiguity. Use `sql<number>` template literals for self-referencing subqueries.

### Pattern 2: Like Toggle Service

**What:** Insert a like row on like, delete on unlike. Use the existing unique constraint `likes_user_post_idx` to prevent duplicates.

**Example:**
```typescript
// chirp/src/lib/services/likes.ts
import { db } from "@/lib/db/client";
import { likes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export function toggleLike(userId: number, postId: number): { liked: boolean; likeCount: number } {
  // Check if already liked
  const existing = db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
    .get();

  if (existing) {
    // Unlike
    db.delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
      .run();
  } else {
    // Like
    db.insert(likes)
      .values({ userId, postId })
      .run();
  }

  // Return updated count
  const countResult = db
    .select({ value: sql<number>`COUNT(*)` })
    .from(likes)
    .where(eq(likes.postId, postId))
    .get();

  return {
    liked: !existing,
    likeCount: countResult?.value ?? 0,
  };
}
```

### Pattern 3: Optimistic Like Mutation (TanStack Query)

**What:** Update the cache immediately on like/unlike click, rollback on failure. Follow the existing `deleteMutation` pattern in PostFeed.tsx.

**Example:**
```typescript
// Inside PostFeed or a shared hooks file
const likeMutation = useMutation({
  mutationFn: (postId: number) =>
    fetch(`/api/posts/${postId}/like`, { method: "POST" }).then((r) => {
      if (!r.ok) throw new Error("Failed to toggle like");
      return r.json();
    }),
  onMutate: async (postId) => {
    await queryClient.cancelQueries({ queryKey: ["posts", "feed"] });
    const prev = queryClient.getQueryData<FeedPost[]>(["posts", "feed"]);
    queryClient.setQueryData<FeedPost[]>(["posts", "feed"], (old) =>
      old?.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      ) ?? []
    );
    return { prev };
  },
  onError: (_err, _postId, context) => {
    if (context?.prev) {
      queryClient.setQueryData(["posts", "feed"], context.prev);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  },
});
```

### Pattern 4: Retweet as Reference Row

**What:** A retweet creates a new row in `posts` with `repostOfId` set and `content` as null. The feed must resolve the original post to display its content.

**Example:**
```typescript
// chirp/src/lib/services/retweets.ts
export function createRetweet(userId: number, originalPostId: number): { success: boolean } {
  // Prevent self-retweet
  const original = db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, originalPostId)).get();
  if (!original || original.userId === userId) {
    return { success: false };
  }

  // Check if already retweeted
  const existing = db
    .select()
    .from(posts)
    .where(and(
      eq(posts.userId, userId),
      eq(posts.repostOfId, originalPostId),
      isNull(posts.content) // pure retweet, not quote-tweet
    ))
    .get();

  if (existing) {
    return { success: false }; // already retweeted
  }

  db.insert(posts)
    .values({ userId, repostOfId: originalPostId, content: null })
    .run();

  return { success: true };
}

export function deleteRetweet(userId: number, originalPostId: number): boolean {
  const result = db
    .delete(posts)
    .where(and(
      eq(posts.userId, userId),
      eq(posts.repostOfId, originalPostId),
      isNull(posts.content)
    ))
    .run();
  return result.changes > 0;
}
```

### Pattern 5: Reply Creation

**What:** A reply is a new post with `parentId` set. Content is required for replies (unlike pure retweets).

**Example:**
```typescript
export function createReply(userId: number, parentPostId: number, content: string) {
  return db.insert(posts)
    .values({ userId, parentId: parentPostId, content })
    .returning()
    .get();
}

export function getReplies(postId: number, currentUserId?: number): FeedPost[] {
  // Same enriched select as feed, but filtered by parentId
  return db
    .select({ /* same enriched columns */ })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.parentId, postId))
    .orderBy(desc(posts.createdAt))
    .all();
}
```

### Pattern 6: Feed Display of Retweets

**What:** When a retweet appears in the feed, the UI must resolve the original post and display it with a "retweeted by @username" header. The feed query needs to JOIN the original post data.

**Example approach:**
```typescript
// For retweets in the feed, the query returns the retweet row (with retweeter info)
// AND the original post data. Two approaches:
//
// Approach A: Resolve in a second query (simpler, slight N+1 risk)
//   - Feed returns retweet rows with repostOfId
//   - Client or server fetches original post details
//
// Approach B: Resolve with self-join in feed query (better, single query)
//   - LEFT JOIN posts AS original ON posts.repost_of_id = original.id
//   - LEFT JOIN users AS originalAuthor ON original.user_id = originalAuthor.id
//   - Return both retweeter and original author info
//
// Recommendation: Approach B (self-join) to avoid N+1.
// Use raw sql`` for the self-join since Drizzle's join API
// requires distinct table references.
```

### Pattern 7: Quote-Tweet Display

**What:** A quote-tweet is a post with both `repostOfId` set AND `content` non-null. Display the quoter's text above an embedded card showing the original post.

**UI structure:**
```
┌─────────────────────────────────────┐
│ @quoter                             │
│ Quoter's commentary text            │
│ ┌─────────────────────────────────┐ │
│ │ @originalAuthor                 │ │
│ │ Original post content           │ │
│ └─────────────────────────────────┘ │
│ [heart] [reply] [retweet] [quote]   │
└─────────────────────────────────────┘
```

### Anti-Patterns to Avoid

- **N+1 for interaction counts:** Do NOT loop through posts and query like count individually. Use `db.$count()` or `sql<number>` subqueries in the main select.
- **Storing counts as columns:** Do NOT add `likeCount` column to posts table. Derive from likes table with COUNT.
- **Retweet as content copy:** Do NOT copy original post content into retweet row. Use repostOfId reference.
- **Separate mutations per query key:** Each optimistic mutation must update ALL relevant query keys (feed, profile posts) or use broader invalidation.
- **Forgetting SQLite boolean caveat:** SQLite returns 0/1 for boolean expressions, not true/false. Cast appropriately in TypeScript or use `!!` coercion.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Like count computation | Counter column on posts | `db.$count(likes, eq(likes.postId, posts.id))` | Counter drifts on failed transactions; COUNT is always accurate |
| Duplicate like prevention | Application-level check only | Unique constraint `likes_user_post_idx` on (userId, postId) | DB constraint is the true guard; app check is optimization |
| Optimistic cache update | Manual useState + useEffect | TanStack Query `useMutation` with `onMutate` | Already established pattern in PostFeed.tsx; handles rollback, invalidation |
| Form state for reply/quote | Manual useState tracking | react-hook-form (already used in auth forms) | Handles validation, dirty state, submission state |
| Icon rendering | Custom SVG components | lucide-react Heart, MessageCircle, Repeat2 | Already installed, tree-shakeable, consistent sizing |

## Common Pitfalls

### Pitfall 1: Self-Referencing Subqueries in Drizzle

**What goes wrong:** Using `db.$count(posts, eq(posts.parentId, posts.id))` to count replies creates ambiguous column references because you are counting FROM posts WHERE posts.parentId = posts.id -- both sides reference the same table alias.

**Why it happens:** Drizzle's `$count()` utility generates a correlated subquery, but when the outer query is also from the `posts` table, the column references are ambiguous.

**How to avoid:** Use raw `sql<number>` template literals with explicit table aliases for self-referencing counts:
```typescript
replyCount: sql<number>`(SELECT COUNT(*) FROM posts p2 WHERE p2.parent_id = ${posts.id})`
```

**Warning signs:** Wrong counts, SQL errors about ambiguous column names.

### Pitfall 2: SQLite Boolean Return Values

**What goes wrong:** SQLite returns 0 and 1 for boolean expressions, not `true`/`false`. The TypeScript type annotation `sql<boolean>` tells Drizzle the expected type, but the actual runtime value is still a number.

**Why it happens:** SQLite has no native boolean type.

**How to avoid:** Either cast in the query (`CAST(... AS BOOLEAN)` -- which SQLite ignores) or coerce in TypeScript: `likedByMe: !!row.likedByMe`. The simplest approach is to use `sql<number>` and coerce to boolean in the type mapping.

**Warning signs:** `post.likedByMe === true` evaluates to `false` even when the value is `1`.

### Pitfall 3: Feed Showing Both Retweet Row AND Original Post

**What goes wrong:** A user retweets post #5. The feed now shows post #5 (the original) AND the retweet row -- the same content appears twice.

**Why it happens:** The feed query returns all top-level posts including retweet rows. The retweet row references the original, which is also a top-level post.

**How to avoid:** The feed query should include retweet rows (they carry the "retweeted by" context) but must resolve the original post's content for display. The original post also appears on its own. This is correct behavior -- Twitter does this too. The original appears once (as itself) and the retweet appears separately (with "retweeted" header). They are distinct feed items.

However, if the current user retweeted a post, the feed should NOT show both the user's retweet AND the original in the same feed view -- this depends on whether the feed is "all posts" (global) or "following" (curated). For a global chronological feed, both appearing is expected.

### Pitfall 4: Optimistic Update Not Matching All Query Keys

**What goes wrong:** User likes a post from the feed page. The like count updates optimistically in the feed. But if the user navigates to the profile page, the like count is stale because the profile query cache was not updated.

**Why it happens:** The optimistic update only touches `["posts", "feed"]` but the profile uses a different query key.

**How to avoid:** Use `queryClient.invalidateQueries({ queryKey: ["posts"] })` in `onSettled` (already done in existing pattern). This invalidates ALL queries starting with "posts". For optimistic updates in `onMutate`, update the specific key the user is viewing. The invalidation in `onSettled` catches the rest.

### Pitfall 5: Retweet of Already-Retweeted Post (Duplicate Prevention)

**What goes wrong:** No unique constraint on (userId, repostOfId) in the posts table means a user can create multiple retweet rows for the same original post.

**Why it happens:** The likes table has `likes_user_post_idx` unique constraint, but the posts table has no equivalent for retweets.

**How to avoid:** Add application-level check (query for existing retweet before inserting) since adding a partial unique index to SQLite for `(userId, repostOfId) WHERE content IS NULL` is not straightforward. The service function must check-then-insert. This is acceptable for a learning project; the app-level check is the primary guard.

### Pitfall 6: Reply Count Including Quote-Tweets

**What goes wrong:** The reply count subquery counts all posts where `parentId` matches, but quote-tweets do NOT set `parentId` -- they set `repostOfId`. So this pitfall is actually about confusing the two. Replies use `parentId`. Retweets/quotes use `repostOfId`. These are separate dimensions.

**How to avoid:** Be explicit about what each count measures:
- `replyCount`: `WHERE parent_id = post.id`
- `repostCount` (pure retweets): `WHERE repost_of_id = post.id AND content IS NULL`
- `quoteCount`: `WHERE repost_of_id = post.id AND content IS NOT NULL`
- `likeCount`: `COUNT(*) FROM likes WHERE post_id = post.id`

## Code Examples

### Example 1: API Route for Like Toggle

```typescript
// chirp/src/app/api/posts/[id]/like/route.ts
// Source: Existing API route pattern from chirp/src/app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { toggleLike } from "@/lib/services/likes";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = Number((session.user as any).id);
    const result = toggleLike(userId, Number(id));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
```

### Example 2: API Route for Retweet

```typescript
// chirp/src/app/api/posts/[id]/retweet/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createRetweet, deleteRetweet } from "@/lib/services/retweets";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = Number((session.user as any).id);
    const result = createRetweet(userId, Number(id));

    if (!result.success) {
      return NextResponse.json({ error: "Cannot retweet" }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = Number((session.user as any).id);
    const deleted = deleteRetweet(userId, Number(id));

    if (!deleted) {
      return NextResponse.json({ error: "Retweet not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
```

### Example 3: Reply API Route with Validation

```typescript
// chirp/src/app/api/posts/[id]/replies/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createReply, getReplies } from "@/lib/services/posts";
import { createPostSchema } from "@/lib/validations/post";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = Number((session.user as any).id);
    const replies = getReplies(Number(id), userId);

    return NextResponse.json(replies);
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = createPostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const userId = Number((session.user as any).id);
    const reply = createReply(userId, Number(id), result.data.content);

    return NextResponse.json(reply, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
```

### Example 4: ActionBar Component

```typescript
// chirp/src/components/posts/ActionBar.tsx
"use client";

import { Heart, MessageCircle, Repeat2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  postId: number;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  likedByMe: boolean;
  repostedByMe: boolean;
  isOwnPost: boolean;
  onLike: (postId: number) => void;
  onReply: (postId: number) => void;
  onRetweet: (postId: number) => void;
  onQuote: (postId: number) => void;
}

export function ActionBar({
  postId,
  likeCount,
  replyCount,
  repostCount,
  likedByMe,
  repostedByMe,
  isOwnPost,
  onLike,
  onReply,
  onRetweet,
  onQuote,
}: ActionBarProps) {
  return (
    <div className="mt-2 flex items-center gap-6">
      {/* Reply */}
      <button
        onClick={() => onReply(postId)}
        className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-blue-500"
      >
        <MessageCircle size={16} />
        {replyCount > 0 && <span>{replyCount}</span>}
      </button>

      {/* Retweet */}
      <button
        onClick={() => onRetweet(postId)}
        disabled={isOwnPost}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          isOwnPost
            ? "cursor-not-allowed text-slate-300"
            : repostedByMe
              ? "text-green-500"
              : "text-slate-400 hover:text-green-500"
        )}
      >
        <Repeat2 size={16} />
        {repostCount > 0 && <span>{repostCount}</span>}
      </button>

      {/* Like */}
      <button
        onClick={() => onLike(postId)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          likedByMe ? "text-red-500" : "text-slate-400 hover:text-red-500"
        )}
      >
        <Heart size={16} fill={likedByMe ? "currentColor" : "none"} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>

      {/* Quote */}
      <button
        onClick={() => onQuote(postId)}
        className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-blue-500"
      >
        <Quote size={16} />
      </button>
    </div>
  );
}
```

### Example 5: Feed Query with Retweet Resolution (Self-Join)

```typescript
// Approach for resolving retweet original content in feed
// Use raw SQL for the self-join since the posts table is referenced twice

import { sql } from "drizzle-orm";

// Extended FeedPost type for retweets
export type FeedPost = {
  // ... existing fields ...
  // Retweet metadata (null for non-retweet posts)
  retweeterUsername: string | null;
  retweeterDisplayName: string | null;
  // Original post data (for retweets and quote-tweets)
  originalPostId: number | null;
  originalContent: string | null;
  originalAuthorUsername: string | null;
  originalAuthorDisplayName: string | null;
};

// The feed query needs a LEFT JOIN to resolve originals:
// SELECT p.*, u.username,
//   retweeter.username AS retweeter_username,
//   original.content AS original_content,
//   original_author.username AS original_author_username
// FROM posts p
// JOIN users u ON p.user_id = u.id
// LEFT JOIN posts original ON p.repost_of_id = original.id
// LEFT JOIN users original_author ON original.user_id = original_author.id
//
// For retweets: display original.content with "retweeted by p.user" header
// For quote-tweets: display p.content with original embedded below
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate likes/retweets tables | Single posts table + likes join table | Always (for this schema) | Schema already correct -- likes in separate table, retweets as post rows |
| Stored count columns | Derived counts via COUNT/subquery | Best practice | No migration needed -- never store counts |
| Server Actions for mutations | API Routes + TanStack Query | Project decision (Phase 2) | Keep using API Routes -- TanStack Query already provides optimistic UI |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | none -- needs setup (Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTR-01 | toggleLike inserts/deletes like row; returns correct count | unit | `npx vitest run tests/services/likes.test.ts -t "toggleLike"` | No -- Wave 0 |
| INTR-01 | Like API route returns toggled state | integration | `npx vitest run tests/api/like.test.ts` | No -- Wave 0 |
| INTR-02 | createReply inserts post with parentId set | unit | `npx vitest run tests/services/posts.test.ts -t "createReply"` | No -- Wave 0 |
| INTR-02 | getReplies returns replies for a given postId | unit | `npx vitest run tests/services/posts.test.ts -t "getReplies"` | No -- Wave 0 |
| INTR-03 | createRetweet inserts post with repostOfId, null content | unit | `npx vitest run tests/services/retweets.test.ts -t "createRetweet"` | No -- Wave 0 |
| INTR-03 | Cannot retweet own post | unit | `npx vitest run tests/services/retweets.test.ts -t "own post"` | No -- Wave 0 |
| INTR-03 | Cannot retweet same post twice | unit | `npx vitest run tests/services/retweets.test.ts -t "duplicate"` | No -- Wave 0 |
| INTR-04 | Quote-tweet creates post with repostOfId AND content | unit | `npx vitest run tests/services/posts.test.ts -t "quote"` | No -- Wave 0 |
| INTR-01 | Enriched feed includes likeCount, likedByMe | unit | `npx vitest run tests/services/posts.test.ts -t "enriched feed"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `chirp/vitest.config.ts` -- Vitest configuration with path aliases matching tsconfig
- [ ] `chirp/tests/services/likes.test.ts` -- covers INTR-01 (toggle, count, duplicate)
- [ ] `chirp/tests/services/retweets.test.ts` -- covers INTR-03 (create, delete, self-retweet guard, duplicate guard)
- [ ] `chirp/tests/services/posts.test.ts` -- covers INTR-02, INTR-04 (reply, quote, enriched feed)
- [ ] `chirp/tests/helpers/db.ts` -- test DB setup helper (in-memory SQLite or temp file)

## Open Questions

1. **Retweet display in enriched feed query complexity**
   - What we know: The feed needs to resolve original post content for retweets via self-join on posts table. Drizzle's type-safe join API requires distinct table references.
   - What's unclear: Whether Drizzle's `alias()` function works cleanly with better-sqlite3 for self-joins, or if raw SQL is needed for the full feed query.
   - Recommendation: Start with `sql` template literals for the self-referencing parts. If `alias()` from `drizzle-orm/sqlite-core` works, prefer it for type safety. Test early.

2. **Quote-tweet modal implementation**
   - What we know: D-15 specifies a compose dialog/modal. No modal infrastructure exists in the project.
   - What's unclear: Whether to use a simple conditional render (inline), a portal-based modal, or a dialog element.
   - Recommendation: Use the native HTML `<dialog>` element with React ref. Lightweight, accessible by default, no library needed. This is Claude's discretion per CONTEXT.md.

3. **Profile page integration**
   - What we know: `ProfilePostList.tsx` uses local `useState` instead of TanStack Query. It needs the action bar too.
   - What's unclear: Whether to migrate ProfilePostList to TanStack Query or keep local state with additional interaction handlers.
   - Recommendation: Keep ProfilePostList's current local state pattern but pass the enriched `FeedPost` type and action bar callbacks. The `onSettled` invalidation will handle stale profile data on next visit.

## Sources

### Primary (HIGH confidence)
- `chirp/src/lib/db/schema.ts` -- Verified: likes table structure, posts.parentId, posts.repostOfId, unique constraint on likes
- `chirp/src/lib/services/posts.ts` -- Verified: existing service pattern, FeedPost type, query structure
- `chirp/src/components/posts/PostFeed.tsx` -- Verified: TanStack Query optimistic delete pattern (onMutate/onError/onSettled)
- `chirp/src/components/posts/PostCard.tsx` -- Verified: current card structure, action area location
- `chirp/src/app/api/posts/[id]/route.ts` -- Verified: Next.js 16 params pattern (Promise-based)
- [Drizzle ORM Select docs](https://orm.drizzle.team/docs/select) -- Subquery patterns
- [Drizzle ORM Query Utils](https://orm.drizzle.team/docs/query-utils) -- `db.$count()` API
- [Drizzle ORM Count Rows guide](https://orm.drizzle.team/docs/guides/count-rows) -- COUNT in joins with GROUP BY
- [Drizzle ORM sql operator](https://orm.drizzle.team/docs/sql) -- `sql<boolean>` type annotation for EXISTS
- Next.js 16 route.md (`node_modules/next/dist/docs/`) -- Confirmed `params: Promise<>` pattern

### Secondary (MEDIUM confidence)
- [TanStack Query Optimistic Updates](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates) -- Optimistic mutation lifecycle (onMutate, onError, onSettled)

### Tertiary (LOW confidence)
- Drizzle `alias()` function for self-joins with better-sqlite3 -- not verified with current version; may need raw SQL fallback

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages needed; all patterns verified in existing codebase
- Architecture: HIGH -- clear extension of Phase 2 patterns with well-documented Drizzle/TanStack Query APIs
- Pitfalls: HIGH -- SQLite boolean gotcha and self-referencing subquery ambiguity are well-known; retweet duplicate prevention is the only novel concern
- Query patterns: MEDIUM -- `db.$count()` inline usage and `sql<boolean>` EXISTS verified via Drizzle docs but not tested against exact schema; self-join approach may need iteration

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain, established libraries)
