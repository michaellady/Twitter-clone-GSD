# Project Research Summary

**Project:** Chirp — Twitter Clone / Microblogging Platform
**Domain:** Social microblogging platform (learning project)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

Chirp is a classic social microblogging platform — one of the most thoroughly studied application domains in software engineering education. The research confirms a clear, well-validated approach: a Next.js 16 full-stack monolith with SQLite for local persistence, Drizzle ORM for type-safe queries, next-auth v4 for session management, and Tailwind CSS v4 for styling. This stack eliminates the complexity of running separate backend services while teaching real architectural patterns. The entire social loop — post, like, retweet, follow, feed — is achievable in a single cohesive codebase.

The critical insight across all four research areas is that the data model must be designed correctly before any features are built. The single-table post model (with nullable `parent_id` and `repost_of_id` discriminators) handles tweets, replies, and retweets without schema rewrites. The social graph requires an explicit `follows` join table — not an array column on users. Auth requires proper bcrypt hashing and cookie-based session management from day one. Getting these foundations wrong is recoverable but costly; getting them right unlocks every feature phase cleanly.

The primary risks are all data-modeling mistakes: splitting posts into multiple tables, modeling the follow graph as user attributes, and implementing retweets as content copies. Each of these has a HIGH recovery cost if discovered late. The secondary risk is N+1 query patterns in feed construction, which is a LOW recovery cost but creates a bad mental model if left in place. All other pitfalls — optimistic UI for likes, authorization checks on mutations — are feature-level concerns addressable during their respective implementation phases.

## Key Findings

### Recommended Stack

The stack is a Next.js monolith that eliminates the need for a separate API server. Next.js App Router provides file-based routing, Server Components, and Server Actions in a single package. SQLite via `better-sqlite3` requires zero infrastructure setup — a single file database that models the full social graph. Drizzle ORM provides type-safe SQL that remains close enough to raw SQL to be educational. next-auth v4 (not v5, which is still beta) handles the session cookie flow. Tailwind v4 requires no PostCSS configuration and is already the default in `create-next-app`.

See `.planning/research/STACK.md` for complete version table and installation commands.

**Core technologies:**
- Next.js 16.2.1 (App Router): Full-stack framework — no separate Express server needed; Server Actions handle mutations cleanly
- React 19.2.4: UI rendering — stable Actions API underpins Next.js Server Actions
- TypeScript 5.9.3: Type safety — essential for modeling the social graph (User, Tweet, Like, Follow relations)
- SQLite via better-sqlite3 12.8.0: Local database — zero setup, synchronous API, models all social graph relations
- Drizzle ORM 0.45.1: Data access — type-safe SQL, thinner than Prisma, educationally transparent
- Tailwind CSS 4.2.2: Styling — zero-config, utility-first, ships as default in create-next-app
- next-auth 4.24.13: Auth — battle-tested session management, Credentials provider for email/password
- TanStack Query 5.94.5: Client-side cache — optimistic updates for likes/retweets, feed refetch

**Critical version constraint:** `@hookform/resolvers` v5+ is required for Zod v4 compatibility. Do not pair resolvers v4 with Zod v4 — it is a breaking change.

### Expected Features

The full feature analysis is in `.planning/research/FEATURES.md`. The dependency graph is clear: auth gates everything, post creation enables all interactions, and the follow graph enables the personalized feed.

**Must have (table stakes — v1 launch):**
- User registration (email + password) — identity foundation; nothing works without it
- Persistent login / logout — makes the app usable across sessions
- Post creation with 280-char limit — the core action of the product
- Delete own post — content ownership expectation
- Chronological global feed — content discovery and the post-read loop
- Like / unlike a post — lowest-friction engagement; immediate feedback expected
- Reply to a post — distinguishes social platform from broadcast tool
- Retweet (straight retweet, reference model) — amplification mechanic
- User profile page with post history — identity and content history
- Follow / unfollow other users — builds the social graph
- Following feed — personalized view; validates the social graph payoff

**Should have (v1.x, after core mechanics validated):**
- Quote-tweet — enriches retweet mechanic; moderate complexity
- User search by username — low complexity, high discoverability value
- Pinned post — single boolean flag, makes profiles feel complete
- Bookmarks — no social side effects, easy to add

