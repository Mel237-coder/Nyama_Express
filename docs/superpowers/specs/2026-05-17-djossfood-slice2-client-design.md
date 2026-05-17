# DjossFood Slice 2 — Client App Design Specification

## Overview

Slice 2 builds the client mobile app (`apps/mobile-client`) using Expo SDK 50 + expo-router with file-based routing. Target platforms: iOS, Android, and web. The app covers the full client flow: authentication, restaurant browsing, ordering, payment, and real-time order tracking.

**Pre-requisite:** Slice 1 (backend API) is complete and running.

## Architecture & File Structure

```
apps/mobile-client/
├── app/                          # expo-router file-based routing
│   ├── _layout.tsx               # Root layout (fonts, providers, auth guard)
│   ├── (auth)/                   # Auth group (no tabs, no bottom nav)
│   │   ├── _layout.tsx           # Auth stack layout
│   │   ├── login.tsx             # Phone/email login
│   │   └── verify.tsx             # OTP verification
│   ├── (tabs)/                   # Main app group (with bottom tabs)
│   │   ├── _layout.tsx           # Tab navigator (Home, Orders, Profile)
│   │   ├── index.tsx             # Home screen (search + restaurants)
│   │   ├── orders.tsx            # Order history
│   │   └── profile.tsx           # User profile + settings
│   ├── restaurant/[id].tsx       # Restaurant detail + menu
│   ├── cart.tsx                  # Cart review
│   ├── checkout.tsx              # Payment method selection + confirm
│   └── order/[id].tsx            # Order tracking (timeline + map)
├── components/
│   ├── ui/                       # Primitives (Button, Input, Card, Badge, Sheet)
│   ├── RestaurantCard.tsx
│   ├── MenuItemRow.tsx
│   ├── CartItemRow.tsx
│   ├── OrderTimeline.tsx
│   └── DriverMap.tsx
├── stores/
│   ├── authStore.ts              # Zustand: user, token, auth state
│   ├── cartStore.ts              # Zustand: items, quantities, totals
│   └── orderStore.ts             # Zustand: active orders, realtime updates
├── services/
│   ├── api.ts                    # Axios instance with auth interceptor
│   ├── auth.ts                   # Supabase auth (OTP + email)
│   └── socket.ts                 # Socket.IO client singleton
├── constants/
│   ├── colors.ts                 # Design spec color palette
│   ├── typography.ts             # Font sizes, weights
│   └── spacing.ts                # Spacing scale
├── hooks/
│   ├── useRestaurants.ts         # React Query hooks
│   ├── useOrders.ts
│   └── useLocation.ts
├── app.json
├── package.json
├── tsconfig.json
└── eas.json
```

### Navigation Structure

- **Root layout**: Loads fonts, wraps app in providers (QueryClientProvider, SupabaseProvider). Checks auth state → redirects to `(auth)` or `(tabs)` accordingly.
- **Auth group**: Stack navigation, no bottom tabs. Phone/email input → OTP verification → onboarding name input (new users only).
- **Tabs group**: Bottom tab navigator with 3 tabs — Home (🏠 Accueil), Orders (📋 Commandes), Profile (👤 Profil). Each tab has its own stack for detail screens.

### State Management

| Store | Purpose | Key State |
|-------|---------|-----------|
| `authStore` | Supabase session, user profile | `session`, `user`, `isAuthenticated`, `isNewUser` |
| `cartStore` | Cart items, quantities, restaurant context | `items[]`, `restaurantId`, `subtotal`, `deliveryFee`, `total` |
| `orderStore` | Active and past orders, realtime updates | `activeOrders[]`, `orderHistory[]`, `subscribeToOrder(id)` |

All stores use Zustand with `persist` middleware (AsyncStorage) so cart survives app restarts and auth session persists.

### Data Fetching

- React Query (`@tanstack/react-query`) for all API calls
- `useRestaurants()` — fetches nearby/featured restaurants, supports search
- `useOrders()` — fetches order history, manages caching
- `useLocation()` — requests GPS permission, returns lat/lng for proximity queries
- Stale-while-revalidate pattern: show cached data immediately, refresh in background

### Real-time Updates

- Socket.IO client (`services/socket.ts`) connects to `API_BASE_URL` on app launch
- `orderStore.subscribeToOrder(orderId)` joins room `order:{id}` and listens for status change events
- Events update the order in Zustand store, which React Query then invalidates
- On delivery confirmation, the rating prompt reads the latest order state from the store

## Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primaryGreen` | `#00AA13` | Primary buttons, success, CTAs |
| `primaryOrange` | `#FF6600` | Orange Money buttons, highlights |
| `primaryYellow` | `#FFCC00` | MTN MoMo buttons, warnings |
| `bg` | `#F7F7F7` | Screen background |
| `surface` | `#FFFFFF` | Cards, modals, sheets |
| `textPrimary` | `#111111` | Headings, body text |
| `textSecondary` | `#666666` | Labels, descriptions |
| `border` | `#E0E0E0` | Input borders, dividers |
| `error` | `#E53935` | Error states, reject buttons |

