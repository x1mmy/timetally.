# Technology Stack

## Framework & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.2.8 | Full-stack React framework with App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.8.2 | Type-safe JavaScript |
| **Node.js** | ES2022 target | Runtime |

## Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.81.1 | PostgreSQL database + Auth + Realtime |
| **@supabase/ssr** | 0.7.0 | Server-side Supabase client |
| **tRPC** | 11.0.0 | Type-safe API layer |
| **TanStack Query** | 5.69.0 | Server state management |

## Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.0.15 | Utility-first CSS |
| **Radix UI** | Various | Accessible UI primitives |
| **Framer Motion** | 12.23.25 | Animation library |
| **Lucide React** | 0.553.0 | Icon library |
| **class-variance-authority** | 0.7.1 | Variant management |
| **tailwind-merge** | 3.4.0 | Class merging |
| **clsx** | 2.1.1 | Conditional classes |

### Radix UI Components Used
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-popover`
- `@radix-ui/react-select`
- `@radix-ui/react-slot`

## Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **date-fns** | 4.1.0 | Date manipulation |
| **Zod** | 3.24.2 | Schema validation |
| **bcryptjs** | 3.0.3 | Password hashing |
| **SuperJSON** | 2.2.1 | JSON serialization for tRPC |

## Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **pnpm** | 10.10.0 | Package manager |
| **ESLint** | 9.23.0 | Linting |
| **Prettier** | 3.5.3 | Code formatting |
| **PostCSS** | 8.5.3 | CSS processing |

## Build Configuration

### TypeScript Config
- Strict mode enabled
- `noUncheckedIndexedAccess`: true
- Module: ESNext with Bundler resolution
- Path aliases: `~/` and `@/` → `./src/*`

### Package Manager
- pnpm with workspace support
- CT3A (Create T3 App) scaffolding: v7.40.0

## Scripts

```json
{
  "dev": "next dev --turbo",
  "build": "next build",
  "start": "next start",
  "check": "next lint && tsc --noEmit",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "format:check": "prettier --check",
  "format:write": "prettier --write"
}
```
