# TimeTally - Multi-Tenant Payroll & Timesheet Management

A complete payroll and timesheet management solution with subdomain-based multi-tenancy. Built with Next.js 15, TypeScript, Supabase, and Tailwind CSS.

## Features

### Core Payroll System
- **Day-Specific Pay Rates**: Different hourly rates for weekdays, Saturdays, and Sundays
- **Automatic Pay Calculations**: Real-time pay calculations based on hours worked and applicable rates
- **Weekly Payroll Dashboard**: View total payroll costs per employee and team-wide
- **Break Time Deductions**: Unpaid breaks automatically deducted from total hours
- **Hours Tracking**: Both raw hours worked and paid hours (after break deductions)

### Multi-Tenant Architecture
- **Subdomain-Based Isolation**: Each client gets their own subdomain with complete data isolation
- **Three Portal System**:
  - **Admin Portal** (`admin.timetally.com`) - Manage all clients and view statistics
  - **Manager Portal** - Payroll dashboard, employee management, break rules configuration
  - **Employee Portal** - Simple PIN-based timesheet submission with weekly view

### Employee Management
- **Full CRUD Operations**: Add, edit, view, and delete employees from manager portal
- **PIN-Based Authentication**: Employees login with just a 4-digit PIN (unique per client)
- **Employee Detail View**: Detailed daily breakdown showing start/end times, breaks, and pay
- **Search Functionality**: Quickly find employees by name

### Timesheet Features
- **Weekly View**: See and submit timesheets for entire week (Monday-Sunday)
- **Partial Entries**: Clock in first (save start time), clock out later (add end time)
- **Week Navigation**: Browse past, current, and future weeks
- **Time Validation**: Ensures end time is after start time
- **Auto-Save Per Day**: Each day saved independently

### Break Management
- **Configurable Break Rules**: Set automatic break deductions based on hours worked
- **Three-Tier System**: Different break times for under 5 hours, 5-7 hours, and over 7 hours
- **Automatic Application**: Database triggers apply break rules when timesheets are submitted
- **Manual Override**: Break minutes can be manually adjusted if needed

### Additional Features
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Secure Authentication**: Password hashing with bcrypt, session-based auth
- **Real-Time Calculations**: All pay and hours calculations happen instantly
- **Type-Safe**: Full TypeScript implementation with strict mode

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Authentication**: bcrypt
- **Date Handling**: date-fns

## Setup Instructions

Follow these steps carefully to get TimeTally running on your local machine for testing.

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd timetally

# Install dependencies
pnpm install
```

### 2. Supabase Project Setup

1. **Create a new Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization, name your project (e.g., "timetally-dev")
   - Set a strong database password (save this!)
   - Select a region close to you
   - Wait for project to finish provisioning (~2 minutes)

2. **Get your Supabase credentials**:
   - Go to Project Settings > API
   - Copy the following:
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon/public key**: Starts with `eyJ...`
     - **service_role key**: Starts with `eyJ...` (click "Reveal" to see)

### 3. Database Schema Setup

Run the following SQL files **in order** in the Supabase SQL Editor:

1. **Main Schema** (Go to SQL Editor > New Query):
   ```sql
   -- Copy and paste entire contents of supabase/schema.sql
   -- This creates all tables, functions, triggers, and indexes
   ```

2. **Migration 1 - Pay Rates** (New Query):
   ```sql
   -- Copy and paste contents of supabase/migrations/001_add_pay_rates.sql
   -- This adds weekday_rate, saturday_rate, sunday_rate columns
   ```

3. **Migration 2 - Nullable End Time** (New Query):
   ```sql
   -- Copy and paste contents of supabase/migrations/20251117_make_end_time_nullable.sql
   -- This allows partial timesheet entries (clock in without clock out)
   ```

4. **Migration 3 - Fix Break Calculation** (New Query):
   ```sql
   -- Copy and paste contents of supabase/migrations/20251117_fix_break_calculation.sql
   -- This fixes break calculation for partial entries
   ```

**Verify Database Setup**:
- Go to Table Editor in Supabase
- You should see 5 tables: `admin_users`, `clients`, `employees`, `timesheets`, `break_rules`
- Check `employees` table has columns: `weekday_rate`, `saturday_rate`, `sunday_rate`

### 4. Environment Configuration

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

⚠️ **Important**: Replace `xxxxx` and the keys with your actual Supabase credentials from Step 2.

### 5. Create Admin User

Generate a bcrypt hash for your admin password:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10))"
```

Copy the output hash, then run this SQL in Supabase SQL Editor:

```sql
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@timetally.com', 'paste-your-bcrypt-hash-here');
```

**Test Admin Login**:
- Email: `admin@timetally.com`
- Password: `admin123`

