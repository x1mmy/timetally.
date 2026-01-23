# Architecture

## Overview

TimeTally is a **multi-tenant SaaS timesheet management system** built on Next.js 15 App Router with subdomain-based client isolation.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Admin Portal   │ Manager Portal  │    Employee Portal          │
│  admin.*        │ {client}.*      │    {client}.*               │
└────────┬────────┴────────┬────────┴────────────┬────────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE                                    │
│              Subdomain Detection & Routing                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   /admin    │     │   /client   │     │     /       │
│   Routes    │     │   Routes    │     │  Marketing  │
└──────┬──────┘     └──────┬──────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API ROUTES                                   │
│  /api/admin/*  |  /api/client/*  |  /api/trpc/*                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE                                      │
│        PostgreSQL + Row Level Security + Auth                    │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-Tenancy Model

### Tenant Isolation
- Each **Client** (business) has a unique subdomain
- Data isolation via `client_id` foreign key
- Admin portal separate at `admin.*` subdomain

### User Hierarchy
```
Admin User (Platform)
    └── Client (Business/Tenant)
            ├── Manager (PIN auth)
            └── Employees (PIN auth)
                    └── Timesheets
```

## App Router Structure

### Route Groups
```
src/app/
├── (root)           # Marketing pages
├── admin/           # Admin portal
│   ├── page.tsx         # Admin login
│   └── dashboard/       # Admin dashboard
└── client/          # Client portal
    ├── manager/         # Manager views
    │   ├── login/
    │   ├── dashboard/
    │   ├── settings/
    │   └── employee/[id]/
    └── employee/        # Employee views
        ├── login/
        └── dashboard/
```

## Data Layer

### Database Schema (Supabase/PostgreSQL)

```
admin_users
├── id (PK)
├── email (unique)
├── password_hash
└── timestamps

clients
├── id (PK)
├── business_name
├── subdomain (unique)
├── contact_email
├── manager_pin (hashed)
├── status (active|inactive|suspended)
└── timestamps

employees
├── id (PK)
├── client_id (FK → clients)
├── first_name, last_name
├── pin (plain text, client-isolated)
├── weekday_rate, saturday_rate, sunday_rate
├── status
└── timestamps

timesheets
├── id (PK)
├── employee_id (FK → employees)
├── client_id (FK → clients)
├── work_date
├── start_time, end_time
├── break_minutes
├── total_hours
├── notes
└── timestamps

break_rules
├── id (PK)
├── client_id (FK → clients)
├── min_hours
├── break_minutes
└── created_at
```

## API Layer

### Pattern: Next.js API Routes
Most business logic uses direct API routes rather than tRPC:

```typescript
// src/app/api/client/employees/route.ts
export async function GET(request: Request) {
  // 1. Extract subdomain from headers
  // 2. Validate session
  // 3. Query Supabase
  // 4. Return JSON
}
```

### tRPC (Minimal Usage)
- Basic setup from T3 scaffolding
- Only `postRouter` defined (example)
- Could be expanded for type-safe queries

## Authentication

### Admin Auth Flow
1. POST `/api/admin/auth` with email/password
2. Verify against `admin_users` table (bcrypt)
3. Set session cookie
4. Redirect to `/admin/dashboard`

### Manager Auth Flow
1. POST `/api/client/auth/manager` with PIN
2. Get `client_id` from subdomain header
3. Verify PIN against `clients.manager_pin`
4. Set session cookie

### Employee Auth Flow
1. POST `/api/client/auth/employee` with PIN
2. Look up employee by PIN within client scope
3. Set session cookie with `employee_id`

## Key Patterns

### 1. Subdomain Extraction
```typescript
// In API routes
const subdomain = request.headers.get("x-subdomain");
const client = await getClientBySubdomain(subdomain);
```

### 2. Admin Client for Full Access
```typescript
const supabase = createSupabaseAdmin(); // Bypasses RLS
const { data } = await supabase.from("clients").select("*");
```

### 3. Server Components with Data Fetching
```typescript
// In page.tsx (server component)
export default async function Page() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("timesheets").select("*");
  return <ClientComponent initialData={data} />;
}
```

## Security Model

### Row Level Security (RLS)
- Supabase RLS policies restrict data access
- Admin operations use service role key (bypasses RLS)
- Client operations scoped by `client_id`

### PIN Security
- Manager PINs: Hashed with bcrypt
- Employee PINs: Plain text (isolated by client)
- Consider upgrading employee PIN security

### Session Management
- Server-side sessions via cookies
- Supabase SSR handles token refresh
