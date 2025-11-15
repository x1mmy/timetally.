# TimeTally - Multi-Tenant Timesheet Management

A complete timesheet management solution with subdomain-based multi-tenancy. Built with Next.js 15, TypeScript, Supabase, and Tailwind CSS.

## Features

- **Multi-Tenant Architecture**: Each client gets their own subdomain with complete data isolation
- **Three Portal System**:
  - **Admin Portal** (`admin.timetally.com`) - Manage all clients
  - **Manager Portal** - View employee hours, manage staff, export CSV
  - **Employee Portal** - Simple PIN-based timesheet submission
- **Automatic Break Calculation**: Configurable break rules based on hours worked
- **MYOB-Compatible CSV Export**: Export timesheets ready for accounting software
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Secure Authentication**: Password hashing with bcrypt, session-based auth

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Authentication**: bcrypt
- **Date Handling**: date-fns

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `supabase/schema.sql`
   - Execute the SQL

3. Get your Supabase credentials:
   - Project URL: `https://[your-project].supabase.co`
   - Anon Key: Found in Project Settings > API

### 3. Environment Configuration

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Create Admin User

Generate a bcrypt hash for your admin password:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10))"
```

Add admin user via Supabase SQL Editor:

```sql
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@timetally.com', 'your-bcrypt-hash-here');
```

### 5. Local Subdomain Setup

Edit `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 admin.timetally.local
127.0.0.1 testclient.timetally.local
```

### 6. Run Development Server

```bash
pnpm dev
```

### 7. Access Portals

- **Root**: http://localhost:3000
- **Admin Portal**: http://admin.timetally.local:3000
- **Client Portal**: http://testclient.timetally.local:3000

## Usage Guide

### For Admins

1. Login at admin portal with admin credentials
2. Create clients with "Add New Client" button
3. Each client gets instant subdomain access
4. Default manager PIN is `0000`

### For Managers

1. Access your subdomain and choose "Manager Access"
2. Enter manager PIN (default: `0000`)
3. View employee timesheets by week
4. Add employees and export CSV reports

### For Employees

1. Access company subdomain and choose "Employee Login"
2. Enter employee number and 4-digit PIN
3. Submit timesheets with start/end times
4. Breaks are automatically calculated

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin portal
│   ├── client/             # Client portals (employee/manager)
│   └── api/                # API routes
├── components/             # Shared UI components
├── lib/                    # Utilities and helpers
├── types/                  # TypeScript definitions
└── middleware.ts           # Subdomain routing
```

## Key Files

- `supabase/schema.sql` - Complete database schema with triggers
- `src/middleware.ts` - Subdomain-based routing logic
- `.env.local` - Environment configuration
- `src/types/database.ts` - TypeScript type definitions

## Commands

```bash
pnpm dev          # Start development
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
pnpm typecheck    # Check types
```

## Production Deployment

1. Deploy to Vercel/Netlify
2. Configure wildcard DNS: `*.timetally.com`
3. Add environment variables
4. Update `NEXT_PUBLIC_APP_URL` to production domain

## License

MIT