### 6. Local Subdomain Setup

To test the multi-tenant subdomain system locally, edit your hosts file:

**macOS/Linux**: Edit `/etc/hosts`
```bash
sudo nano /etc/hosts
```

**Windows**: Edit `C:\Windows\System32\drivers\etc\hosts` (run Notepad as Administrator)

Add these lines:
```
127.0.0.1 admin.timetally.local
127.0.0.1 testclient.timetally.local
127.0.0.1 acme.timetally.local
```

Save and close the file.

### 7. (Optional) Generate Sample Data

To test with realistic data, generate sample timesheets:

```bash
# Generate sample data SQL file
node scripts/generate-sample-data.cjs

# Copy contents of supabase/generated-sample-data.sql
# Paste and run in Supabase SQL Editor
```

This creates:
- 3 sample clients (testclient, acme, demo)
- Multiple employees per client with varying pay rates
- Timesheets for the past few weeks
- Break rules configuration

### 8. Run Development Server

```bash
pnpm dev
```

The server will start on http://localhost:3000

### 9. Access and Test the Portals

#### Admin Portal
- **URL**: http://admin.timetally.local:3000
- **Login**:
  - Email: `admin@timetally.com`
  - Password: `admin123`
- **Test**: Create a new client, view statistics

#### Manager Portal
1. First, create a client in Admin Portal (or use sample data)
2. **URL**: http://[subdomain].timetally.local:3000
   - Example: http://testclient.timetally.local:3000
3. Click **"Manager Access"**
4. **Login**: Default PIN is `0000` (can be changed in Admin Portal)
5. **Test**:
   - View payroll dashboard
   - Add/edit employees in Settings
   - Configure break rules
   - Click employee cards to see details

#### Employee Portal
1. First, create an employee in Manager Portal Settings (or use sample data)
2. **URL**: http://[subdomain].timetally.local:3000
   - Example: http://testclient.timetally.local:3000
3. Click **"Employee Login"**
4. **Login**: Enter your 4-digit PIN (e.g., `1234`)
5. **Test**:
   - Submit timesheets for different days
   - Try partial entry (only start time)
   - Navigate between weeks

### 10. Verify Everything Works

