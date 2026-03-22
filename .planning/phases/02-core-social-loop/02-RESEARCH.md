# Phase 2: Core Social Loop - Research

**Researched:** 2026-03-22
**Domain:** Post CRUD, chronological feed, profile pages (Next.js 16 + Drizzle ORM + SQLite)
**Confidence:** HIGH

## Summary

Phase 2 builds the core social loop: users compose posts, see them in a chronological feed, delete their own, and visit profile pages. The existing codebase from Phase 1 provides a solid foundation -- the database schema already has the `posts` table with all needed columns, the `getSession()` helper handles auth, and the `(auth)` route group ensures only logged-in users reach the feed.

The primary technical decisions are: (1) use Server Actions with `refresh()` from `next/cache` for mutations (create/delete post) to keep things simple and aligned with Next.js 16 patterns, (2) use a single JOIN query for feed/profile fetching to avoid N+1, and (3) make the composer and delete button client components while the feed page itself can be a server component that fetches data directly via Drizzle ORM.

**Primary recommendation:** Build API routes for posts (GET/POST on `/api/posts`, DELETE on `/api/posts/[id]`), a `TweetComposer` client component with live character count, a `PostCard` component for rendering, and a profile page at `(auth)/profile/[username]/page.tsx`. Use Server Actions with `refresh()` for mutations, or API routes with `revalidatePath`/`router.refresh()` -- both patterns work. Given the existing Phase 1 pattern of API routes (see `/api/register/route.ts`), continue with API routes for consistency.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Compose box lives at the top of the feed page, always visible above the timeline
- **D-02:** Textarea with live character counter showing remaining chars (280 max), counter changes color at 20 remaining (yellow) and 0 (red)
- **D-03:** Submit button disabled when empty or over 280 chars
- **D-04:** After successful post, textarea clears and new post appears at top of feed immediately
- **D-05:** Post cards show: author display name (or username if no display name), @username as link to profile, relative timestamp, post content, and action placeholder area (for Phase 3)
- **D-06:** Posts ordered newest-first, simple page load (no infinite scroll -- offset pagination if needed)
- **D-07:** Empty feed shows friendly message: "No posts yet. Be the first to share something!"
- **D-08:** No confirmation dialog -- delete is immediate (learning project, low stakes)
- **D-09:** Post disappears from feed immediately (optimistic UI)
- **D-10:** Delete button only visible on posts owned by the current user
- **D-11:** Minimal profile header: @username, post count. No bio/avatar yet (deferred to future)
- **D-12:** Below header: list of that user's posts in newest-first order, same card style as feed
- **D-13:** Navigate to profiles by clicking @username on any post in the feed

### Claude's Discretion
- Exact card styling and spacing (follow UI-SPEC patterns from Phase 1)
- Timestamp formatting (relative like "2h ago" vs absolute)
- Loading states for feed and profile
- Error handling for failed post creation/deletion

### Deferred Ideas (OUT OF SCOPE)
None -- auto mode stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POST-01 | User can create a text post with 280-character limit | Zod validation schema, API route POST handler, TweetComposer component with character counter |
| POST-02 | User can delete their own posts | API route DELETE handler with ownership check (`post.userId === session.user.id`), optimistic UI removal |
| POST-03 | User can view a chronological feed of all posts (newest first) | Single JOIN query on posts+users, ordered by `created_at DESC`, with pagination via LIMIT/OFFSET |
| PROF-01 | User can view a profile page showing a user's posts | Dynamic route `[username]`, query posts WHERE userId matches, same PostCard component |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **AGENTS.md warning:** "This is NOT the Next.js you know. This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."
- **Key Next.js 16 breaking changes affecting this phase:**
  - `params` in page/layout/route is now a **Promise** -- must `await params` (e.g., `const { username } = await params`)
  - `refresh()` is imported from `next/cache` (not `router.refresh()` from client) and is **Server Action only**
  - `revalidatePath` remains available from `next/cache` for cache invalidation
  - Route Handlers use `RouteContext` helper for typed params: `ctx: RouteContext<'/posts/[id]'>` with `const { id } = await ctx.params`
