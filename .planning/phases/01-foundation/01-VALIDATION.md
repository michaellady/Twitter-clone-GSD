---
phase: 1
slug: foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Verification Approach

This phase uses **build-verification + human checkpoint** as its automated validation strategy.

**Rationale:** Phase 1 is a learning project foundation with 3 auth requirements (AUTH-01, AUTH-02, AUTH-03). The requirements are behavioral (register, login, logout) and are fully verified through:

1. **Automated signal:** `npx next build` in every task's `<verify>` block. A successful build confirms type correctness, import resolution, and compilation of all auth modules (schemas, API routes, middleware, components, pages). Build failure catches the most common classes of defects in a scaffolding phase.

2. **Behavioral verification:** Plan 03 Task 3 is a `checkpoint:human-verify` gate that walks through all 9 auth behaviors end-to-end (register, logout, route protection, login, session persistence, root redirect, validation errors, generic login error, duplicate registration).

Writing dedicated Vitest integration tests for auth flows that require mocking NextAuth, bcrypt, and database calls would consume significant context for minimal additional confidence beyond what build + human verification already provides. Vitest is installed and configured (vitest.config.ts) for use in later phases where unit-testable business logic emerges.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (installed, configured, ready for future phases) |
| **Config file** | `chirp/vitest.config.ts` (created in Plan 01 Task 2) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Build verification** | `npx next build` |
| **Estimated build time** | ~15-30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx next build` (automated verify in each task)
- **After Plan 03 completes:** Human checkpoint verifies all 9 auth behaviors
- **Before `/gsd:verify-work`:** Build must succeed + human checkpoint approved
- **Max feedback latency:** ~30 seconds (build time)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Automated Command | Behavioral Coverage |
|---------|------|------|-------------|-------------------|---------------------|
| P01-T1 | 01 | 1 | AUTH-01 | `npx next build` + dep count check | Project scaffolded, all deps installed |
| P01-T2 | 01 | 1 | AUTH-01 | `drizzle-kit push` + table check | Schema created, DB initialized |
| P02-T1 | 02 | 2 | AUTH-01, AUTH-02, AUTH-03 | `npx next build` | Auth config, session helper, API route, SessionProvider compile |
| P02-T2 | 02 | 2 | AUTH-01, AUTH-02, AUTH-03 | `npx next build` | Registration endpoint, route protection compile |
| P03-T1 | 03 | 3 | AUTH-01, AUTH-02 | `npx next build` | Login/signup form components compile |
| P03-T2 | 03 | 3 | AUTH-01, AUTH-02, AUTH-03 | `npx next build` | All pages, layouts, redirects compile |
| P03-T3 | 03 | 3 | AUTH-01, AUTH-02, AUTH-03 | `npx next build` + **human checkpoint** | Full auth loop verified end-to-end |

---

## Human Checkpoint Coverage (Plan 03 Task 3)

The human checkpoint covers all auth requirements with 9 explicit test steps:

| Step | Requirement | Behavior Verified |
|------|-------------|-------------------|
| 1 | AUTH-01 | Register with email/username/password, auto-redirect to /feed |
| 2 | AUTH-03 | Logout redirects to /login |
| 3 | AUTH-03 | /feed redirects to /login when unauthenticated |
| 4 | AUTH-02 | Login with email/password, redirect to /feed |
| 5 | AUTH-02 | Session persists across page refresh |
| 6 | -- | Root (/) redirects to /feed or /login based on auth state |
| 7 | D-03, D-06 | Validation errors appear inline below fields |
| 8 | D-04 | Generic "Invalid email or password" on failed login |
| 9 | AUTH-01 | Duplicate email/username returns field-specific 409 error |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists across browser close/reopen | AUTH-02 | Requires real browser session | Open app, log in, close browser tab, reopen -- should still be logged in |
| Login/signup form visual layout | AUTH-01 | Visual verification | Check centered card, wordmark, correct spacing per UI-SPEC |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands (`npx next build`)
- [x] Sampling continuity: build runs after every task
- [x] Nyquist strategy: build-verification (automated) + human checkpoint (behavioral)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (build time)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** accepted — build-verification + human checkpoint is appropriate for a 3-requirement learning project foundation phase