### Typography

- Mobile: system fonts (SF Pro on iOS, Roboto on Android)
- Sizes: 12 / 14 / 16 / 18 / 24 / 32px
- Weights: regular (400), medium (500), bold (700)

### Component Patterns

- **Primary button**: `bg: #00AA13`, `border-radius: 12px`, `font-weight: bold`, `padding: 16px 24px`
- **Orange Money button**: `bg: #FF6600`, white text, same radius/padding
- **MTN MoMo button**: `bg: #FFCC00`, `color: #000000`, same radius/padding
- **Cards**: white background, `border-radius: 16px`, subtle shadow (`shadow-opacity: 0.08`)
- **Bottom sheets**: `border-radius: 24px` on top corners
- **Inputs**: `border: 1.5px #E0E0E0`, `border-radius: 10px`, `padding: 12px 16px`
- **Status badges**: pill shape, colored background with white text (e.g., "Ouvert" = green, "Fermé" = red)

### Aesthetic Direction

Cameroon-inspired warmth within the defined palette. Avoid generic AI minimalism. Subtle gradients on headers, warm accent patterns, and the green/orange/yellow trio creating a distinctive identity tied to local mobile money brands.

## Screen Specifications

### 1. Auth — Login (`(auth)/login.tsx`)

Two-tab layout: "Téléphone" (default) and "Email".

**Phone tab:**
- Phone input with `+237` prefix locked, 9-digit input validated against `/^\+2376\d{8}$/`
- "Envoyer le code" primary button, disabled until valid phone
- On tap: calls `supabase.auth.signInWithOtp({ phone })` → navigates to `verify.tsx` with phone param

**Email tab:**
- Email input + password input
- "Se connecter" button → calls `supabase.auth.signInWithPassword({ email, password })`
- "Créer un compte" link → navigates to signup (future slice)

**Error handling:** Network errors show "Vérifiez votre connexion" toast. Invalid credentials show inline "Identifiants incorrects".

### 2. Auth — Verify OTP (`(auth)/verify.tsx`)

- 6-digit OTP input with auto-focus advancing
- 60-second resend countdown timer
- Resend button appears after timer expires
- On success: `authStore` stores session → checks `profiles.is_verified`
  - New user: show name input modal → `supabase.auth.updateUser({ data: { full_name } })` → redirect to `(tabs)`
  - Existing user: redirect to `(tabs)` directly
- On failure: shake animation, "Code invalide" error message

### 3. Home (`(tabs)/index.tsx`)

**Header:**
- App logo left, location badge showing user's city (from profile, overridable by GPS)
- "Bonjour, {firstName}" greeting

**Search bar:**
- Full-width with magnifying glass icon, placeholder "Rechercher un restaurant ou un plat..."
- On submit: calls `GET /api/search?q=&city=&lat=&lng=`
- Results replace the restaurant lists below

**Featured section:**
- Horizontal scroll, title "Restaurants en vedette"
- Restaurants where `is_featured: true`, fetched on mount
- Each is a `RestaurantCard`

**Nearby section:**
- Vertical list, title "Près de chez vous"
- Sorted by distance (when GPS available) or `total_rating DESC`
- Each is a `RestaurantCard`
- Pull-to-refresh supported via React Query refetch

**RestaurantCard component:**
- White card, `border-radius: 16px`, subtle shadow
- Cover image (or gradient placeholder `primaryGreen → primaryOrange`)
- Logo thumbnail overlay (top-left, rounded)
- Name (bold 16px), cuisine tags (pills), rating badge (⭐ `total_rating` + count)
- Delivery fee badge ("500 FCFA"), estimated time ("25 min")
- Status badge: "Ouvert" (green) or "Fermé" (red)

### 4. Restaurant Detail + Menu (`restaurant/[id].tsx`)

**Hero header:**
- Cover image (or gradient) filling top 200px
- Back button overlay (white circle, shadow)
- Restaurant name, cuisine tags, rating, delivery fee, min order, status badge

**Tab bar:** Two tabs — "Menu" (default) and "Infos"

**Menu tab:**
- Sticky category headers for each `menu_category`
- Under each: `MenuItemRow` showing:
  - Image thumbnail (64×64, or green placeholder)
  - Name (bold 14px), description (truncated 1 line, textSecondary)
  - Price in FCFA (right-aligned, bold)
  - "+" add button (or quantity stepper if already in cart)
- Tapping "+" adds to `cartStore` with `quantity: 1`

**Infos tab:**
- Address with map pin icon
- Phone number (tappable)
- Opening hours (formatted from JSON)
- Full description

**Cart floating button:**
- Appears at bottom when `cartStore.items.length > 0`
- Shows item count badge, total in FCFA, "Voir le panier →"
- Taps navigate to `/cart`

### 5. Cart (`cart.tsx`)

- `CartItemRow` for each item: name, price × quantity, quantity stepper (−/+), special instructions link, swipe-to-delete
- Subtotal line
- Delivery fee line
- Total line (bold, larger font)
- "Commander →" primary button, disabled if total < restaurant's `min_order_amount`
- Empty state: illustration + "Votre panier est vide"

