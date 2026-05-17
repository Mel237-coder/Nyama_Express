# DjossFood Slice 3 — Restaurant Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 web dashboard for restaurant owners to manage orders (Kanban board with real-time updates), menus (CRUD), and restaurant settings.

**Architecture:** Next.js 14 App Router with TailwindCSS and shadcn/ui. Supabase Auth (email/password) for authentication. Socket.IO for real-time order updates with sound alerts. React Query for server state. The backend Express API gains new restaurant-owner-scoped endpoints for orders, menu CRUD, and settings.

**Tech Stack:** Next.js 14 (App Router), TailwindCSS, shadcn/ui, React Query (@tanstack/react-query), Socket.IO client, Supabase Auth, Axios, TypeScript

---

## File Structure

```
apps/web-restaurant/
├── app/
│   ├── layout.tsx                    # Root layout: providers (QueryClient, Supabase)
│   ├── login/
│   │   └── page.tsx                  # Email/password login page
│   ├── dashboard/
│   │   ├── layout.tsx                 # Dashboard shell (sidebar + header + auth guard)
│   │   ├── page.tsx                   # Orders Kanban (default route)
│   │   ├── menu/
│   │   │   └── page.tsx               # Menu management page
│   │   └── settings/
│   │       └── page.tsx               # Restaurant settings page
├── components/
│   ├── auth/
│   │   ├── auth-guard.tsx             # Client component: redirect if not logged in
│   │   └── login-form.tsx             # Email/password form component
│   ├── orders/
│   │   ├── kanban-board.tsx           # Multi-column Kanban container
│   │   ├── kanban-column.tsx          # Single status column
│   │   ├── order-card.tsx             # Order card with actions
│   │   └── order-details-sheet.tsx     # Expanded order details
│   ├── menu/
│   │   ├── category-tabs.tsx           # Horizontal category tabs
│   │   ├── item-table.tsx              # Menu items table
│   │   └── item-modal.tsx              # Add/edit item dialog
│   ├── settings/
│   │   └── settings-form.tsx           # Restaurant settings form
│   └── ui/                             # shadcn/ui components (auto-generated)
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── sheet.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       ├── textarea.tsx
│       ├── label.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── dropdown-menu.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts                  # Server-side Supabase client
│   │   └── client.ts                  # Browser-side Supabase client
│   ├── api.ts                         # Axios instance with auth interceptor
│   ├── socket.ts                      # Socket.IO client singleton
│   └── utils.ts                       # cn() utility for shadcn/ui
├── hooks/
│   ├── use-orders.ts                  # React Query + Socket.IO for orders
│   ├── use-menu.ts                    # React Query for menu CRUD
│   └── use-restaurant.ts             # React Query for restaurant data
├── contexts/
│   └── restaurant-context.tsx          # Restaurant context provider
├── middleware.ts                        # Next.js auth middleware
├── public/
│   └── sounds/
│       └── notification.mp3            # New order chime (placeholder)
├── tailwind.config.ts
├── next.config.js
├── components.json                     # shadcn/ui config
├── package.json
├── postcss.config.js
└── tsconfig.json

apps/api/src/routes/
├── ...existing routes...
├── restaurantOwner.ts                  # NEW: Restaurant-owner-scoped routes
└── index.ts                            # MODIFIED: Register new routes
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `apps/web-restaurant/package.json`
- Create: `apps/web-restaurant/tsconfig.json`
- Create: `apps/web-restaurant/next.config.js`
- Create: `apps/web-restaurant/tailwind.config.ts`
- Create: `apps/web-registry/postcss.config.js`
- Create: `apps/web-restaurant/app/layout.tsx`
- Create: `apps/web-restaurant/app/globals.css`
- Create: `apps/web-restaurant/lib/utils.ts`
- Create: `apps/web-restaurant/components.json`
- Create: `apps/web-restaurant/public/sounds/notification.mp3` (empty placeholder)
- Create: `apps/web-restaurant/.env.local` (template)

- [ ] **Step 1: Initialize Next.js project**

Run from the `djossfood/` root:

```bash
cd apps
npx create-next-app@14 web-restaurant --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-git
```

This creates the Next.js 14 project with App Router, TailwindCSS, and TypeScript.

- [ ] **Step 2: Update package.json for monorepo integration**

Replace the content of `apps/web-restaurant/package.json` with:

```json
{
  "name": "@djossfood/web-restaurant",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.312.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "sonner": "^1.3.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.2.0",
    "@djossfood/config": "*",
    "@djossfood/database": "*"
  }
}
```

- [ ] **Step 3: Update tsconfig.json for monorepo**

Replace `apps/web-restaurant/tsconfig.json` with:

```json
{
  "extends": "@djossfood/config/tsconfig.base.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "outDir": "./dist",
    "rootDir": ".",
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

- [ ] **Step 4: Configure TailwindCSS with DjossFood design tokens**

Replace `apps/web-restaurant/tailwind.config.ts` with:

```typescript
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

- [ ] **Step 5: Create globals.css with TailwindCSS directives and font import**

Replace `apps/web-restaurant/app/globals.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 247 0% 97%;
    --foreground: 0 0% 7%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 7%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 7%;
    --primary: 127 100% 33%;
    --primary-foreground: 0 0% 100%;
    --secondary: 247 0% 97%;
    --secondary-foreground: 0 0% 7%;
    --muted: 247 0% 97%;
    --muted-foreground: 0 0% 40%;
    --accent: 247 0% 97%;
    --accent-foreground: 0 0% 7%;
    --destructive: 0 68% 54%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 88%;
    --input: 0 0% 88%;
    --ring: 127 100% 33%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
}
```

- [ ] **Step 6: Create lib/utils.ts for shadcn/ui**

Create `apps/web-restaurant/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Create components.json for shadcn/ui**

Create `apps/web-restaurant/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 8: Create next.config.js**

Replace `apps/web-restaurant/next.config.js` with:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@djossfood/database'],
};

module.exports = nextConfig;
```

- [ ] **Step 9: Create .env.local template**

