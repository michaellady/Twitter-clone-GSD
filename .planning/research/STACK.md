# Stack Research

**Domain:** Social microblogging platform (Twitter clone)
**Researched:** 2026-03-22
**Confidence:** HIGH (versions verified via npm registry)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.2.1 | Full-stack React framework | App Router provides file-based routing, Server Components, and API Routes in one package — no separate Express server needed. Eliminates the mental overhead of running two processes locally. Server Actions handle mutations (like/tweet/follow) cleanly without REST boilerplate. |
| React | 19.2.4 | UI rendering | Pairs with Next.js 16. React 19 includes stable Actions API which Server Actions in Next.js build on. |
| TypeScript | 5.9.3 | Type safety | Essential for modeling a social graph (User, Tweet, Like, Follow relations). Type errors at compile time catch impossible states like liking a tweet you don't own. |
| SQLite (via better-sqlite3) | 12.8.0 | Local database | Perfect for local-only learning projects — zero setup, single file, no server to run. Models all social graph relations (followers, likes, retweets) without the overhead of standing up PostgreSQL locally. Synchronous API simplifies reasoning during learning. |
| Drizzle ORM | 0.45.1 | Database access layer | Type-safe SQL that maps directly to schema types. Better than raw SQL for a learning project (shows ORM patterns) but thinner than Prisma (teaches you what SQL is actually running). Excellent SQLite support. Schema-first approach makes the data model explicit. |
| Tailwind CSS | 4.2.2 | Styling | Zero-config CSS, no PostCSS config file needed in v4. Utility classes eliminate context-switching between JS and CSS files. For a learning project, faster to ship UI without designing a component library. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-auth | 4.24.13 | Session-based authentication | Handles the login/logout/session cookie flow. v4 is battle-tested stable; v5 is still in beta. Use with the Credentials provider for email/password auth — no OAuth needed per project scope. Avoid re-implementing JWT/cookie handling manually. |
| bcryptjs | 3.0.3 | Password hashing | Hash passwords before storing them. Pure JavaScript (no native bindings), easy to install, widely used. Never store plaintext passwords even in a learning project — it builds bad habits. |
| Zod | 4.3.6 | Schema validation | Validate form inputs and API request bodies at runtime. Pairs with react-hook-form for form validation. Catches bad data at the boundary before it hits the database. |
| react-hook-form | 7.72.0 | Form state management | Manage tweet composition form, login/signup forms. Uncontrolled inputs with validation — minimal re-renders. Combine with `@hookform/resolvers` to use Zod schemas for validation. |
| @hookform/resolvers | 5.2.2 | Zod + react-hook-form bridge | Connects Zod schemas to react-hook-form validation. Eliminates duplicate validation logic between client and server. |
| @tanstack/react-query | 5.94.5 | Client-side data fetching/caching | Manage feed updates, optimistic UI for likes/retweets. Handles loading/error states, background refetch, and cache invalidation cleanly. Use when you need the feed to feel live without full page reloads. |
| date-fns | 4.1.0 | Date formatting | Format tweet timestamps ("2h ago", "Mar 15"). Lightweight alternative to moment.js. Tree-shakeable — import only what you use. |
| lucide-react | 0.577.0 | Icons | Heart, retweet, reply, share icons for tweet interactions. Consistent icon set, ships as React components, tree-shakeable. |
| clsx | 2.1.1 | Conditional class names | Combine Tailwind classes conditionally (e.g., liked heart = red, unliked = gray). Pairs with `tailwind-merge` to handle class conflicts. |
| tailwind-merge | 3.5.0 | Tailwind class deduplication | Resolves Tailwind class conflicts when composing components. Use together with clsx via a `cn()` utility helper. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| drizzle-kit | 0.31.10 | Schema migrations and introspection | Run `drizzle-kit push` to apply schema changes to the SQLite file during development — no migration files needed while iterating. |
| Vitest | 4.1.0 | Unit/integration testing | Vite-native test runner, fastest option for Next.js. Use for testing utility functions, validation logic, and ORM queries. Avoid over-testing UI in a learning project — focus tests on business logic. |
| @testing-library/react | 16.3.2 | Component testing | When you do test React components, use this for user-centric interaction testing. |
| ESLint | 10.1.0 | Code linting | Next.js ships with ESLint config built in (`next lint`). No additional configuration needed to start. |
| Prettier | 3.8.1 | Code formatting | Consistent formatting. Add `.prettierrc` with `tailwindcss` plugin to auto-sort Tailwind class names. |

## Installation

