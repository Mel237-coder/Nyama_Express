# DjossFood Slice 5 — Admin Panel + Polish Design Specification

## Overview

Slice 5 builds the admin web dashboard (`apps/web-admin`) and fixes cross-app issues. The admin panel provides: platform overview with KPIs, restaurant management (listing, approval, boost), driver management (listing, approval), order monitoring (paginated table with filters), and admin settings. It also includes a database migration to fix schema mismatches and TypeScript type corrections across all apps.

**Pre-requisites:** Slices 1–4 are complete. The admin API endpoints already exist in `apps/api/src/routes/admin.ts`.

## Architecture & File Structure

```
apps/web-admin/
├── app/
│   ├── layout.tsx                # Root: providers (QueryClient, Supabase)
│   ├── login/
│   │   └── page.tsx              # Email/password login
│   ├── dashboard/
│   │   ├── layout.tsx             # Sidebar + header shell (admin guard)
│   │   ├── page.tsx               # KPIs dashboard
│   │   ├── restaurants/
│   │   │   └── page.tsx           # Restaurant list + management
│   │   ├── drivers/
│   │   │   └── page.tsx           # Driver list + approval
│   │   ├── orders/
│   │   │   └── page.tsx           # Order list with filters
│   │   └── settings/
│   │       └── page.tsx           # Admin settings (profile)
├── components/
│   ├── auth/
│   │   ├── auth-guard.tsx         # Client component: redirect if not admin
│   │   └── login-form.tsx         # Email/password form
│   ├── dashboard/
│   │   ├── kpi-card.tsx           # KPI stat card
│   │   └── status-chart.tsx       # Orders by status bar chart
│   ├── restaurants/
│   │   ├── restaurant-table.tsx   # Restaurant data table
│   │   └── boost-dialog.tsx       # Boost value + reason dialog
│   ├── drivers/
│   │   └── driver-table.tsx       # Driver data table with approve action
│   ├── orders/
│   │   ├── order-table.tsx        # Order data table with status filter
│   │   └── order-details.tsx      # Order detail sheet
│   └── ui/                        # shadcn/ui primitives
├── lib/
│   ├── supabase/
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── client.ts             # Browser-side Supabase client
│   ├── api.ts                     # Axios instance with auth interceptor
│   └── utils.ts                   # cn() utility
├── hooks/
│   ├── use-kpis.ts                # KPIs React Query hook
│   ├── use-restaurants.ts         # Restaurants list hook
│   ├── use-drivers.ts             # Drivers list hook
│   └── use-orders.ts              # Orders list hook (paginated)
├── middleware.ts                   # Next.js auth middleware
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | TailwindCSS + shadcn/ui |
| State | React Query (server state) |
| Auth | Supabase Auth (email/password, admin role) |
| Language | TypeScript |

### Design System

Same DjossFood palette, adapted for web via TailwindCSS (matching the restaurant dashboard):

| Token | Value | TailwindCSS Class |
|-------|-------|------------------|
| primaryGreen | #00AA13 | `bg-primary` |
| primaryOrange | #FF6600 | `bg-orange` |
| primaryYellow | #FFCC00 | `bg-yellow` |
| bg | #F7F7F7 | `bg-background` |
| surface | #FFFFFF | `bg-card` |
| textPrimary | #111111 | `text-foreground` |
| textSecondary | #666666 | `text-muted-foreground` |
| border | #E0E0E0 | `border-border` |
| error | #E53935 | `bg-destructive` |

Typography: Plus Jakarta Sans (Google Fonts) loaded via `next/font/google`.

### Authentication Flow

1. Admin navigates to `/login`
2. Enters email + password
3. Calls `supabase.auth.signInWithPassword()`
4. On success: session stored in cookie (via Supabase middleware), redirect to `/dashboard`
5. Middleware checks session on every `/dashboard/*` request — also verifies `role === 'admin'` by querying the profile
6. On failure: inline error message

### Protected Routes

`middleware.ts` checks Supabase session cookie + admin role on all `/dashboard/*` routes. Unauthenticated or non-admin requests redirect to `/login`.

## Screen Specifications

### 1. Login (`/login`)

Same pattern as restaurant dashboard:
- Centered card on `#F7F7F7` background
- "DjossFood Admin" logo text at top
- Email input, password input (with show/hide toggle)
- "Se connecter" button (bg-primary, full width)
- Error states: "Email ou mot de passe incorrect"
- Already authenticated + admin → redirect to `/dashboard`

### 2. Dashboard Layout (`/dashboard/layout.tsx`)

**Sidebar** (left, 240px, dark `#1A1A2E`):
- "DjossFood Admin" text at top
- Navigation links: Tableau de bord (📊), Restaurants (🍽️), Livreurs (🚗), Commandes (📋), Paramètres (⚙️)
- Active link highlighted with `bg-primary`
- "Déconnexion" link at bottom

**Header** (top bar, white bg):
- Page title on left
- Admin name on right

### 3. Dashboard (`/dashboard`)

**KPI Cards** (4 cards in a grid):
- Total commandes (total orders count, green icon)
- Revenu total (total revenue in FCFA, orange icon)
- Restaurants actifs (active restaurants count, blue icon)
- Livreurs approuvés (approved drivers count, purple icon)

**Orders by Status** (bar chart or horizontal stacked bar):
- Shows count of orders in each status
- Color-coded by status (matching the Kanban colors from the restaurant dashboard)

**Recent Orders** (table, last 10):
- Order number, restaurant, client, status badge, total, date
- Click row to see order details sheet

### 4. Restaurants (`/dashboard/restaurants`)

**Table columns**: Name, Ville, Statut (badge), Approuvé (badge with toggle), Note (rating), Boost (current value + edit button), Créé le

**Actions per row**:
- Toggle `is_approved` (green checkmark / red X)
- Edit boost value (opens boost dialog with value input + reason textarea)

**Boost Dialog** (shadcn Dialog):
- Current boost value displayed
- New boost value input (number, 0-5)
- Reason textarea (required)
- "Appliquer" button → `PUT /api/admin/restaurants/:id/boost`

### 5. Drivers (`/dashboard/drivers`)

**Table columns**: Nom (from profile join), Téléphone, Véhicule, Plaque, Statut (badge), Approuvé (badge with toggle), Courses, Créé le

**Actions per row**:
- Toggle `is_approved` → `PUT /api/admin/drivers/:id/approve`
- View documents link (opens documents in a dialog showing license, ID, vehicle photos)

### 6. Orders (`/dashboard/orders`)

**Filter bar** at top:
- Status dropdown filter (Tous, En attente, Confirmée, En préparation, Prête, Livreur assigné, Récupérée, En livraison, Livrée, Terminée, Annulée)
- Search by order number

**Table columns**: #, Client, Restaurant, Statut (badge), Total, Créé le

**Pagination**: Page controls at bottom (previous/next, page X of Y)

**Order detail sheet** (click row → shadcn Sheet from right):
- Full item list with quantities and prices
- Client name, delivery address
- Driver name (if assigned)
- Payment method, payment status
- Order timeline (created → confirmed → preparing → ready → delivered)
- Total, delivery fee, subtotal

### 7. Settings (`/dashboard/settings`)

Simple profile display:
- Admin name and email (read-only)
- "Déconnexion" button

## API Integration

### Existing Admin Endpoints (no backend changes needed)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/kpis` | Dashboard KPIs |
| GET | `/api/admin/restaurants` | List all restaurants |
| PUT | `/api/admin/restaurants/:id/boost` | Set restaurant boost |
| GET | `/api/admin/drivers` | List all drivers |
| PUT | `/api/admin/drivers/:id/approve` | Approve a driver |
| GET | `/api/admin/orders` | List all orders (paginated, filterable) |

### New Admin Endpoints (to add)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/admin/restaurants/:id/approve` | Toggle restaurant approval |
| GET | `/api/admin/drivers/:id` | Get single driver with documents |

### Service Layer

**`lib/supabase/`** — Same pattern as web-restaurant:
- `server.ts`: Server-side Supabase client with `SUPABASE_SERVICE_ROLE_KEY`
- `client.ts`: Browser-side Supabase client with `SUPABASE_ANON_KEY`

**`lib/api.ts`** — Axios instance:
- Base URL from `NEXT_PUBLIC_API_URL` env var
- Auth interceptor: reads Supabase session, attaches `Bearer` token
- Error interceptor: on 401, redirects to `/login`

## Polish & Bug Fixes

### 1. Database Migration: Fix `admin_actions` Schema Mismatch

The `admin_actions` table in the SQL schema has columns `action` and `reason`, but the TypeScript `AdminAction` type and the admin routes code use `action_type`, `previous_value`, and `new_value`. This causes runtime insert failures.

**Fix:** Add a new migration `005_admin_actions_fix.sql` that:
- Adds `action_type TEXT`, `previous_value JSONB`, `new_value JSONB` columns to `admin_actions`
- Keeps `action` and `reason` columns for backward compatibility
- Updates the `AdminAction` TypeScript type to match the new schema

### 2. TypeScript Type Fixes

- Add `'on_delivery'` to `DriverStatus` type in `packages/database/src/types.ts` (SQL enum has it, TypeScript doesn't)
- Align `OrderStatus` type: the SQL enum has `'delivered'` but TypeScript has both `'delivering'` and `'delivered'`. Keep both in TypeScript since the app code uses `'delivering'` for the driver's "en livraison" status and `'delivered'` for the client's confirmation. Update the SQL enum to include `'delivering'` and `'rejected'` via migration.

### 3. Cross-App Consistency

- Ensure all apps use consistent French error messages
- Verify all amounts are formatted with `toLocaleString('fr-FR')` + ' FCFA'
- Verify all phone numbers use +237 format

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Network error | Toast: "Vérifiez votre connexion" |
| 401 Unauthorized | Redirect to /login |
| Failed admin action | Toast with error message from server |
| Non-admin access | Redirect to /login |

## Testing Strategy

- Component tests for key screens (Dashboard, RestaurantTable, DriverTable)
- Integration tests for approval and boost flows
- Manual E2E: login → view KPIs → approve driver → boost restaurant → filter orders