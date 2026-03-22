# Phase 2: Core Social Loop - Context

**Gathered:** 2026-03-22 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can compose and publish tweets, delete their own, and read a live chronological feed with profile pages. No interactions (likes, replies, retweets) — those are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Tweet Composer
- **D-01:** Compose box lives at the top of the feed page, always visible above the timeline
- **D-02:** Textarea with live character counter showing remaining chars (280 max), counter changes color at 20 remaining (yellow) and 0 (red)
- **D-03:** Submit button disabled when empty or over 280 chars
- **D-04:** After successful post, textarea clears and new post appears at top of feed immediately

### Feed Layout
- **D-05:** Post cards show: author display name (or username if no display name), @username as link to profile, relative timestamp, post content, and action placeholder area (for Phase 3)
- **D-06:** Posts ordered newest-first, simple page load (no infinite scroll — offset pagination if needed)
- **D-07:** Empty feed shows friendly message: "No posts yet. Be the first to share something!"

### Delete Behavior
- **D-08:** No confirmation dialog — delete is immediate (learning project, low stakes)
- **D-09:** Post disappears from feed immediately (optimistic UI)
- **D-10:** Delete button only visible on posts owned by the current user

### Profile Page
- **D-11:** Minimal profile header: @username, post count. No bio/avatar yet (deferred to future)
- **D-12:** Below header: list of that user's posts in newest-first order, same card style as feed
- **D-13:** Navigate to profiles by clicking @username on any post in the feed

### Claude's Discretion
- Exact card styling and spacing (follow UI-SPEC patterns from Phase 1)
- Timestamp formatting (relative like "2h ago" vs absolute)
- Loading states for feed and profile
- Error handling for failed post creation/deletion

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 patterns (established)
- `chirp/src/lib/db/schema.ts` — Posts table with nullable parentId and repostOfId, users table
- `chirp/src/lib/db/client.ts` — DB singleton pattern with WAL mode
- `chirp/src/lib/auth/session.ts` — getSession() server-side helper
- `chirp/src/lib/utils.ts` — cn() utility for Tailwind class merging
- `chirp/src/lib/validations/auth.ts` — Zod validation pattern to follow for post validations
- `chirp/src/app/globals.css` — CSS variables and design tokens from UI-SPEC

### Requirements
- `.planning/REQUIREMENTS.md` — POST-01, POST-02, POST-03, PROF-01

### Research
- `.planning/research/STACK.md` — TanStack Query for client-side data fetching
- `.planning/research/ARCHITECTURE.md` — Feed architecture: fan-out on read (single SQL query)
- `.planning/research/PITFALLS.md` — N+1 query prevention, use JOIN for feed queries

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cn()` utility in `src/lib/utils.ts` — Tailwind class merging
- `getSession()` in `src/lib/auth/session.ts` — server-side session access
- `SessionProvider` in `src/components/providers/` — client-side session context
- Zod validation pattern from `src/lib/validations/auth.ts` — follow for post validation
- DB client singleton from `src/lib/db/client.ts` — reuse for all queries
- Posts table already exists in schema with all needed columns

### Established Patterns
- Route groups: `(auth)` for protected, `(public)` for guest routes
- Form pattern: react-hook-form + Zod resolver + server action/API call
- Inline error display below form fields
- CSS variables for accent color, spacing scale from globals.css

### Integration Points
- Feed page replaces placeholder at `src/app/(auth)/feed/page.tsx`
- Profile pages need new route: `src/app/(auth)/profile/[username]/page.tsx`
- Post API routes: `src/app/api/posts/route.ts` (create, list), `src/app/api/posts/[id]/route.ts` (delete)
- Nav bar needs username link to own profile

</code_context>

<specifics>
## Specific Ideas

No specific requirements — auto mode used recommended defaults for all decisions.

</specifics>

<deferred>
## Deferred Ideas

None — auto mode stayed within phase scope

</deferred>

---

*Phase: 02-core-social-loop*
*Context gathered: 2026-03-22 (auto mode)*
