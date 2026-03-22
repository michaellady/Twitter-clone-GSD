---
phase: 2
slug: core-social-loop
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-22
---

# Phase 2 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Verification Approach

This phase uses **build-verification + human checkpoint** as its automated validation strategy.

**Rationale:** Phase 2 is a learning project social loop with 4 requirements (POST-01, POST-02, POST-03, PROF-01). The requirements are behavioral (compose, delete, feed, profile) and are fully verified through:

1. **Automated signal:** `npx tsc --noEmit` and `npx next build` in every task's `<verify>` block. A successful build confirms type correctness, import resolution, and compilation of all post modules (validations, services, API routes, components, pages). Build failure catches the most common classes of defects: missing imports, type mismatches, broken JSX, and invalid route structures.

2. **Behavioral verification:** Plan 02 Task 4 is a `checkpoint:human-verify` gate that walks through all 10 verification steps end-to-end (compose box, character counter, post creation, post card display, feed ordering, empty states, delete from feed, delete from profile, profile navigation, nav bar links).

Writing dedicated Vitest integration tests for post CRUD flows that require mocking database state, session cookies, and API route handlers would consume significant context for minimal additional confidence beyond what build + human verification already provides. The service layer functions (`createPost`, `deletePost`, `getFeedPosts`, etc.) use synchronous Drizzle queries against SQLite -- their correctness is validated behaviorally through the human checkpoint which exercises the full stack.

Vitest is installed and configured (`chirp/vitest.config.ts`) and will be used in future phases where unit-testable business logic with complex edge cases emerges (e.g., like toggling, reply threading, retweet attribution).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (installed, configured) |
| **Config file** | `chirp/vitest.config.ts` |
| **Quick run command** | `cd chirp && npx vitest run --reporter=verbose` |
| **Build verification** | `cd chirp && npx tsc --noEmit && npx next build` |
| **Estimated build time** | ~15-30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (type check) and/or `npx next build` (full build)
- **After Plan 02 completes:** Human checkpoint verifies all 10 behavioral steps
- **Before `/gsd:verify-work`:** Build must succeed + human checkpoint approved
- **Max feedback latency:** ~30 seconds (build time)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Automated Command | Behavioral Coverage |
|---------|------|------|-------------|-------------------|---------------------|
| P01-T1 | 01 | 1 | POST-01, POST-03, PROF-01 | `npx tsc --noEmit` + dep install check | Zod validation schema, service layer with JOIN queries, FeedPost type |
| P01-T2 | 01 | 1 | POST-01, POST-02, POST-03 | `npx tsc --noEmit` + `npx next build` | API routes (GET/POST/DELETE), QueryProvider, auth checks |
| P02-T1 | 02 | 2 | POST-01, POST-02 | `npx tsc --noEmit` | PostCard with owner-only delete, TweetComposer with character counter |
| P02-T2 | 02 | 2 | POST-01, POST-02, POST-03 | `npx tsc --noEmit` + `npx next build` | PostFeed with optimistic delete + error handling, NavBar, feed page |
| P02-T3 | 02 | 2 | POST-02, PROF-01 | `npx tsc --noEmit` + `npx next build` | ProfilePostList with delete, profile page, loading skeleton |
| P02-T4 | 02 | 2 | POST-01, POST-02, POST-03, PROF-01 | **human checkpoint** | Full social loop verified end-to-end (10 steps) |

---

## Human Checkpoint Coverage (Plan 02 Task 4)

The human checkpoint covers all post/profile requirements with 10 explicit test steps:

| Step | Requirement | Behavior Verified |
|------|-------------|-------------------|
| 1 | -- | Log in with test account |
| 2 | POST-01, D-01, D-02, D-03 | Compose box visible, character counter (yellow at 20, red at 0), disabled when empty/over |
| 3 | POST-01, D-04 | Create post, textarea clears, post appears at top |
| 4 | D-05 | Post card shows display name, @username link, relative timestamp, content |
| 5 | POST-03, D-06 | Feed shows posts newest-first |
| 6 | D-07 | Empty feed message: "No posts yet. Be the first to share something!" |
| 7 | POST-02, D-08, D-09, D-10 | Delete from feed: immediate, no confirmation, owner-only |
| 8 | PROF-01, D-11, D-12, D-13, POST-02 | Profile page: @username header, post count, filtered posts, delete from profile works |
| 9 | PROF-01 | Empty profile message for user with no posts |
| 10 | -- | Nav bar @username links to own profile |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Optimistic delete visual feedback | D-09 | Requires visual confirmation of instant removal | Delete a post and verify it disappears without page refresh |
| Character counter color transitions | D-02 | Visual verification of color changes | Type to 260 chars (yellow), then to 280+ (red) |
| Profile page for unknown user | PROF-01 | Requires navigating to non-existent username | Visit /profile/nonexistentuser123 -- should show 404 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands (`npx tsc --noEmit` and/or `npx next build`)
- [x] Sampling continuity: build runs after every task
- [x] Nyquist strategy: build-verification (automated) + human checkpoint (behavioral)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (build time)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** accepted -- build-verification + human checkpoint is appropriate for a 4-requirement learning project social loop phase, consistent with the Phase 1 validation strategy