```bash
# Bootstrap (Next.js ships with React, TypeScript, ESLint, and Tailwind v4)
npx create-next-app@latest chirp --typescript --tailwind --eslint --app --src-dir

# Database
npm install better-sqlite3 drizzle-orm
npm install -D drizzle-kit @types/better-sqlite3

# Auth
npm install next-auth bcryptjs
npm install -D @types/bcryptjs

# Forms and validation
npm install zod react-hook-form @hookform/resolvers

# Data fetching
npm install @tanstack/react-query

# UI utilities
npm install date-fns lucide-react clsx tailwind-merge

# Dev tools
npm install -D prettier vitest @testing-library/react @vitejs/plugin-react
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| SQLite + Drizzle | PostgreSQL + Prisma | Use Postgres if the goal is production deployment or if you want to learn a more production-realistic setup. SQLite is strictly better for local-only learning. |
| SQLite + Drizzle | Prisma (with SQLite) | Prisma is fine but abstracts more SQL away. Drizzle is thinner and educational — you can see the generated SQL more easily. Use Prisma if you want faster schema iteration with less SQL knowledge. |
| next-auth v4 | Auth.js (next-auth v5) | Use v5 once it ships stable. As of March 2026 it's still beta. v4 is proven, well-documented, and sufficient for this project's email/password scope. |
| better-sqlite3 | @libsql/client (Turso) | Use libsql if you want async SQLite or plan to move toward edge deployments later. For local-only learning, better-sqlite3's synchronous API is simpler to reason about. |
| @tanstack/react-query | SWR | Both solve the same problem. TanStack Query has more features (mutations, optimistic updates, devtools). SWR is simpler. Either works — TanStack Query is more commonly taught in 2025+ tutorials. |
| Tailwind CSS v4 | shadcn/ui components | shadcn/ui is excellent but adds abstraction. For a learning project, building tweet cards and feed layouts from raw Tailwind teaches CSS fundamentals better than using pre-built components. |
| Vitest | Jest | Jest requires more configuration with Next.js. Vitest works natively with the Vite-adjacent toolchain Next.js 15+ uses. Same API, lower friction. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Express/Node.js API server | Running a separate server process adds friction (two terminals, CORS config, proxy setup) for no learning benefit. Next.js API Routes and Server Actions handle the backend. | Next.js API Routes or Server Actions |
| MongoDB / NoSQL | The social graph (followers, likes, retweets, reply threads) is inherently relational. Modeling these as document references in MongoDB creates more complexity than it solves for a learning project. | SQLite with Drizzle ORM |
| Redux / Zustand for global state | Overkill for this scope. Server Components handle most data fetching. React Query handles client cache. Local component state handles the rest. Adding a global store adds patterns without adding learning value. | React Context (if needed), or React Query cache |
| Tailwind CSS v3 | v4 is now the stable `latest`. v3 is `v3-lts`. Starting new projects on v3 requires manual PostCSS config and misses the improved performance of v4. | Tailwind CSS v4 (already default in create-next-app) |
| JWT stored in localStorage | XSS vulnerability. next-auth stores session tokens in httpOnly cookies automatically. Never store auth tokens in localStorage. | next-auth session cookies |
| moment.js | Bloated, deprecated-in-spirit, not tree-shakeable. | date-fns v4 |
| next.js Pages Router | App Router is the current standard and what Next.js 13+ documentation assumes. Pages Router is in maintenance mode. | App Router (default in create-next-app with `--app`) |

## Stack Patterns by Variant

**If you want to skip TanStack Query:**
- Use React 19's `use()` hook with Server Components for initial data load
- Use Server Actions + `router.refresh()` for mutations
- Simpler mental model, slightly less optimistic UI capability

**If the project expands to PostgreSQL later:**
- Swap `better-sqlite3` for `postgres` (node-postgres)
- Drizzle ORM supports both with near-identical schema syntax — migration is straightforward
- No other stack changes required

**If you want richer UI components without building from scratch:**
- Add shadcn/ui after initial build (run `npx shadcn@latest init`)
- Use it for modals (compose tweet dialog), toasts (liked!), and dropdowns (tweet actions menu)
- Defer this to a polish phase — don't add it upfront

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next-auth@4.24.13 | Next.js 16.x | v4 is compatible. v5 (beta) has a different import path (`auth` instead of `getServerSession`). |
| drizzle-orm@0.45.1 | better-sqlite3@12.8.0 | Use `drizzle(db)` with BetterSQLite3Database. Sync driver, no async/await needed. |
| tailwindcss@4.2.2 | Next.js 16.x | v4 uses CSS `@import "tailwindcss"` — no `tailwind.config.js` required. create-next-app handles this automatically. |
| react@19.2.4 | react-hook-form@7.72.0 | Compatible. react-hook-form v7 supports React 19. |
| zod@4.3.6 | @hookform/resolvers@5.2.2 | resolvers v5 supports Zod v4. Do not use resolvers v4 with Zod v4 — breaking change. |

## Sources

- npm registry (dist-tags and latest versions) — versions verified 2026-03-22 — HIGH confidence
- Training knowledge (Next.js App Router patterns, social graph data modeling, auth patterns) — MEDIUM confidence (verify specific APIs against Next.js 16 docs before implementation)
- next-auth v4 vs v5 status inferred from dist-tags (`v5` still at `beta` tag) — HIGH confidence

---
*Stack research for: Twitter clone / microblogging platform (Chirp)*
*Researched: 2026-03-22*