- **GSD workflow:** Do not make direct repo edits outside a GSD workflow unless user explicitly asks

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 16.2.1 | Full-stack framework | Installed |
| React | 19.2.4 | UI rendering | Installed |
| Drizzle ORM | 0.45.1 | Type-safe DB queries | Installed |
| better-sqlite3 | 12.8.0 | SQLite driver | Installed |
| Zod | 4.3.6 | Schema validation | Installed |
| react-hook-form | 7.72.0 | Form state | Installed |
| @hookform/resolvers | 5.2.2 | Zod bridge | Installed |
| clsx + tailwind-merge | 2.1.1 / 3.5.0 | Conditional classes via `cn()` | Installed |

### Needs Installation for Phase 2
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| @tanstack/react-query | 5.94.5 | Client data fetching/caching | Feed refetching after mutations, optimistic delete. Stack decision from STACK.md. |
| date-fns | 4.1.0 | Relative timestamp formatting | "2h ago" display on post cards per D-05 |
| lucide-react | 0.577.0 | Icons | Delete (Trash2) icon on post cards, future action icons |

**Installation:**
```bash
cd chirp && npm install @tanstack/react-query date-fns lucide-react
```

### Alternatives Considered
| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| TanStack Query for feed | Server Components + `refresh()` only | TanStack Query provides optimistic UI for delete (D-09) and better loading states. Server Components alone would require full page refresh on every mutation. |
| date-fns for timestamps | Manual `Intl.RelativeTimeFormat` | date-fns `formatDistanceToNow` is one function call vs rolling custom logic with edge cases. Tree-shakeable. |
| API Routes for mutations | Server Actions | Phase 1 already established API route pattern (see `/api/register/route.ts`). Staying consistent reduces cognitive overhead. Either approach works -- API routes keep the REST mental model clear. |

## Architecture Patterns

### Recommended Project Structure (new files for Phase 2)
```
src/
  app/
    (auth)/
      feed/
        page.tsx              # REPLACE placeholder -- server component fetches posts, renders composer + feed
        loading.tsx           # NEW -- loading skeleton for feed page
      profile/
        [username]/
          page.tsx            # NEW -- server component fetches user + their posts
          loading.tsx         # NEW -- loading skeleton for profile page
    api/
      posts/
        route.ts              # NEW -- GET (list posts), POST (create post)
      posts/
        [id]/
          route.ts            # NEW -- DELETE (delete own post)
  components/
    posts/
      TweetComposer.tsx       # NEW -- "use client", textarea + char counter + submit
      PostCard.tsx             # NEW -- single post display card (author, content, timestamp, delete)
      PostFeed.tsx             # NEW -- "use client", list of PostCards with TanStack Query
    providers/
      QueryProvider.tsx        # NEW -- TanStack QueryClientProvider wrapper
  lib/
    validations/
      post.ts                 # NEW -- Zod schema for post creation (content: string, max 280)
    services/
      posts.ts                # NEW -- createPost, deletePost, getFeedPosts, getUserPosts functions
```

### Pattern 1: API Route + Service Layer (established in Phase 1)
**What:** Route handlers parse HTTP, validate, check auth, delegate to service functions. Service functions contain business logic and DB queries.
**When to use:** All mutations (create post, delete post) and data fetching (feed, profile).
**Example:**
```typescript
// src/app/api/posts/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createPostSchema } from "@/lib/validations/post";
import { createPost, getFeedPosts } from "@/lib/services/posts";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const posts = getFeedPosts(page);
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const result = createPostSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const userId = Number((session.user as any).id);
  const post = createPost(userId, result.data.content);
  return NextResponse.json(post, { status: 201 });
}
```

