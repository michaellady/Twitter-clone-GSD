# Phase 1: Foundation - Research

**Researched:** 2026-03-22
**Domain:** Authentication, Database Schema, Next.js App Router Scaffolding
**Confidence:** HIGH

## Summary

Phase 1 bootstraps the Chirp project from zero: scaffold a Next.js 16 App Router project, define the complete database schema using Drizzle ORM with SQLite (better-sqlite3), and implement email/password authentication via next-auth v4 with the Credentials provider. Users must be able to register, log in, stay logged in across browser refresh (30-day cookie sessions), and log out.

A critical discovery during research is that **Next.js 16 renames `middleware.ts` to `proxy.ts`** with `export function proxy()`. This affects how next-auth v4's route protection is wired up. The re-export pattern changes from `export { default } from "next-auth/middleware"` to `export { default as proxy } from "next-auth/middleware"`. The latest next-auth v4.24.13 officially supports Next.js 16 in its peer dependencies.

The database schema must be designed to support all three phases upfront (users, posts with nullable parent_id and repost_of_id, likes, follows) to avoid migrations later. Only the users table is actively used in Phase 1, but the full schema is created now per the architecture decisions.

**Primary recommendation:** Use `create-next-app@latest` with `--typescript --tailwind --eslint --app --src-dir`, add Drizzle + better-sqlite3 + next-auth v4.24.13 + bcryptjs, define the full schema in one file, and use `drizzle-kit push` for schema application. Wire auth through `app/api/auth/[...nextauth]/route.ts` with `getServerSession` for server components and a `SessionProvider` client wrapper for client components. Route protection via `proxy.ts` with the next-auth re-export.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Sessions last 30 days before requiring re-login -- standard for social apps
- **D-02:** Use cookie-based sessions (httpOnly) -- next-auth default, secure against XSS
- **D-03:** Auth errors displayed as inline messages below the failing form field (red text, e.g., "Email already taken")
- **D-04:** Failed login shows generic "Invalid email or password" -- does not reveal whether the email exists in the system
- **D-05:** Signup form collects: email, password, and username/handle
- **D-06:** Username validation: alphanumeric + underscores only, 3-15 characters, must be unique (Twitter-style)
- **D-07:** Display name and bio are NOT collected at registration -- can be added later on profile page

### Claude's Discretion
- Auth page layout and styling (login vs signup pages)
- Password strength requirements
- Avatar placeholder for new accounts
- Form validation UX (real-time vs on-submit)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create account with email and password | next-auth v4 Credentials provider with bcryptjs hashing, Drizzle users table schema, Zod validation for registration form, signup API route |
| AUTH-02 | User can log in and stay logged in across browser refresh | next-auth v4 JWT session strategy with 30-day maxAge, httpOnly cookie, SessionProvider wrapper for client components, getServerSession for server components |
| AUTH-03 | User can log out from any page | next-auth signOut() client function, proxy.ts route protection redirects unauthenticated users to login |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- GSD workflow enforcement: use `/gsd:execute-phase` for planned phase work, not direct repo edits
- Stack locked: Next.js 16 + SQLite (better-sqlite3) + Drizzle ORM + next-auth v4 + Tailwind v4 + TanStack Query
- Schema: Single posts table with nullable parent_id (replies) and repost_of_id (retweets) -- must not be split
- Auth: bcrypt + HTTP-only cookie sessions via next-auth v4 Credentials provider
- Learning project: favor clarity and simplicity over production-hardening
- Local-only: no deployment, no CI/CD

## Standard Stack

