# Phase 1: Foundation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Bootstrap the project with correct data schema and working authentication. Users can register, log in, stay logged in, and log out. No post creation, no feed, no interactions — just identity and project scaffolding.

</domain>

<decisions>
## Implementation Decisions

### Session Handling
- **D-01:** Sessions last 30 days before requiring re-login — standard for social apps
- **D-02:** Use cookie-based sessions (httpOnly) — next-auth default, secure against XSS

### Error Responses
- **D-03:** Auth errors displayed as inline messages below the failing form field (red text, e.g., "Email already taken")
- **D-04:** Failed login shows generic "Invalid email or password" — does not reveal whether the email exists in the system

### Registration Flow
- **D-05:** Signup form collects: email, password, and username/handle
- **D-06:** Username validation: alphanumeric + underscores only, 3-15 characters, must be unique (Twitter-style)
- **D-07:** Display name and bio are NOT collected at registration — can be added later on profile page

### Claude's Discretion
- Auth page layout and styling (login vs signup pages)
- Password strength requirements
- Avatar placeholder for new accounts
- Form validation UX (real-time vs on-submit)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in:
- `.planning/REQUIREMENTS.md` — AUTH-01, AUTH-02, AUTH-03 define acceptance criteria
- `.planning/research/STACK.md` — Next.js 16 + next-auth v4 + Drizzle + SQLite stack decisions
- `.planning/research/PITFALLS.md` — Auth pitfalls (bcrypt, JWT patterns, session strategy)
- `.planning/research/ARCHITECTURE.md` — Data model schema (users table design)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — patterns will be established in this phase

### Integration Points
- This phase creates the foundation that all subsequent phases build on
- Database schema must include columns needed by Phase 2 (posts) and Phase 3 (interactions) to avoid migrations later
- Auth middleware must protect routes that Phase 2 and 3 will add

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-22*