**Defer (v2+):**
- Hashtags — discovery layer; good stretch goal after core mechanics work
- @mentions with notifications — adds async complexity; enhances but doesn't define core loop
- Block / mute — important for real products; medium complexity
- Cursor-based pagination — good API design deep-dive; offset pagination sufficient for demo
- Real-time updates (WebSocket) — excellent learning exercise, not needed for demo
- Media uploads — scope explosion; text-only covers 90% of the social mechanic learning
- Algorithmic feed — requires ML infrastructure; destroys simplicity; not a learning goal

### Architecture Approach

The architecture is a layered Next.js monolith: App Router pages and API routes handle HTTP concerns, a `lib/services/` layer contains domain logic (TweetService, FeedService, LikeService, FollowService, RetweetService), and Drizzle ORM abstracts the SQLite data layer. All internal boundaries communicate via direct function calls — no message queues, no microservices, no infrastructure. The feed uses fan-out-on-read (query at request time): a single JOIN across `posts`, `users`, and `follows` ordered by `created_at DESC` with a LIMIT. This is correct for this scale and teaches the right query structure.

See `.planning/research/ARCHITECTURE.md` for the full project structure, data model schema, and SQL examples.

**Major components:**
1. Next.js App Router pages — routing, Server Components for initial data load, auth-gated route groups
2. API route handlers — HTTP parsing, session validation, input validation; delegates immediately to services
3. Domain services (lib/services/) — TweetService, FeedService, LikeService, FollowService, RetweetService; plain TypeScript functions, testable without HTTP
4. Drizzle ORM + SQLite — type-safe query layer; schema is the single source of truth
5. next-auth session middleware — HTTP-only cookie; validates session before protected handlers run
6. TanStack Query client cache — optimistic updates for likes/retweets; cache invalidation on mutations
7. React components — TweetCard, TweetComposer, FeedList, FollowButton; map directly to visible UI elements

**Build order (driven by FK dependencies):** Schema → Auth → Tweet CRUD → Global feed → Follows → Personalized feed → Interactions (likes, retweets, replies) → Profile page

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full details, warning signs, and recovery strategies.

1. **Single-table post model is not optional** — Splitting tweets, replies, and retweets into separate tables creates UNION-dependent feed queries and a schema that fights every subsequent feature. Use one `posts` table with nullable `parent_id` (reply indicator) and `repost_of_id` (retweet indicator). Address in Phase 1 (data modeling). Recovery cost: HIGH.

2. **Retweet must be a reference, not a content copy** — Duplicating post content on retweet causes like count divergence, broken delete semantics, and orphaned rows. A retweet row has `repost_of_id` set and `content` as null. Directly linked to Pitfall 1 — same phase. Recovery cost: MEDIUM-HIGH.

3. **Follows table must be an explicit join table** — Storing follow relationships as an array column on the user model breaks bidirectional queries, loses timestamps, and prevents the personalized feed query from working. Use `follows(follower_id, followee_id)` with a composite primary key. Address in Phase 2 (social graph). Recovery cost: HIGH.

4. **Auth must use bcrypt and proper session validation** — Plaintext or weakly-hashed passwords and JWT decode-without-verify are non-negotiable mistakes even in learning projects. bcrypt is two function calls; next-auth handles the session cookie correctly by default. Address in Phase 1 (auth). Recovery cost: HIGH.

5. **N+1 queries in feed construction** — Fetching author info, like counts, and retweet counts in separate per-post queries creates 60-80 DB round trips for a 20-post feed. Build the enriched JOIN query once at feed implementation time — do not refactor it later. Address in Phase 2 (feed). Recovery cost: LOW but establishes bad mental model if deferred.

## Implications for Roadmap

Based on the dependency graph from FEATURES.md, the build order from ARCHITECTURE.md, and the pitfall-to-phase mapping from PITFALLS.md, the research points to a 4-phase structure.

### Phase 1: Foundation — Schema, Auth, and Core Post Model

**Rationale:** Auth gates every subsequent feature. The data model, once wrong, is expensive to fix — it must be correct before a single post is created. These two concerns share a phase because both involve schema decisions that are hard to undo.

**Delivers:**
- Project bootstrapped (Next.js + Drizzle + next-auth configured)
- Database schema with correct single-table post model (`parent_id`, `repost_of_id` columns present from the start)
- User registration and login with bcrypt password hashing
- Persistent HTTP-only cookie session
- Logout with server-side session invalidation
- Basic auth middleware protecting all non-public routes

