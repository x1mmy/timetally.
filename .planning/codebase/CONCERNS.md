# Technical Concerns

## Security

### High Priority

#### 1. Employee PIN Storage (Plain Text)
**Location:** `src/types/database.ts:42`
```typescript
pin: string; // 4-digit PIN (plain text, client-isolated)
```

**Issue:** Employee PINs are stored in plain text, relying only on client isolation for security.

**Risk:** If database is compromised or a client's data leaks, all employee PINs are exposed.

**Recommendation:** Hash employee PINs with bcrypt like manager PINs, or implement a per-client salt.

#### 2. Service Role Key Usage
**Location:** `src/lib/supabase/server.ts:47`

**Issue:** Admin client uses service role key which bypasses all RLS. If any API route accidentally uses this client with user-controlled input, it could expose data.

**Recommendation:**
- Audit all usages of `createSupabaseAdmin()`
- Add explicit comments about when it's safe to use
- Consider middleware to validate admin sessions before allowing admin client

#### 3. Console Logging in Middleware
**Location:** `src/middleware.ts:15-19, 47, 66, 82, 89`

**Issue:** Debug console.log statements in production code expose request details.

**Recommendation:** Remove or gate behind `NODE_ENV === 'development'`.

### Medium Priority

#### 4. Missing CSRF Protection
**Issue:** API routes don't appear to have CSRF token validation.

**Recommendation:** Implement CSRF tokens for state-changing operations, or verify `Origin` header matches expected domain.

#### 5. No Rate Limiting
**Issue:** Auth endpoints (PIN verification) have no rate limiting, enabling brute force attacks on 4-digit PINs.

**Recommendation:** Implement rate limiting on auth endpoints (e.g., using Vercel Edge Middleware or Upstash Redis).

## Testing

### Critical Gap

#### No Test Coverage
**Issue:** Zero tests in the codebase. No unit, integration, or E2E tests.

**Risk:** Regressions go undetected, refactoring is risky, critical paths untested.

**Recommendation:** See TESTING.md for implementation plan. Priority areas:
1. Authentication flows
2. Timesheet calculations
3. Break rule logic

## Code Quality

### Medium Priority

#### 1. tRPC Underutilized
**Location:** `src/server/api/root.ts`

**Issue:** Only example `postRouter` exists. All actual API logic is in plain Next.js API routes, losing type safety benefits.

**Recommendation:** Either:
- Migrate key procedures to tRPC for type safety
- Remove tRPC if not planning to use it (reduces bundle size)

#### 2. Mixed API Patterns
**Issue:** Codebase uses both tRPC (unused) and REST API routes. This inconsistency can confuse contributors.

**Recommendation:** Standardize on one approach.

#### 3. Environment Variable Assertions
**Location:** `src/lib/supabase/server.ts:17-19, 49-50`
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!,
```

**Issue:** Non-null assertions on environment variables. If misconfigured, runtime crashes with unclear errors.

**Recommendation:** Validate env vars at startup using `@t3-oss/env-nextjs` (already in dependencies but not fully utilized).

### Low Priority

#### 4. Database Types Manual Sync
**Location:** `src/types/database.ts`

**Issue:** Types are manually defined and could drift from actual Supabase schema.

**Recommendation:** Use Supabase CLI to generate types:
```bash
supabase gen types typescript --project-id <id> > src/types/supabase.ts
```

## Performance

### Medium Priority

#### 1. No Caching Strategy
**Issue:** API routes don't implement caching. Each request hits Supabase.

**Recommendation:**
- Add `Cache-Control` headers for static data
- Consider React Query's caching (already using TanStack Query)
- Implement Supabase real-time for live updates instead of polling

#### 2. Bundle Analysis Needed
**Issue:** No visibility into bundle size. Framer Motion and date-fns can be heavy.

**Recommendation:** Add `@next/bundle-analyzer`:
```bash
pnpm add -D @next/bundle-analyzer
```

## Architecture

### Medium Priority

#### 1. Session Management Unclear
**Issue:** Auth session handling varies across different auth types (admin, manager, employee). No unified session abstraction.

**Recommendation:** Create unified auth context/utilities:
```typescript
// src/lib/auth/session.ts
export function getSession(type: 'admin' | 'manager' | 'employee')
export function requireAuth(type: 'admin' | 'manager' | 'employee')
```

#### 2. Error Handling Inconsistent
**Issue:** Some routes return `{ error: "message" }`, others throw. No standard error format.

**Recommendation:** Create standard error response utility:
```typescript
// src/lib/api/errors.ts
export class APIError extends Error {
  constructor(public code: string, message: string, public status: number) {}
}
```

## Dependencies

### To Monitor

| Package | Current | Notes |
|---------|---------|-------|
| next | 15.2.8 | Check for 15.3+ updates |
| react | 19.0.0 | Stable, but watch for 19.1 |
| tailwindcss | 4.0.15 | Breaking changes possible |

### Consider Removing
- tRPC (if not using): ~150KB+ in bundle
- `server-only` package (only needed if using in weird places)

## TODO/FIXME Audit

**Result:** No TODO or FIXME comments found in source code.

## Missing Features (Inferred)

Based on the types and routes:

1. **Password Reset** - No forgot password flow for admin
2. **Session Expiry** - No clear session timeout handling
3. **Audit Logging** - No tracking of who changed what
4. **Soft Delete** - Employees/timesheets fully deleted vs archived
5. **Export Options** - Only CSV, no PDF or other formats
6. **Timezone Handling** - Unclear how timezones are managed for timesheets
