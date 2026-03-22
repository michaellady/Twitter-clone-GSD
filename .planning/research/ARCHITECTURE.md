# Architecture Research

**Domain:** Twitter clone / microblogging platform (local learning project)
**Researched:** 2026-03-22
**Confidence:** HIGH (core architecture) / MEDIUM (specific tooling choices)

> Note: WebSearch was unavailable during this research session. Findings are based on
> well-established system design patterns for social platforms — this domain is extremely
> well-documented. Core architecture patterns carry HIGH confidence. Specific library
> version choices should be cross-checked against STACK.md research.

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Feed UI │  │ Profile  │  │ Tweet    │  │  Auth    │        │
│  │ Component│  │  Page    │  │ Composer │  │  Forms   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │              │              │
│  ┌────┴─────────────┴─────────────┴──────────────┴────────────┐  │
│  │                   Client-Side Router                        │  │
│  └────────────────────────────┬────────────────────────────────┘  │
└───────────────────────────────┼─────────────────────────────────┘
                                │ HTTP (REST or tRPC)
┌───────────────────────────────┼─────────────────────────────────┐
│                        Server Layer                              │
│  ┌────────────────────────────┴────────────────────────────────┐  │
│  │                  API Request Handler                        │  │
│  │           (route → validate → auth check)                   │  │
│  └─────────────────┬───────────────────────┬───────────────────┘  │
│                    │                       │                     │
│  ┌─────────────────┴──────┐  ┌─────────────┴──────────────────┐  │
│  │   Auth Service         │  │   Domain Services               │  │
│  │  - session management  │  │  - TweetService                 │  │
│  │  - password hashing    │  │  - FeedService                  │  │
│  │  - JWT/cookie issue    │  │  - LikeService                  │  │
│  └────────────────────────┘  │  - FollowService                │  │
│                              │  - RetweetService               │  │
│                              └─────────────────┬──────────────┘  │
│                                                │                 │
│  ┌─────────────────────────────────────────────┴──────────────┐  │
│  │                    Data Access Layer                        │  │
│  │              (ORM / query builder)                          │  │
│  └─────────────────────────────────────────────┬──────────────┘  │
└────────────────────────────────────────────────┼────────────────┘
                                                 │
┌────────────────────────────────────────────────┼────────────────┐
│                        Data Layer                                │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  Primary DB      │  │  Session Store   │                     │
│  │  (PostgreSQL /   │  │  (DB table or    │                     │
│  │   SQLite)        │  │   in-memory)     │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Client Router | Map URL paths to page components | React Router, Next.js App Router |
| Feed UI | Render paginated tweet list; handle real-time-like feel via polling or refetch | React component + query library |
| Tweet Composer | Text input, character count, submit action | Controlled form component |
| Auth Forms | Login / signup forms; store token/session on success | Form + API call + cookie |
| API Request Handler | Receive HTTP requests, parse body/params, validate, check auth, delegate to service | Express router or Next.js API routes |
| Auth Service | Hash passwords (bcrypt), issue session tokens, validate tokens on each request | Stateless JWT or stateful DB session |
| TweetService | Create, delete, fetch tweets; enforce ownership for delete | Business logic layer |
| FeedService | Assemble timeline — fetch tweets from followed users plus own; order by created_at DESC | Query with JOIN on follows |
| LikeService | Toggle like; prevent duplicate likes; return updated count | Upsert / delete on likes table |
| FollowService | Follow/unfollow; prevent self-follow; power the social graph | Insert/delete on follows table |
| RetweetService | Create retweet record pointing at original tweet; prevent duplicate retweets | Insert on retweets table + relation |
| Data Access Layer | Translate service calls into DB queries; abstract raw SQL | Drizzle ORM, Prisma, Kysely |
| Primary Database | Persist all application data | SQLite (local dev) or PostgreSQL |
| Session Store | Persist auth sessions between requests | DB table or in-process Map for local |

## Recommended Project Structure