**Addresses from FEATURES.md:** User registration, persistent login, logout

**Avoids from PITFALLS.md:**
- Pitfall 1 (split post tables) — schema review gate: single posts table before any posts are created
- Pitfall 2 (plaintext passwords) — bcrypt wired at registration; no plaintext path exists
- Pitfall 3 (JWT misuse) — next-auth session cookies eliminate manual JWT handling

**Research flag:** Standard patterns — next-auth v4 Credentials provider is well-documented; no additional research needed.

---

### Phase 2: Core Social Loop — Posts, Feed, and the Social Graph

**Rationale:** Once auth exists, the core social loop can be built. This phase deliberately defers interactions (likes, retweets, replies) until the post and feed infrastructure is solid. The global feed validates rendering before the social graph is added. The follow graph is built in this phase because the personalized feed depends on it — they ship together.

**Delivers:**
- Post creation with 280-char character count and server-side enforcement
- Post deletion with ownership check (403 if not the owner)
- Chronological global feed with enriched JOIN query (author, like counts in one query)
- Offset pagination on feed (LIMIT 20)
- Follows join table with `follower_id`/`followee_id` and composite primary key
- Follow / unfollow with self-follow prevention
- Personalized following feed (fan-out-on-read with IN subquery)
- User profile page with post history and follower/following counts

**Addresses from FEATURES.md:** Post creation, delete own post, chronological global feed, follow/unfollow, following feed, user profile page

**Avoids from PITFALLS.md:**
- Pitfall 4 (N+1 feed queries) — enriched JOIN query established here; warning sign checklist from PITFALLS.md applied
- Pitfall 5 (follower graph as array column) — explicit follows table; composite PK prevents duplicates
- Pitfall 6 (bad feed query structure) — single IN-subquery pattern established, not loop-based

**Research flag:** Standard patterns — feed JOIN query and social graph table design are extremely well-documented. No additional research needed.

---

### Phase 3: Interactions — Likes, Retweets, and Replies

**Rationale:** With posts and the social graph working, interactions can be added cleanly. Likes and retweets are join table rows (not counter columns). Replies use the `parent_id` column already in the schema from Phase 1. Optimistic UI for likes is implemented here — not deferred.

**Delivers:**
- Like / unlike toggle with optimistic UI (immediate state update, revert on error)
- Retweet as a reference row (`repost_of_id` set, `content` null) — not a content copy
- Unique constraint on `(user_id, original_tweet_id)` prevents duplicate retweets
- Reply creation using `parent_id` on the posts table
- Reply thread display below tweet detail view
- Authorization guard on all mutations (like, unlike, delete) — wrong user returns 403
- Like and retweet counts derived from join table COUNT(), not cached columns
- Feed updated to show retweet attribution ("X retweeted") with original author

**Addresses from FEATURES.md:** Like/unlike, retweet (straight), reply to a post

**Avoids from PITFALLS.md:**
- Pitfall 7 (retweet as content copy) — reference model enforced; content column null on retweet rows
- Pitfall 8 (no optimistic UI for likes) — optimistic update pattern with rollback implemented
- Authorization missing on delete/unlike — security test checklist from PITFALLS.md applied
- No `created_at` on likes/follows — timestamps added at schema creation

**Research flag:** Standard patterns for likes and retweets. Reply threading display may benefit from targeted research if nested threading (replies to replies) is desired — but flat reply display is sufficient for v1 and well-documented.

---

### Phase 4: Polish and v1.x Enhancements

**Rationale:** Once the full social loop is working and validated, lower-priority features that add meaningful depth without architectural changes can be layered on. These are all additive — no schema rewrites required.

**Delivers (pick subset based on learning goals):**
- Quote-tweet — new post with `repost_of_id` and non-null `content`; already supported by schema
- User search by username — simple query on `username` column; prerequisite for organic discoverability
- Pinned post — boolean flag on posts; profile rendering change only
- Bookmarks — new join table `(user_id, post_id)`; no social visibility

**Addresses from FEATURES.md:** Quote-tweet (v1.x), user search (v1.x), pinned post (v1.x), bookmarks (v1.x)

**Research flag:** Standard patterns. Quote-tweet is already supported by the Phase 1 schema (same discriminator column approach). No additional research needed.

---

### Phase Ordering Rationale

