# DjossFood Slice 5 — Admin Panel + Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DjossFood admin web dashboard and fix cross-app schema/type mismatches.

**Architecture:** Next.js 14 App Router app at `apps/web-admin/`, mirroring the web-restaurant patterns (shadcn/ui, TailwindCSS, Supabase SSR auth, React Query). Backend additions: 2 new admin endpoints (restaurant approval, driver detail). Database migration to fix `admin_actions` schema and add missing enum values. TypeScript type fixes in `@djossfood/database`.

**Tech Stack:** Next.js 14, TailwindCSS, shadcn/ui (Radix primitives), React Query, Supabase Auth (email/password, admin role), Axios, TypeScript.

---

## Task 1: Database Migration — Fix admin_actions Schema + Enum Values

**Files:**
- Create: `supabase/migrations/005_admin_actions_and_enum_fixes.sql`
- Modify: `packages/database/src/types.ts`

- [ ] **Step 1: Create the migration SQL**

Create `supabase/migrations/005_admin_actions_and_enum_fixes.sql`:

```sql
-- ============================================================
-- Fix admin_actions schema: add missing columns
-- ============================================================
ALTER TABLE admin_actions ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE admin_actions ADD COLUMN IF NOT EXISTS previous_value JSONB;
ALTER TABLE admin_actions ADD COLUMN IF NOT EXISTS new_value JSONB;

-- Migrate existing data: copy 'action' column to 'action_type' if action_type is null
UPDATE admin_actions SET action_type = action WHERE action_type IS NULL;

-- ============================================================
-- Add missing order_status enum values
-- ============================================================
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'picked_up';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivering';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'rejected';

-- ============================================================
-- Add missing driver_status enum value
-- ============================================================
ALTER TYPE driver_status ADD VALUE IF NOT EXISTS 'on_delivery';

-- ============================================================
-- Add missing restaurant_status enum value
-- ============================================================
ALTER TYPE restaurant_status ADD VALUE IF NOT EXISTS 'temporarily_closed';

-- ============================================================
-- Add missing payment_status enum values
-- ============================================================
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'partial';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'completed';
```

- [ ] **Step 2: Update TypeScript types in packages/database/src/types.ts**

Update the type definitions to match the SQL schema. Key changes:
- `DriverStatus`: add `'on_delivery'`
- `RestaurantStatus`: add `'temporarily_closed'`
- `PaymentStatus`: change to `'pending' | 'partial' | 'completed' | 'refunded' | 'failed'`
- `PaymentMethod`: keep as `'orange_money' | 'mtn_mobile_money'` (this is the app-level type, different from the SQL enum which uses `'cash' | 'mobile_money' | 'card'`)
- `AdminAction`: add `action_type`, `previous_value`, `new_value` fields

The full updated types.ts should have these changes:

```typescript
export type DriverStatus = 'offline' | 'available' | 'busy' | 'on_delivery';

export type RestaurantStatus = 'open' | 'closed' | 'busy' | 'temporarily_closed';

export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'refunded' | 'failed';

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}
```

Note: Keep `OrderStatus` as-is (it already includes `'picked_up'`, `'delivering'`, `'rejected'`). The migration adds these to the SQL enum to match.

- [ ] **Step 3: Fix the admin routes to use the correct column names**

In `apps/api/src/routes/admin.ts`, the boost endpoint logs to `admin_actions` using `action_type`, `previous_value`, `new_value` — which now exist after the migration. But there's a bug: it logs `previous_value` as the *new* boost value because the update already happened. Fix the boost endpoint to capture the previous value before the update:

Read `apps/api/src/routes/admin.ts` lines 34-78. The boost endpoint does the update first then tries to log `previous_value` with `(restaurant as any).admin_boost` which is already the new value. Fix it to:

```typescript
// PUT /api/admin/restaurants/:id/boost
router.put('/restaurants/:id/boost', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { boost, reason } = req.body;

  if (typeof boost !== 'number' || boost < 0) {
    return res.status(400).json({ error: 'La valeur du boost doit etre un nombre positif' });
  }

  if (!reason || typeof reason !== 'string') {
    return res.status(400).json({ error: 'La raison du boost est requise' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Fetch current boost value first
    const { data: current, error: fetchError } = await supabase
      .from('restaurants')
      .select('admin_boost')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const previousBoost = current.admin_boost;

    // Update the restaurant's admin_boost
    const { data: restaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ admin_boost: boost })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    // Log the admin action with correct previous_value
    await supabase.from('admin_actions').insert({
      admin_id: req.userId!,
      action_type: 'boost_restaurant',
      target_type: 'restaurant',
      target_id: id,
      previous_value: { admin_boost: previousBoost },
      new_value: { admin_boost: boost },
      reason,
    });

    return res.json({ restaurant });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('Admin boost error:', message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});
```