```
src/
├── app/                     # Next.js App Router (if using Next) OR Express entry
│   ├── (auth)/              # Auth-gated route group
│   │   ├── feed/            # Home feed page
│   │   ├── profile/[user]/  # User profile page
│   │   └── tweet/[id]/      # Single tweet + replies page
│   ├── (public)/            # Public pages
│   │   ├── login/
│   │   └── signup/
│   └── api/                 # API route handlers
│       ├── auth/            # login, logout, signup endpoints
│       ├── tweets/          # CRUD for tweets
│       ├── feed/            # feed assembly endpoint
│       ├── likes/           # like/unlike toggle
│       ├── retweets/        # retweet creation
│       └── follows/         # follow/unfollow
├── components/              # Reusable UI components
│   ├── TweetCard.tsx        # Single tweet display
│   ├── TweetComposer.tsx    # Post creation form
│   ├── FeedList.tsx         # Scrollable tweet list
│   ├── UserAvatar.tsx       # Avatar + username
│   └── FollowButton.tsx     # Follow/unfollow toggle
├── lib/                     # Shared utilities and services
│   ├── db/                  # Database connection + schema
│   │   ├── schema.ts        # Table definitions (Drizzle/Prisma)
│   │   └── client.ts        # DB client singleton
│   ├── auth/                # Auth helpers
│   │   ├── session.ts       # Session create/validate
│   │   └── password.ts      # bcrypt hash/compare
│   └── services/            # Domain service functions
│       ├── tweets.ts
│       ├── feed.ts
│       ├── likes.ts
│       ├── follows.ts
│       └── retweets.ts
└── types/                   # Shared TypeScript types
    └── index.ts
```

### Structure Rationale

- **app/api/:** Keeps HTTP handling co-located with routing; each resource folder owns its endpoints
- **lib/services/:** Domain logic separated from HTTP layer — testable without HTTP overhead
- **lib/db/:** Schema and connection in one place — single source of truth for data model
- **components/:** UI components that map directly to visible elements in the feed/profile views

## Architectural Patterns

### Pattern 1: Fan-Out on Read (Pull Model) for Feed

**What:** When a user requests their feed, the server queries all tweets from accounts they follow at read time, sorts by recency, and returns the result. No pre-computation.

**When to use:** Small-to-medium scale (this project). Simpler to implement. Correct by default — no stale feed cache.

**Trade-offs:**
- Pro: Simple query, no background jobs, always fresh
- Pro: Correct for local project; no infrastructure needed
- Con: O(following_count) JOIN at read time — slow at scale (Twitter uses fan-out on write for this reason)
- Con: Does not matter at all for a local learning project

**Example:**
```sql
-- Feed query: tweets from followed users + own tweets
SELECT t.*, u.username, u.display_name
FROM tweets t
JOIN users u ON t.user_id = u.id
WHERE t.user_id IN (
  SELECT followee_id FROM follows WHERE follower_id = :currentUserId
  UNION
  SELECT :currentUserId
)
ORDER BY t.created_at DESC
LIMIT 20 OFFSET :offset;
```

### Pattern 2: Soft Interaction Records (Likes, Retweets as Rows)

**What:** Likes and retweets are stored as rows in join tables rather than counters. A `likes` table holds `(user_id, tweet_id)` with a unique constraint. A `retweets` table holds `(user_id, original_tweet_id)`.

**When to use:** Always for this type of project. Enables: "did the current user like this?", undo operations, like counts via COUNT(), preventing duplicates via constraint.

**Trade-offs:**
- Pro: Simple, relational, queryable
- Pro: Unique constraint enforces business rules at DB level
- Pro: Count derived from data (no drift between counter and reality)
- Con: COUNT(*) per tweet in feed query adds load (acceptable at this scale)

**Example:**
```sql
-- Like a tweet (idempotent upsert)
INSERT INTO likes (user_id, tweet_id) VALUES (:userId, :tweetId)
ON CONFLICT (user_id, tweet_id) DO NOTHING;

-- Unlike a tweet
DELETE FROM likes WHERE user_id = :userId AND tweet_id = :tweetId;

-- Check if current user liked a tweet (enriched feed query)
SELECT t.id, COUNT(l.id) as like_count,
       EXISTS(SELECT 1 FROM likes WHERE user_id = :me AND tweet_id = t.id) as liked_by_me
FROM tweets t
LEFT JOIN likes l ON l.tweet_id = t.id
GROUP BY t.id;
```

### Pattern 3: Token-Based Auth with HTTP-only Cookies

**What:** On login, server issues a signed JWT (or opaque session token stored in DB). Token is stored in an HTTP-only cookie — not accessible to JavaScript. Every API request automatically includes the cookie; server validates it.

**When to use:** Standard for web apps. HTTP-only cookie prevents XSS token theft. Simpler than Authorization header management on the client.

