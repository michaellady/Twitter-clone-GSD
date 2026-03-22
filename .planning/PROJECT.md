# Chirp (Twitter Clone)

## What This Is

A Twitter clone built as a learning project to understand how social platforms work under the hood. Users can sign up, post short-form text updates, and interact through likes, replies, and retweets — all running locally.

## Core Value

Users can post tweets and interact with other users' posts through a chronological feed — the core social loop of post → read → react.

## Requirements

### Validated

- ✓ User can create an account with email and password — Phase 1
- ✓ User can log in and stay logged in across browser refresh — Phase 1
- ✓ User can log out — Phase 1
- ✓ User can create a text post (tweet) — Phase 2
- ✓ User can delete their own tweets — Phase 2
- ✓ User can view a chronological feed of all tweets — Phase 2
- ✓ User can view a profile page with their tweets — Phase 2

- ✓ User can like/unlike tweets — Phase 3
- ✓ User can reply to tweets — Phase 3
- ✓ User can retweet posts — Phase 3
- ✓ User can quote-tweet posts — Phase 3

### Active
- [ ] User can follow/unfollow other users

### Out of Scope

- OAuth/social login — email/password sufficient for learning auth fundamentals
- Algorithmic/ranked feed — chronological is simpler and more predictable
- Direct messages — not part of the core post-and-interact loop
- Notifications — adds complexity without teaching core social platform mechanics
- Image/media uploads — text-only keeps scope focused
- Deployment — runs locally, no production infrastructure needed
- Search — not essential for the core learning goals
- Email verification/password reset — nice-to-have but not core

## Context

This is a solo learning project. The goal is to understand full-stack social platform architecture: auth, data modeling for social graphs, feed construction, and interactive features like likes and retweets. No users to serve, no uptime requirements — just a working local demo.

## Constraints

- **Scope**: Learning project — favor clarity and simplicity over production-hardening
- **Environment**: Runs locally only — no deployment, no CI/CD
- **Tech stack**: To be determined by research — modern 2025 stack, Claude picks

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Email/password auth only | Teaches auth fundamentals better than OAuth delegation | — Pending |
| Chronological feed | Simpler to implement, easier to reason about | — Pending |
| Text-only posts | Keeps scope focused on social mechanics, not media handling | — Pending |
| Local-only | No deployment complexity — focus on learning the code | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after Phase 3 completion — all v1 milestone phases complete*
