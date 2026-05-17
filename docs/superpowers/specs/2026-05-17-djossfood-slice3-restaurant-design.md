# DjossFood Slice 3 — Restaurant Dashboard Design Specification

## Overview

Slice 3 builds the restaurant owner web dashboard (`apps/web-restaurant`) using Next.js 14 App Router, TailwindCSS, and shadcn/ui. The dashboard provides order management via a real-time Kanban board, menu CRUD management, and restaurant settings.

**Pre-requisites:** Slice 1 (backend API) and Slice 2 (mobile client) are complete.

## Architecture & File Structure

```
apps/web-restaurant/
├── app/
│   ├── layout.tsx                # Root: providers (QueryClient, Supabase)
│   ├── login/
│   │   └── page.tsx              # Email/password login
│   ├── dashboard/
│   │   ├── layout.tsx             # Sidebar + header shell (protected)
│   │   ├── page.tsx               # Orders Kanban (default route)
│   │   ├── menu/
│   │   │   └── page.tsx           # Menu management
│   │   └── settings/
│   │       └── page.tsx           # Restaurant settings
├── components/
│   ├── auth/
│   │   ├── auth-guard.tsx         # Client component: redirect if not logged in
│   │   └── login-form.tsx        # Email/password form
│   ├── orders/
│   │   ├── kanban-board.tsx       # Multi-column Kanban container
│   │   ├── kanban-column.tsx      # Single status column
│   │   ├── order-card.tsx         # Order card with actions
│   │   └── order-details.tsx     # Expanded order details sheet
│   ├── menu/
│   │   ├── category-tabs.tsx      # Horizontal category tabs
│   │   ├── item-table.tsx         # Menu items table
│   │   └── item-modal.tsx         # Add/edit item dialog
│   └── ui/                        # shadcn/ui primitives (auto-generated)
├── lib/
│   ├── supabase.ts                # Supabase browser + server clients
│   ├── api.ts                     # Axios instance with auth interceptor
│   └── socket.ts                  # Socket.IO client singleton
├── hooks/
│   ├── use-orders.ts              # React Query + Socket.IO realtime
│   └── use-menu.ts                # React Query for menu CRUD
├── middleware.ts                   # Next.js auth middleware
├── public/
│   └── sounds/
│       └── notification.mp3       # New order chime
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
| State | React Query (server state) + React Context (restaurant context) |
| Realtime | Socket.IO client |
| Auth | Supabase Auth (email/password) |
| Language | TypeScript |

### Design System Integration

The restaurant dashboard uses the same DjossFood color palette but adapted for web via TailwindCSS:

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

1. Restaurant owner navigates to `/login`
2. Enters email + password
3. Calls `supabase.auth.signInWithPassword()`
4. On success: session stored in cookie (via Supabase middleware), redirect to `/dashboard`
5. On failure: inline error message
6. Middleware checks session on every `/dashboard/*` request — redirects to `/login` if no valid session
7. After auth, fetches restaurant data: `GET /api/restaurants?owner_id={userId}`
8. Restaurant context stored in React Context for all dashboard pages

### Protected Routes

`middleware.ts` checks Supabase session cookie on:
- `/dashboard` — orders Kanban
- `/dashboard/menu` — menu management
- `/dashboard/settings` — restaurant settings

Unauthenticated requests redirect to `/login`.

## Screen Specifications

### 1. Login (`/login`)

- Centered card on background `#F7F7F7`
- DjossFood logo (text: "DjossFood Pro") at top
- Email input (shadcn Input), password input (shadcn Input with show/hide toggle)
- "Se connecter" button (bg-primary, full width)
- Error states: "Email ou mot de passe incorrect" inline below form
- On success: redirect to `/dashboard`
- Already authenticated: redirect to `/dashboard`

### 2. Dashboard Layout (`/dashboard/layout.tsx`)

**Sidebar** (left, 240px, dark bg `#1A1A2E`):
- Restaurant logo/name at top
- Navigation links: Commandes (📋), Menu (🍽️), Paramètres (⚙️)
- Active link: highlighted with `bg-primary`
- "Déconnexion" link at bottom

**Header** (top bar, white bg):
- Page title on left
- Restaurant name + status badge on right (Ouvert/Fermé)
- Notification bell icon (future: shows new order count)

**Content area**: Main content rendered by child pages.

### 3. Orders Kanban (`/dashboard`)

**5 columns**, scrollable horizontally on smaller screens:

| Column | Status | Accent Color | Actions |
|--------|--------|-------------|---------|
| Nouvelle | pending | Yellow (#FFCC00 bg) | Accepter (green), Refuser (red) |
| Confirmée | confirmed | Green (#00AA13 bg) | Marquer prête |
| En préparation | preparing | Blue (#3B82F6 bg) | (none, waiting) |
| Prête | ready | Orange (#FF6600 bg) | (waiting for driver) |
| Terminée | completed + delivered | Gray (#9CA3AF bg) | (view only) |

**Order card** (shadcn Card):
- Order number: `#1042` (bold, 14px)
- Client name (from order.client_id, fallback "Client")
- Items count: "3 articles"
- Total: "3 500 FCFA" (bold, green)
- Time since order: "Il y a 2 min" (muted, updates)
- Countdown timer in "Nouvelle" column: shows remaining time before 5-min timeout (red when < 1 min)
- Action buttons at bottom of card

**Real-time updates**:
- On mount: `socket.emit('join_room', 'restaurant:{id}')`
- Listens for `order_status_update` events
- New order in "Nouvelle": plays notification sound, animates card slide-in
- Status changes: card moves to the appropriate column with animation
- On unmount: `socket.emit('leave_room', 'restaurant:{id}')`

**Sound alert**:
- New order: `new Audio('/sounds/notification.mp3').play()` 
- Only plays when tab is not focused (checks `document.hidden`)
- Sound file: short chime (~1 second)

**Order details sheet** (shadcn Sheet, slides from right):
- Triggered by clicking on an order card
- Shows: full item list with quantities and prices, delivery address, client phone, payment method, special instructions, order timeline

### 4. Menu Management (`/dashboard/menu`)

**Category tabs** (horizontal scroll):
- Each tab shows category name + item count
- "Ajouter une catégorie" button at the end (opens dialog)
- Active tab highlighted with `bg-primary text-white`
- Dropdown menu on each tab (hover/click): "Modifier", "Supprimer"

**Add category dialog** (shadcn Dialog):
- Name input (required)
- Description input (optional)
- "Créer" button → `POST /api/admin/menu-categories` (via restaurant-scoped endpoint)

**Item table** (shadcn Table):
- Columns: Image (64x64 thumbnail or placeholder), Nom, Description (truncated 1 line), Prix (FCFA), Disponible (toggle switch), Actions (edit/delete icons)
- "Ajouter un article" button above table (opens item modal)
- Click row to open edit modal
- Toggle "Disponible" switch → `PUT /api/admin/menu-items/:id` with `is_available: true/false`

**Item modal** (shadcn Dialog):
- Name input (required)
- Description textarea (optional)
- Price input (number, FCFA, required)
- Image URL input (optional)
- Category dropdown (select from existing categories)
- Tags input (comma-separated, optional)
- Available toggle (default: on)
- "Enregistrer" button → `POST /api/admin/menu-items` (create) or `PUT /api/admin/menu-items/:id` (update)
- "Supprimer" button (red, with confirmation) → `DELETE /api/admin/menu-items/:id`

### 5. Settings (`/dashboard/settings`)

Simple form with:
- Restaurant name (text input)
- Description (textarea)
- Phone number (text input)
- Address (text input)
- Opening hours (JSON editor or simple time inputs for each day)
- Minimum order amount (number input, FCFA)
- Delivery fee (number input, FCFA)
- Status toggle (Ouvert/Fermé)
- "Enregistrer" button → `PUT /api/admin/restaurants/:id`

## API Integration

### Service Layer

**`lib/supabase.ts`** — Dual Supabase clients:
- `createServerClient()`: Uses `SUPABASE_SERVICE_ROLE_KEY`, for server components and middleware
- `createBrowserClient()`: Uses `SUPABASE_ANON_KEY`, for client components with session from cookie

**`lib/api.ts`** — Axios instance:
- Base URL from `NEXT_PUBLIC_API_URL` env var (default `http://localhost:3001`)
- Auth interceptor: reads Supabase session from cookie, attaches `Bearer` token
- Error interceptor: on 401, redirects to `/login`

**`lib/socket.ts`** — Socket.IO client:
- Connects on auth, disconnects on logout
- Auto-reconnect with backoff
- Exports `joinRoom(room)`, `leaveRoom(room)`, `onEvent(event, callback)`

### API Endpoints Used

| Screen | Endpoint | Method |
|--------|----------|--------|
| Login | Supabase Auth (`signInWithPassword`) | — |
| Dashboard | `/api/orders?restaurant_id={id}` | GET |
| Dashboard | `/api/orders/:id/confirm` | POST |
| Dashboard | `/api/orders/:id/reject` | POST |
| Dashboard | `/api/orders/:id/ready` | POST |
| Menu | `/api/restaurants/:id/menu` | GET |
| Menu | `/api/admin/menu-categories` | POST |
| Menu | `/api/admin/menu-items` | POST |
| Menu | `/api/admin/menu-items/:id` | PUT, DELETE |
| Settings | `/api/restaurants/:id` | GET, PUT |

**Note**: The admin endpoints for menu CRUD may need to be added to the existing API if they don't exist yet. The current `admin.ts` routes have restaurant listing and driver management but not menu item CRUD for restaurant owners. The plan will include adding these routes.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Network error | Toast notification: "Vérifiez votre connexion" |
| 401 Unauthorized | Redirect to `/login` |
| Failed order action | Toast with error message from server |
| Failed menu save | Inline error on modal form |
| Socket disconnect | Banner at top: "Reconnexion..." |

## Testing Strategy

- Component tests with React Testing Library for key components (Kanban, OrderCard, ItemModal)
- Integration tests for menu CRUD operations
- Manual E2E testing: login → view orders → accept/reject order → manage menu items