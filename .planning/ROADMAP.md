# Roadmap: Chirp (Twitter Clone)

## Overview

Chirp is built in three phases, each delivering a complete vertical slice of the social platform. Phase 1 establishes the project and gets users authenticated — nothing else is possible without it. Phase 2 delivers the core social loop: users can post and read a feed, which is the minimum viable product. Phase 3 adds the interactions that make it social: likes, replies, and retweets. By the end of Phase 3, every v1 requirement is fulfilled and the full post-read-react loop is working.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Bootstrap project with correct data schema and working auth
- [x] **Phase 2: Core Social Loop** - Users can post tweets and read a chronological feed
- [x] **Phase 3: Interactions** - Users can like, reply to, retweet, and quote-tweet posts

## Phase Details

### Phase 1: Foundation
**Goal**: Users can securely create accounts and log in, with the database schema correct from the start
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. User can register a new account with email and password and be redirected to the feed
  2. User can log in and remain logged in after refreshing or closing and reopening the browser
  3. User can log out from any page and is redirected to the login screen
  4. Unauthenticated users who visit protected routes are redirected to login
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js project, install dependencies, create database schema and utilities
- [x] 01-02-PLAN.md — Build auth backend (NextAuth config, registration API, route protection)
- [x] 01-03-PLAN.md — Build auth UI (login form, signup form, placeholder feed, page routing)

### Phase 2: Core Social Loop
**Goal**: Users can compose and publish tweets, delete their own, and read a live chronological feed with profile pages
**Depends on**: Phase 1
**Requirements**: POST-01, POST-02, POST-03, PROF-01
**Success Criteria** (what must be TRUE):
  1. User can type a tweet up to 280 characters and see a live character count; submitting posts it to the feed
  2. User can delete one of their own tweets and it disappears from the feed immediately; attempting to delete another user's tweet fails
  3. User can visit the home feed and see all posts in newest-first order
  4. User can visit any user's profile page and see only that user's posts
**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md — Post API backend (install deps, Zod validation, service layer with JOIN queries, API routes, QueryProvider)
- [x] 02-02-PLAN.md — Feed and profile UI (PostCard, TweetComposer, PostFeed with optimistic delete, feed page, profile page)

### Phase 3: Interactions
**Goal**: Users can engage with posts through likes, replies, retweets, and quote-tweets, completing the social feedback loop
**Depends on**: Phase 2
**Requirements**: INTR-01, INTR-02, INTR-03, INTR-04
**Success Criteria** (what must be TRUE):
  1. User can like a post and see the like count increment immediately; unliking decrements it; the state persists on refresh
  2. User can reply to a post and the reply appears threaded beneath the original
  3. User can retweet a post and the retweet appears in the feed attributed to the original author (not a content copy)
  4. User can quote-tweet a post by adding a comment, which appears as a new post with the original embedded
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Backend services and API routes (enriched feed query, like toggle, retweet create/delete, reply create/list)
- [x] 03-02-PLAN.md — Likes and retweets UI (ActionBar, EmbeddedPost, optimistic mutations, retweet/quote display in PostCard)
- [ ] 03-03-PLAN.md — Replies and quote-tweets UI (ReplyComposer, ReplyThread, QuoteComposer, wiring into PostCard/PostFeed)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-03-22 |
| 2. Core Social Loop | 2/2 | Complete | 2026-03-22 |
| 3. Interactions | 3/3 | Complete | 2026-03-22 |
