# TimeTally — Claude Code Guide

## Project Overview

Multi-tenant SaaS timesheet management system. Businesses (clients) get isolated subdomains. Each client has managers (PIN auth) and employees (PIN auth) who log timesheets.

**User hierarchy:** Platform Admin → Client (business) → Manager → Employees → Timesheets

---

## Dev Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm check        # Lint + typecheck (run before committing)
pnpm lint         # ESLint only
pnpm typecheck    # tsc --noEmit only
pnpm format:write # Prettier fix
```

Package manager: **pnpm only** — do not use npm or yarn.

---

## Architecture

### Subdomain Routing (key concept)
`src/middleware.ts` routes based on subdomain:
- `admin.*` → `/admin/*`
- `{client}.*` → `/client/*`
- Root domain → marketing pages

The `x-subdomain` header is injected by middleware and used in API routes to scope all queries to the correct client.

### Two Supabase Clients
- `createSupabaseServer()` — respects RLS, use for normal operations
- `createSupabaseAdmin()` — bypasses RLS via service role key, **use sparingly and only when RLS can't handle the use case**

### API Pattern
All business logic lives in Next.js API routes (`/api/client/*`, `/api/admin/*`). tRPC is scaffolded but not actively used — don't add new tRPC procedures, stick with REST API routes.

Standard API route structure:
```typescript
export async function GET(request: Request) {
  const subdomain = request.headers.get("x-subdomain");
  if (!subdomain) return NextResponse.json({ error: "Missing subdomain" }, { status: 400 });
  // validate session, query supabase, return JSON
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Subdomain detection and route rewriting |
| `src/types/database.ts` | All DB types — single source of truth |
| `src/lib/supabase/server.ts` | Server Supabase clients (server + admin) |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/auth.ts` | Auth utilities |
| `src/lib/employeePin.ts` | Employee PIN lookup hash + encryption |
| `src/lib/timeUtils.ts` | Time calculations |
| `src/lib/csvExport.ts` | CSV export logic |
| `supabase/migrations/` | DB migrations (apply in order) |

---

## Conventions

### TypeScript
- `interface` for object shapes (DB entities, component props)
- `type` for unions and computed types
- Explicit return types on exported functions
- DB columns stay `snake_case` in interfaces (match schema)
- Form input types use `camelCase`

### Components
- Server components by default (no directive)
- Add `"use client"` only when you need hooks or browser APIs
- Import order: React/Next → external libs → internal components (`~/components/`) → utils (`~/lib/`) → types (`~/types/`)
- Use `~/` or `@/` path aliases — no relative imports from deep paths

### Styling
- Tailwind utility classes
- Conditional classes via `cn()` from `~/lib/utils`
- Component variants via `cva` (class-variance-authority)
- Prettier auto-sorts Tailwind classes on format

---

## Known Issues (Do Not Regress)

1. **Employee PINs are not hashed with bcrypt** — they are stored as `pin_lookup` (keyed HMAC, used for login and uniqueness) plus `pin_encrypted` (AES-256-GCM), both keyed by `EMPLOYEE_PIN_SECRET` via `src/lib/employeePin.ts`. Manager PINs are bcrypt-hashed. The legacy plain text `pin` column still exists for rows not yet backfilled; the fallbacks that read it are marked "issue #49" and go away when the column is dropped. The only route that returns a PIN is the reveal endpoint, `POST /api/client/employees/[id]/pin` (manager session + manager PIN re-check, rate limited via `src/lib/authAttempts.ts`). Everywhere else: never `select("*")` on `employees` — use `EMPLOYEE_PUBLIC_COLUMNS` from `src/lib/employeeColumns.ts` or an explicit column list without the PIN columns.
2. **No rate limiting on the employee login endpoint** — 4-digit PINs are brute-forceable. Don't make this worse. Manager login and the PIN reveal re-check are limited (5 attempts per client per 15 minutes each, `auth_attempts` table, `registerAttempt` in `src/lib/authAttempts.ts`). Employee login is still open (#41 part B): it is PIN-only, so there is no employee to count a wrong PIN against.
3. **No test coverage** — zero tests in the codebase. Be careful with refactors.
4. **Console.logs in middleware** — debug logs exist in production code, don't add more.

---

## Local Development

Add to `/etc/hosts` for subdomain routing:
```
127.0.0.1 admin.timetally.local
127.0.0.1 testclient.timetally.local
```

Required env vars:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Server-side only, never expose to client
EMPLOYEE_PIN_SECRET=         # Server-side only, 32+ chars; changing it invalidates every employee PIN
NEXT_PUBLIC_APP_URL=
```

---

## Active Branch Context

Currently on `feat/categories-for-employees` — adding category support to employees. New API routes being added:
- `src/app/api/client/categories/`
- `src/app/api/client/employees/bulk-category/`
- Migration: `supabase/migrations/20260324_employee_categories.sql`
