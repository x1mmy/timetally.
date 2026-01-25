# Project Structure

## Directory Tree

```
timetally./
├── .planning/              # GSD planning artifacts
│   └── codebase/           # This documentation
├── public/
│   ├── fonts/              # Satoshi variable fonts
│   ├── favicon.ico
│   └── icon.svg
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # Shared React components
│   ├── lib/                # Utilities and clients
│   ├── server/             # tRPC server setup
│   ├── styles/             # Global CSS
│   ├── trpc/               # tRPC client setup
│   ├── types/              # TypeScript definitions
│   └── middleware.ts       # Subdomain routing
├── supabase/               # Database migrations
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── eslint.config.js
```

## Source Directory (`src/`)

### `src/app/` - Routes & Pages

```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Landing page (root domain)
├── not-found.tsx           # 404 page
├── _components/            # App-specific components
│   └── post.tsx            # T3 example component
├── admin/                  # Admin portal
│   ├── page.tsx            # Admin login
│   └── dashboard/
│       ├── page.tsx        # Dashboard view
│       └── components/
│           ├── ClientList.tsx
│           ├── EditClientDialog.tsx
│           ├── NewClientDialog.tsx
│           └── StatsCards.tsx
├── client/                 # Client portal
│   ├── page.tsx            # Client landing
│   ├── manager/
│   │   ├── login/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       └── AddEmployeeDialog.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       └── EmployeeDialog.tsx
│   │   └── employee/[employeeId]/
│   │       ├── page.tsx
│   │       └── components/
│   │           └── EditTimesheetDialog.tsx
│   └── employee/
│       ├── login/page.tsx
│       └── dashboard/page.tsx
└── api/                    # API routes
    ├── trpc/[trpc]/route.ts
    ├── admin/
    │   ├── auth/route.ts
    │   └── clients/
    │       ├── route.ts
    │       └── [id]/route.ts
    └── client/
        ├── auth/
        │   ├── manager/route.ts
        │   └── employee/
        │       ├── route.ts
        │       └── me/route.ts
        ├── break-rules/route.ts
        ├── employees/
        │   ├── route.ts
        │   └── [id]/route.ts
        └── timesheets/route.ts
```

### `src/components/` - Shared Components

```
components/
├── ui/                     # Radix-based UI primitives
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── date-picker.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── select.tsx
│   └── table.tsx
├── PinPad.tsx              # PIN entry component
├── TimePicker.tsx          # Time selection (responsive)
├── TimePickerDesktopSimple.tsx
├── TimePickerMobile.tsx
├── TimeInput.tsx           # Time input field
└── WeekNavigator.tsx       # Week selection UI
```

### `src/lib/` - Utilities

```
lib/
├── auth.ts                 # Auth utilities
├── csvExport.ts            # CSV generation
├── subdomain.ts            # Subdomain helpers
├── timeUtils.ts            # Time calculations
├── utils.ts                # General utilities (cn, etc.)
└── supabase/
    ├── client.ts           # Browser Supabase client
    └── server.ts           # Server Supabase clients
```

### `src/server/` - Backend

```
server/
└── api/
    ├── trpc.ts             # tRPC context & procedures
    ├── root.ts             # App router
    └── routers/
        └── post.ts         # Example router
```

### `src/trpc/` - tRPC Client

```
trpc/
├── query-client.ts         # TanStack Query client
├── react.tsx               # React hooks provider
└── server.ts               # Server-side caller
```

### `src/types/` - Type Definitions

```
types/
└── database.ts             # All database types
```

## Naming Conventions

### Files
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ClientList.tsx` |
| Utilities | camelCase | `timeUtils.ts` |
| API routes | `route.ts` in folder | `[id]/route.ts` |
| Pages | `page.tsx` | `dashboard/page.tsx` |
| Types | camelCase | `database.ts` |

### Components
| Type | Convention |
|------|------------|
| Server Components | Default (no directive) |
| Client Components | `"use client"` at top |
| UI Primitives | Lowercase in `ui/` folder |

### Routes
| Pattern | Use Case |
|---------|----------|
| `[param]` | Dynamic segments |
| `(group)` | Route groups (no URL segment) |
| `_folder` | Private folders (excluded from routing) |

## Route Structure

### Public Routes (no auth)
- `/` - Marketing landing
- `/admin` - Admin login
- `/client` - Client landing
- `/client/manager/login`
- `/client/employee/login`

### Protected Routes
- `/admin/dashboard` - Admin only
- `/client/manager/dashboard` - Manager only
- `/client/manager/settings` - Manager only
- `/client/manager/employee/[id]` - Manager only
- `/client/employee/dashboard` - Employee only

## Import Aliases

```typescript
// tsconfig.json paths
"~/*" → "./src/*"
"@/*" → "./src/*"

// Usage
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
```
