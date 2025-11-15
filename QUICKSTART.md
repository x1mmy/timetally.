# TimeTally Quick Start Guide

Get TimeTally up and running in 5 minutes!

## Prerequisites

- Node.js 20+ and pnpm installed
- Supabase account (free tier works)

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize (~2 minutes)
3. Go to **SQL Editor** in the left sidebar
4. Copy the contents of `supabase/schema.sql`
5. Paste and click **Run**

## Step 3: Configure Environment

1. In Supabase, go to **Settings** > **API**
2. Copy your **Project URL** and **anon public** key
3. Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 4: Generate and Load Sample Data

Generate sample data (includes admin user, test client, and employees):

```bash
node scripts/generate-sample-data.cjs
```

This creates `supabase/generated-sample-data.sql`. Then in Supabase SQL Editor:
1. Open the generated file: `supabase/generated-sample-data.sql`
2. Copy and paste the SQL into Supabase SQL Editor
3. Click **Run**

## Step 5: Set Up Local Subdomains

Edit your hosts file to enable subdomain routing:

**macOS/Linux:**
```bash
sudo nano /etc/hosts
```

**Windows:**
Edit `C:\Windows\System32\drivers\etc\hosts` as Administrator

Add these lines:
```
127.0.0.1 admin.timetally.local
127.0.0.1 testclient.timetally.local
```

Save and close (on macOS/Linux: Ctrl+X, then Y, then Enter).

## Step 6: Start Development Server

```bash
pnpm dev
```

## Step 7: Access the Application

Open in your browser:

### Admin Portal
- URL: http://admin.timetally.local:3000
- Login: `admin@timetally.com` / `admin123`

### Test Client Portal (from sample data)
- URL: http://testclient.timetally.local:3000
- Manager PIN: `0000`
- Employee PINs: `1234`, `5678`, `9999`

### Root Landing Page
- URL: http://localhost:3000

## Test Credentials (from Sample Data)

The generated sample data includes:

**Admin:**
- Email: `admin@timetally.com`
- Password: `admin123`

**Test Client (subdomain: testclient):**
- Business Name: Test Company
- Manager PIN: `0000`

**Employees:**
- Employee 1: John Doe (PIN: `1234`)
- Employee 2: Jane Smith (PIN: `5678`)
- Employee 3: Bob Johnson (PIN: `9999`)

## Creating Additional Clients

1. Login to admin portal
2. Click **"Add New Client"**
3. Enter:
   - Business Name: `Your Company Name`
   - Contact Email: `manager@yourcompany.com`
   - Leave subdomain blank (auto-generated from business name)
   - Leave manager PIN blank (defaults to `0000`)
4. Click **"Create Client"**
5. Add subdomain to `/etc/hosts` (e.g., `127.0.0.1 yourcompanyname.timetally.local`)
6. Access at: http://yourcompanyname.timetally.local:3000

## Adding Employees

1. Access the client portal (e.g., http://testclient.timetally.local:3000)
2. Click **"Manager Access"**
3. Enter manager PIN: `0000`
4. Click **"Add Employee"**
5. Enter employee details and unique 4-digit PIN
6. **Important:** Each PIN must be unique within the client
7. Employee can now login with their PIN only (no employee number needed)

## Submitting a Timesheet (Employee Workflow)

1. Access client portal
2. Click **"Employee Login"**
3. Enter your 4-digit PIN
4. Fill in work date, start time, end time
5. Click **"Submit Timesheet"**
6. Breaks are automatically calculated based on client's break rules!

## Exporting to CSV

1. Login as manager
2. Navigate using week controls
3. Click **"Export CSV"**
4. Import into MYOB or Excel

## Troubleshooting

### Can't access subdomains?
- Verify `/etc/hosts` entries
- Clear browser cache
- Restart dev server

### Database errors?
- Check `.env.local` credentials
- Verify schema was executed in Supabase
- Check Supabase logs

### TypeScript errors?
```bash
pnpm typecheck
```

## Next Steps

- Customize break rules in Supabase `break_rules` table
- Deploy to Vercel with wildcard DNS
- Add more employees and test timesheet workflow
- Explore manager dashboard features

## Support

For issues, check the full [README.md](./README.md) or open an issue on GitHub.
