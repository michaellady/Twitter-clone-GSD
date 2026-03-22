# Pitfalls Research

**Domain:** Twitter clone / microblogging platform (learning project)
**Researched:** 2026-03-22
**Confidence:** HIGH — these are canonical, well-documented failure modes across hundreds of similar projects in the developer community. Calibrated to the Chirp learning project scope (local, solo, no deployment).

## Critical Pitfalls

### Pitfall 1: Conflating Tweets, Replies, and Retweets as Different Tables

**What goes wrong:**
Three separate tables are created — `tweets`, `replies`, and `retweets` — with duplicate columns and separate foreign keys. When you need to show a thread, build a feed, or count total interactions on a post, every query requires joining all three tables with UNIONs. Adding quote-tweets later requires a fourth table. The data model fights every feature.

**Why it happens:**
The UI shows tweets, replies, and retweets as distinct things, so developers mirror the UI in the database schema. This feels natural at first but ignores that all three are fundamentally the same entity: a post with optional metadata (parent_id for replies, original_id for retweets).

**How to avoid:**
Use a single `posts` table with discriminator columns:
- `parent_id` (nullable FK to posts.id) — non-null means it's a reply
- `repost_of_id` (nullable FK to posts.id) — non-null means it's a retweet/repost
- `content` (nullable) — null content + non-null repost_of_id = pure retweet; non-null content + non-null repost_of_id = quote tweet

This single-table model handles all variants and makes feed queries, thread building, and reply counts trivially joinable.

**Warning signs:**
- You have separate `replies` or `retweets` tables with their own `id` columns
- Feed queries require `UNION ALL` across multiple tables
- "Show all posts by a user including replies" needs multiple queries

**Phase to address:**
Data modeling phase (Phase 1 / foundation). Wrong here = rewrite later.

---

### Pitfall 2: Password Stored as Plaintext or Weakly Hashed

**What goes wrong:**
Passwords are stored as plaintext, MD5, or SHA-1. The database is a local SQLite file that gets shared, inspected, or committed — exposing all user credentials. Even on a learning project, developing the habit of weak password storage is harmful to long-term skill-building.

**Why it happens:**
"It's just local" reasoning leads developers to skip bcrypt/argon2 as "production complexity." Also: implementing auth manually without a library often means rolling a naive hash.

**How to avoid:**
Use bcrypt (work factor 10-12) or argon2id from the start. Every modern auth library defaults to this. If building auth manually, use `bcrypt` package (Node) or equivalent — it's two function calls: `hash()` on save, `compare()` on login. Never implement your own hashing.

**Warning signs:**
- Password column is `VARCHAR` rather than fixed-length `CHAR(60)` (bcrypt output is always 60 chars)
- `SELECT * FROM users WHERE password = ?` appears anywhere in the codebase
- MD5 or SHA-1 is used without a salt

**Phase to address:**
Auth phase (Phase 1 or Phase 2 depending on roadmap). Cannot be deferred.

---

### Pitfall 3: Storing Session State Client-Side Without Validation (JWT Misuse)

**What goes wrong:**
JWTs are used for auth, the secret is hardcoded or `.env`-ignored, and the token is never validated server-side — only decoded. Any user can craft a token claiming to be user ID 1 (admin) by changing the payload. Or: tokens are issued but never invalidated, so logout does nothing.

**Why it happens:**
JWT tutorials show decode-without-verify patterns. "Stateless auth" messaging leads developers to think server-side session state (a token blocklist or session table) is the wrong approach. The `jwt.decode()` vs `jwt.verify()` distinction is subtle and easy to miss.

**How to avoid:**
Always use `jwt.verify()` with the secret, never `jwt.decode()`. Use a strong random secret (32+ bytes from `crypto.randomBytes`). For a learning project, simple HTTP-only cookie sessions with a session store are actually simpler and harder to misuse than JWTs. If using JWTs: store the secret in `.env`, add `.env` to `.gitignore` before the first commit.

**Warning signs:**
- `jwt.decode()` used instead of `jwt.verify()` in middleware
- JWT secret is a short string literal in source code (`"secret"`, `"myapp"`)
- Logout deletes the client-side cookie but no server-side invalidation exists
- `.env` is not in `.gitignore`

**Phase to address:**
Auth phase. The session strategy must be decided before any protected routes are built.

---

### Pitfall 4: N+1 Queries in Feed Construction

**What goes wrong:**
The home feed loads 20 tweets, then for each tweet fires a separate query to get the author's name and avatar, another for like count, another to check if the current user liked it. 20 tweets = 60-80 queries. The page is slow even on localhost with a small dataset.