- **Schema first, always:** The PITFALLS.md pitfall-to-phase mapping is unambiguous — all HIGH recovery-cost mistakes are data modeling mistakes that must be prevented in Phase 1. A 30-minute schema review before any feature work is the highest-ROI activity in this project.
- **Feed before interactions:** Rendering a feed of posts validates the core data flow before adding the complexity of state mutations. Debugging a broken like count is much easier when the feed query is already known to work.
- **Social graph with personalized feed:** Follow/unfollow and the personalized feed are a logical unit — building the graph without the feed that consumes it delays the validation of the social mechanic. They belong in the same phase.
- **Interactions last among core features:** Likes, retweets, and replies all depend on posts existing. They can be built in parallel with each other (all share the same dependency: an authenticated user and a posts table) but not before Phase 2.
- **Polish is genuinely optional:** Quote-tweet, search, and bookmarks all have medium-to-low learning value relative to the core social loop. Phase 4 exists but should be treated as a stretch goal, not a requirement.

### Research Flags

**Phases with standard patterns (skip additional research-phase):**
- **Phase 1 (Foundation):** next-auth v4 Credentials provider, bcrypt hashing, and Drizzle schema setup are all extremely well-documented. The exact patterns needed are captured in STACK.md and ARCHITECTURE.md.
- **Phase 2 (Core Social Loop):** Feed JOIN query and social graph table design are canonical patterns. ARCHITECTURE.md contains the exact SQL examples needed.
- **Phase 3 (Interactions):** Like/retweet join table pattern is standard. Optimistic UI pattern is well-documented in TanStack Query documentation.
- **Phase 4 (Polish):** All features are additive to established patterns. No novel integration needed.

**No phases require deeper research before planning.** The domain is exceptionally well-documented. The research files contain sufficient detail to write implementation tasks directly.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified against npm registry on 2026-03-22. next-auth v4 vs v5 beta status confirmed via dist-tags. One caveat: specific Next.js 16 API details should be verified against current docs before implementation, as training data cuts off at August 2025. |
| Features | HIGH | Twitter/X feature set is among the most documented in software engineering. Mastodon and Bluesky are open-source with public docs. Feature dependency graph is logically derived and internally consistent. |
| Architecture | HIGH | Core patterns (fan-out-on-read, join table interactions, HTTP-only cookie auth) are established OWASP and system design patterns. MEDIUM for specific library-level API details — cross-reference with STACK.md during implementation. |
| Pitfalls | HIGH | All eight critical pitfalls are canonical, extensively documented failure modes from hundreds of similar projects. Recovery costs are accurately assessed. WebSearch was unavailable during pitfalls research but the domain is stable enough that training data is sufficient. |

**Overall confidence: HIGH**

### Gaps to Address

- **Next.js 16 specific APIs:** The App Router patterns in ARCHITECTURE.md are based on Next.js 13-15 conventions (training data through August 2025). Next.js 16 may have introduced changes to Server Actions or middleware. Verify `next-auth` v4 `getServerSession` import paths and Server Action patterns against Next.js 16 docs before Phase 1 implementation.
- **Quote-tweet data modeling:** The single-table model supports quote-tweets (non-null `content` + non-null `repost_of_id`), but the feed query enrichment for quote-tweets (showing embedded original post) is not fully specified in the research. Address when quote-tweet is prioritized in Phase 4.
- **Reply threading depth:** Research recommends flat/single-level replies for v1. If nested threading (replies to replies) is desired, the `parent_id` column supports it but the UI rendering and query complexity increase significantly. Decision deferred to Phase 3 planning.

## Sources

### Primary (HIGH confidence)
- npm registry dist-tags — package versions verified 2026-03-22
- Twitter/X, Mastodon, Bluesky public feature documentation — feature analysis basis
- OWASP JWT Cheat Sheet — auth security patterns
- Next.js App Router documentation (training data) — architectural patterns

### Secondary (MEDIUM confidence)
- Training knowledge (August 2025 cutoff) — Next.js 16 specific API details, library integration patterns
- Open-source Twitter clone reference implementations (Rails, Django, Next.js) — feature prioritization and pitfall validation
- TanStack Query documentation — optimistic update patterns

### Tertiary (informational only)
- Scaling analysis — fan-out-on-read vs fan-out-on-write tradeoffs; not applicable to this project's scope but noted for educational context

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