### 6. Checkout (`checkout.tsx`)

**Delivery section:**
- Auto-filled delivery address from GPS (editable text input)
- Delivery notes input (optional, placeholder "Porte, étage, instructions...")

**Payment section:**
- Two large branded buttons side by side:
  - 🟠 "Orange Money" — `bg: #FF6600`, white text
  - 🟡 "MTN MoMo" — `bg: #FFCC00`, black text
- Selected button shows checkmark overlay

**Phone confirmation:**
- Phone number pre-filled from profile, editable
- Validated against `/^\+2376\d{8}$/`

**Order summary:**
- Collapsible item list
- Subtotal, delivery fee, total
- **60% upfront amount highlighted** in green: "Acompte: {amount} FCFA"

**Confirm button:**
- "Payer l'acompte {amount} FCFA" (primary green)
- On tap: calls `POST /api/orders` with `OrderCreationData`
- Loading state: spinner with "Traitement en cours..."
- On success: navigate to `/order/{id}` with `replace` (can't go back to checkout)
- On failure: show error toast, stay on checkout

### 7. Order Tracking (`order/[id].tsx`)

**Header:**
- Back button, "Commande #{orderNumber}", status badge (colored by status)

**OrderTimeline component:**
- Vertical stepper, each step shows:
  - Icon (✅ completed, 🔵 pulsing current, ⚪ future)
  - Label in French matching the 9-step lifecycle
  - Timestamp (formatted) for completed steps
- Steps: Commande passée → Confirmée → En préparation → Prête → Livreur assigné → Récupérée → En livraison → Livrée → Confirmée

**DriverMap component** (visible when status ≥ `driver_assigned`):
- Google Maps with:
  - Restaurant marker (green pin)
  - Delivery point marker (red pin)
  - Driver position marker (blue dot, real-time via Socket.IO)
  - Route polyline from driver to delivery point
- Map takes remaining screen height below timeline

**Bottom sheet:**
- Driver info: name, vehicle type, rating
- "Appeler" call button (tappable phone link)
- Collapsible order summary

**Delivery confirmation:**
- When status = `delivered`: large green "Confirmer la réception" button appears
- Tapping calls `POST /api/orders/:id/confirm-delivery`
- After confirmation: rating prompt modal
  - ⭐ Restaurant rating (1-5 stars + optional comment)
  - ⭐ Driver rating (1-5 stars + optional comment)
  - Calls `POST /api/ratings`

**Real-time updates:**
- Screen subscribes to Socket.IO room `order:{id}`
- Status change events update the timeline and map in real-time
- `driver_location` events update the driver marker position

## API Integration

### Service Layer

**`services/api.ts`** — Axios instance:
- Base URL from `EXPO_PUBLIC_API_URL` env var (default `http://localhost:3001`)
- Auth interceptor: attaches `Bearer {token}` from `authStore.session.access_token`
- Error interceptor: on 401, refreshes session or redirects to login

**`services/auth.ts`** — Supabase auth wrapper:
- `sendOtp(phone)` — calls `supabase.auth.signInWithOtp({ phone })`
- `verifyOtp(phone, token)` — calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
- `signInWithEmail(email, password)` — calls `supabase.auth.signInWithPassword()`
- `signOut()` — calls `supabase.auth.signOut()`
- Supabase client initialized with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**`services/socket.ts`** — Socket.IO client:
- Connects on auth, disconnects on logout
- Auto-reconnect with backoff
- Exports `joinRoom(room)`, `leaveRoom(room)`, `onEvent(event, callback)`

### API Endpoints Used

| Screen | Endpoint | Method |
|--------|----------|--------|
| Home | `/api/search?q=&city=&lat=&lng=` | GET |
| Home | `/api/restaurants` | GET |
| Restaurant | `/api/restaurants/:id` | GET |
| Restaurant | `/api/restaurants/:id/menu` | GET |
| Checkout | `/api/orders` | POST |
| Order tracking | `/api/orders/:id` | GET |
| Delivery confirm | `/api/orders/:id/confirm-delivery` | POST |
| Ratings | `/api/ratings` | POST |
| Auth | Supabase auth (OTP, email) | — |

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Network error | Toast: "Vérifiez votre connexion" + retry button |
| 401 Unauthorized | Refresh session, redirect to login if refresh fails |
| Payment failure on checkout | Toast: "Paiement échoué" + stay on checkout |
| Order creation failure | Toast with server error message, stay on checkout |
| GPS unavailable | Skip distance sorting, show restaurants by rating |
| Socket disconnect | Show "Reconnexion..." banner, auto-reconnect |
| Driver location stale | Show last known position with "Dernière position" label |

## Testing Strategy

- Component tests with React Native Testing Library for UI primitives
- Integration tests for cart store (add, remove, total calculation, min order validation)
- E2E manual testing of full flow: search → restaurant → cart → checkout → order tracking → confirm delivery → rating