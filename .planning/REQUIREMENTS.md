# Requirements: Chirp (Twitter Clone)

**Defined:** 2026-03-22
**Core Value:** Users can post tweets and interact with other users' posts through a chronological feed

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User can log in and stay logged in across browser refresh
- [x] **AUTH-03**: User can log out from any page

### Posts

- [x] **POST-01**: User can create a text post with 280-character limit
- [x] **POST-02**: User can delete their own posts
- [x] **POST-03**: User can view a chronological feed of all posts (newest first)

### Interactions

- [x] **INTR-01**: User can like/unlike any post
- [x] **INTR-02**: User can reply to any post
- [x] **INTR-03**: User can retweet a post
- [x] **INTR-04**: User can quote-tweet (retweet with added comment)

### Profile

- [x] **PROF-01**: User can view a profile page showing a user's posts

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Social Graph

- **SOCL-01**: User can follow/unfollow other users
- **SOCL-02**: User can view a following-only feed
- **SOCL-03**: User can search for users by username

### Engagement

- **ENGM-01**: User can bookmark/save posts
- **ENGM-02**: User can pin a post to their profile
- **ENGM-03**: User can view hashtag-based feeds

### Safety

- **SAFE-01**: User can block other users
- **SAFE-02**: User can mute other users

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| OAuth/social login | Learning auth fundamentals — email/password teaches from first principles |
| Algorithmic/ranked feed | Requires ML infrastructure; chronological is simpler and more transparent |
| Direct messages | High complexity (WebSocket), not part of core post-and-interact loop |
| Notifications | Adds fan-out complexity without teaching core social mechanics |
| Image/media uploads | Requires file storage infrastructure; text-only keeps scope focused |
| Email verification/password reset | Requires email delivery infrastructure; not core for local-only project |
| Real-time WebSocket updates | Turns stateless API into stateful; polling sufficient for learning |
| Full-text search | Requires search index; marginal learning value |
| Trending topics | Requires complex aggregation queries; defer entirely |
| Deployment/CI/CD | Local-only project — no production infrastructure |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| POST-01 | Phase 2 | Complete |
| POST-02 | Phase 2 | Complete |
| POST-03 | Phase 2 | Complete |
| PROF-01 | Phase 2 | Complete |
| INTR-01 | Phase 3 | Complete |
| INTR-02 | Phase 3 | Complete |
| INTR-03 | Phase 3 | Complete |
| INTR-04 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
