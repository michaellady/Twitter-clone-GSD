# Feature Research

**Domain:** Twitter clone / microblogging platform
**Researched:** 2026-03-22
**Confidence:** HIGH

This analysis draws on the well-documented feature sets of Twitter/X, Mastodon, Bluesky, Threads, and numerous open-source Twitter clones. Microblogging is one of the most studied social platform patterns — confidence is high for all categories.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User registration (email/password) | Every social platform requires an identity | LOW | bcrypt hash, JWT or session; the entry point for everything else |
| Persistent login (session / JWT) | Logging in on every page refresh is broken | LOW | Refresh tokens or cookie-based sessions; users abandon without this |
| Post creation (tweet) | The entire point of the product | LOW | 280-char limit is convention; plain text sufficient for learning project |
| Character limit enforcement | Microblogging is defined by brevity | LOW | Client + server validation; 280 chars is the established expectation |
| Chronological feed | Core content discovery loop | MEDIUM | Requires querying across users; "latest first" is the expected default |
| Like / unlike a post | Lowest-friction engagement action | LOW | Toggle; counter display; users expect immediate feedback |
| Reply to a post | Conversation threading is a microblogging fundamental | MEDIUM | Requires parent_id on posts; threaded display adds further complexity |
| Retweet / re-share | Amplification is a core social mechanic | MEDIUM | Two types exist (straight retweet vs quote-tweet); straight retweet is simpler |
| Delete own post | Basic content ownership expectation | LOW | Soft or hard delete; users feel trapped without it |
| User profile page | Identity and post history are expected together | LOW | Avatar, bio, follower counts, post list |
| Follow / unfollow users | Social graph is what makes content personal | MEDIUM | Requires followers table; enables following-only feed |
| Following feed | Personalized feed based on who you follow | MEDIUM | Depends on follow graph; users expect "my feed" to be distinct from global |
| Logout | Session termination is a basic security expectation | LOW | Clear token/cookie; redirect to login |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required for a learning project, but represent the next layer of social platform mechanics.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Quote-tweet (retweet with comment) | Enables commentary + amplification simultaneously | MEDIUM | Variant of retweet; adds a text body to the reshare; separate from straight retweet |
| Hashtag support | Topic-based discovery across the social graph | MEDIUM | Parse #tag on save; hashtag index table; hashtag feed view |
| @mentions with notification | Direct addressing creates conversation density | MEDIUM | Parse @handle on save; notification record per mention; unread count |
| User search / username lookup | Core discoverability for following new users | LOW | Simple query on username; prerequisite for organic growth |
| Trending topics | Surfaces emergent conversation | HIGH | Requires aggregation queries with time windows; expensive at scale |
| Bookmarks / saved posts | Private curation without public signal | LOW | Simple junction table; no social visibility |
| Post edit history | Transparency on edits; trust mechanism | MEDIUM | Requires version table; Bluesky and X both support this |
| Lists (curated following groups) | Power-user feature for managing high-volume follows | HIGH | Separate social graph subset; list-scoped feed query |
| Pinned post | Lets users surface their most important content | LOW | Single boolean flag on post; profile rendering change only |
| Verified / badge system | Trust signal for notable accounts | MEDIUM | Admin-controlled flag; visual indicator; no complex logic |
| Direct messages (DMs) | Private 1:1 communication | HIGH | Real-time delivery (WebSocket), separate message model, privacy concerns; explicitly out of scope for Chirp |
| Block / mute | Safety and noise control | MEDIUM | Block prevents visibility; mute hides from feed; both need relationship records |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in a learning context or social platform context generally.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Algorithmic / ranked feed | "Show me what I'll like" is appealing | Requires ML infrastructure, engagement data, and constant tuning; destroys simplicity and learning value; reduces transparency | Chronological feed with optional "popular" sort is simpler and more honest |
| OAuth / social login | "Login with Google" reduces friction | Defers understanding of auth fundamentals; adds OAuth library dependency; hides the session/token mechanic you're trying to learn | Email/password teaches auth from first principles; add OAuth later as an enhancement |
| Real-time updates (WebSocket push) | "New tweet" banners feel polished | WebSocket lifecycle adds significant complexity (connection management, reconnects, scaling); turns a stateless API into a stateful one | Polling every N seconds is sufficient for a learning demo; add WebSocket if real-time is a specific learning goal |
| Image / media uploads | Rich posts are more engaging | Requires file storage (S3 or local disk), multipart upload handling, image resizing, CDN considerations; scope explosion for no social mechanic learning | Text-only posts cover 90% of the social loop; defer media until core mechanics work |
| Email verification / password reset | "Real" apps do this | Requires email delivery infrastructure (SMTP, Mailgun, etc.); significantly extends auth phase with no new social platform learning | Skip entirely for local-only projects; or use a fake mailer (Mailhog) if email flow is a learning goal |
| Notifications (in-app) | Users expect to know when they're mentioned | Notification fan-out is architecturally complex (especially at scale); introduces async processing concerns before core mechanics are solid | Add notifications after likes/replies/retweets are working; they enhance but don't define the core loop |
| Full-text post search | "Find tweets about X" is natural | Requires full-text search index (Postgres tsvector or Elasticsearch); significant operational overhead for marginal learning value | Username lookup is simpler and covers basic discoverability; add search as a stretch goal |
| Infinite scroll / pagination via cursor | Polished UX | Cursor-based pagination is non-trivial to implement correctly; offset pagination is simpler and sufficient for a learning demo | Use offset pagination first; cursor-based is a good stretch goal once core features work |

