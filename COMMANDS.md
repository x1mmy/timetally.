# TimeTally Command Reference

Quick reference for all common commands.

## Development

```bash
# Start development server with hot reload
pnpm dev

# Start with Turbo (faster)
pnpm dev --turbo
```

## Building

```bash
# Build for production
pnpm build

# Start production server (after build)
pnpm start

# Preview production build
pnpm preview
```

## Code Quality

```bash
# Run TypeScript type checking
pnpm typecheck

# Run ESLint
pnpm lint

# Fix ESLint errors automatically
pnpm lint:fix

# Format code with Prettier
pnpm format:write

# Check code formatting
pnpm format:check

# Run all checks (lint + typecheck)
pnpm check
```

## Database

```bash
# Generate bcrypt hash for password/PIN
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10))"

# Example: Create admin user
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10))"
```

## Testing URLs

```bash
# Development URLs (after setting up /etc/hosts)
http://localhost:3000                    # Landing page
http://admin.timetally.local:3000        # Admin portal
http://testclient.timetally.local:3000   # Client portal
```

## Deployment

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## Package Management

```bash
# Install all dependencies
pnpm install

# Add a new dependency
pnpm add package-name

# Add a dev dependency
pnpm add -D package-name

# Update all dependencies
pnpm update

# Remove a dependency
pnpm remove package-name
```

## Git

```bash
# Initial commit
git add .
git commit -m "Initial TimeTally implementation"

# Push to GitHub
git remote add origin YOUR_REPO_URL
git push -u origin main
```

## Supabase

```sql
-- Create admin user (run in Supabase SQL Editor)
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@timetally.com', 'YOUR_BCRYPT_HASH');

-- Create test client
INSERT INTO clients (business_name, subdomain, contact_email, manager_pin)
VALUES ('Test Company', 'testcompany', 'manager@test.com', 'YOUR_BCRYPT_HASH');

-- Create test employee
INSERT INTO employees (client_id, employee_number, first_name, last_name, pin_hash)
VALUES ('CLIENT_ID', 'EMP001', 'John', 'Doe', 'YOUR_BCRYPT_HASH');
```

## Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local  # or use your preferred editor
```

## Hosts File Setup

### macOS/Linux
```bash
# Edit hosts file
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 admin.timetally.local
127.0.0.1 testclient.timetally.local

# Save and exit (Ctrl+X, Y, Enter)
```

### Windows
```powershell
# Run PowerShell as Administrator
notepad C:\Windows\System32\drivers\etc\hosts

# Add these lines:
127.0.0.1 admin.timetally.local
127.0.0.1 testclient.timetally.local

# Save and close
```

## Troubleshooting

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear build artifacts
pnpm clean  # If you add this script to package.json

# Check for TypeScript errors
pnpm typecheck

# Check for linting errors
pnpm lint
```

## Quick Start (Full Flow)

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment (edit with your Supabase credentials)
cp .env.example .env.local
nano .env.local

# 3. Set up local subdomains
sudo nano /etc/hosts
# Add: 127.0.0.1 admin.timetally.local

# 4. Start development server
pnpm dev

# 5. Open browser
open http://admin.timetally.local:3000
```

## Production Deployment

```bash
# 1. Build and test locally
pnpm build
pnpm start

# 2. Test production build
open http://localhost:3000

# 3. Deploy to Vercel
vercel --prod

# 4. Configure DNS (in your domain provider)
# Add CNAME record: * -> cname.vercel-dns.com

# 5. Update environment variables in Vercel
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# NEXT_PUBLIC_APP_URL=https://timetally.com
```

## Useful Shortcuts

```bash
# Development workflow
pnpm dev              # Start dev server
pnpm typecheck        # Check types
pnpm lint:fix         # Fix lint errors
pnpm format:write     # Format code

# Pre-commit checks
pnpm check            # Run all checks

# Production workflow
pnpm build            # Build for production
pnpm start            # Start production server
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

**Pro Tip**: Add these aliases to your shell (`.bashrc` or `.zshrc`):

```bash
alias tt-dev="pnpm dev"
alias tt-build="pnpm build"
alias tt-check="pnpm typecheck && pnpm lint"
alias tt-admin="open http://admin.timetally.local:3000"
```