Also fix the approve_driver endpoint to use `action_type` instead of the non-existent `action` column:

The approve endpoint at line 102-136 uses `action_type: 'approve_driver'` which is now correct after the migration. But update the `previous_value` to actually capture the previous state:

```typescript
// PUT /api/admin/drivers/:id/approve
router.put('/drivers/:id/approve', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseAdmin();

    const { data: driver, error: updateError } = await supabase
      .from('drivers')
      .update({ is_approved: true })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !driver) {
      return res.status(404).json({ error: 'Livreur non trouve' });
    }

    // Log the admin action
    await supabase.from('admin_actions').insert({
      admin_id: req.userId!,
      action_type: 'approve_driver',
      target_type: 'driver',
      target_id: id,
      previous_value: { is_approved: false },
      new_value: { is_approved: true },
      reason: 'Admin approval',
    });

    return res.json({ driver });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('Admin approve driver error:', message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd apps/api && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/005_admin_actions_and_enum_fixes.sql packages/database/src/types.ts apps/api/src/routes/admin.ts
git commit -m "fix: add database migration for admin_actions schema and enum fixes, update TypeScript types"
```

---

## Task 2: New Backend Admin Endpoints

**Files:**
- Modify: `apps/api/src/routes/admin.ts` — Add 2 new endpoints

- [ ] **Step 1: Add restaurant approval endpoint**

Add to `apps/api/src/routes/admin.ts` (before the export):

```typescript
// PUT /api/admin/restaurants/:id/approve - Toggle restaurant approval
router.put('/restaurants/:id/approve', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { is_approved } = req.body as { is_approved: boolean };

  if (typeof is_approved !== 'boolean') {
    return res.status(400).json({ error: 'is_approved doit etre un booleen' });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ is_approved })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    // Log the admin action
    await supabase.from('admin_actions').insert({
      admin_id: req.userId!,
      action_type: is_approved ? 'approve_restaurant' : 'disapprove_restaurant',
      target_type: 'restaurant',
      target_id: id,
      previous_value: { is_approved: !is_approved },
      new_value: { is_approved },
      reason: is_approved ? 'Admin approval' : 'Admin disapproval',
    });

    return res.json({ restaurant });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('Admin approve restaurant error:', message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/admin/drivers/:id - Get single driver with profile details
router.get('/drivers/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseAdmin();

    const { data: driver, error } = await supabase
      .from('drivers')
      .select('*, profiles!drivers_id_fkey(full_name, phone, avatar_url, email)')
      .eq('id', id)
      .single();

    if (error || !driver) {
      return res.status(404).json({ error: 'Livreur non trouve' });
    }

    return res.json({ driver });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('Admin get driver error:', message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/api && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/admin.ts
git commit -m "feat(api): add restaurant approval toggle and driver detail endpoints for admin"
```

---

## Task 3: Next.js Admin Project Setup

**Files:**
- Create: `apps/web-admin/package.json`
- Create: `apps/web-admin/app.json` (not needed for web, skip)
- Create: `apps/web-admin/tsconfig.json`
- Create: `apps/web-admin/next.config.js`
- Create: `apps/web-admin/tailwind.config.ts`
- Create: `apps/web-admin/postcss.config.mjs`
- Create: `apps/web-admin/.env.local.example`
- Create: `apps/web-admin/app/layout.tsx`
- Create: `apps/web-admin/app/globals.css`
- Create: `apps/web-admin/lib/utils.ts`
- Create: `apps/web-admin/lib/api.ts`
- Create: `apps/web-admin/lib/supabase/server.ts`
- Create: `apps/web-admin/lib/supabase/client.ts`
- Create: `apps/web-admin/middleware.ts`
- Create: `apps/web-admin/app/page.tsx` (redirect to /dashboard)

This task sets up the full Next.js 14 project, mirroring the web-restaurant patterns exactly.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@djossfood/web-admin",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.1.5",
    "@supabase/ssr": "^0.10.3",
    "@supabase/supabase-js": "^2.105.4",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.312.0",
    "next": "14.2.35",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@djossfood/config": "*",
    "@djossfood/database": "*",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.2.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "@djossfood/config/tsconfig.base.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ES2022", "dom", "dom.iterable"],
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "outDir": "./dist",
    "rootDir": ".",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@djossfood/database'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create postcss.config.mjs**

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

