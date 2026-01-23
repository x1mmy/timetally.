# Coding Conventions

## TypeScript

### Type Definitions
- Use `interface` for object shapes
- Use `type` for unions, primitives, and computed types
- Prefer explicit return types on exported functions

```typescript
// Interfaces for entities
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

// Types for forms/inputs
export type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
};

// Union types
type Status = "active" | "inactive" | "suspended";
```

### Strictness
- `strict: true` enabled
- `noUncheckedIndexedAccess: true` - Array access returns `T | undefined`
- All JS files checked (`checkJs: true`)

### Naming
| Item | Convention | Example |
|------|------------|---------|
| Interfaces | PascalCase | `Employee`, `Timesheet` |
| Types | PascalCase | `CreateEmployeeInput` |
| Functions | camelCase | `createSupabaseServer()` |
| Constants | UPPER_SNAKE | `API_BASE_URL` |
| Components | PascalCase | `ClientList` |

## React Components

### Server vs Client Components
```typescript
// Server Component (default) - page.tsx
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Client Component - requires directive
"use client";
export function InteractiveForm() {
  const [state, setState] = useState();
  return <form>...</form>;
}
```

### Component Organization
```typescript
// 1. Directive (if client)
"use client";

// 2. Imports (grouped)
import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { Employee } from "~/types/database";

// 3. Types (component-specific)
interface Props {
  employee: Employee;
  onSave: () => void;
}

// 4. Component
export function EmployeeCard({ employee, onSave }: Props) {
  // State
  // Effects
  // Handlers
  // Render
}
```

### Props Pattern
- Destructure props in function signature
- Use TypeScript interfaces for complex props
- Prefer controlled components

## Styling (Tailwind CSS)

### Utility Pattern
```typescript
import { cn } from "~/lib/utils";

// Conditional classes with cn()
<div className={cn(
  "rounded-lg p-4",
  isActive && "bg-blue-500",
  className
)} />
```

### Component Variants (CVA)
```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## API Routes

### Request/Response Pattern
```typescript
// src/app/api/client/employees/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "~/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const subdomain = request.headers.get("x-subdomain");
    if (!subdomain) {
      return NextResponse.json(
        { error: "Missing subdomain" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .select("*");

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
```

### Error Handling
- Return appropriate HTTP status codes
- Include error message in JSON response
- Log errors server-side
- Never expose internal errors to client

## Database Types

### Snake Case ↔ Camel Case
- Database columns: `snake_case`
- TypeScript interfaces: `snake_case` (match DB)
- Form inputs: `camelCase`

```typescript
// Database type (matches schema)
interface Employee {
  first_name: string;
  last_name: string;
}

// Form input type (camelCase)
interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
}
```

## File Organization

### Imports Order
1. React/Next.js
2. External libraries
3. Internal components (`~/components/`)
4. Internal utilities (`~/lib/`)
5. Types (`~/types/`)
6. Styles
7. Relative imports

```typescript
// React & Next
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// External
import { format } from "date-fns";

// Internal components
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";

// Internal utilities
import { cn } from "~/lib/utils";
import { createSupabaseServer } from "~/lib/supabase/server";

// Types
import type { Employee } from "~/types/database";
```

## Code Formatting

### Prettier Config
- Tailwind class sorting enabled (`prettier-plugin-tailwindcss`)
- Check: `pnpm format:check`
- Fix: `pnpm format:write`

### ESLint
- Next.js config (`eslint-config-next`)
- TypeScript ESLint rules
- Run: `pnpm lint` or `pnpm lint:fix`