### Pattern 2: Service Functions with JOIN Query (avoid N+1)
**What:** Service functions use a single Drizzle query with JOINs to fetch posts with author information. No separate queries per post.
**When to use:** Feed page and profile page data fetching.
**Example:**
```typescript
// src/lib/services/posts.ts
import { db } from "@/lib/db/client";
import { posts, users } from "@/lib/db/schema";
import { eq, desc, isNull, sql, and } from "drizzle-orm";

const POSTS_PER_PAGE = 20;

export function getFeedPosts(page: number = 1) {
  const offset = (page - 1) * POSTS_PER_PAGE;

  return db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      userId: posts.userId,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(isNull(posts.parentId))  // Only top-level posts, not replies
    .orderBy(desc(posts.createdAt))
    .limit(POSTS_PER_PAGE)
    .offset(offset)
    .all();
}

export function getUserPosts(username: string, page: number = 1) {
  const offset = (page - 1) * POSTS_PER_PAGE;

  return db
    .select({
      id: posts.id,
      content: posts.content,
      createdAt: posts.createdAt,
      userId: posts.userId,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(and(eq(users.username, username), isNull(posts.parentId)))
    .orderBy(desc(posts.createdAt))
    .limit(POSTS_PER_PAGE)
    .offset(offset)
    .all();
}

export function createPost(userId: number, content: string) {
  return db.insert(posts).values({ userId, content }).returning().get();
}

export function deletePost(postId: number, userId: number): boolean {
  const result = db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .run();
  return result.changes > 0;
}
```

### Pattern 3: TanStack Query for Client-Side Feed Management
**What:** Feed page uses TanStack Query's `useQuery` for data fetching and `useMutation` for create/delete with cache invalidation.
**When to use:** The feed page client component that renders PostCard list.
**Example:**
```typescript
// src/components/posts/PostFeed.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function PostFeed({ initialPosts }: { initialPosts: Post[] }) {
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ["posts", "feed"],
    queryFn: () => fetch("/api/posts").then(r => r.json()),
    initialData: initialPosts,
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: number) =>
      fetch(`/api/posts/${postId}`, { method: "DELETE" }),
    onMutate: async (postId) => {
      // Optimistic: remove from cache immediately (D-09)
      await queryClient.cancelQueries({ queryKey: ["posts", "feed"] });
      const prev = queryClient.getQueryData(["posts", "feed"]);
      queryClient.setQueryData(["posts", "feed"], (old: Post[]) =>
        old.filter(p => p.id !== postId)
      );
      return { prev };
    },
    onError: (_err, _postId, context) => {
      // Rollback on failure
      queryClient.setQueryData(["posts", "feed"], context?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return /* ... render posts ... */;
}
```

### Pattern 4: Next.js 16 Dynamic Route with Async Params
**What:** Profile page uses dynamic `[username]` route. In Next.js 16, `params` is a Promise that must be awaited.
**When to use:** Profile page at `(auth)/profile/[username]/page.tsx`.
**Example:**
```typescript
// src/app/(auth)/profile/[username]/page.tsx
import { getUserPosts, getUserPostCount } from "@/lib/services/posts";
import { getUserByUsername } from "@/lib/services/users";
import { notFound } from "next/navigation";

export default async function ProfilePage(
  props: PageProps<"/profile/[username]">
) {
  const { username } = await props.params;
  const user = getUserByUsername(username);
  if (!user) notFound();

  const userPosts = getUserPosts(username);
  const postCount = getUserPostCount(username);

  return (
    <div>
      {/* Profile header with @username and post count */}
      {/* Post list using same PostCard component */}
    </div>
  );
}
```