**Trade-offs:**
- Pro: Secure against XSS (cookie not readable by JS)
- Pro: Automatic inclusion by browser — no client-side token management
- Pro: "Stay logged in across refresh" requirement is automatically satisfied
- Con: CSRF risk (mitigated by SameSite=Strict cookie attribute)

## Data Flow

### Request Flow

```
User submits tweet form
    |
    v
Client (TweetComposer)
    | POST /api/tweets { content: "..." }
    v
API Route Handler
    | - parse body
    | - validate session cookie → get currentUserId
    | - validate content (non-empty, <= 280 chars)
    v
TweetService.createTweet(userId, content)
    | - insert into tweets table
    | - return new tweet row
    v
API Response { tweet: { id, content, created_at, user } }
    |
    v
Client cache invalidation → feed refetch → UI update
```

### Feed Load Flow

```
User navigates to / (home feed)
    |
    v
FeedPage component mounts
    | GET /api/feed?cursor=<timestamp>
    v
API Route Handler
    | - validate session
    v
FeedService.getFeed(userId, cursor)
    | - query: tweets from (follows + self) ORDER BY created_at DESC
    | - enrich: like count, liked_by_me, retweet count, retweeted_by_me
    | - paginate: LIMIT 20 with cursor
    v
Response: { tweets: [...], nextCursor: "..." }
    |
    v
FeedList component renders TweetCard[] per tweet
```

### Auth Flow

```
User submits login form
    |
    v
Client POST /api/auth/login { email, password }
    |
    v
AuthService
    | - lookup user by email
    | - bcrypt.compare(password, hash)
    | - on match: sign JWT with userId
    | - set HTTP-only cookie: session=<token>
    v
Response 200 OK + Set-Cookie header
    |
    v
Browser stores cookie automatically
Every subsequent request includes cookie → server reads userId → protected routes work
```

### State Management

```
Server (source of truth)
    |
    v (HTTP fetch on mount / mutation)
Client Query Cache (React Query / SWR)
    |
    v (subscribe to cache)
React Components
    |
    v (user action: like, tweet, follow)
Mutation → optimistic update in cache → POST to server → confirm or rollback
```

## Data Model

The schema is the foundation. Build this correctly first — everything else depends on it.

```
users
  id          uuid / serial PK
  username    text UNIQUE NOT NULL
  email       text UNIQUE NOT NULL
  password_hash text NOT NULL
  display_name text
  bio         text
  created_at  timestamptz

tweets
  id          uuid / serial PK
  user_id     FK → users.id
  content     text NOT NULL (max 280 chars enforced at app layer)
  created_at  timestamptz
  -- no reply_to_id here; replies are modeled as tweets with a parent

replies
  id          uuid / serial PK
  tweet_id    FK → tweets.id (the reply itself)
  parent_id   FK → tweets.id (tweet being replied to)
  -- OR: add reply_to_id column directly on tweets table (simpler for MVP)

likes
  id          serial PK
  user_id     FK → users.id
  tweet_id    FK → tweets.id
  created_at  timestamptz
  UNIQUE(user_id, tweet_id)

retweets
  id          serial PK
  user_id     FK → users.id
  original_tweet_id  FK → tweets.id
  created_at  timestamptz
  UNIQUE(user_id, original_tweet_id)

follows
  follower_id   FK → users.id
  followee_id   FK → users.id
  created_at    timestamptz
  PRIMARY KEY (follower_id, followee_id)
  CHECK (follower_id != followee_id)  -- prevent self-follow
```

## Component Build Order

Dependencies between components determine the order phases should address them.

```
1. Database schema + ORM setup
        |
        v
2. User model + Auth (register, login, session)
   [Everything else requires an authenticated user]
        |
        v
3. Tweet CRUD (create, read, delete)
   [Likes, retweets, replies depend on tweets existing]
        |
        v
4. Feed assembly
   [Feed depends on tweets + follows; build with self-feed first, then add follows]
        |
        v
5. Follows (social graph)
   [Follow model needed before follow-filtered feed works]
        |
        v
6. Interactions: Likes, Retweets, Replies
   [All depend on tweets + auth; can be built in parallel with each other]
        |
        v
7. Profile page
   [Aggregates tweets, follow counts, user info — composite view of earlier models]
```