### Core (Phase 1 specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | Full-stack framework | App Router, Server Components, API Routes, proxy.ts for route interception |
| React | 19.2.4 | UI rendering | Shipped with Next.js 16, stable Actions API |
| TypeScript | 5.9.3 | Type safety | Models user/post/auth types at compile time |
| better-sqlite3 | 12.8.0 | SQLite driver | Synchronous API, zero-config local DB, single file |
| drizzle-orm | 0.45.1 | Database ORM | Type-safe schema-first SQL, excellent SQLite support |
| drizzle-kit | 0.31.10 | Schema tooling | `drizzle-kit push` applies schema to SQLite without migration files |
| next-auth | 4.24.13 | Authentication | Credentials provider, JWT sessions, httpOnly cookies. v4.24.13 officially supports Next.js 16 (peer dep `^16`) |
| bcryptjs | 3.0.3 | Password hashing | Pure JS bcrypt, no native bindings, hash + compare |
| Zod | 4.3.6 | Schema validation | Validate registration/login form data at the boundary |
| react-hook-form | 7.72.0 | Form management | Uncontrolled inputs with validation for login/signup forms |
| @hookform/resolvers | 5.2.2 | Zod + RHF bridge | Connects Zod schemas to react-hook-form. Resolvers v5 required for Zod v4 |
| Tailwind CSS | 4.2.2 | Styling | Zero-config in v4, ships with create-next-app |
| clsx | 2.1.1 | Conditional classes | Error state styling on form fields |
| tailwind-merge | 3.5.0 | Class deduplication | Build cn() utility for component composition |

### Version Verification

All versions verified against npm registry on 2026-03-22. Versions match STACK.md exactly.

### Installation

```bash
# Bootstrap project
npx create-next-app@latest chirp --typescript --tailwind --eslint --app --src-dir

cd chirp

# Database
npm install better-sqlite3 drizzle-orm
npm install -D drizzle-kit @types/better-sqlite3

# Auth
npm install next-auth@4.24.13 bcryptjs
npm install -D @types/bcryptjs

# Forms and validation
npm install zod react-hook-form @hookform/resolvers

# UI utilities
npm install clsx tailwind-merge

# Dev tools
npm install -D vitest @vitejs/plugin-react
```

**Note:** TanStack Query, date-fns, lucide-react, and @testing-library/react are NOT needed in Phase 1. Install them in Phase 2/3 when feed and interactions are built.

## Architecture Patterns

### Recommended Project Structure (Phase 1)

```
src/
  app/
    (auth)/                    # Route group for authenticated pages
      layout.tsx               # Auth-gated layout (redirects if no session)
      feed/
        page.tsx               # Placeholder feed page (post-login landing)
    (public)/                  # Route group for public pages
      login/
        page.tsx               # Login form
      signup/
        page.tsx               # Registration form
    api/
      auth/
        [...nextauth]/
          route.ts             # NextAuth API route handler
      register/
        route.ts               # Registration endpoint (POST)
    layout.tsx                 # Root layout with Providers wrapper
    page.tsx                   # Root redirect (to /feed or /login)
  components/
    auth/
      LoginForm.tsx            # Login form component
      SignupForm.tsx            # Registration form component
    providers/
      SessionProvider.tsx       # "use client" wrapper for next-auth SessionProvider
  lib/
    auth/
      auth-options.ts          # NextAuth configuration (authOptions export)
      session.ts               # getServerSession helper
    db/
      schema.ts                # Full Drizzle schema (all tables for all phases)
      client.ts                # Database connection singleton
    validations/
      auth.ts                  # Zod schemas for login/signup
    utils.ts                   # cn() utility (clsx + tailwind-merge)
  proxy.ts                     # Route protection (next-auth re-export)
drizzle.config.ts              # Drizzle-kit configuration
.env.local                     # NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL
```

### Pattern 1: NextAuth v4 Route Handler (App Router)

**What:** next-auth v4 uses a catch-all route handler in `app/api/auth/[...nextauth]/route.ts`. Auth options are defined separately for reuse with `getServerSession`.