---

## Feature Dependencies

```
[User Registration]
    └──requires──> [Persistent Login / Sessions]
                       └──enables──> [Post Creation]
                       └──enables──> [Like / Unlike]
                       └──enables──> [Reply]
                       └──enables──> [Retweet]
                       └──enables──> [Follow / Unfollow]

[Post Creation]
    └──enables──> [Chronological Feed (global)]
    └──enables──> [Like / Unlike]
    └──enables──> [Reply]
    └──enables──> [Retweet]
    └──enables──> [Delete Own Post]

[Follow / Unfollow]
    └──enables──> [Following Feed]
    └──enables──> [Follower / Following counts on Profile]

[Reply]
    └──requires──> [Post Creation]
    └──enables──> [Threaded conversation view]

[Retweet]
    └──requires──> [Post Creation]
    └──variant──> [Quote-tweet (adds body text)]

[User Profile]
    └──requires──> [User Registration]
    └──enhanced-by──> [Follow / Unfollow]
    └──enhanced-by──> [Post Creation] (shows user's posts)

[@mentions]
    └──requires──> [Post Creation]
    └──enhanced-by──> [Notifications] (mention alerts)

[Hashtags]
    └──requires──> [Post Creation]
    └──enhanced-by──> [Hashtag feed / search]

[Notifications]
    └──requires──> [Like / Unlike] (or Reply, Retweet, Mention)
    └──requires──> [Follow / Unfollow]
```

### Dependency Notes

- **Post Creation requires Auth:** Every write action requires a verified user identity. Auth must be phase 1.
- **Following Feed requires Follow Graph:** The personalized feed is meaningless without the social graph. Follow/unfollow must exist first.
- **Reply requires Post Creation:** Replies are posts with a `parent_id`; the post data model must support this before replies work.
- **Retweet requires Post Creation:** Retweets reference an original post; post model must exist first.
- **Notifications enhance, not require:** Notifications make likes/replies more visible but the core loop works without them. Safe to defer.
- **Quote-tweet conflicts with simple Retweet model:** A straight retweet is a pointer to another post. A quote-tweet is a new post with an embedded reference. Mixing both requires careful data modeling — pick one or model both upfront.

---

## MVP Definition

### Launch With (v1)

Minimum viable product for the Chirp learning project — validates the core social loop.

- [ ] User registration (email + password) — identity foundation; nothing else works without it
- [ ] Persistent login / logout — makes the app usable across sessions
- [ ] Post creation with 280-char limit — the core action of the product
- [ ] Delete own post — basic content ownership; users feel trapped without it
- [ ] Chronological global feed — content discovery; validates the post-read loop
- [ ] Like / unlike a post — lowest-friction engagement; closes the react loop
- [ ] Reply to a post — enables conversation; distinguishes social platform from broadcast
- [ ] Retweet (straight retweet) — amplification mechanic; completes the core three interactions
- [ ] User profile page with post history — identity + content history
- [ ] Follow / unfollow other users — builds the social graph
- [ ] Following feed — personalized view; validates the social graph payoff

### Add After Validation (v1.x)

Features to add once core mechanics work and learning goals are confirmed.

- [ ] Quote-tweet — enrich retweet mechanic once base retweet works
- [ ] Pinned post — simple addition that makes profiles feel more complete
- [ ] User search by username — discoverability; low complexity, high value
- [ ] Bookmarks — private curation; no social side effects, easy to add