**Rationale:**
- Auth is gating — no user identity means no ownership, no permissions
- Tweets before interactions — nothing to like/retweet without tweets
- Basic feed before follows — validate the feed rendering with own tweets first
- Follows before follow-filtered feed — need the social graph data to filter on
- Profile is last — purely a composition of data already built

## Scaling Considerations

This is a local learning project. Scale is not a goal. Notes here are informational only.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Local (this project) | Monolith, single process, SQLite or local Postgres, no caching |
| 0–1k users | Monolith is fine. Add indexes on `tweets.user_id`, `follows.follower_id`, `likes.tweet_id` |
| 1k–100k users | Feed query becomes the bottleneck. Add Redis cache for user feeds. Add DB read replica. |
| 100k+ users | Fan-out on write (pre-compute feeds on tweet creation). Separate media service. CDN. |

### Scaling Priorities (for educational awareness)

1. **First bottleneck:** Feed query. The JOIN across follows + tweets + likes gets expensive as follow counts grow. Fix: index first, then cache.
2. **Second bottleneck:** Like/retweet counts. COUNT(*) per tweet in feed is N+1 adjacent. Fix: batch COUNT in a single query with GROUP BY, not per-tweet queries.

## Anti-Patterns

### Anti-Pattern 1: N+1 Queries in Feed Rendering

**What people do:** Fetch the list of tweet IDs, then for each tweet make a separate query to get like count, author info, etc.

**Why it's wrong:** 20 tweets = 20+ separate DB round trips. Slow, kills performance even locally with large datasets.

**Do this instead:** Use a single enriched JOIN query that fetches tweets + author + like_count + liked_by_me + retweet_count in one shot using LEFT JOINs and subqueries/CTEs.

### Anti-Pattern 2: Storing Counts as Columns

**What people do:** Add `like_count INT` to the tweets table, increment/decrement on each like action.

**Why it's wrong:** Count gets out of sync if a transaction fails. Race conditions under concurrent writes. Hard to answer "did this user like this?" — requires a separate likes table anyway.

**Do this instead:** Derive counts from the likes/retweets tables using COUNT(). For this project scale, derived counts are perfectly fast. Store the relation rows, not the derived number.

### Anti-Pattern 3: Putting Business Logic in Route Handlers

**What people do:** Write all DB queries and business rules inline in the API route function.

**Why it's wrong:** Route handler becomes a 200-line function. Logic can't be tested without HTTP. Same logic duplicated across endpoints.

**Do this instead:** Route handler handles HTTP concerns only (parse, validate, respond). All business logic lives in a service function (`TweetService.createTweet`) that takes plain arguments and returns plain data.

### Anti-Pattern 4: Modeling Replies as a Separate Table (over-engineering for MVP)

**What people do:** Build a dedicated `replies` table with complex thread traversal logic from the start.

**Why it's wrong:** For MVP, a tweet IS a reply — just one with a `parent_tweet_id` foreign key. Two tables before you have users creates unnecessary complexity.

**Do this instead:** Add `reply_to_id` as a nullable column on the `tweets` table. `NULL` = top-level tweet. Non-null = reply. Threads are simply tweets WHERE `reply_to_id = :tweetId`. Promote to a separate model only if you need nested threading.

## Integration Points

### External Services

None for this project. Everything runs locally.

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Email provider | Not applicable | Email verification is out of scope |
| File storage | Not applicable | Media uploads are out of scope |
| Push notifications | Not applicable | Notifications are out of scope |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI components ↔ API routes | HTTP fetch (REST or tRPC) | React Query / SWR manages cache and loading state |
| API routes ↔ service layer | Direct function call (same process) | Services are plain TypeScript functions, not separate services |
| Service layer ↔ database | ORM query methods | Drizzle or Prisma abstracts raw SQL |
| Auth middleware ↔ all protected routes | Session cookie validation | Middleware runs before route handler; attaches userId to request context |

## Sources

- Architecture knowledge: well-established system design patterns for social platforms
  (Twitter system design is among the most documented interview/learning topics)
- Data modeling: standard relational social graph patterns (users/tweets/follows/likes as join tables)
- Auth pattern: HTTP-only cookie + JWT is documented best practice per OWASP guidelines
- Build order: derived from relational data dependencies (FK graph)
- Confidence: HIGH for core structure and data model; MEDIUM for specific library choices
  (library choices should be confirmed by STACK.md research)

---
*Architecture research for: Twitter clone / microblogging platform (Chirp)*
*Researched: 2026-03-22*