Create `apps/web-restaurant/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- [ ] **Step 10: Create placeholder notification sound**

Create an empty file at `apps/web-restaurant/public/sounds/notification.mp3` (this will be replaced with an actual sound file later). Run:

```bash
touch apps/web-restaurant/public/sounds/notification.mp3
```

Or create an empty file manually. The actual MP3 file should be added later.

- [ ] **Step 11: Install dependencies**

Run from `apps/web-restaurant/`:

```bash
cd apps/web-restaurant
npm install
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card badge dialog sheet table tabs select switch textarea label dropdown-menu
npm install sonner
```

- [ ] **Step 12: Create root layout.tsx with providers**

Create `apps/web-restaurant/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from 'sonner';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'DjossFood Pro — Gestion Restaurant',
  description: 'Tableau de bord pour la gestion de votre restaurant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={jakartaSans.variable}>
      <body className="font-sans">
        <QueryProvider>
          {children}
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
```

Create `apps/web-restaurant/components/providers/query-provider.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 13: Commit project scaffolding**

```bash
cd djossfood
git add apps/web-restaurant/
git commit -m "feat(web-restaurant): scaffold Next.js 14 project with TailwindCSS and shadcn/ui

- Next.js 14 App Router with TypeScript
- TailwindCSS configured with DjossFood design tokens
- shadcn/ui components initialized
- React Query provider in root layout
- Plus Jakarta Sans font
- Monorepo integration with @djossfood/database"
```

---

### Task 2: Backend — Restaurant-Owner API Routes

**Files:**
- Create: `apps/api/src/routes/restaurantOwner.ts`
- Modify: `apps/api/src/routes/index.ts`

The restaurant dashboard needs API endpoints that don't exist yet: listing a restaurant's orders, managing menu categories/items, and updating restaurant settings. This task adds those routes.

- [ ] **Step 1: Create restaurantOwner routes file**

Create `apps/api/src/routes/restaurantOwner.ts`:

```typescript
import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { getSupabaseAdmin } from '../config/supabase';

const router = Router();

// All routes require auth + restaurant_owner role
router.use(authMiddleware);
router.use(roleGuard('restaurant_owner'));

// GET /api/restaurant-owner/restaurant — Get current user's restaurant
router.get('/restaurant', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', req.userId!)
      .eq('is_active', true)
      .single();

    if (error || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    return res.json({ restaurant });
  } catch (err: any) {
    console.error('Get restaurant error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/restaurant-owner/restaurant — Update restaurant settings
router.put('/restaurant', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    // Find the restaurant owned by this user
    const { data: existing, error: findError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.userId!)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const allowedFields = [
      'name', 'description', 'phone', 'address', 'opening_hours',
      'min_order_amount', 'delivery_fee', 'status', 'logo_url', 'cover_url',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Aucun champ a mettre a jour' });
    }

    const { data: restaurant, error: updateError } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.json({ restaurant });
  } catch (err: any) {
    console.error('Update restaurant error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/restaurant-owner/orders — Get orders for current restaurant
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    // Find the restaurant owned by this user
    const { data: restaurant, error: findError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.userId!)
      .single();

    if (findError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const status = req.query.status as string | undefined;

    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    } else {
      // By default, only show active orders (not completed/cancelled/rejected)
      query = query.not('status', 'in', '(completed,cancelled,rejected)');
    }

    const { data: orders, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ orders });
  } catch (err: any) {
    console.error('Get orders error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/restaurant-owner/menu-categories — Create a menu category
router.post('/menu-categories', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.userId!)
      .single();

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const { name, description, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    const { data: category, error } = await supabase
      .from('menu_categories')
      .insert({
        restaurant_id: restaurant.id,
        name,
        description: description || null,
        sort_order: sort_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ category });
  } catch (err: any) {
    console.error('Create category error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/restaurant-owner/menu-categories/:id — Update a menu category
router.put('/menu-categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.userId!)
      .single();

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const { id } = req.params;
    const allowedFields = ['name', 'description', 'sort_order', 'is_active'];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const { data: category, error } = await supabase
      .from('menu_categories')
      .update(updateData)
      .eq('id', id)
      .eq('restaurant_id', restaurant.id)
      .select()
      .single();

    if (error || !category) {
      return res.status(404).json({ error: 'Categorie non trouvee' });
    }

    return res.json({ category });
  } catch (err: any) {
    console.error('Update category error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// DELETE /api/restaurant-owner/menu-categories/:id — Delete a menu category
router.delete('/menu-categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.userId!)
      .single();

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurant.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: 'Categorie supprimee' });
  } catch (err: any) {
    console.error('Delete category error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/restaurant-owner/menu-items — Create a menu item
router.post('/menu-items', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.userId!)
      .single();

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const { name, description, price, category_id, image_url, tags, is_available } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Le nom et le prix sont requis' });
    }

    const { data: item, error } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: restaurant.id,
        category_id: category_id || null,
        name,
        description: description || null,
        price,
        image_url: image_url || null,
        tags: tags || [],
        is_available: is_available !== undefined ? is_available : true,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ item });
  } catch (err: any) {
    console.error('Create menu item error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/restaurant-owner/menu-items/:id — Update a menu item
router.put('/menu-items/:id', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.userId!)
      .single();

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const { id } = req.params;
    const allowedFields = ['name', 'description', 'price', 'category_id', 'image_url', 'tags', 'is_available'];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const { data: item, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .eq('restaurant_id', restaurant.id)
      .select()
      .single();

    if (error || !item) {
      return res.status(404).json({ error: 'Article non trouve' });
    }

    return res.json({ item });
  } catch (err: any) {
    console.error('Update menu item error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// DELETE /api/restaurant-owner/menu-items/:id — Delete a menu item
router.delete('/menu-items/:id', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', req.userId!)
      .single();

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouve' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurant.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: 'Article supprime' });
  } catch (err: any) {
    console.error('Delete menu item error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const restaurantOwnerRouter = router;
```

- [ ] **Step 2: Register the new routes in the router index**

Modify `apps/api/src/routes/index.ts` to add:

```typescript
import { Router } from 'express';
import { authRouter } from './auth';
import { searchRouter } from './search';
import { restaurantsRouter } from './restaurants';
import { ordersRouter } from './orders';
import { driversRouter } from './drivers';
import { paymentsRouter } from './payments';
import { ratingsRouter } from './ratings';
import { adminRouter } from './admin';
import { restaurantOwnerRouter } from './restaurantOwner';

const router = Router();

// Public routes
router.use('/auth', authRouter);
router.use('/search', searchRouter);
router.use('/restaurants', restaurantsRouter);
router.use('/payments', paymentsRouter);

// Protected routes (auth middleware applied inside each router)
router.use('/orders', ordersRouter);
router.use('/drivers', driversRouter);
router.use('/ratings', ratingsRouter);

// Admin routes (auth + role guard applied inside the router)
router.use('/admin', adminRouter);

// Restaurant owner routes (auth + role guard applied inside the router)
router.use('/restaurant-owner', restaurantOwnerRouter);

export const apiRouter = router;
```