**Source:** [next-auth.js.org/configuration/initialization](https://next-auth.js.org/configuration/initialization)

```typescript
// src/lib/auth/auth-options.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .get();

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (D-01)
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.username as string;
      }
      return session;
    },
  },
};
```

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Pattern 2: proxy.ts for Route Protection (Next.js 16)

**What:** Next.js 16 renamed `middleware.ts` to `proxy.ts`. The exported function must be named `proxy` (or be a default export). next-auth v4's middleware re-export must be adapted.

**Source:** [nextjs.org/docs/app/api-reference/file-conventions/proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

```typescript
// src/proxy.ts
export { default as proxy } from "next-auth/middleware";

export const config = {
  matcher: [
    // Protect all routes except public ones
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)",
  ],
};
```

**CRITICAL:** The function export must be named `proxy`, not `middleware`. This is the most common migration error.

### Pattern 3: SessionProvider Client Wrapper

**What:** next-auth's `SessionProvider` uses React Context, which only works in client components. Create a `"use client"` wrapper component.

**Source:** [github.com/nextauthjs/next-auth/issues/7760](https://github.com/nextauthjs/next-auth/issues/7760)

```typescript
// src/components/providers/SessionProvider.tsx
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

```typescript
// src/app/layout.tsx (root layout - server component)
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

### Pattern 4: getServerSession in Server Components

**What:** In server components and route handlers, use `getServerSession` with `authOptions` instead of `useSession`.

```typescript
// In any server component or route handler
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  // ... render page
}
```

### Pattern 5: Drizzle Schema with SQLite

**What:** Define the full schema upfront. Use `integer` with `primaryKey({ autoIncrement: true })` for IDs, `text` for strings, and proper constraints.

**Source:** [orm.drizzle.team/docs/column-types/sqlite](https://orm.drizzle.team/docs/column-types/sqlite)

```typescript
// src/lib/db/schema.ts
import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex("email_idx").on(table.email),
  uniqueIndex("username_idx").on(table.username),
]);

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content"),  // nullable: null content + repostOfId = pure retweet
  parentId: integer("parent_id").references(() => posts.id),  // nullable: non-null = reply
  repostOfId: integer("repost_of_id").references(() => posts.id),  // nullable: non-null = retweet
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  index("posts_user_id_idx").on(table.userId),
  index("posts_parent_id_idx").on(table.parentId),
  index("posts_created_at_idx").on(table.createdAt),
]);

export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex("likes_user_post_idx").on(table.userId, table.postId),
]);

export const follows = sqliteTable("follows", {
  followerId: integer("follower_id").notNull().references(() => users.id),
  followeeId: integer("followee_id").notNull().references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followeeId] }),
]);
```

```typescript
// src/lib/db/client.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("chirp.db");
sqlite.pragma("journal_mode = WAL");  // Better concurrent read performance
sqlite.pragma("foreign_keys = ON");   // Enforce FK constraints (off by default in SQLite)

export const db = drizzle(sqlite, { schema });
```

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "chirp.db",
  },
});
```

### Pattern 6: Registration API Route with Validation

**What:** Separate registration route that validates input with Zod, checks uniqueness, hashes password, and creates user.

```typescript
// src/lib/validations/auth.ts
import { z } from "zod";

export const signupSchema = z.object({
  email: z.email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(15, "Username must be at most 15 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
```

```typescript
// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const result = signupSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, username, password } = result.data;

  // Check if email or username already taken
  const existing = db
    .select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .get();

  if (existing) {
    const field = existing.email === email ? "email" : "username";
    return NextResponse.json(
      { error: { [field]: [`This ${field} is already taken`] } },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  db.insert(users).values({ email, username, passwordHash }).run();

  return NextResponse.json({ success: true }, { status: 201 });
}
```

### Anti-Patterns to Avoid

- **Using `middleware.ts` instead of `proxy.ts`:** Next.js 16 deprecated middleware.ts. Will show a deprecation warning or break.
- **Storing JWT secret as string literal:** Use `NEXTAUTH_SECRET` env var. Generate with `openssl rand -base64 32`.
- **Calling `jwt.decode()` instead of `jwt.verify()`:** next-auth handles this internally, but if customizing, always verify.
- **Returning `password_hash` in session/API responses:** Explicitly exclude from all SELECT statements returning user data.
- **Using `SessionProvider` directly in root layout.tsx:** Must wrap in `"use client"` component first.
- **Forgetting `sqlite.pragma("foreign_keys = ON")`:** SQLite disables FK enforcement by default.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash functions, MD5, SHA | bcryptjs `hash()` / `compare()` | Timing-safe comparison, salt handling, work factor built in |
| Session management | Custom JWT signing/cookie handling | next-auth v4 with Credentials provider | Handles token rotation, cookie security flags, CSRF protection |
| Route protection | Custom auth checks in every page | proxy.ts with next-auth middleware re-export | Centralizes auth gate, runs before route rendering |
| Form validation | Manual if/else chains on input | Zod schemas + react-hook-form + resolvers | Type-safe, reusable between client and server, error messages for free |
| Database connection | Raw better-sqlite3 queries everywhere | Drizzle ORM with typed schema | Type safety, query builder prevents SQL injection, schema serves as documentation |
| Class name composition | String concatenation for Tailwind | cn() from clsx + tailwind-merge | Handles conditional classes and deduplicates conflicting Tailwind utilities |

## Common Pitfalls

### Pitfall 1: middleware.ts vs proxy.ts (Next.js 16 Breaking Change)

**What goes wrong:** Developer creates `middleware.ts` with `export function middleware()` following older tutorials. Next.js 16 ignores it or shows deprecation warnings. Route protection silently fails.
**Why it happens:** Most tutorials and the next-auth docs still reference `middleware.ts`. Next.js 16 renamed it to `proxy.ts`.
**How to avoid:** Use `proxy.ts` at project root (or `src/proxy.ts` with src dir). Export function named `proxy` or as default.
**Warning signs:** Routes that should be protected are accessible without login. No proxy-related logs in terminal.

### Pitfall 2: next-auth v4 Peer Dependency with Next.js 16

**What goes wrong:** `npm install next-auth` fails with peer dependency error because older v4 versions only support up to Next.js 15.
**Why it happens:** Only next-auth v4.24.12+ added `^16` to peer dependencies.
**How to avoid:** Explicitly install `next-auth@4.24.13` (latest v4). Do NOT use v5 (still beta).
**Warning signs:** npm ERESOLVE error mentioning next peer dependency.

### Pitfall 3: SQLite Foreign Keys Disabled by Default

**What goes wrong:** Insert a post with a non-existent `user_id` and SQLite accepts it silently. Data integrity violations accumulate.
**Why it happens:** SQLite disables foreign key enforcement by default for backwards compatibility.
**How to avoid:** Run `sqlite.pragma("foreign_keys = ON")` immediately after opening the database connection.
**Warning signs:** Invalid references in the database, orphaned rows, no errors on bad inserts.

### Pitfall 4: Revealing Email Existence on Login Failure

**What goes wrong:** Login error says "No account found with this email" -- reveals whether an email is registered.
**Why it happens:** Different error messages for "user not found" vs "wrong password".
**How to avoid:** Per D-04, always return generic "Invalid email or password" regardless of which part failed.
**Warning signs:** Login errors that distinguish between invalid email and invalid password.

### Pitfall 5: better-sqlite3 Synchronous API in Async Contexts

**What goes wrong:** Developer wraps synchronous better-sqlite3 calls in `await` unnecessarily, or expects async behavior. Or worse, the event loop is blocked on long operations.
**Why it happens:** Most Node.js database drivers are async. better-sqlite3 is synchronous by design.
**How to avoid:** Call `.get()`, `.all()`, `.run()` without await. Drizzle ORM abstracts this -- its methods are synchronous with better-sqlite3 but the API uses `.then()` for consistency. For route handlers (which are async), this is fine -- the sync call blocks only the current request.
**Warning signs:** Unnecessary async/await wrappers around DB calls, confusion about return types.

### Pitfall 6: Not Creating Full Schema Upfront

**What goes wrong:** Only the `users` table is created in Phase 1. Phase 2 requires adding posts, likes, follows tables, leading to migration headaches.
**Why it happens:** "We'll add tables when we need them" seems pragmatic.
**How to avoid:** Per CONTEXT.md, create the full schema (users, posts, likes, follows) in Phase 1. Use `drizzle-kit push` to apply -- no migration files needed during development.
**Warning signs:** Phase 2 starts with schema changes before any feature work.

### Pitfall 7: Zod v4 with @hookform/resolvers v4

**What goes wrong:** Form validation throws runtime errors because resolvers v4 is not compatible with Zod v4.
**Why it happens:** Zod v4 introduced breaking changes. Only @hookform/resolvers v5+ supports it.
**How to avoid:** Install `@hookform/resolvers@5.2.2` (not v4). Confirmed compatible with Zod v4.3.6.
**Warning signs:** "Cannot read property" errors in form validation, type mismatches.

## Code Examples

### cn() Utility

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Environment Variables

```bash
# .env.local
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=chirp.db
```

### Logout Pattern (Client Component)

```typescript
"use client";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })}>
      Log out
    </button>
  );
}
```

### Protecting Server Components

```typescript
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <>{children}</>;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `export function middleware()` | `proxy.ts` with `export function proxy()` | Next.js 16.0.0 (2025) | Must use new file name and export; old name deprecated |
| `skipMiddlewareUrlNormalize` config flag | `skipProxyUrlNormalize` | Next.js 16.0.0 | Config flag renamed |
| Edge Runtime for middleware | Node.js runtime for proxy (only option) | Next.js 16.0.0 | No longer configurable; proxy always runs on Node.js |
| next-auth v4 supports up to Next.js 15 | v4.24.12+ supports Next.js 16 | v4.24.12 release | Must use 4.24.12 or later for clean install |
| Zod v3 + @hookform/resolvers v3-4 | Zod v4 + @hookform/resolvers v5 | 2025 | Breaking change; resolvers v5 required for Zod v4 |
| Drizzle `drizzle-kit generate:sqlite` | `drizzle-kit push` (no migration files) | Drizzle 0.28+ | Simpler for development; push directly applies schema |

