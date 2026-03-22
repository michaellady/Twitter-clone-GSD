# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 01-Foundation
**Areas discussed:** Session handling, Error responses, Registration flow

---

## Session Handling

| Option | Description | Selected |
|--------|-------------|----------|
| 30 days (Recommended) | Standard for social apps — users stay logged in for a month | ✓ |
| 7 days | Re-login weekly — slightly more secure | |
| Never expire | Stay logged in until explicit logout | |

**User's choice:** 30 days
**Notes:** None — straightforward choice

---

## Error Responses

### Error Display Style

| Option | Description | Selected |
|--------|-------------|----------|
| Inline messages | Red text below the form field that failed | ✓ |
| Toast/banner | Pop-up notification at top of screen | |
| You decide | Claude picks the best approach | |

**User's choice:** Inline messages

### Login Failure Messaging

| Option | Description | Selected |
|--------|-------------|----------|
| Generic message | "Invalid email or password" — doesn't reveal if account exists | ✓ |
| Specific messages | "No account with that email" / "Wrong password" — more helpful but leaks info | |
| You decide | Claude picks based on learning project context | |

**User's choice:** Generic message — security-conscious even for a learning project

---

## Registration Flow

### Signup Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Email + password | Minimum viable — just credentials | ✓ |
| Username/handle | Like @username — needed for profile URLs | ✓ |
| Display name | Full name shown on posts | |
| Bio | Short about-me text | |

**User's choice:** Email, password, and username. Display name and bio deferred to profile page.

### Username Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Twitter-style (Recommended) | Alphanumeric + underscores, 3-15 chars, unique | ✓ |
| Minimal | Just unique and non-empty | |
| You decide | Claude picks sensible defaults | |

**User's choice:** Twitter-style validation

---

## Claude's Discretion

- Auth page layout and styling
- Password strength requirements
- Avatar placeholder design
- Form validation UX timing

## Deferred Ideas

None — discussion stayed within phase scope