**Checklist**:
- [ ] Admin portal loads and login works
- [ ] Can create a new client in admin dashboard
- [ ] Client subdomain (http://[subdomain].timetally.local:3000) loads
- [ ] Manager can login with PIN 0000
- [ ] Can add new employee with pay rates in Manager Settings
- [ ] Employee can login with their PIN
- [ ] Employee can submit timesheet entries
- [ ] Manager dashboard shows payroll calculations
- [ ] Break rules can be configured and applied
- [ ] Employee detail view shows daily breakdown

### Troubleshooting

**"Cannot connect to Supabase"**:
- Check `.env.local` has correct credentials
- Verify Supabase project is active (not paused)
- Check network connection

**"Subdomain not working"**:
- Verify `/etc/hosts` file was saved correctly
- Try `ping admin.timetally.local` - should resolve to 127.0.0.1
- Clear browser cache or try incognito mode
- Restart development server

**"Admin login fails"**:
- Verify admin user exists in database
- Check password hash was generated correctly
- Try generating new bcrypt hash

**"Database errors"**:
- Ensure all migration files were run in order
- Check Supabase logs in dashboard for errors
- Verify RLS (Row Level Security) is enabled on tables

**"Calculations not working"**:
- Verify migrations 2 and 3 were run (fix break calculation)
- Check database triggers exist in Supabase
- View Supabase logs for trigger errors

## Usage Guide

### For Admins

1. **Login**: Access admin.timetally.local:3000 with email/password
2. **Dashboard Overview**: View statistics for all clients, employees, and activity
3. **Create Clients**:
   - Click "Add New Client"
   - Enter business name, contact email, and subdomain (e.g., "acme")
   - Set manager PIN (default: 0000)
   - Client gets instant subdomain access at [subdomain].timetally.local:3000
4. **Manage Clients**:
   - Edit client details (name, email, manager PIN)
   - Change client status (active/inactive/suspended)
   - Delete clients (removes all employees and timesheets)
5. **Monitor**: View total employees across all clients

### For Managers

1. **Login**: Access [subdomain].timetally.local:3000 and click "Manager Access"
2. **Enter PIN**: Default is 0000 (can be changed by admin)

3. **Payroll Dashboard** (Main View):
   - View weekly payroll overview with total cost
   - See employee cards showing:
     - Weekly pay amount (prominent)
     - Pay rates (weekday/Saturday/Sunday)
     - Hours breakdown by day type
     - Raw hours vs paid hours (after breaks)
   - Search employees by name
   - Navigate between weeks
   - Click employee cards for detailed daily breakdown

4. **Employee Management** (Settings Page):
   - **Add Employee**:
     - Click "Add Employee"
     - Enter name and 4-digit PIN
     - Set pay rates for weekday, Saturday, Sunday
     - Employee can immediately login
   - **Edit Employee**:
     - Click edit icon on employee row
     - Update name, PIN, or any pay rate
     - Changes apply to future timesheets
   - **Delete Employee**:
     - Click delete icon
     - Confirm deletion (removes all their timesheets)
   - **View All**: See all employees with their current pay rates

5. **Break Rules Configuration** (Settings Page):
   - Set automatic break deductions:
     - Under 5 hours: X minutes
     - 5-7 hours: Y minutes
     - Over 7 hours: Z minutes
   - Save rules to apply to all future timesheets
   - Example: 0 hrs = 0 min, 5 hrs = 30 min, 7 hrs = 60 min

6. **Employee Detail View**:
   - Click any employee card on dashboard
   - See daily breakdown for the week:
     - Start and end times per day
     - Raw hours worked
     - Break minutes deducted
     - Paid hours
     - Daily pay amount
   - View week summary totals
   - Navigate between weeks

### For Employees

1. **Login**: Access [subdomain].timetally.local:3000 and click "Employee Login"
2. **Enter PIN**: Just your 4-digit PIN (no employee number needed)

3. **Submit Timesheets** (Weekly View):
   - See all 7 days of the week (Monday-Sunday)
   - For each day:
     - Select start time (24-hour format)
     - Select end time (24-hour format)
     - Click "Save" for that day
   - **Partial Entries**: You can save just start time, then add end time later
   - **Time Validation**: End time must be after start time
   - **Auto-Save**: Each day saves independently
   - View weekly total hours at top

4. **Navigate Weeks**:
   - Use "Previous Week" / "Next Week" buttons
   - Submit timesheets for past or future weeks
   - See which days already have entries

5. **Automatic Calculations**:
   - Breaks are automatically deducted based on hours worked
   - Pay is calculated using correct rate (weekday/Saturday/Sunday)
   - No manual calculations needed

## Project Structure

```
timetally/
├── src/
│   ├── app/
│   │   ├── admin/                          # Admin Portal
│   │   │   ├── page.tsx                    # Admin login
│   │   │   └── dashboard/
│   │   │       └── page.tsx                # Client management dashboard
│   │   ├── client/                         # Client Portals
│   │   │   ├── page.tsx                    # Portal selection (Employee/Manager)
│   │   │   ├── employee/
│   │   │   │   ├── login/page.tsx          # Employee PIN login
│   │   │   │   └── dashboard/page.tsx      # Employee timesheet entry
│   │   │   └── manager/
│   │   │       ├── login/page.tsx          # Manager PIN login
│   │   │       ├── dashboard/page.tsx      # Payroll dashboard
│   │   │       ├── settings/page.tsx       # Employee CRUD & break rules
│   │   │       └── employee/
│   │   │           └── [employeeId]/page.tsx  # Employee detail view
│   │   ├── api/                            # API Routes
│   │   │   ├── admin/
│   │   │   │   ├── auth/route.ts           # Admin authentication
│   │   │   │   └── clients/                # Client CRUD endpoints
│   │   │   └── client/
│   │   │       ├── auth/                   # Employee & manager auth
│   │   │       ├── employees/              # Employee CRUD endpoints
│   │   │       ├── timesheets/             # Timesheet endpoints
│   │   │       └── break-rules/            # Break rules endpoints
│   │   ├── layout.tsx                      # Root layout
│   │   └── page.tsx                        # Landing page
│   ├── components/                         # Shared UI Components
│   │   ├── ui/                             # shadcn/ui components
│   │   ├── WeekNavigator.tsx               # Week navigation component
│   │   ├── TimePicker.tsx                  # 24-hour time input
│   │   ├── EmployeeDialog.tsx              # Add/Edit employee modal
│   │   ├── ClientList.tsx                  # Admin client table
│   │   ├── NewClientDialog.tsx             # Admin new client form
│   │   ├── EditClientDialog.tsx            # Admin edit client form
│   │   └── StatsCards.tsx                  # Admin dashboard stats
│   ├── lib/                                # Utilities
│   │   ├── supabase.ts                     # Supabase client setup
│   │   └── utils.ts                        # Helper functions
│   ├── types/
│   │   └── database.ts                     # TypeScript database types
│   └── middleware.ts                       # Subdomain routing logic
├── supabase/
│   ├── schema.sql                          # Main database schema
│   ├── migrations/
│   │   ├── 001_add_pay_rates.sql           # Add payroll features
│   │   ├── 20251117_make_end_time_nullable.sql
│   │   └── 20251117_fix_break_calculation.sql
│   ├── sample-data.sql                     # Sample data template
│   └── generated-sample-data.sql           # Generated sample data
├── scripts/
│   └── generate-sample-data.cjs            # Sample data generator
├── .env.local                              # Environment variables (not in git)
├── package.json                            # Dependencies
├── tsconfig.json                           # TypeScript configuration
├── next.config.js                          # Next.js configuration
├── tailwind.config.ts                      # Tailwind CSS configuration
└── README.md                               # This file
```

## Key Files

### Database
- [supabase/schema.sql](supabase/schema.sql) - Complete database schema with tables, triggers, functions, and indexes
- [supabase/migrations/](supabase/migrations/) - Database migration files (must run in order)

### Application
- [src/middleware.ts](src/middleware.ts) - Subdomain-based routing logic (redirects to correct portal)
- [src/types/database.ts](src/types/database.ts) - TypeScript type definitions matching database schema
- [src/lib/supabase.ts](src/lib/supabase.ts) - Supabase client configuration

### Configuration
- `.env.local` - Environment variables (Supabase credentials, app URL)
- [package.json](package.json) - Project dependencies and scripts
- [tsconfig.json](tsconfig.json) - TypeScript strict mode configuration
- [next.config.js](next.config.js) - Next.js configuration

### Components
- [src/components/WeekNavigator.tsx](src/components/WeekNavigator.tsx) - Reusable week navigation
- [src/components/TimePicker.tsx](src/components/TimePicker.tsx) - 24-hour time input with validation
- [src/components/EmployeeDialog.tsx](src/components/EmployeeDialog.tsx) - Dual-mode employee add/edit form
- [src/components/ui/](src/components/ui/) - shadcn/ui component library

## Commands

```bash
# Development
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Build for production (includes type checking)
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking (strict mode)

# Database
node scripts/generate-sample-data.cjs  # Generate sample data SQL file

# Testing
# Navigate to portals in browser to test functionality
# Use provided test credentials (admin/manager/employee)
```

## Production Deployment

### Prerequisites
- Vercel or Netlify account
- Domain name (e.g., timetally.com)
- Production Supabase project

### Deployment Steps

1. **Setup Supabase Production Database**:
   - Create new Supabase project for production
   - Run schema.sql and all migrations in order
   - Create admin user with production password
   - Note credentials (URL, anon key, service role key)

2. **Configure DNS**:
   - Add wildcard DNS record: `*.timetally.com` → Your hosting provider
   - Add admin subdomain: `admin.timetally.com` → Your hosting provider
   - Wait for DNS propagation (~1-48 hours)

3. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   pnpm i -g vercel

   # Deploy
   vercel
   ```

   Or use GitHub integration:
   - Connect GitHub repository to Vercel
   - Auto-deploy on push to main branch

4. **Add Environment Variables** (Vercel Dashboard):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
   NEXT_PUBLIC_APP_URL=https://timetally.com
   NODE_ENV=production
   ```

5. **Verify Deployment**:
   - Visit https://admin.timetally.com
   - Test admin login
   - Create test client
   - Test client subdomain: https://[subdomain].timetally.com
   - Test manager and employee portals

6. **Security Checklist**:
   - [ ] Use strong admin passwords
   - [ ] Change default manager PINs
   - [ ] Enable Supabase RLS policies
   - [ ] Use HTTPS only (automatic on Vercel)
   - [ ] Rotate service role key periodically
   - [ ] Set up Supabase database backups
   - [ ] Monitor Supabase usage and logs

### Alternative: Netlify Deployment

```bash
# Install Netlify CLI
pnpm i -g netlify-cli

# Deploy
netlify deploy --prod
```

Add same environment variables in Netlify dashboard.

## Database Schema Overview

### Tables
- **admin_users**: Platform administrators with email/password auth
- **clients**: Business clients with subdomain and manager PIN
- **employees**: Employees with PIN auth and three pay rates (weekday/Saturday/Sunday)
- **timesheets**: Daily timesheet entries with start/end times, breaks, and calculated hours
- **break_rules**: Configurable break deduction rules per client

### Automatic Features (Database Triggers)
- **Break Calculation**: Automatically applies break rules based on hours worked
- **Pay Rate Selection**: Uses correct rate based on day of week (Sunday=0, Saturday=6)
- **Total Hours**: Calculates paid hours (raw hours - break minutes)
- **Updated Timestamps**: Auto-updates `updated_at` on all record changes

### Key Functions
- `calculate_break_minutes(client_id, total_hours)`: Returns break minutes for given hours
- `calculate_timesheet_hours()`: Trigger function for timesheet calculations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation files (QUICKSTART.md, PROJECT_SUMMARY.md)
- Review Supabase logs for database errors

## License

MIT
