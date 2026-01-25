# Testing

## Current Status

**No test infrastructure is currently set up.**

The project does not have:
- Unit tests
- Integration tests
- E2E tests
- Test configuration files

## Recommended Setup

### 1. Unit Testing with Vitest

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

#### Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '~': './src',
      '@': './src',
    },
  },
});
```

### 2. E2E Testing with Playwright

```bash
pnpm add -D @playwright/test
```

#### Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'pnpm dev',
    port: 3000,
  },
});
```

## Testing Priorities

### High Priority
1. **Authentication flows** - Admin, manager, employee login
2. **Timesheet CRUD** - Create, read, update operations
3. **Break rule calculations** - Automatic break deductions
4. **Subdomain routing** - Correct portal routing

### Medium Priority
1. **Employee management** - Add, edit, deactivate
2. **Client management** - Admin operations
3. **CSV export** - Data export functionality
4. **Time calculations** - Hours worked computation

### Low Priority
1. **UI components** - Button, dialog, form interactions
2. **Responsive behavior** - Mobile vs desktop

## Test Structure

### Recommended Directory Layout
```
src/
├── __tests__/           # Unit tests alongside source
│   ├── lib/
│   │   └── timeUtils.test.ts
│   └── components/
│       └── PinPad.test.tsx
└── test/
    └── setup.ts         # Test setup/globals

e2e/
├── auth/
│   ├── admin-login.spec.ts
│   ├── manager-login.spec.ts
│   └── employee-login.spec.ts
├── timesheets/
│   └── crud.spec.ts
└── fixtures/
    └── test-data.ts
```

## Test Data Strategy

### Supabase Test Environment
1. Create separate Supabase project for testing
2. Use seed scripts to populate test data
3. Reset database between test runs

### Fixtures
```typescript
// e2e/fixtures/test-data.ts
export const testClient = {
  subdomain: 'testclient',
  manager_pin: '1234',
};

export const testEmployee = {
  first_name: 'Test',
  last_name: 'Employee',
  pin: '0000',
};
```

## Scripts to Add

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```