**Why it happens:**
Feed is built iteratively: "fetch tweets, then for each tweet get the user." ORMs make this invisible — Sequelize/Prisma's lazy loading fires the query silently when you access `tweet.author.name`.

**How to avoid:**
Build feeds with a single JOIN query from the start:
```sql
SELECT posts.*, users.username, users.display_name,
  COUNT(DISTINCT likes.id) AS like_count,
  EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = $currentUser) AS liked_by_me
FROM posts
JOIN users ON posts.user_id = users.id
LEFT JOIN likes ON likes.post_id = posts.id
WHERE posts.parent_id IS NULL
GROUP BY posts.id, users.id
ORDER BY posts.created_at DESC
LIMIT 20
```
If using an ORM, use eager loading (`include: [User]`, Prisma's `include: { author: true }`).

**Warning signs:**
- Feed controller has a loop that calls `getUserById()` or `getLikeCount()` per post
- Query log shows 20+ queries for a single feed page load
- Feed response time is >500ms on localhost with <100 posts

**Phase to address:**
Feed construction phase. Establish the JOIN pattern at the start of feed implementation.

---

### Pitfall 5: Following/Follower Graph Modeled Incorrectly

**What goes wrong:**
The follow relationship is modeled as a column on the user (`following_ids TEXT[]` or similar array), or as a many-to-many through the users table itself with ambiguous column names. Querying "who follows user X" vs "who does user X follow" becomes confusing and error-prone.

**Why it happens:**
The "follows" concept feels like a user attribute, not a separate entity. Developers add it to the user model rather than creating a dedicated join table.

**How to avoid:**
Create an explicit `follows` table with unambiguous column names:
```sql
CREATE TABLE follows (
  follower_id INTEGER REFERENCES users(id),
  followee_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);
```
The composite primary key prevents duplicate follows automatically. `follower_id` = the person doing the following. `followee_id` = the person being followed. Never use `user_id` / `target_id` — the meaning is too ambiguous.

**Warning signs:**
- Follow data stored as a JSON/array column on the users table
- Variable names like `userId` and `targetId` in follow queries (ambiguous direction)
- "Get followers of user X" and "get following of user X" require different query shapes

**Phase to address:**
Social graph phase. Must be correct before building the personalized feed (which reads this table heavily).

---

### Pitfall 6: Building the Personalized Feed as a Query, Not a Fan-Out

**What goes wrong:**
The "following feed" (posts from people you follow) is implemented as: get all users the current user follows, then fetch all their posts ordered by time. With 1 user following 10 others this is fine. The query gets written as a subquery or multi-join that works at demo scale — but the query structure itself teaches the wrong mental model and the code is fragile.

**Why it happens:**
The fan-out-on-write model (pre-computing feeds) is more complex to explain, so tutorials show fan-out-on-read (query at request time). For a learning project this is fine — but the query needs to be written correctly regardless.

**How to avoid:**
For a learning project, fan-out-on-read is correct. But write it as a single clean query:
```sql
SELECT posts.*, users.username
FROM posts
JOIN users ON posts.user_id = users.id
WHERE posts.user_id IN (
  SELECT followee_id FROM follows WHERE follower_id = $currentUser
)
ORDER BY posts.created_at DESC
LIMIT 20
```
The learning value is understanding WHY Twitter switched to fan-out-on-write at scale — document this in code comments rather than over-engineering it.

**Warning signs:**
- Feed fetches follower list in one query, then loops to fetch each user's posts
- `Promise.all(followedUsers.map(u => getPostsByUser(u.id)))` appears in feed code

**Phase to address:**
Feed construction phase, after social graph is in place.

---

### Pitfall 7: Retweet Implemented as a Copy, Not a Reference

**What goes wrong:**
When a user retweets, the original tweet's content is duplicated into a new row. Like counts diverge (the copy gets its own likes, separate from the original). Editing the original doesn't update retweets. Deleting the original leaves orphaned copies.

**Why it happens:**
"Retweet = share = copy" feels natural. It's simpler to implement in the short term — just `INSERT INTO tweets SELECT content FROM tweets WHERE id = $original`.

**How to avoid:**
Retweets must be references, not copies. Using the single-table model from Pitfall 1: a retweet is a post row with `repost_of_id` set and `content` as null. The UI renders the referenced post's content. Likes on the original stay on the original. The retweet row only tracks who shared it and when.

**Warning signs:**
- A retweet creates a new row with the same `content` as the original
- Like counts on retweets are separate from like counts on the original post
- No `repost_of_id` or equivalent foreign key exists

**Phase to address:**
Data modeling phase (Part of Pitfall 1 prevention). Also requires UI attention in the retweet feature phase.

---

### Pitfall 8: No Optimistic UI for Likes — Feels Broken

**What goes wrong:**
Clicking like fires a server request, waits for the response, then updates the count. On localhost this works. But the interaction feels sluggish and mechanical — the like doesn't register until the round-trip completes. This is one of the most important UX patterns to learn from social platforms.

**Why it happens:**
Developers implement likes as a standard form submit or fetch-then-update. Optimistic UI (update immediately, revert on failure) requires additional state management that feels like over-engineering.

**How to avoid:**
For likes specifically: update the UI state immediately on click (toggle the heart, update the count), then fire the server request. On error, revert the state and show an error. This is the correct pattern and teaches an important lesson about perceived performance vs actual performance.

**Warning signs:**
- Like button is disabled/grayed during the server request
- Like count visibly "catches up" after a short delay
- No rollback logic exists for failed like/unlike requests

**Phase to address:**
Interactions phase (likes/retweets). This is a feature-level concern, not architecture.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing follow relationships as array column on user | No join table to manage | Cannot query "who follows X" efficiently; no created_at timestamp; composite queries fail | Never for a learning project — the join table IS the lesson |
| Skipping password hashing | Faster auth setup | Teaches dangerous habits; local DB file exposure | Never — bcrypt is 2 lines of code |
| Fetching all tweets and filtering in JS | Simple to implement | Breaks immediately with >100 tweets; teaches wrong mental model | Never — pagination and DB filtering must be learned |
| No created_at timestamp on likes/follows | Simpler schema | Cannot sort followers by date, cannot detect rapid-fire abuse, cannot debug ordering issues | Never — timestamps cost nothing to add, everything to remove |
| content NOT NULL on posts table | Forces tweets to have content | Blocks implementing pure retweets (which have null content by design) | Never — allow null to support the retweet reference model |

## Integration Gotchas

This project has no external integrations by design (local-only, no OAuth, no email). The relevant "integration" concerns are between internal layers.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| ORM + raw SQL | Mixing ORM queries and raw SQL for the same table | Pick one approach per table; ORMs are fine for CRUD, raw SQL for complex feed joins |
| Frontend state + server state | Frontend cache of like counts drifts from DB after concurrent actions | On re-fetch, always trust server state; optimistic updates must be reversible |
| Auth middleware + route handlers | Auth middleware sets `req.user` but route handlers don't guard against missing user | Every protected handler must check `req.user` exists before proceeding |
| Soft-delete + feed queries | Deleted tweets are excluded via `WHERE deleted_at IS NULL` but some queries forget this clause | Centralize post visibility logic in a single query helper or ORM scope |

## Performance Traps

Patterns that work at small scale but fail as usage grows. Note: Chirp is a local learning project — these thresholds are informational for understanding the concepts, not production targets.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| SELECT * on every query | No immediate symptoms; all columns returned including future large fields | SELECT only needed columns; especially important when content can be long | At 1k+ posts with no pagination |
| No LIMIT on feed queries | Full table scan returns all posts; page hangs | Always paginate; LIMIT 20 with cursor or offset | At 500+ posts in local SQLite |
| No index on `posts.user_id` | Profile page query (posts by user) slows down | Add index on foreign keys at schema creation time | At 200+ posts per user |
| No index on `follows.follower_id` | "Who am I following?" query slows | Index all FK columns used in WHERE clauses | At 100+ follow relationships |
| Counting likes with COUNT(*) on each feed row | Like counts require subquery per row | Use JOIN + GROUP BY in the main feed query | At 50+ likes per post |

## Security Mistakes

Domain-specific security issues for this type of application.

| Mistake | Risk | Prevention |
|---------|------|------------|
| No authorization check on delete tweet | Any logged-in user can delete any tweet by guessing the ID | Always verify `post.user_id === req.user.id` before DELETE; return 403 otherwise |
| No authorization check on unlike | User can unlike someone else's like by guessing like ID | Delete likes by `WHERE id = $likeId AND user_id = $currentUserId` — the AND is the guard |
| Exposing user IDs as sequential integers | Makes it trivial to enumerate all users (`/profile/1`, `/profile/2`) | For a learning project this is acceptable; production would use UUIDs or slugs |
| Storing JWT secret in source code | Secret committed to git; all tokens can be forged | Use environment variables; add `.env` to `.gitignore` before first commit |
| Missing rate limiting on post creation | Trivial to spam the feed with automated requests | For local learning project: acceptable to skip; note the gap in code comments |
| Returning password hash in user API responses | Hash is exposed to frontend; enables offline cracking | Explicitly exclude `password_hash` from all `SELECT` statements returning user objects |

## UX Pitfalls

Common user experience mistakes specific to microblogging platforms.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No character count feedback on tweet compose | User discovers limit only on submit rejection | Show live character count; visually warn at 240+/280 chars |
| Feed doesn't distinguish retweets from original posts | Everything looks identical; can't tell who said what originally | Retweets show "X retweeted" header + original author attribution |
| Reply threads are flat (no nesting indication) | Can't tell which reply is responding to which | Show parent tweet excerpt above reply; use visual indentation |
| Like/retweet counts not updating after action | User wonders if their action registered | Optimistic update on action; reflect new count immediately |
| No empty state on profile/feed | Blank page with no explanation when a new user has no posts | Show "No posts yet" message on empty feeds/profiles |
| Deleted tweets leave "ghost" slots in threads | Replies to deleted tweets show "[deleted]" parent or nothing | Display "[This post was deleted]" placeholder in thread position |

## "Looks Done But Isn't" Checklist

Things that appear complete in a demo but are missing critical pieces.

- [ ] **Auth:** Logout actually invalidates the session server-side — verify by copying the cookie and using it after logout
- [ ] **Tweets:** Delete checks ownership — verify by trying to delete another user's tweet via direct API call (not just UI)
- [ ] **Likes:** Unlike is idempotent — verify that double-clicking unlike does not throw a DB constraint error
- [ ] **Retweets:** A user cannot retweet the same post twice — verify the unique constraint on (user_id, repost_of_id)
- [ ] **Feed:** Retweets display the original author, not the retweeter, as the post author
- [ ] **Follow:** Following yourself is blocked — verify `follower_id != followee_id` constraint or application check
- [ ] **Replies:** Reply count on a post is accurate — verify it counts only direct replies, not nested replies-to-replies
- [ ] **Profile:** Post count on profile matches actual posts — verify deleted posts decrement the count (or count is computed, not cached)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Split tweet/reply/retweet tables | HIGH | Write a migration to merge tables into single-table model; update all queries; test thoroughly — this is a full data layer rewrite |
| N+1 queries in feed | LOW | Replace loop-based fetching with JOIN query; this is a query rewrite, not a schema change |
| Retweets as content copies | MEDIUM | Migration to convert copy rows to reference rows; find originals by matching content + timestamp; some data may be unrecoverable if originals were deleted |
| Weak password storage | HIGH | Force password reset for all users; re-hash on next login; cannot migrate existing hashes without plaintext |
| Follower graph as array column | HIGH | Schema migration to extract into follows table; populate from array data; update all related queries |
| No optimistic UI for likes | LOW | Frontend-only change; add local state toggle before server call; add revert on error |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Split post types into separate tables | Phase 1 (Data Modeling) | Schema review: single posts table with parent_id and repost_of_id columns |
| Plaintext/weak passwords | Phase 1 (Auth) | Code review: bcrypt/argon2 used; no raw hash in source |
| JWT misuse or bad session strategy | Phase 1 (Auth) | Test: logout + replay old cookie fails with 401 |
| N+1 feed queries | Phase 2 (Feed) | Query log: feed page loads with 1-3 queries, not 20+ |
| Follower graph incorrect model | Phase 2 (Social Graph) | Schema: dedicated follows table with follower_id/followee_id and composite PK |
| Personalized feed bad query structure | Phase 2 (Feed, after Social Graph) | Test: following feed shows only posts from followed users; query uses IN subquery or JOIN |
| Retweet as content copy | Phase 1 (Data Modeling) + Phase 3 (Retweet feature) | Schema: repost_of_id FK exists; verify retweet row has null content |
| No optimistic UI for likes | Phase 3 (Interactions) | Manual test: like count updates before server response completes |
| Authorization missing on delete/unlike | Phase 3 (Interactions) | Security test: attempt to delete/unlike as wrong user returns 403 |
| Password hash in API response | Phase 1 (Auth) + Phase 2 (User API) | Response inspection: no password_hash field in any user JSON response |

## Sources

- Training knowledge: canonical Twitter clone architecture patterns from developer community blog posts, GitHub repositories, and course materials (HIGH confidence — these pitfalls are extensively documented)
- Data modeling patterns: well-established in PostgreSQL and SQLite community resources for social graph schema design
- JWT security: documented in OWASP JWT cheat sheet and Auth0 security blog (patterns stable, HIGH confidence)
- N+1 query problem: extensively documented in ORM documentation for Sequelize, Prisma, TypeORM, and ActiveRecord
- Optimistic UI pattern: established React/frontend pattern documented in React Query, SWR, and Apollo documentation
- Note: WebSearch was unavailable during this research session; all findings are from training data (August 2025 cutoff). For a learning project of this scope and maturity, these pitfalls are stable and unlikely to have changed.

---
*Pitfalls research for: Twitter clone / microblogging platform (Chirp)*
*Researched: 2026-03-22*