- [ ] **Step 3: Verify the API compiles**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit backend changes**

```bash
cd djossfood
git add apps/api/src/routes/restaurantOwner.ts apps/api/src/routes/index.ts
git commit -m "feat(api): add restaurant-owner-scoped API routes

- GET /restaurant-owner/restaurant — get current user's restaurant
- PUT /restaurant-owner/restaurant — update restaurant settings
- GET /restaurant-owner/orders — get orders for current restaurant
- POST /restaurant-owner/menu-categories — create category
- PUT /restaurant-owner/menu-categories/:id — update category
- DELETE /restaurant-owner/menu-categories/:id — delete category
- POST /restaurant-owner/menu-items — create menu item
- PUT /restaurant-owner/menu-items/:id — update menu item
- DELETE /restaurant-owner/menu-items/:id — delete menu item

All routes require auth + restaurant_owner role guard"
```

---

### Task 3: Supabase Auth + Login Page

**Files:**
- Create: `apps/web-restaurant/lib/supabase/server.ts`
- Create: `apps/web-restaurant/lib/supabase/client.ts`
- Create: `apps/web-restaurant/middleware.ts`
- Create: `apps/web-restaurant/components/auth/auth-guard.tsx`
- Create: `apps/web-restaurant/components/auth/login-form.tsx`
- Create: `apps/web-restaurant/app/login/page.tsx`
- Create: `apps/web-restaurant/lib/api.ts`

- [ ] **Step 1: Create server-side Supabase client**

Create `apps/web-restaurant/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@djossfood/database';

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 2: Create browser-side Supabase client**

Create `apps/web-restaurant/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@djossfood/database';

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Create Next.js middleware for auth protection**

Create `apps/web-restaurant/middleware.ts`:

```typescript
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has restaurant_owner role
    const userRole = user.user_metadata?.role;
    if (userRole !== 'restaurant_owner' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from login
  if (request.nextUrl.pathname === '/login' && user) {
    const userRole = user.user_metadata?.role;
    if (userRole === 'restaurant_owner' || userRole === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

- [ ] **Step 4: Create auth guard component**

Create `apps/web-restaurant/components/auth/auth-guard.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export function AuthGuard({ children }: { children: React.ReactNode }) {
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
      if (userRole !== 'restaurant_owner' && userRole !== 'admin') {
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

- [ ] **Step 5: Create login form component**

Create `apps/web-restaurant/components/auth/login-form.tsx`:

```typescript
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
      if (userRole !== 'restaurant_owner' && userRole !== 'admin') {
        setError('Ce compte n\'est pas un compte restaurateur');
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
          placeholder="restaurant@example.com"
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

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 6: Create login page**

Create `apps/web-restaurant/app/login/page.tsx`:

```typescript
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary">DjossFood Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestion de votre restaurant
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

- [ ] **Step 7: Create Axios API client with auth interceptor**

Create `apps/web-restaurant/lib/api.ts`:

```typescript
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const supabase = createBrowserSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

- [ ] **Step 8: Commit auth and login**

```bash
cd djossfood
git add apps/web-restaurant/lib/ apps/web-restaurant/middleware.ts apps/web-restaurant/components/auth/ apps/web-restaurant/app/login/
git commit -m "feat(web-restaurant): add Supabase auth, middleware, and login page

- Server and browser Supabase clients using @supabase/ssr
- Next.js middleware protecting /dashboard routes
- AuthGuard client component for redirect on unauthenticated
- LoginForm with email/password, role validation
- Axios client with auth interceptor and 401 redirect"
```

---

### Task 4: Dashboard Layout + Restaurant Context

**Files:**
- Create: `apps/web-restaurant/contexts/restaurant-context.tsx`
- Create: `apps/web-restaurant/hooks/use-restaurant.ts`
- Create: `apps/web-restaurant/app/dashboard/layout.tsx`

- [ ] **Step 1: Create restaurant context**

Create `apps/web-restaurant/contexts/restaurant-context.tsx`:

```typescript
'use client';

import { createContext, useContext } from 'react';
import type { Restaurant } from '@djossfood/database';

interface RestaurantContextType {
  restaurant: Restaurant;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export function RestaurantProvider({
  restaurant,
  children,
}: {
  restaurant: Restaurant;
  children: React.ReactNode;
}) {
  return (
    <RestaurantContext.Provider value={{ restaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurantContext() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurantContext must be used within a RestaurantProvider');
  }
  return context;
}
```

- [ ] **Step 2: Create useRestaurant hook**

Create `apps/web-restaurant/hooks/use-restaurant.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Restaurant } from '@djossfood/database';

export function useRestaurant() {
  return useQuery<{ restaurant: Restaurant }>({
    queryKey: ['restaurant'],
    queryFn: async () => {
      const { data } = await api.get('/api/restaurant-owner/restaurant');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 3: Create dashboard layout with sidebar and header**

Create `apps/web-restaurant/app/dashboard/layout.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { RestaurantProvider } from '@/contexts/restaurant-context';
import { useRestaurant } from '@/hooks/use-restaurant';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  ClipboardList,
  UtensilsCrossed,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Commandes', icon: ClipboardList },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/settings', label: 'Parametres', icon: Settings },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading } = useRestaurant();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data?.restaurant) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            Aucun restaurant trouve
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre compte n&apos;est pas associe a un restaurant.
          </p>
        </div>
      </div>
    );
  }

  const restaurant = data.restaurant;
  const isOpen = restaurant.status === 'open';

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Commandes';
    if (pathname === '/dashboard/menu') return 'Menu';
    if (pathname === '/dashboard/settings') return 'Parametres';
    return 'Tableau de bord';
  };

  return (
    <RestaurantProvider restaurant={restaurant}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside className="flex w-60 flex-col bg-sidebar text-white">
          {/* Logo / Restaurant name */}
          <div className="flex items-center gap-3 border-b border-white/10 p-4">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold">
                {restaurant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{restaurant.name}</p>
              <p className="text-xs text-sidebar-text">DjossFood Pro</p>
            </div>
          </div>

          {/* Navigation */}
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

          {/* Logout */}
          <div className="border-t border-white/10 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-active/50 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Deconnexion
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-14 items-center justify-between border-b bg-card px-6">
            <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
            <div className="flex items-center gap-4">
              <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{restaurant.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isOpen
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isOpen ? 'Ouvert' : 'Ferme'}
                </span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </RestaurantProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
```

- [ ] **Step 4: Commit dashboard layout**

```bash
cd djossfood
git add apps/web-restaurant/contexts/ apps/web-restaurant/hooks/use-restaurant.ts apps/web-restaurant/app/dashboard/layout.tsx
git commit -m "feat(web-restaurant): add dashboard layout with sidebar and restaurant context

- RestaurantContext provides restaurant data to all dashboard pages
- useRestaurant hook fetches current user's restaurant
- Dashboard layout with dark sidebar, navigation, header with status badge
- AuthGuard wrapping all dashboard routes"
```

---

### Task 5: Orders Data Layer — API Hooks + Socket.IO

**Files:**
- Create: `apps/web-restaurant/lib/socket.ts`
- Create: `apps/web-restaurant/hooks/use-orders.ts`

- [ ] **Step 1: Create Socket.IO client singleton**

Create `apps/web-restaurant/lib/socket.ts`:

```typescript
import { io, type Socket } from 'socket.io-client';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export async function connectSocket(): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const s = getSocket();
  if (session?.access_token) {
    s.auth = { token: session.access_token };
  }
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  const s = getSocket();
  if (s.connected) {
    s.disconnect();
  }
}

export function joinRoom(room: string): void {
  const s = getSocket();
  s.emit('join_room', room);
}

export function leaveRoom(room: string): void {
  const s = getSocket();
  s.emit('leave_room', room);
}

export function onEvent(event: string, callback: (...args: any[]) => void): void {
  const s = getSocket();
  s.on(event, callback);
}

export function offEvent(event: string, callback?: (...args: any[]) => void): void {
  const s = getSocket();
  s.off(event, callback);
}
```

- [ ] **Step 2: Create use-orders hook with React Query + Socket.IO**

Create `apps/web-restaurant/hooks/use-orders.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { connectSocket, disconnectSocket, joinRoom, leaveRoom, onEvent, offEvent } from '@/lib/socket';
import { useRestaurantContext } from '@/contexts/restaurant-context';
import type { Order, OrderStatus } from '@djossfood/database';

// Kanban-relevant statuses
const ACTIVE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'driver_assigned',
];

const COMPLETED_STATUSES: OrderStatus[] = [
  'delivered',
  'completed',
  'cancelled',
  'rejected',
];

interface OrdersResponse {
  orders: (Order & { order_items: any[] })[];
}

export function useOrders() {
  const { restaurant } = useRestaurantContext();
  const queryClient = useQueryClient();
  const queryKey = ['orders', restaurant.id];
  const soundRef = useRef<HTMLAudioElement | null>(null);

  const query = useQuery<OrdersResponse>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get('/api/restaurant-owner/orders');
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s as fallback
  });

  // Socket.IO real-time updates
  useEffect(() => {
    const roomId = `restaurant_${restaurant.id}`;
    connectSocket();

    const handleNewOrder = (data: { orderId: string; orderNumber: string }) => {
      // Play notification sound if tab is not focused
      if (document.hidden) {
        if (!soundRef.current) {
          soundRef.current = new Audio('/sounds/notification.mp3');
        }
        soundRef.current.play().catch(() => {
          // Ignore autoplay restrictions
        });
      }
      // Refetch orders to include the new one
      queryClient.invalidateQueries({ queryKey });
    };

    const handleStatusChange = (data: { orderId: string; status: string }) => {
      queryClient.invalidateQueries({ queryKey });
    };

    const handleConnect = () => {
      joinRoom(roomId);
    };

    onEvent('connect', handleConnect);
    onEvent('new_order', handleNewOrder);
    onEvent('order_status_changed', handleStatusChange);

    // If already connected, join the room immediately
    const s = getSocket();
    if (s.connected) {
      joinRoom(roomId);
    }

    return () => {
      leaveRoom(roomId);
      offEvent('connect', handleConnect);
      offEvent('new_order', handleNewOrder);
      offEvent('order_status_changed', handleStatusChange);
      disconnectSocket();
    };
  }, [restaurant.id, queryClient]);

  // Separate orders into kanban columns
  const orders = query.data?.orders ?? [];

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const completedOrders = orders.filter((o) =>
    COMPLETED_STATUSES.includes(o.status),
  );

  return {
    orders,
    pendingOrders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Mutation hooks for order actions
export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/confirm`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { data } = await api.post(`/api/orders/${orderId}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useMarkReady() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/ready`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Need to import getSocket for the connect check
function getSocket() {
  const { io } = require('socket.io-client');
  // Re-import to avoid circular dependency — use the singleton from lib/socket
  // Actually, let's fix this properly
  return require('@/lib/socket').getSocket();
}
```

Wait — there's a circular import issue with `getSocket`. Let me fix that by exporting it from the socket module, which we already do. The import is already at the top. Let me revise the hook to use the exported `getSocket` properly:

Create `apps/web-restaurant/hooks/use-orders.ts` (revised):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import {
  connectSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  onEvent,
  offEvent,
  getSocket,
} from '@/lib/socket';
import { useRestaurantContext } from '@/contexts/restaurant-context';
import type { Order, OrderStatus } from '@djossfood/database';

const COMPLETED_STATUSES: OrderStatus[] = [
  'delivered',
  'completed',
  'cancelled',
  'rejected',
];

interface OrdersResponse {
  orders: (Order & { order_items: any[] })[];
}

export function useOrders() {
  const { restaurant } = useRestaurantContext();
  const queryClient = useQueryClient();
  const queryKey = ['orders', restaurant.id];
  const soundRef = useRef<HTMLAudioElement | null>(null);

  const query = useQuery<OrdersResponse>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get('/api/restaurant-owner/orders');
      return data;
    },
    refetchInterval: 30000,
  });

  // Socket.IO real-time updates
  useEffect(() => {
    const roomId = `restaurant_${restaurant.id}`;
    connectSocket();

    const handleNewOrder = () => {
      if (document.hidden) {
        if (!soundRef.current) {
          soundRef.current = new Audio('/sounds/notification.mp3');
        }
        soundRef.current.play().catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey });
    };

    const handleStatusChange = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    const handleConnect = () => {
      joinRoom(roomId);
    };

    onEvent('connect', handleConnect);
    onEvent('new_order', handleNewOrder);
    onEvent('order_status_changed', handleStatusChange);

    // If already connected, join the room immediately
    const s = getSocket();
    if (s.connected) {
      joinRoom(roomId);
    }

    return () => {
      leaveRoom(roomId);
      offEvent('connect', handleConnect);
      offEvent('new_order', handleNewOrder);
      offEvent('order_status_changed', handleStatusChange);
      disconnectSocket();
    };
  }, [restaurant.id, queryClient]);

  const orders = query.data?.orders ?? [];

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const completedOrders = orders.filter((o) =>
    COMPLETED_STATUSES.includes(o.status),
  );

  return {
    orders,
    pendingOrders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/confirm`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { data } = await api.post(`/api/orders/${orderId}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useMarkReady() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/ready`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

- [ ] **Step 3: Commit orders data layer**

```bash
cd djossfood
git add apps/web-restaurant/lib/socket.ts apps/web-restaurant/hooks/use-orders.ts
git commit -m "feat(web-restaurant): add Socket.IO client and orders React Query hooks

- Socket.IO client singleton with auth token, reconnect, room join/leave
- useOrders hook with real-time updates and notification sound
- useConfirmOrder, useRejectOrder, useMarkReady mutations
- Auto-refetch on socket events + 30s polling fallback"
```

---

### Task 6: Kanban Board — Columns + Order Cards

**Files:**
- Create: `apps/web-restaurant/components/orders/kanban-column.tsx`
- Create: `apps/web-restaurant/components/orders/order-card.tsx`
- Create: `apps/web-restaurant/components/orders/kanban-board.tsx`
- Create: `apps/web-restaurant/app/dashboard/page.tsx`

- [ ] **Step 1: Create kanban-column component**

Create `apps/web-restaurant/components/orders/kanban-column.tsx`:

```typescript
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  title: string;
  count: number;
  accentColor: string;
  children: ReactNode;
}

export function KanbanColumn({ title, count, accentColor, children }: KanbanColumnProps) {
  return (
    <div className="flex w-80 min-w-[320px] flex-shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn('h-3 w-3 rounded-full', accentColor)} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg bg-muted/50 p-2">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create order-card component**

Create `apps/web-restaurant/components/orders/order-card.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, X, Check, ChefHat } from 'lucide-react';
import type { Order, OrderStatus } from '@djossfood/database';

interface OrderCardProps {
  order: Order & { order_items: any[] };
  onConfirm?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onClick?: (order: Order & { order_items: any[] }) => void;
  isPending?: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'A l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${Math.floor(diffHours / 24)}j`;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function getTimeRemaining(order: Order): number | null {
  if (order.status !== 'pending' || !order.expires_at) return null;
  const remaining = new Date(order.expires_at).getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

export function OrderCard({
  order,
  onConfirm,
  onReject,
  onMarkReady,
  onClick,
  isPending,
}: OrderCardProps) {
  const itemsCount = order.order_items?.length ?? 0;
  const timeRemaining = getTimeRemaining(order);
  const isUrgent = timeRemaining !== null && timeRemaining < 60;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        isUrgent && 'border-destructive/50',
      )}
      onClick={() => onClick?.(order)}
    >
      <CardContent className="p-3">
        {/* Header: order number + timer */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">
            #{order.order_number}
          </span>
          {timeRemaining !== null && (
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                isUrgent
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700',
              )}
            >
              <Clock className="h-3 w-3" />
              {timeRemaining < 60 ? `${timeRemaining}s` : `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`}
            </span>
          )}
        </div>

        {/* Client info + items count */}
        <p className="text-xs text-muted-foreground">
          {itemsCount} article{itemsCount > 1 ? 's' : ''}
        </p>

        {/* Total */}
        <p className="mt-1 text-sm font-bold text-primary">
          {formatAmount(order.total_amount)}
        </p>

        {/* Time ago */}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatTimeAgo(order.created_at)}
        </p>

        {/* Action buttons */}
        <div className="mt-2 flex gap-2">
          {order.status === 'pending' && onConfirm && (
            <Button
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(order.id);
              }}
              disabled={isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Accepter
            </Button>
          )}
          {order.status === 'pending' && onReject && (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onReject(order.id);
              }}
              disabled={isPending}
            >
              <X className="mr-1 h-3 w-3" />
              Refuser
            </Button>
          )}
          {order.status === 'confirmed' && onMarkReady && (
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onMarkReady(order.id);
              }}
              disabled={isPending}
            >
              <ChefHat className="mr-1 h-3 w-3" />
              Marquer prete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create kanban-board component**

Create `apps/web-restaurant/components/orders/kanban-board.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useOrders, useConfirmOrder, useRejectOrder, useMarkReady } from '@/hooks/use-orders';
import { KanbanColumn } from './kanban-column';
import { OrderCard } from './order-card';
import { OrderDetailsSheet } from './order-details-sheet';
import type { Order } from '@djossfood/database';

export function KanbanBoard() {
  const {
    pendingOrders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    isLoading,
  } = useOrders();

  const confirmOrder = useConfirmOrder();
  const rejectOrder = useRejectOrder();
  const markReady = useMarkReady();

  const [selectedOrder, setSelectedOrder] = useState<(Order & { order_items: any[] }) | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumn
          title="Nouvelle"
          count={pendingOrders.length}
          accentColor="bg-yellow"
        >
          {pendingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onConfirm={(id) => confirmOrder.mutate(id)}
              onReject={(id) => rejectOrder.mutate({ orderId: id, reason: 'Non disponible' })}
              onClick={(o) => setSelectedOrder(o)}
              isPending={confirmOrder.isPending || rejectOrder.isPending}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Confirmee"
          count={confirmedOrders.length}
          accentColor="bg-primary"
        >
          {confirmedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onMarkReady={(id) => markReady.mutate(id)}
              onClick={(o) => setSelectedOrder(o)}
              isPending={markReady.isPending}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="En preparation"
          count={preparingOrders.length}
          accentColor="bg-blue-500"
        >
          {preparingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={(o) => setSelectedOrder(o)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Prette"
          count={readyOrders.length}
          accentColor="bg-orange"
        >
          {readyOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={(o) => setSelectedOrder(o)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Terminee"
          count={completedOrders.length}
          accentColor="bg-gray-400"
        >
          {completedOrders.slice(0, 10).map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={(o) => setSelectedOrder(o)}
            />
          ))}
        </KanbanColumn>
      </div>

      {/* Order details sheet */}
      {selectedOrder && (
        <OrderDetailsSheet
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 4: Create the dashboard orders page**

Create `apps/web-restaurant/app/dashboard/page.tsx`:

```typescript
import { KanbanBoard } from '@/components/orders/kanban-board';

export default function OrdersPage() {
  return <KanbanBoard />;
}
```

- [ ] **Step 5: Commit Kanban board components**

```bash
cd djossfood
git add apps/web-restaurant/components/orders/ apps/web-restaurant/app/dashboard/page.tsx
git commit -m "feat(web-restaurant): add Kanban board with order cards and columns

- KanbanColumn with accent colors and order count badges
- OrderCard with status-based actions (accept/reject/mark ready)
- Countdown timer for pending orders with urgency highlighting
- KanbanBoard composing 5 columns with real-time data
- Dashboard page renders KanbanBoard"
```

---

### Task 7: Order Details Sheet + Notification Sound

**Files:**
- Create: `apps/web-restaurant/components/orders/order-details-sheet.tsx`
- Create: `apps/web-restaurant/components/connection-banner.tsx`

- [ ] **Step 1: Create order-details-sheet component**

Create `apps/web-restaurant/components/orders/order-details-sheet.tsx`:

```typescript
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus } from '@djossfood/database';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  preparing: 'En preparation',
  ready: 'Prette',
  driver_assigned: 'Livreur assigne',
  picked_up: 'Recuperee',
  delivering: 'En livraison',
  delivered: 'Livree',
  completed: 'Terminee',
  cancelled: 'Annulee',
  rejected: 'Rejetee',
};

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  preparing: 'default',
  ready: 'default',
  driver_assigned: 'default',
  picked_up: 'default',
  delivering: 'default',
  delivered: 'outline',
  completed: 'outline',
  cancelled: 'destructive',
  rejected: 'destructive',
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAYMENT_METHODS: Record<string, string> = {
  orange_money: 'Orange Money',
  mtn_mobile_money: 'MTN Mobile Money',
};

interface OrderDetailsSheetProps {
  order: Order & { order_items: any[] };
  open: boolean;
  onClose: () => void;
}

export function OrderDetailsSheet({ order, open, onClose }: OrderDetailsSheetProps) {
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusVariant = STATUS_VARIANTS[order.status] || 'secondary';

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[420px] overflow-y-auto sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Commande #{order.order_number}
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Items */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Articles</h4>
            <div className="space-y-2">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    {item.special_instructions && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">
                      {item.quantity} x {formatAmount(item.price)}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {formatAmount(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 rounded-lg bg-muted p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatAmount(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Livraison</span>
              <span>{formatAmount(order.delivery_fee)}</span>
            </div>
            <div className="border-t pt-1">
              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-primary">{formatAmount(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Livraison</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adresse</span>
                <span className="text-right max-w-[250px]">{order.delivery_address}</span>
              </div>
              {order.delivery_notes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="text-right max-w-[250px]">{order.delivery_notes}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paiement</span>
                <span>{PAYMENT_METHODS[order.payment_method] || order.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Chronologie</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Creee</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              {order.confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-primary">Confirmee</span>
                  <span>{formatDate(order.confirmed_at)}</span>
                </div>
              )}
              {order.ready_at && (
                <div className="flex justify-between">
                  <span className="text-blue-600">Prette</span>
                  <span>{formatDate(order.ready_at)}</span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-green-600">Livree</span>
                  <span>{formatDate(order.delivered_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Create connection banner for Socket.IO disconnect**

Create `apps/web-restaurant/components/connection-banner.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { WifiOff } from 'lucide-react';

export function ConnectionBanner() {
  const [isDisconnected, setIsDisconnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleDisconnect = () => setIsDisconnected(true);
    const handleConnect = () => setIsDisconnected(false);

    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
    };
  }, []);

  if (!isDisconnected) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-destructive py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4" />
      Reconnexion en cours...
    </div>
  );
}
```

- [ ] **Step 3: Add ConnectionBanner to dashboard layout**

Add the ConnectionBanner import and render to `apps/web-restaurant/app/dashboard/layout.tsx`. Add this import near the top of `DashboardShell`:

```typescript
import { ConnectionBanner } from '@/components/connection-banner';
```

And add `<ConnectionBanner />` just before the closing `</div>` of the main container, inside the flex layout. The relevant section of the return statement becomes:

```tsx
<div className="flex h-screen bg-background">
  <ConnectionBanner />
  {/* Sidebar */}
  <aside className="...">
  ...
```

- [ ] **Step 4: Commit order details and connection banner**

```bash
cd djossfood
git add apps/web-restaurant/components/orders/order-details-sheet.tsx apps/web-restaurant/components/connection-banner.tsx apps/web-restaurant/app/dashboard/layout.tsx
git commit -m "feat(web-restaurant): add order details sheet and connection banner

- OrderDetailsSheet with item list, totals, delivery info, timeline
- ConnectionBanner showing Socket.IO disconnect state
- Added ConnectionBanner to dashboard layout"
```

---

### Task 8: Menu Management — Categories + Item Table

**Files:**
- Create: `apps/web-restaurant/hooks/use-menu.ts`
- Create: `apps/web-restaurant/components/menu/category-tabs.tsx`
- Create: `apps/web-restaurant/components/menu/item-table.tsx`
- Create: `apps/web-restaurant/app/dashboard/menu/page.tsx`

- [ ] **Step 1: Create use-menu hook**

Create `apps/web-restaurant/hooks/use-menu.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRestaurantContext } from '@/contexts/restaurant-context';
import type { MenuCategory, MenuItem } from '@djossfood/database';

interface MenuData {
  menu: Array<{
    id: string | null;
    name: string;
    description: string | null;
    sort_order: number;
    items: MenuItem[];
  }>;
}

export function useMenu() {
  const { restaurant } = useRestaurantContext();
  const queryClient = useQueryClient();
  const queryKey = ['menu', restaurant.id];

  const query = useQuery<MenuData>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurants/${restaurant.id}/menu`);
      return data;
    },
  });

  return {
    ...query,
    menu: query.data?.menu ?? [],
    queryKey,
  };
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; sort_order?: number }) => {
      const { data: result } = await api.post('/api/restaurant-owner/menu-categories', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; sort_order?: number; is_active?: boolean }) => {
      const { data: result } = await api.put(`/api/restaurant-owner/menu-categories/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/restaurant-owner/menu-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      price: number;
      category_id?: string;
      image_url?: string;
      tags?: string[];
      is_available?: boolean;
    }) => {
      const { data: result } = await api.post('/api/restaurant-owner/menu-items', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      name?: string;
      description?: string;
      price?: number;
      category_id?: string;
      image_url?: string;
      tags?: string[];
      is_available?: boolean;
    }) => {
      const { data: result } = await api.put(`/api/restaurant-owner/menu-items/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/restaurant-owner/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}
```

- [ ] **Step 2: Create category-tabs component**

Create `apps/web-restaurant/components/menu/category-tabs.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-menu';

interface Category {
  id: string | null;
  name: string;
  description: string | null;
  items: any[];
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createCategory.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
    setShowCreateDialog(false);
    setName('');
    setDescription('');
  };

  const handleEdit = async () => {
    if (!editingCategory || !name.trim()) return;
    await updateCategory.mutateAsync({
      id: editingCategory.id!,
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setEditingCategory(null);
    setName('');
    setDescription('');
  };

  const handleDelete = async (id: string) => {
    await deleteCategory.mutateAsync(id);
    setDeleteConfirmId(null);
    // If we deleted the active category, switch to "all"
    if (activeCategory === id) {
      onSelectCategory(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {/* All items tab */}
        <button
          className={cn(
            'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            activeCategory === null
              ? 'bg-primary text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
          onClick={() => onSelectCategory(null)}
        >
          Tous
        </button>

        {categories.map((cat) => (
          <div key={cat.id ?? 'uncategorized'} className="relative flex-shrink-0">
            <button
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.name} ({cat.items.length})
            </button>
          </div>
        ))}

        {/* Add category button */}
        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0 rounded-full"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Categorie
        </Button>
      </div>

      {/* Category edit dropdowns rendered inline in a row below */}
      <div className="flex gap-2">
        {categories.map((cat) => (
          <div key={`actions-${cat.id}`} className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded p-1 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingCategory(cat);
                    setName(cat.name);
                    setDescription(cat.description ?? '');
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteConfirmId(cat.id!)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Create category dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle categorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nom</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom de la categorie"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description (optionnel)</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la categorie"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createCategory.isPending}>
              Creer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit category dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la categorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cat-name">Nom</Label>
              <Input
                id="edit-cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cat-desc">Description</Label>
              <Textarea
                id="edit-cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={!name.trim() || updateCategory.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la categorie ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action supprimera la categorie et tous ses articles. Cette action est irreversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteCategory.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 3: Create item-table component**

Create `apps/web-restaurant/components/menu/item-table.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/use-menu';
import type { MenuItem } from '@djossfood/database';

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

interface ItemTableProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
}

export function ItemTable({ items, onEdit }: ItemTableProps) {
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  const toggleAvailability = (item: MenuItem) => {
    updateMenuItem.mutate({
      id: item.id,
      is_available: !item.is_available,
    });
  };

  const handleDelete = (item: MenuItem) => {
    if (confirm(`Supprimer "${item.name}" ?`)) {
      deleteMenuItem.mutate(item.id);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">Aucun article dans cette categorie</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">Image</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead>Prix</TableHead>
          <TableHead>Disponible</TableHead>
          <TableHead className="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onEdit(item)}
          >
            <TableCell>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  N/A
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="hidden max-w-[200px] truncate md:table-cell">
              {item.description}
            </TableCell>
            <TableCell className="font-semibold text-primary">
              {formatAmount(item.price)}
            </TableCell>
            <TableCell>
              <Switch
                checked={item.is_available}
                onCheckedChange={() => toggleAvailability(item)}
                onClick={(e) => e.stopPropagation()}
              />
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 4: Create menu page**

Create `apps/web-restaurant/app/dashboard/menu/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useMenu } from '@/hooks/use-menu';
import { CategoryTabs } from '@/components/menu/category-tabs';
import { ItemTable } from '@/components/menu/item-table';
import { ItemModal } from '@/components/menu/item-modal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { MenuItem } from '@djossfood/database';

export default function MenuPage() {
  const { menu, isLoading } = useMenu();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCreateItem, setShowCreateItem] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Filter items by active category
  const filteredItems = activeCategory
    ? menu.flatMap((cat) =>
        cat.id === activeCategory ? cat.items : [],
      )
    : menu.flatMap((cat) => cat.items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gestion du menu</h2>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowCreateItem(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un article
        </Button>
      </div>

      <CategoryTabs
        categories={menu}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <div className="rounded-lg border bg-card">
        <ItemTable items={filteredItems} onEdit={(item) => setEditingItem(item)} />
      </div>

      {/* Create/Edit item modal */}
      {(showCreateItem || editingItem) && (
        <ItemModal
          categories={menu}
          item={editingItem}
          open={showCreateItem || !!editingItem}
          onClose={() => {
            setEditingItem(null);
            setShowCreateItem(false);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit menu management**

```bash
cd djossfood
git add apps/web-restaurant/hooks/use-menu.ts apps/web-restaurant/components/menu/ apps/web-restaurant/app/dashboard/menu/
git commit -m "feat(web-restaurant): add menu management with categories and item table

- useMenu hook with CRUD mutations for categories and items
- CategoryTabs with create/edit/delete dialogs
- ItemTable with availability toggle and edit/delete actions
- Menu page composing categories + items + modal trigger"
```

---

### Task 9: Menu Item Modal (Add/Edit/Delete)

**Files:**
- Create: `apps/web-restaurant/components/menu/item-modal.tsx`

- [ ] **Step 1: Create item-modal component**

Create `apps/web-restaurant/components/menu/item-modal.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateMenuItem, useUpdateMenuItem } from '@/hooks/use-menu';
import type { MenuItem } from '@djossfood/database';

interface Category {
  id: string | null;
  name: string;
  items: any[];
}

interface ItemModalProps {
  categories: Category[];
  item: MenuItem | null; // null = create mode, non-null = edit mode
  open: boolean;
  onClose: () => void;
}

export function ItemModal({ categories, item, open, onClose }: ItemModalProps) {
  const isEditing = !!item;
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tags, setTags] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Populate form when editing
  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description ?? '');
      setPrice(item.price.toString());
      setImageUrl(item.image_url ?? '');
      setCategoryId(item.category_id ?? '');
      setTags(item.tags?.join(', ') ?? '');
      setIsAvailable(item.is_available);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setCategoryId('');
      setTags('');
      setIsAvailable(true);
    }
  }, [item, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !price) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: parseFloat(price),
      category_id: categoryId || undefined,
      image_url: imageUrl.trim() || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      is_available: isAvailable,
    };

    if (isEditing && item) {
      await updateMenuItem.mutateAsync({ id: item.id, ...data });
    } else {
      await createMenuItem.mutateAsync(data);
    }
    onClose();
  };

  const isPending = createMenuItem.isPending || updateMenuItem.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'article' : 'Nouvel article'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Nom *</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de l'article"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de l'article"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-price">Prix (FCFA) *</Label>
            <Input
              id="item-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-image">URL de l'image</Label>
            <Input
              id="item-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-category">Categorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat) => cat.id !== null)
                  .map((cat) => (
                    <SelectItem key={cat.id!} value={cat.id!}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-tags">Tags (separes par des virgules)</Label>
            <Input
              id="item-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="populaire, epice, rapide"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="item-available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="item-available">Disponible</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !price || isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit item modal**

```bash
cd djossfood
git add apps/web-restaurant/components/menu/item-modal.tsx
git commit -m "feat(web-restaurant): add menu item modal for create/edit/delete

- ItemModal dialog with name, description, price, image, category, tags, availability
- Create and edit modes populated from existing item data
- Category dropdown populated from menu data
- Tags input as comma-separated string"
```

---

### Task 10: Settings Page

**Files:**
- Create: `apps/web-restaurant/components/settings/settings-form.tsx`
- Create: `apps/web-restaurant/app/dashboard/settings/page.tsx`

- [ ] **Step 1: Create settings form component**

Create `apps/web-restaurant/components/settings/settings-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRestaurantContext } from '@/contexts/restaurant-context';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Restaurant, RestaurantStatus } from '@djossfood/database';

export function SettingsForm() {
  const { restaurant } = useRestaurantContext();
  const queryClient = useQueryClient();

  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description ?? '');
  const [phone, setPhone] = useState(restaurant.phone ?? '');
  const [address, setAddress] = useState(restaurant.address ?? '');
  const [deliveryFee, setDeliveryFee] = useState(restaurant.delivery_fee.toString());
  const [minOrderAmount, setMinOrderAmount] = useState(restaurant.min_order_amount.toString());
  const [status, setStatus] = useState<RestaurantStatus>(restaurant.status);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await api.put('/api/restaurant-owner/restaurant', {
        name: name.trim(),
        description: description.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        delivery_fee: parseFloat(deliveryFee) || 0,
        min_order_amount: parseFloat(minOrderAmount) || 0,
        status,
      });

      toast.success('Parametres enregistres');
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du restaurant</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du restaurant"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Decrivez votre restaurant"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telephone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+237 6XX XXX XXX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse du restaurant"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="delivery-fee">Frais de livraison (FCFA)</Label>
            <Input
              id="delivery-fee"
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-order">Commande minimum (FCFA)</Label>
            <Input
              id="min-order"
              type="number"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
          <Switch
            id="status"
            checked={status === 'open'}
            onCheckedChange={(checked) => setStatus(checked ? 'open' : 'closed')}
          />
          <div>
            <Label htmlFor="status" className="text-base font-medium">
              Restaurant {status === 'open' ? 'ouvert' : 'ferme'}
            </Label>
            <p className="text-sm text-muted-foreground">
              Les clients peuvent passer commande uniquement lorsque vous etes ouvert.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-primary hover:bg-primary/90"
      >
        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create settings page**

Create `apps/web-restaurant/app/dashboard/settings/page.tsx`:

```typescript
import { SettingsForm } from '@/components/settings/settings-form';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Parametres du restaurant</h2>
      <SettingsForm />
    </div>
  );
}
```

- [ ] **Step 3: Commit settings page**

```bash
cd djossfood
git add apps/web-restaurant/components/settings/ apps/web-restaurant/app/dashboard/settings/
git commit -m "feat(web-restaurant): add restaurant settings page

- SettingsForm with name, description, phone, address, delivery fee, min order, status toggle
- Uses restaurant context for initial values
- PUT /api/restaurant-owner/restaurant for updates
- Toast notifications for success/error"
```

---

### Task 11: Integration Verification

**Files:**
- All existing files in `apps/web-restaurant/`

- [ ] **Step 1: Install all dependencies and verify build**

```bash
cd apps/web-restaurant
npm install
npx next build
```

Expected: Build succeeds with no errors. Fix any TypeScript errors that come up.

- [ ] **Step 2: Verify backend API compiles**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: No TypeScript errors.

- [ ] **Step 3: Check for common issues**

Check these common issues and fix them:

1. **Import paths**: All imports use `@/` alias correctly for web-restaurant files
2. **Type mismatches**: Order types match between database package and API responses
3. **Missing shadcn/ui components**: Ensure all required components (Button, Input, Card, Badge, Dialog, Sheet, Table, Tabs, Select, Switch, Textarea, Label, DropdownMenu) are installed
4. **Environment variables**: `.env.local` has the required Supabase and API URL variables

- [ ] **Step 4: Commit any fixes**

```bash
cd djossfood
git add apps/web-restaurant/ apps/api/
git commit -m "fix: resolve TypeScript and integration issues for web-restaurant

- Fix any import path issues
- Ensure type compatibility between database package and frontend
- Verify all shadcn/ui components are properly installed"
```