### Future Consideration (v2+)

Defer until core social loop is solid and these become specific learning goals.

- [ ] Hashtags — adds discovery layer; medium complexity; good stretch goal
- [ ] @mentions with notifications — enhances conversation density; async complexity
- [ ] Block / mute — important for real products; adds safety layer; medium complexity
- [ ] Pagination improvements (cursor-based) — good deep-dive into API design patterns
- [ ] Real-time updates (WebSocket) — excellent learning exercise; not needed for demo

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User registration | HIGH | LOW | P1 |
| Persistent login | HIGH | LOW | P1 |
| Post creation | HIGH | LOW | P1 |
| Chronological feed | HIGH | MEDIUM | P1 |
| Like / unlike | HIGH | LOW | P1 |
| Reply | HIGH | MEDIUM | P1 |
| Retweet (straight) | HIGH | MEDIUM | P1 |
| Delete own post | HIGH | LOW | P1 |
| User profile page | HIGH | LOW | P1 |
| Follow / unfollow | HIGH | MEDIUM | P1 |
| Following feed | HIGH | MEDIUM | P1 |
| Logout | HIGH | LOW | P1 |
| Quote-tweet | MEDIUM | MEDIUM | P2 |
| User search | MEDIUM | LOW | P2 |
| Pinned post | LOW | LOW | P2 |
| Bookmarks | MEDIUM | LOW | P2 |
| Hashtags | MEDIUM | MEDIUM | P2 |
| @mentions | MEDIUM | MEDIUM | P2 |
| Notifications | MEDIUM | HIGH | P3 |
| Block / mute | MEDIUM | MEDIUM | P3 |
| Real-time updates | LOW | HIGH | P3 |
| Trending topics | LOW | HIGH | P3 |
| Lists | LOW | HIGH | P3 |
| Media uploads | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — core social loop is incomplete without it
- P2: Should have — adds meaningful depth, reasonable cost
- P3: Nice to have — valuable but significant complexity or out of scope for learning goals

---

## Competitor Feature Analysis

The learning project context (Chirp) means "competitors" are reference implementations to learn from, not products to beat.

| Feature | Twitter/X | Mastodon | Bluesky | Chirp (our approach) |
|---------|-----------|----------|---------|----------------------|
| Auth | OAuth, passkeys, 2FA | Local accounts + federation | DID-based decentralized identity | Email/password only — teaches fundamentals |
| Feed algorithm | Algorithmic "For You" + Following | Chronological (with boosts) | Algorithmic + chronological toggle | Chronological — simpler to reason about |
| Post limit | 280 chars (25K for premium) | 500 chars default (configurable) | 300 chars | 280 chars — establishes microblogging discipline |
| Media | Images, video, GIFs, polls | Images, video, audio | Images, video | Text-only — keeps scope on social mechanics |
| Retweet types | Retweet + Quote Tweet | Boost (no quote) | Repost + Quote Post | Straight retweet first; quote as stretch |
| Replies | Threaded, nested | Threaded | Threaded | Flat or 1-level thread sufficient for learning |
| DMs | Yes (encrypted) | Yes | Yes | Out of scope |
| Notifications | Yes (full suite) | Yes | Yes | Out of scope for v1 |
| Search | Full-text + hashtags | Hashtags + user search | Full-text | Username search only if added |
| Hashtags | Yes | Yes | Labels (not hashtags) | Optional stretch goal |
| Federation | No | ActivityPub | AT Protocol | Not applicable (local only) |

---

## Sources

- Twitter/X product feature set: well-documented public knowledge, extensively analyzed in software engineering literature and open-source clone tutorials (HIGH confidence from training data through Aug 2025)
- Mastodon feature set: open-source codebase and documentation (HIGH confidence)
- Bluesky / AT Protocol feature set: public documentation and product announcements (HIGH confidence)
- Threads (Meta) feature set: product launch and feature rollout coverage (MEDIUM confidence — product evolving rapidly)
- Open-source Twitter clone tutorials and reference implementations (Rails, Django, Next.js, etc.): established learning corpus (HIGH confidence)
- PROJECT.md (Chirp): defines explicit out-of-scope decisions that inform anti-feature categorization

---

*Feature research for: Twitter clone / microblogging platform (Chirp learning project)*
*Researched: 2026-03-22*