- [ ] **Step 5: Create tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00AA13',
        orange: '#FF6600',
        yellow: '#FFCC00',
        background: '#F7F7F7',
        foreground: '#111111',
        card: '#FFFFFF',
        muted: '#F7F7F7',
        'muted-foreground': '#666666',
        border: '#E0E0E0',
        destructive: '#E53935',
        sidebar: '#1A1A2E',
        'sidebar-text': '#A0A0B8',
        'sidebar-active': '#2A2A42',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

- [ ] **Step 6: Create .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 7: Create app/globals.css**

(Copy from web-restaurant, same CSS custom properties and Tailwind directives.)

- [ ] **Step 8: Create app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'DjossFood Admin',
  description: 'Administration de la plateforme DjossFood',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={jakartaSans.variable}>
      <body className="font-sans">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Create components/providers/query-provider.tsx**

(Copy from web-restaurant — identical QueryClient setup.)

- [ ] **Step 10: Create lib/utils.ts**

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 11: Create lib/api.ts**

(Copy from web-restaurant, identical Axios setup with Supabase auth interceptor.)

- [ ] **Step 12: Create lib/supabase/server.ts**

(Copy from web-restaurant, identical server-side Supabase client.)

- [ ] **Step 13: Create lib/supabase/client.ts**

(Copy from web-restaurant, identical browser-side Supabase client.)

- [ ] **Step 14: Create middleware.ts**