## Open Questions

1. **Drizzle ORM sync vs async with better-sqlite3**
   - What we know: better-sqlite3 is synchronous. Drizzle's API returns results directly when using the better-sqlite3 driver.
   - What's unclear: Whether `.get()` returns the value directly or a Promise-like wrapper in the latest Drizzle 0.45.x.
   - Recommendation: Test during implementation. If Drizzle wraps results, use `await` for safety; the overhead is negligible.

2. **next-auth v4 `withAuth` wrapper in proxy.ts**
   - What we know: The simple re-export pattern `export { default as proxy } from "next-auth/middleware"` works.
   - What's unclear: Whether the `withAuth` wrapper (for custom logic like role checking) works with the proxy rename.
   - Recommendation: Start with the simple re-export. Custom logic can be added in the proxy function body if needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | Yes | v25.8.0 | -- |
| npm | Package management | Yes | 11.11.0 | -- |
| npx | create-next-app | Yes | 11.11.0 | -- |
| SQLite | Database (via better-sqlite3) | Yes | Bundled with better-sqlite3 | -- |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | None -- Wave 0 must create `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User can register with email/password | integration | `npx vitest run src/__tests__/auth/register.test.ts -t "register" --reporter=verbose` | Wave 0 |
| AUTH-01 | Registration rejects duplicate email | integration | `npx vitest run src/__tests__/auth/register.test.ts -t "duplicate" --reporter=verbose` | Wave 0 |
| AUTH-01 | Registration validates username format (D-06) | unit | `npx vitest run src/__tests__/validations/auth.test.ts -t "username" --reporter=verbose` | Wave 0 |
| AUTH-02 | User can log in with valid credentials | integration | `npx vitest run src/__tests__/auth/login.test.ts -t "login" --reporter=verbose` | Wave 0 |
| AUTH-02 | Session persists (JWT with 30-day maxAge) | unit | `npx vitest run src/__tests__/auth/session.test.ts -t "session" --reporter=verbose` | Wave 0 |
| AUTH-03 | User can log out | integration | `npx vitest run src/__tests__/auth/logout.test.ts --reporter=verbose` | Wave 0 |
| AUTH-03 | Unauthenticated user redirected to login | integration | `npx vitest run src/__tests__/auth/protection.test.ts --reporter=verbose` | Wave 0 |
| -- | Password hashed with bcrypt | unit | `npx vitest run src/__tests__/auth/password.test.ts --reporter=verbose` | Wave 0 |
| -- | Generic error on failed login (D-04) | unit | `npx vitest run src/__tests__/auth/login.test.ts -t "generic error" --reporter=verbose` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` -- Vitest configuration with Next.js/React support
- [ ] `src/__tests__/auth/register.test.ts` -- Registration flow tests
- [ ] `src/__tests__/auth/login.test.ts` -- Login flow and error message tests
- [ ] `src/__tests__/auth/logout.test.ts` -- Logout flow test
- [ ] `src/__tests__/auth/session.test.ts` -- Session configuration tests
- [ ] `src/__tests__/auth/protection.test.ts` -- Route protection tests
- [ ] `src/__tests__/auth/password.test.ts` -- bcrypt hashing verification
- [ ] `src/__tests__/validations/auth.test.ts` -- Zod schema validation tests
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react` -- test runner

## Sources

### Primary (HIGH confidence)
- [nextjs.org/docs/app/api-reference/file-conventions/proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- proxy.ts API reference, confirmed middleware.ts deprecated in v16
- [npm registry](https://www.npmjs.com/) -- All package versions verified 2026-03-22
- [orm.drizzle.team/docs/column-types/sqlite](https://orm.drizzle.team/docs/column-types/sqlite) -- SQLite column types and constraints
- [orm.drizzle.team/docs/indexes-constraints](https://orm.drizzle.team/docs/indexes-constraints) -- Unique, FK, composite PK, CHECK constraints
- [orm.drizzle.team/docs/get-started/sqlite-new](https://orm.drizzle.team/docs/get-started/sqlite-new) -- Drizzle setup guide
- [next-auth.js.org/providers/credentials](https://next-auth.js.org/providers/credentials) -- Credentials provider configuration
- [next-auth.js.org/configuration/nextjs](https://next-auth.js.org/configuration/nextjs) -- Next.js integration (getServerSession, middleware)
- [next-auth.js.org/configuration/initialization](https://next-auth.js.org/configuration/initialization) -- Route Handler initialization pattern
- npm peer dependencies verified: next-auth@4.24.13 supports `next@^16`

### Secondary (MEDIUM confidence)
- [github.com/nextauthjs/next-auth/issues/13302](https://github.com/nextauthjs/next-auth/issues/13302) -- Next.js 16 compatibility issue (confirmed resolved in v4.24.12+)
- [github.com/nextauthjs/next-auth/discussions/13315](https://github.com/nextauthjs/next-auth/discussions/13315) -- proxy.ts migration pattern for next-auth
- [github.com/nextauthjs/next-auth/issues/7760](https://github.com/nextauthjs/next-auth/issues/7760) -- SessionProvider client wrapper pattern

### Tertiary (LOW confidence)
- Drizzle ORM sync/async behavior with better-sqlite3 in v0.45.x -- based on training data, needs runtime verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry, peer dependencies confirmed
- Architecture: HIGH -- patterns verified against official Next.js 16 and next-auth v4 docs
- Pitfalls: HIGH -- proxy.ts rename confirmed via official docs; peer dep issue confirmed via npm registry; SQLite FK behavior is well-documented

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack, 30-day window)