### Pattern 5: QueryClientProvider Setup
**What:** TanStack Query requires a QueryClientProvider wrapping the app. Create a client component wrapper.
**When to use:** Root layout or (auth) layout.
**Example:**
```typescript
// src/components/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Anti-Patterns to Avoid
- **N+1 queries in feed:** Never loop through posts and fetch author info separately. Use JOIN in the single query.
- **Forgetting ownership check on delete:** The `WHERE` clause MUST include both `posts.id = $postId AND posts.userId = $userId`. Never delete by ID alone.
- **Using `router.refresh()` from client components in Next.js 16:** The `refresh()` function now lives in `next/cache` and is Server Action only. For client-side cache invalidation, use TanStack Query's `invalidateQueries`.
- **Synchronous params access in Next.js 16:** `params` is a Promise. Always `await params` in pages, layouts, and route handlers.
- **Returning passwordHash in user queries:** When querying users for profile or feed display, explicitly select only needed columns. Never `select()` all from users.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative timestamp formatting | Custom "time ago" logic | `date-fns` `formatDistanceToNow()` | Edge cases with timezones, plural forms, "just now" vs "1 second ago". |
| Client-side cache invalidation | Manual `fetch` + `useState` + refetch logic | TanStack Query `useQuery` + `useMutation` | Handles race conditions, deduplication, optimistic updates, error rollback. |
| Form validation | Manual length checks in event handlers | Zod schema + `safeParse` | Consistent validation on client and server. Reusable. Type-inferred. |
| Conditional CSS classes | String concatenation | `cn()` utility (clsx + tailwind-merge) | Already established in Phase 1. Handles class conflicts correctly. |

**Key insight:** Phase 2 is mostly CRUD + rendering. The libraries solve the hard parts (cache invalidation, optimistic UI, validation). The custom code should focus on business logic (ownership check, feed query) and UI (character counter, post card layout).

## Common Pitfalls

### Pitfall 1: N+1 Queries in Feed Rendering
**What goes wrong:** Fetch post IDs, then for each post fetch author separately. 20 posts = 20+ queries.
**Why it happens:** ORM makes it easy to lazy-load relations in a loop.
**How to avoid:** Single Drizzle query with `innerJoin(users, eq(posts.userId, users.id))` from the start. Select only needed columns.
**Warning signs:** Feed page slows down noticeably, multiple SQL logs per page load.

### Pitfall 2: Missing Ownership Check on Delete
**What goes wrong:** Any logged-in user can delete any post by guessing the ID.
**Why it happens:** Delete route only checks `posts.id` without also checking `posts.userId`.
**How to avoid:** `db.delete(posts).where(and(eq(posts.id, postId), eq(posts.userId, userId)))`. If `changes === 0`, return 403/404.
**Warning signs:** Delete succeeds on posts you don't own when tested via direct API call.

### Pitfall 3: Password Hash Leaking in User Data
**What goes wrong:** Feed query joins users table and returns all columns including `passwordHash`.
**Why it happens:** Using `.select()` without specifying columns returns everything.
**How to avoid:** Always use explicit column selection: `.select({ username: users.username, displayName: users.displayName })`.
**Warning signs:** Inspecting network tab shows `passwordHash` in API response JSON.

### Pitfall 4: Synchronous Params Access (Next.js 16)
**What goes wrong:** Profile page crashes with "params is not iterable" or similar TypeScript errors.
**Why it happens:** Next.js 16 made `params` a Promise. Old patterns like `{ params: { username } }` no longer work.
**How to avoid:** Always `const { username } = await props.params` in pages, or `const { id } = await ctx.params` in route handlers.
**Warning signs:** TypeScript type error on params destructuring, runtime crash on dynamic routes.

### Pitfall 5: Stale Feed After Post Creation
**What goes wrong:** User creates a post but it doesn't appear in the feed until manual page refresh.
**Why it happens:** TanStack Query cache still holds the old feed data.
**How to avoid:** After successful `POST /api/posts`, call `queryClient.invalidateQueries({ queryKey: ["posts"] })` to trigger refetch. Or optimistically prepend the new post to the cache.
**Warning signs:** New post only visible after browser F5 refresh.

### Pitfall 6: Character Counter Off-by-One
**What goes wrong:** Counter says "0 remaining" but post still submits, or says "-1" and button isn't disabled.
**Why it happens:** Counter logic checks `length > 280` but should check `length > 280` for disable AND display `280 - length` for the count.
**How to avoid:** Single source of truth: `const remaining = 280 - content.length`. Button disabled when `remaining < 0 || content.trim().length === 0`.
**Warning signs:** Being able to submit a post longer than 280 characters, or counter showing negative numbers while button is enabled.

## Code Examples

### Zod Post Validation Schema
```typescript
// src/lib/validations/post.ts
// Follows pattern from src/lib/validations/auth.ts
import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post cannot be empty")
    .max(280, "Post must be 280 characters or less"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
```

### TweetComposer Component Pattern
```typescript
// src/components/posts/TweetComposer.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export function TweetComposer() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const remaining = 280 - content.length;
  const isDisabled = content.trim().length === 0 || remaining < 0 || isSubmitting;

  const handleSubmit = async () => {
    if (isDisabled) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-300 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        rows={3}
        className="w-full resize-none bg-transparent text-lg outline-none"
      />
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm",
            remaining <= 0 ? "text-red-500 font-semibold" :
            remaining <= 20 ? "text-yellow-500" :
            "text-slate-400"
          )}
        >
          {remaining}
        </span>
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className={cn(
            "rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-sm font-semibold text-white",
            "hover:bg-[var(--color-accent-hover)]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Post
        </button>
      </div>
    </div>
  );
}
```

### Delete Route Handler with Ownership Check
```typescript
// src/app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deletePost } from "@/lib/services/posts";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/posts/[id]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const userId = Number((session.user as any).id);
  const deleted = deletePost(Number(id), userId);

  if (!deleted) {
    return NextResponse.json(
      { error: "Post not found or not authorized" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
```

### Relative Timestamp Formatting
```typescript
// Using date-fns formatDistanceToNow
import { formatDistanceToNow } from "date-fns";

function formatTimestamp(createdAt: string): string {
  return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  // Returns: "2 hours ago", "3 days ago", "just now"
}
```

### Profile Page Server Component with Async Params
```typescript
// src/app/(auth)/profile/[username]/page.tsx
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function ProfilePage(
  props: PageProps<"/profile/[username]">
) {
  const { username } = await props.params;
  const session = await getSession();

  // Fetch user and their posts using service functions
  const user = getUserByUsername(username);
  if (!user) notFound();

  const userPosts = getUserPosts(username);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav bar (shared) */}
      {/* Profile header: @username, post count */}
      {/* Post list using PostCard components */}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach (Next.js 16) | Impact |
|--------------|-------------------------------|--------|
| `router.refresh()` from client | `refresh()` from `next/cache` (Server Action only) | Mutations that need page refresh must use Server Actions or `revalidatePath` |
| `params: { slug: string }` (sync) | `params: Promise<{ slug: string }>` (async) | Must `await params` in all dynamic routes |
| `revalidatePath` only | `refresh()`, `revalidateTag()`, `updateTag()` | More granular cache control options |
| `export const dynamic = 'force-dynamic'` | Routes with DB queries are dynamic by default | No explicit config needed for feed pages |

**Deprecated/outdated:**
- `router.refresh()` from `useRouter()` -- replaced by `refresh()` from `next/cache` (Server Action context only)
- Synchronous `params` access -- fully removed in Next.js 16 (was deprecated with warning in 15)

## Open Questions

1. **TanStack Query vs Server Components for initial feed load**
   - What we know: Server Components can fetch data directly via Drizzle (no API call). TanStack Query can accept `initialData` from server-rendered props.
   - What's unclear: Whether to server-render the initial feed (fast first paint) and hydrate TanStack Query with that data, or load entirely client-side.
   - Recommendation: Use hybrid approach -- server component fetches initial data, passes to client `PostFeed` component as `initialData` for TanStack Query. Best of both worlds: fast first paint + client-side cache management for mutations.

2. **Pagination strategy**
   - What we know: D-06 says "offset pagination if needed." Simple approach for learning project.
   - What's unclear: Whether to implement pagination in Phase 2 or defer until post count warrants it.
   - Recommendation: Implement simple offset pagination (page query param) from the start. It's 2 lines of SQL and prevents the feed from breaking when post count grows. Default LIMIT 20.

## Environment Availability

Phase 2 is code/config changes only. The three new npm packages (`@tanstack/react-query`, `date-fns`, `lucide-react`) need to be installed.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Available | 20.9+ (required by Next.js 16) | -- |
| npm | Package install | Available | -- | -- |
| @tanstack/react-query | Feed/mutation cache | Not installed | 5.94.5 (from STACK.md) | `npm install` in Wave 0 |
| date-fns | Timestamp formatting | Not installed | 4.1.0 (from STACK.md) | `npm install` in Wave 0 |
| lucide-react | Icons (delete button) | Not installed | 0.577.0 (from STACK.md) | `npm install` in Wave 0 |

**Missing dependencies with no fallback:** None (all can be installed)

**Missing dependencies with fallback:** None needed -- straightforward npm install

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `chirp/vitest.config.ts` |
| Quick run command | `cd chirp && npx vitest run --reporter=verbose` |
| Full suite command | `cd chirp && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POST-01 | Create post with 280-char limit validated by Zod | unit | `cd chirp && npx vitest run src/lib/validations/post.test.ts -x` | Wave 0 |
| POST-01 | POST /api/posts creates post and returns 201 | integration | `cd chirp && npx vitest run src/lib/services/posts.test.ts -x` | Wave 0 |
| POST-02 | Delete own post succeeds, delete other user's post fails | unit | `cd chirp && npx vitest run src/lib/services/posts.test.ts -x` | Wave 0 |
| POST-03 | Feed returns posts newest-first with author info (JOIN) | unit | `cd chirp && npx vitest run src/lib/services/posts.test.ts -x` | Wave 0 |
| PROF-01 | getUserPosts returns only that user's posts | unit | `cd chirp && npx vitest run src/lib/services/posts.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd chirp && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd chirp && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/validations/post.test.ts` -- covers POST-01 validation (content length, empty, whitespace-only)
- [ ] `src/lib/services/posts.test.ts` -- covers POST-01 create, POST-02 delete + ownership, POST-03 feed ordering, PROF-01 user posts filtering
- [ ] Framework install: `cd chirp && npm install @tanstack/react-query date-fns lucide-react` -- new dependencies

*(Vitest config exists. @testing-library/react is available as devDependency. No project test files exist yet -- all test files are Wave 0 gaps.)*

## Sources

### Primary (HIGH confidence)
- `chirp/node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` -- Route Handler patterns, RouteContext type helper, async params
- `chirp/node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` -- Server Actions, `refresh()` from `next/cache`, `revalidatePath`
- `chirp/node_modules/next/dist/docs/01-app/02-guides/forms.md` -- Form patterns, useActionState, useOptimistic, Zod validation in Server Actions
- `chirp/node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` -- Breaking changes: async params, refresh from next/cache
- `chirp/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/refresh.md` -- refresh() is Server Action only
- `chirp/src/lib/db/schema.ts` -- Existing posts table schema (id, userId, content, parentId, repostOfId, createdAt)
- `chirp/src/lib/db/client.ts` -- DB singleton pattern (WAL mode, foreign keys enabled)
- `chirp/src/lib/auth/session.ts` -- getSession() helper using getServerSession
- `chirp/src/lib/auth/auth-options.ts` -- Session includes `id` and `username` via JWT callbacks
- `chirp/src/app/api/register/route.ts` -- Established API route pattern (parse body, Zod validate, DB operation, return JSON)
- `chirp/src/components/auth/LoginForm.tsx` -- Established form pattern (react-hook-form, zodResolver, cn utility, error display)

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- TanStack Query 5.94.5 recommended for feed management
- `.planning/research/ARCHITECTURE.md` -- Fan-out on read pattern, service layer pattern
- `.planning/research/PITFALLS.md` -- N+1 query prevention, ownership check on delete, password hash exclusion

### Tertiary (LOW confidence)
- Drizzle ORM query syntax for `innerJoin` and `returning()` -- based on training data, should be verified against installed version's actual API at implementation time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified from package.json and STACK.md research
- Architecture: HIGH -- patterns derived from existing Phase 1 code and Next.js 16 bundled docs
- Pitfalls: HIGH -- well-documented patterns from PITFALLS.md research, verified against actual schema
- Next.js 16 specifics: HIGH -- verified directly from bundled docs in node_modules

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- no fast-moving dependencies)
