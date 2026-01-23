# External Integrations

## Supabase

### Configuration
TimeTally uses Supabase for:
- **PostgreSQL Database** - All data storage
- **Authentication** - Admin session management
- **Row Level Security** - Data isolation

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=secret-key
```

### Client Types

#### Browser Client (`src/lib/supabase/client.ts`)
- Used in client components
- Configured with cookie handling for sessions

#### Server Client (`src/lib/supabase/server.ts`)
- `createSupabaseServer()` - For server components and API routes
- `createSupabaseAdmin()` - Bypasses RLS for admin operations

### Data Flow
```
Client → API Route → Supabase Server Client → PostgreSQL
                  ↓
Admin API → Supabase Admin Client (Service Role) → PostgreSQL
```

## tRPC Integration

### Setup
- Server: `src/server/api/trpc.ts`
- Client: `src/trpc/react.tsx`
- API Route: `src/app/api/trpc/[trpc]/route.ts`

### Available Routers
- `post` - Example router (from T3 scaffolding)

> Note: Most API calls use direct Next.js API routes rather than tRPC procedures

## Subdomain Routing

### Middleware Configuration
The app uses subdomain-based multi-tenancy via `src/middleware.ts`:

| Subdomain | Portal | Path Rewrite |
|-----------|--------|--------------|
| `admin.*` | Admin Portal | `/admin/*` |
| `{client}.*` | Client Portal | `/client/*` |
| Root domain | Marketing | No rewrite |

### Headers
- `x-subdomain` header passed to all routes

### Local Development
Add to `/etc/hosts`:
```
127.0.0.1 admin.timetally.local
127.0.0.1 testclient.timetally.local
```

## Authentication Flow

### Admin Authentication
1. Email/password login via `/api/admin/auth`
2. Session stored in cookies
3. Validated on each request

### Manager Authentication
1. PIN-based login via `/api/client/auth/manager`
2. Client subdomain determines scope
3. PIN hashed with bcryptjs

### Employee Authentication
1. PIN-based login via `/api/client/auth/employee`
2. Isolated within client namespace
3. Session via cookies

## API Routes Structure

```
/api/
├── admin/
│   ├── auth/route.ts          # Admin login
│   └── clients/
│       ├── route.ts           # List/create clients
│       └── [id]/route.ts      # Update/delete client
├── client/
│   ├── auth/
│   │   ├── manager/route.ts   # Manager login
│   │   └── employee/
│   │       ├── route.ts       # Employee login
│   │       └── me/route.ts    # Current employee
│   ├── break-rules/route.ts   # Break rule config
│   ├── employees/
│   │   ├── route.ts           # List/create employees
│   │   └── [id]/route.ts      # Update employee
│   └── timesheets/route.ts    # Timesheet CRUD
└── trpc/[trpc]/route.ts       # tRPC handler
```

## Environment Setup

### Required Variables
| Variable | Public | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Admin operations key |
| `NEXT_PUBLIC_APP_URL` | Yes | Application base URL |
| `NODE_ENV` | Yes | Environment mode |

### Security Notes
- Service role key MUST stay server-side only
- Anon key is safe for client but has RLS restrictions
- PIN storage uses client-isolation rather than hashing for employees