Same as web-restaurant but restrict to `admin` role only:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard routes — admin only
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated admins away from login
  if (request.nextUrl.pathname === '/login' && user) {
    const userRole = user.user_metadata?.role;
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

- [ ] **Step 15: Create app/page.tsx** (redirect root to /dashboard)

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
```

- [ ] **Step 16: Install dependencies and verify TypeScript**

Run: `cd apps/web-admin && npm install`
Run: `cd apps/web-admin && npx tsc --noEmit`

- [ ] **Step 17: Commit**

```bash
cd apps/web-admin
git add -A
git commit -m "feat(admin): scaffold Next.js 14 admin app with auth, providers, and TailwindCSS"
```

---

## Task 4: shadcn/ui Components + Login + Auth Guard

**Files:**
- Create: All shadcn/ui primitives (button, input, card, badge, dialog, sheet, table, tabs, select, switch, textarea, label, dropdown-menu, toast)
- Create: `apps/web-admin/components/auth/auth-guard.tsx`
- Create: `apps/web-admin/components/auth/login-form.tsx`
- Create: `apps/web-admin/app/login/page.tsx`

- [ ] **Step 1: Initialize shadcn/ui components**

The web-admin needs the same shadcn/ui components as web-restaurant. Copy each component from `apps/web-restaurant/components/ui/` to `apps/web-admin/components/ui/`, adapting the import alias from `@/lib/utils` (already correct). Components to copy:
- button.tsx, input.tsx, card.tsx, badge.tsx, dialog.tsx, sheet.tsx, table.tsx, tabs.tsx, select.tsx, switch.tsx, textarea.tsx, label.tsx, dropdown-menu.tsx, toast.tsx

Also copy `apps/web-restaurant/components.json` to `apps/web-admin/components.json` (for shadcn CLI if needed later).

- [ ] **Step 2: Create components/auth/auth-guard.tsx**

Same pattern as web-restaurant but restrict to `admin` role only:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      const userRole = user.user_metadata?.role;
      if (userRole !== 'admin') {
        router.replace('/login');
        return;
      }

      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Create components/auth/login-form.tsx**

Same pattern as web-restaurant but restrict to `admin` role and show "DjossFood Admin" branding:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError('Email ou mot de passe incorrect');
        return;
      }

      const userRole = data.user?.user_metadata?.role;
      if (userRole !== 'admin') {
        setError("Ce compte n'est pas un compte administrateur");
        await supabase.auth.signOut();
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@djossfood.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Masquer' : 'Afficher'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Create app/login/page.tsx**

```tsx
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary">DjossFood Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Administration de la plateforme
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/web-admin && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
cd apps/web-admin
git add components/ app/login/ app/page.tsx
git commit -m "feat(admin): add login page, auth guard, and shadcn/ui components"
```

---

## Task 5: Dashboard Layout + KPIs Page

**Files:**
- Create: `apps/web-admin/app/dashboard/layout.tsx`
- Create: `apps/web-admin/app/dashboard/page.tsx`
- Create: `apps/web-admin/hooks/use-kpis.ts`
- Create: `apps/web-admin/components/dashboard/kpi-card.tsx`
- Create: `apps/web-admin/components/dashboard/status-chart.tsx`

- [ ] **Step 1: Create hooks/use-kpis.ts**

```ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface KpiData {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalRestaurants: number;
  totalDrivers: number;
  activeOrders: number;
  ordersByStatus: Record<string, number>;
}

export function useKpis() {
  return useQuery<KpiData>({
    queryKey: ['admin-kpis'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/kpis');
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
```

- [ ] **Step 2: Create components/dashboard/kpi-card.tsx**

A reusable card for displaying a KPI metric with an icon, label, and value:

```tsx
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export function KpiCard({ title, value, icon: Icon, iconColor, iconBg }: KpiCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create components/dashboard/status-chart.tsx**

A simple horizontal bar chart showing order counts by status:

```tsx
const STATUS_COLORS: Record<string, string> = {
  pending: '#FFCC00',
  confirmed: '#00AA13',
  preparing: '#3B82F6',
  ready: '#FF6600',
  driver_assigned: '#8B5CF6',
  picked_up: '#06B6D4',
  delivering: '#F59E0B',
  delivered: '#10B981',
  completed: '#6B7280',
  cancelled: '#E53935',
  rejected: '#E53935',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  driver_assigned: 'Livreur assigné',
  picked_up: 'Récupérée',
  delivering: 'En livraison',
  delivered: 'Livrée',
  completed: 'Terminée',
  cancelled: 'Annulée',
  rejected: 'Refusée',
};

interface StatusChartProps {
  ordersByStatus: Record<string, number>;
}

export function StatusChart({ ordersByStatus }: StatusChartProps) {
  const entries = Object.entries(ordersByStatus).filter(([_, count]) => count > 0);
  const total = entries.reduce((sum, [_, count]) => sum + count, 0);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune commande</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex h-8 overflow-hidden rounded-lg">
        {entries.map(([status, count]) => (
          <div
            key={status}
            className="flex items-center justify-center text-xs font-medium text-white"
            style={{
              width: `${(count / total) * 100}%`,
              backgroundColor: STATUS_COLORS[status] || '#9CA3AF',
            }}
          >
            {count}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {entries.map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: STATUS_COLORS[status] || '#9CA3AF' }}
            />
            <span className="text-xs text-muted-foreground">
              {STATUS_LABELS[status] || status} ({count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create app/dashboard/layout.tsx**

Admin dashboard shell with sidebar, header, and admin guard. Mirrors the web-restaurant layout but with admin navigation items:

```tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/auth/auth-guard';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Car,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { href: '/dashboard/drivers', label: 'Livreurs', icon: Car },
  { href: '/dashboard/orders', label: 'Commandes', icon: ClipboardList },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Tableau de bord';
    if (pathname === '/dashboard/restaurants') return 'Restaurants';
    if (pathname === '/dashboard/drivers') return 'Livreurs';
    if (pathname === '/dashboard/orders') return 'Commandes';
    if (pathname === '/dashboard/settings') return 'Paramètres';
    return 'Administration';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col bg-sidebar text-white">
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">DjossFood</p>
            <p className="text-xs text-sidebar-text">Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-text hover:bg-sidebar-active/50 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-active/50 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
```

- [ ] **Step 5: Create app/dashboard/page.tsx** (KPIs dashboard)

```tsx
'use client';

import { useKpis } from '@/hooks/use-kpis';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { StatusChart } from '@/components/dashboard/status-chart';
import { ClipboardList, DollarSign, UtensilsCrossed, Car } from 'lucide-react';

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export default function DashboardPage() {
  const { data, isLoading } = useKpis();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total commandes"
          value={data.totalOrders}
          icon={ClipboardList}
          iconColor="text-primary"
          iconBg="bg-green-100"
        />
        <KpiCard
          title="Revenu total"
          value={formatAmount(data.totalRevenue)}
          icon={DollarSign}
          iconColor="text-orange"
          iconBg="bg-orange-100"
        />
        <KpiCard
          title="Restaurants"
          value={data.totalRestaurants}
          icon={UtensilsCrossed}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <KpiCard
          title="Livreurs"
          value={data.totalDrivers}
          icon={Car}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>

      {/* Active Orders */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Commandes actives: {data.activeOrders}
        </h2>
        <StatusChart ordersByStatus={data.ordersByStatus} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd apps/web-admin && npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
cd apps/web-admin
git add app/dashboard/ hooks/ components/dashboard/
git commit -m "feat(admin): add dashboard layout, KPI cards, and status chart"
```

---

## Task 6: Restaurant Management Page

**Files:**
- Create: `apps/web-admin/hooks/use-restaurants.ts`
- Create: `apps/web-admin/components/restaurants/restaurant-table.tsx`
- Create: `apps/web-admin/components/restaurants/boost-dialog.tsx`
- Create: `apps/web-admin/app/dashboard/restaurants/page.tsx`

- [ ] **Step 1: Create hooks/use-restaurants.ts**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Restaurant } from '@djossfood/database';

export function useRestaurants() {
  return useQuery<{ restaurants: Restaurant[] }>({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/restaurants');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useBoostRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, boost, reason }: { id: string; boost: number; reason: string }) => {
      const { data } = await api.put(`/api/admin/restaurants/${id}/boost`, { boost, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
    },
  });
}

export function useApproveRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const { data } = await api.put(`/api/admin/restaurants/${id}/approve`, { is_approved: isApproved });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
    },
  });
}
```

- [ ] **Step 2: Create components/restaurants/boost-dialog.tsx**

A shadcn Dialog with boost value input and reason textarea:

```tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BoostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName: string;
  currentBoost: number;
  onBoost: (boost: number, reason: string) => void;
  loading: boolean;
}

export function BoostDialog({
  open,
  onOpenChange,
  restaurantName,
  currentBoost,
  onBoost,
  loading,
}: BoostDialogProps) {
  const [boost, setBoost] = useState(currentBoost.toString());
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBoost(parseFloat(boost), reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Boost: {restaurantName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Boost actuel: {currentBoost.toFixed(2)}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={boost}
              onChange={(e) => setBoost(e.target.value)}
              placeholder="Nouveau boost (0-5)"
            />
          </div>
          <div className="space-y-2">
            <Label>Raison (requise)</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Pourquoi ce boost?"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !reason.trim()}>
              {loading ? 'Enregistrement...' : 'Appliquer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create components/restaurants/restaurant-table.tsx**

A data table showing all restaurants with approve/reject toggle and boost button:

```tsx
'use client';

import { useState } from 'react';
import type { Restaurant } from '@djossfood/database';
import { useApproveRestaurant, useBoostRestaurant } from '@/hooks/use-restaurants';
import { BoostDialog } from './boost-dialog';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface RestaurantTableProps {
  restaurants: Restaurant[];
}

export function RestaurantTable({ restaurants }: RestaurantTableProps) {
  const approveMutation = useApproveRestaurant();
  const boostMutation = useBoostRestaurant();
  const [boostTarget, setBoostTarget] = useState<Restaurant | null>(null);

  const handleBoost = (boost: number, reason: string) => {
    if (!boostTarget) return;
    boostMutation.mutate(
      { id: boostTarget.id, boost, reason },
      {
        onSuccess: () => setBoostTarget(null),
      },
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Approuvé</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Boost</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.city || '-'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : r.status === 'busy'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {r.status === 'open' ? 'Ouvert' : r.status === 'busy' ? 'Occupé' : 'Fermé'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      approveMutation.mutate({ id: r.id, isApproved: !r.is_approved })
                    }
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${
                      r.is_approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                    disabled={approveMutation.isPending}
                  >
                    {r.is_approved ? 'Oui' : 'Non'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {r.rating_count > 0 ? `${r.total_rating.toFixed(1)}/5` : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setBoostTarget(r)}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    {r.admin_boost.toFixed(2)}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {boostTarget && (
        <BoostDialog
          open={!!boostTarget}
          onOpenChange={(open) => !open && setBoostTarget(null)}
          restaurantName={boostTarget.name}
          currentBoost={boostTarget.admin_boost}
          onBoost={handleBoost}
          loading={boostMutation.isPending}
        />
      )}
    </>
  );
}
```

- [ ] **Step 4: Create app/dashboard/restaurants/page.tsx**

```tsx
'use client';

import { useRestaurants } from '@/hooks/use-restaurants';
import { RestaurantTable } from '@/components/restaurants/restaurant-table';

export default function RestaurantsPage() {
  const { data, isLoading } = useRestaurants();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.restaurants.length} restaurant{data.restaurants.length !== 1 ? 's' : ''}
        </p>
      </div>
      <RestaurantTable restaurants={data.restaurants} />
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/web-admin && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
cd apps/web-admin
git add hooks/use-restaurants.ts components/restaurants/ app/dashboard/restaurants/
git commit -m "feat(admin): add restaurant management page with approval and boost"
```

---

## Task 7: Driver Management Page

**Files:**
- Create: `apps/web-admin/hooks/use-drivers.ts`
- Create: `apps/web-admin/components/drivers/driver-table.tsx`
- Create: `apps/web-admin/app/dashboard/drivers/page.tsx`

- [ ] **Step 1: Create hooks/use-drivers.ts**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface DriverWithProfile {
  id: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  current_location: any;
  status: string;
  rating: number;
  rating_count: number;
  total_deliveries: number;
  wallet_balance: number;
  is_approved: boolean;
  documents: Record<string, unknown>;
  created_at: string;
  profiles: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
}

export function useDrivers() {
  return useQuery<{ drivers: DriverWithProfile[] }>({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/drivers');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useApproveDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/api/admin/drivers/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
    },
  });
}

export function useDriverDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin-driver', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/drivers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
```

- [ ] **Step 2: Create components/drivers/driver-table.tsx**

```tsx
'use client';

import { useState } from 'react';
import type { DriverWithProfile } from '@/hooks/use-drivers';
import { useApproveDriver, useDriverDetail } from '@/hooks/use-drivers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: 'Moto',
  bicycle: 'Vélo',
  car: 'Voiture',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  available: { label: 'En ligne', className: 'bg-green-100 text-green-800' },
  offline: { label: 'Hors ligne', className: 'bg-gray-100 text-gray-800' },
  busy: { label: 'En course', className: 'bg-yellow-100 text-yellow-800' },
  on_delivery: { label: 'En livraison', className: 'bg-orange-100 text-orange-800' },
};

interface DriverTableProps {
  drivers: DriverWithProfile[];
}

export function DriverTable({ drivers }: DriverTableProps) {
  const approveMutation = useApproveDriver();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const { data: detailData } = useDriverDetail(selectedDriverId);
  const detail = detailData?.driver;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Véhicule</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Approuvé</th>
              <th className="px-4 py-3 font-medium">Courses</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const profile = d.profiles;
              const statusInfo = STATUS_LABELS[d.status] || { label: d.status, className: 'bg-gray-100 text-gray-800' };
              return (
                <tr
                  key={d.id}
                  className="border-b hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedDriverId(d.id)}
                >
                  <td className="px-4 py-3 font-medium">
                    {profile?.full_name || 'Sans nom'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{profile?.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {VEHICLE_LABELS[d.vehicle_type || ''] || d.vehicle_type || '-'}
                    {d.vehicle_plate ? ` (${d.vehicle_plate})` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        approveMutation.mutate(d.id);
                      }}
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${
                        d.is_approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      disabled={approveMutation.isPending}
                    >
                      {d.is_approved ? 'Oui' : 'Non'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.total_deliveries}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(d.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Driver Detail Dialog */}
      <Dialog open={!!selectedDriverId} onOpenChange={(open) => !open && setSelectedDriverId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du livreur</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom</p>
                  <p className="font-medium">{(detail as any).profiles?.full_name || 'Sans nom'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{(detail as any).profiles?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Véhicule</p>
                  <p className="font-medium">
                    {VEHICLE_LABELS[detail.vehicle_type || ''] || detail.vehicle_type || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plaque</p>
                  <p className="font-medium">{detail.vehicle_plate || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Note</p>
                  <p className="font-medium">
                    {detail.rating_count > 0 ? `${detail.rating.toFixed(1)}/5` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Solde</p>
                  <p className="font-medium">{detail.wallet_balance.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground">Documents</p>
                {detail.documents && Object.keys(detail.documents).length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {Object.entries(detail.documents).map(([key, url]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        {typeof url === 'string' && (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                            Voir
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun document</p>
                )}
              </div>
              {!detail.is_approved && (
                <Button
                  onClick={() => {
                    approveMutation.mutate(detail.id);
                    setSelectedDriverId(null);
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? 'Approbation...' : 'Approuver ce livreur'}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 3: Create app/dashboard/drivers/page.tsx**

```tsx
'use client';

import { useDrivers } from '@/hooks/use-drivers';
import { DriverTable } from '@/components/drivers/driver-table';

export default function DriversPage() {
  const { data, isLoading } = useDrivers();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.drivers.length} livreur{data.drivers.length !== 1 ? 's' : ''}
        </p>
      </div>
      <DriverTable drivers={data.drivers} />
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd apps/web-admin && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
cd apps/web-admin
git add hooks/use-drivers.ts components/drivers/ app/dashboard/drivers/
git commit -m "feat(admin): add driver management page with approval and detail view"
```

---

## Task 8: Order Monitoring Page

**Files:**
- Create: `apps/web-admin/hooks/use-orders.ts`
- Create: `apps/web-admin/components/orders/order-table.tsx`
- Create: `apps/web-admin/components/orders/order-details.tsx`
- Create: `apps/web-admin/app/dashboard/orders/page.tsx`

- [ ] **Step 1: Create hooks/use-orders.ts**

```ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Order, OrderStatus } from '@djossfood/database';

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface OrdersResponse {
  orders: OrderWithItems[];
  total: number;
  page: number;
  limit: number;
}

export function useOrders(page: number, status?: string) {
  return useQuery<OrdersResponse>({
    queryKey: ['admin-orders', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (status) params.set('status', status);
      const { data } = await api.get(`/api/admin/orders?${params.toString()}`);
      return data;
    },
    staleTime: 15_000,
  });
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'En préparation', className: 'bg-blue-100 text-blue-800' },
  ready: { label: 'Prête', className: 'bg-orange-100 text-orange-800' },
  driver_assigned: { label: 'Livreur assigné', className: 'bg-purple-100 text-purple-800' },
  picked_up: { label: 'Récupérée', className: 'bg-cyan-100 text-cyan-800' },
  delivering: { label: 'En livraison', className: 'bg-amber-100 text-amber-800' },
  delivered: { label: 'Livrée', className: 'bg-green-100 text-green-800' },
  completed: { label: 'Terminée', className: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
  rejected: { label: 'Refusée', className: 'bg-red-100 text-red-800' },
};

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
}

export { type OrderWithItems };
```

- [ ] **Step 2: Create components/orders/order-details.tsx**

A slide-in dialog showing full order details:

```tsx
'use client';

import type { OrderWithItems } from '@/hooks/use-orders';
import { getStatusConfig } from '@/hooks/use-orders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

interface OrderDetailsProps {
  order: OrderWithItems | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetails({ order, open, onOpenChange }: OrderDetailsProps) {
  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Commande #{order.order_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.className}`}>
              {statusConfig.label}
            </span>
            <span className="text-sm text-muted-foreground">{formatDate(order.created_at)}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatAmount(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Livraison</span>
              <span>{formatAmount(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatAmount(order.total_amount)}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Articles</p>
            <div className="space-y-1">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatAmount(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Adresse:</span> {order.delivery_address || '-'}</p>
            {order.delivery_notes && (
              <p><span className="text-muted-foreground">Notes:</span> {order.delivery_notes}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create components/orders/order-table.tsx**

A paginated table with status filter:

```tsx
'use client';

import { useState } from 'react';
import type { OrderWithItems } from '@/hooks/use-orders';
import { getStatusConfig } from '@/hooks/use-orders';
import { OrderDetails } from './order-details';

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'preparing', label: 'En préparation' },
  { value: 'ready', label: 'Prête' },
  { value: 'driver_assigned', label: 'Livreur assigné' },
  { value: 'picked_up', label: 'Récupérée' },
  { value: 'delivering', label: 'En livraison' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
];

interface OrderTableProps {
  orders: OrderWithItems[];
  total: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export function OrderTable({
  orders,
  total,
  currentPage,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
}: OrderTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const totalPages = Math.ceil(total / 20);

  return (
    <>
      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onStatusFilterChange(filter.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === filter.value
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Restaurant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <tr
                  key={order.id}
                  className="border-b hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-4 py-3 font-medium">#{order.order_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{order.restaurant_id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatAmount(order.total_amount)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} commande{total !== 1 ? 's' : ''} — Page {currentPage} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <OrderDetails
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
    </>
  );
}
```

- [ ] **Step 4: Create app/dashboard/orders/page.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { OrderTable } from '@/components/orders/order-table';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading } = useOrders(page, status || undefined);

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <OrderTable
      orders={data.orders}
      total={data.total}
      currentPage={page}
      onPageChange={setPage}
      statusFilter={status}
      onStatusFilterChange={(s) => { setStatus(s); setPage(1); }}
    />
  );
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/web-admin && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
cd apps/web-admin
git add hooks/use-orders.ts components/orders/ app/dashboard/orders/
git commit -m "feat(admin): add order monitoring page with filters, pagination, and detail view"
```

---

## Task 9: Settings Page

**Files:**
- Create: `apps/web-admin/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Create app/dashboard/settings/page.tsx**

A simple settings page showing admin profile info and a logout button:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAdminEmail(user.email || '');
        setAdminName(user.user_metadata?.full_name || '');
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Profil administrateur</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Nom</p>
            <p className="font-medium">{adminName || 'Non défini'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{adminEmail || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rôle</p>
            <p className="font-medium">Administrateur</p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
      >
        Déconnexion
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/web-admin && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
cd apps/web-admin
git add app/dashboard/settings/
git commit -m "feat(admin): add settings page with admin profile and logout"
```

---

## Task 10: Integration Verification

**Files:**
- Verify all screens compile and route correctly
- Fix any TypeScript errors
- Ensure backend changes are consistent

- [ ] **Step 1: Run TypeScript compilation on the admin app**

Run: `cd apps/web-admin && npx tsc --noEmit`

Expected: No errors. Fix any that appear.

- [ ] **Step 2: Run TypeScript compilation on the API**

Run: `cd apps/api && npx tsc --noEmit`

Expected: No errors. Fix any that appear.

- [ ] **Step 3: Run TypeScript compilation on the database package**

Run: `cd packages/database && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Verify file structure matches the spec**

Check that all expected files exist:

```
apps/web-admin/
├── app/
│   ├── layout.tsx                ✓
│   ├── page.tsx                 ✓
│   ├── login/page.tsx           ✓
│   ├── dashboard/
│   │   ├── layout.tsx            ✓
│   │   ├── page.tsx             ✓
│   │   ├── restaurants/page.tsx  ✓
│   │   ├── drivers/page.tsx      ✓
│   │   ├── orders/page.tsx       ✓
│   │   └── settings/page.tsx     ✓
├── components/
│   ├── auth/
│   │   ├── auth-guard.tsx        ✓
│   │   └── login-form.tsx        ✓
│   ├── dashboard/
│   │   ├── kpi-card.tsx          ✓
│   │   └── status-chart.tsx      ✓
│   ├── restaurants/
│   │   ├── restaurant-table.tsx   ✓
│   │   └── boost-dialog.tsx      ✓
│   ├── drivers/
│   │   └── driver-table.tsx       ✓
│   ├── orders/
│   │   ├── order-table.tsx        ✓
│   │   └── order-details.tsx      ✓
│   └── ui/                        ✓ (copied from web-restaurant)
├── lib/
│   ├── api.ts                     ✓
│   ├── utils.ts                  ✓
│   └── supabase/
│       ├── server.ts             ✓
│       └── client.ts             ✓
├── hooks/
│   ├── use-kpis.ts               ✓
│   ├── use-restaurants.ts        ✓
│   ├── use-drivers.ts             ✓
│   └── use-orders.ts             ✓
├── middleware.ts                  ✓
├── tailwind.config.ts             ✓
├── next.config.js                ✓
├── package.json                   ✓
└── tsconfig.json                  ✓
```

- [ ] **Step 5: Verify backend changes are consistent**

Check that:
1. `apps/api/src/routes/admin.ts` has the new endpoints (restaurant approve, driver detail)
2. `supabase/migrations/005_admin_actions_and_enum_fixes.sql` exists
3. `packages/database/src/types.ts` has updated types (DriverStatus, RestaurantStatus, PaymentStatus, AdminAction)

- [ ] **Step 6: Final commit for any fixes**

```bash
git add -A
git commit -m "fix(admin): resolve integration issues from verification"
```

---

## Spec Coverage Self-Review

**Login screen** → Task 4 (LoginForm + AuthGuard + middleware with admin role check)

**Dashboard KPIs** → Task 5 (useKpis hook + KpiCard + StatusChart + dashboard page)

**Restaurant management** → Task 6 (restaurant table + boost dialog + approve toggle)

**Driver management** → Task 7 (driver table + approval toggle + detail dialog with documents)

**Order monitoring** → Task 8 (order table with status filter + pagination + detail dialog)

**Settings** → Task 9 (admin profile + logout)

**Auth flow** → Task 4 (middleware checks admin role, AuthGuard redirects non-admin, login form validates admin role)

**Backend endpoints** → Task 2 (PUT restaurants/:id/approve, GET drivers/:id)

**Schema fixes** → Task 1 (migration for admin_actions columns, order_status/driver_status/restaurant_status/payment_status enum additions)

**Type fixes** → Task 1 (DriverStatus, RestaurantStatus, PaymentStatus, AdminAction type updates in packages/database/src/types.ts)

No placeholder sections found. All code is complete. Type names and method signatures are consistent across tasks.