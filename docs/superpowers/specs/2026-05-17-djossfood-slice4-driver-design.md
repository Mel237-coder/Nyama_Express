# DjossFood Slice 4 — Driver App Design Specification

## Overview

Slice 4 builds the driver mobile app (`apps/mobile-driver`) using Expo SDK 50, expo-router v3, and the same design system as the client app. The driver app provides: registration with document upload, approval flow, online/offline toggle, delivery request acceptance, live navigation with route map, delivery lifecycle management, and earnings tracking.

**Pre-requisites:** Slices 1 (backend API) and 2 (mobile client) are complete. Slice 3 (restaurant dashboard) is complete. New backend endpoints for driver registration and earnings are needed.

## Architecture & File Structure

```
apps/mobile-driver/
├── app/
│   ├── _layout.tsx                # Root: providers (QueryClient, Socket.IO)
│   ├── (auth)/
│   │   ├── _layout.tsx            # Auth group layout
│   │   ├── login.tsx              # Phone OTP login
│   │   ├── verify.tsx             # OTP verification
│   │   ├── register.tsx           # Driver registration (vehicle info)
│   │   └── documents.tsx          # Document upload (license, ID)
│   ├── (main)/
│   │   ├── _layout.tsx            # Main tabs layout (guarded by auth + approval)
│   │   ├── index.tsx              # Home: map + online toggle + delivery requests
│   │   ├── delivery/
│   │   │   └── [id].tsx           # Active delivery with map + actions
│   │   ├── earnings.tsx           # Earnings summary + delivery history
│   │   └── profile.tsx            # Driver profile + settings
├── components/
│   ├── ui/                        # Shared UI primitives (Button, Input, Card, etc.)
│   ├── DeliveryRequestSheet.tsx    # Incoming delivery request modal
│   ├── ActiveDeliveryMap.tsx       # Map with route for active delivery
│   ├── EarningsCard.tsx            # Wallet balance + today's earnings
│   └── DocumentUpload.tsx          # Camera/gallery document upload
├── services/
│   ├── api.ts                     # Axios instance with auth interceptor
│   ├── auth.ts                    # Supabase Auth (OTP + driver profile)
│   ├── socket.ts                  # Socket.IO + location broadcasting
│   └── location.ts               # Foreground GPS tracking service
├── stores/
│   ├── authStore.ts               # Auth + driver profile + approval state
│   └── deliveryStore.ts           # Active delivery + real-time updates
├── hooks/
│   ├── useDriver.ts              # Driver profile + status mutations
│   ├── useEarnings.ts            # Earnings data + delivery history
│   └── useDeliveries.ts          # Accept/pickup/deliver mutations
├── constants/
│   ├── colors.ts                  # Same DjossFood palette
│   ├── typography.ts              # Same typography tokens
│   └── spacing.ts                 # Same spacing tokens
├── public/
│   └── sounds/
│       └── delivery_request.mp3   # Incoming delivery chime
├── package.json
└── tsconfig.json
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 50 + expo-router v3 |
| Styling | Custom components (same design system as client) |
| State | Zustand (persisted for auth, non-persisted for delivery) |
| Data | React Query (server state) |
| Realtime | Socket.IO (location updates + delivery requests) |
| Maps | react-native-maps (Polyline for routes) |
| Location | expo-location (foreground GPS) |
| Auth | Supabase Auth (phone OTP) |
| Language | TypeScript |

### Design System

Same DjossFood palette as the client app:

| Token | Value | Usage |
|-------|-------|-------|
| primaryGreen | #00AA13 | Go online, accept, primary actions |
| primaryOrange | #FF6600 | Active delivery accent |
| primaryYellow | #FFCC00 | Pending/warning states |
| bg | #F7F7F7 | Screen background |
| surface | #FFFFFF | Card background |
| textPrimary | #111111 | Main text |
| textSecondary | #666666 | Secondary text |
| border | #E0E0E0 | Borders/dividers |
| error | #E53935 | Reject, error states |

Typography: Plus Jakarta Sans (Google Fonts) loaded via `expo-font`.

### Authentication & Onboarding Flow

1. Driver opens app → phone OTP login (same as client)
2. After verification, check if driver profile exists (`GET /api/drivers/me`)
3. If no profile → **Registration screen** (vehicle type, license plate, license number)
4. After registration → **Document upload screen** (license photo, ID photo)
5. After document upload → **Pending approval screen** showing "Votre dossier est en cours de vérification"
6. Admin approves via existing `PUT /api/admin/drivers/:id/approve`
7. Driver receives push notification → can now go online

**Guard**: The `(main)` layout checks both authentication AND `is_approved === true`. Unapproved drivers see the pending screen.

### Protected Routes

`(main)` layout requires:
- Authenticated Supabase session
- Driver profile exists
- `is_approved === true`

Otherwise redirects to the appropriate auth/onboarding screen.

## Screen Specifications

### 1. Login (`(auth)/login`)

- Same as client app: phone input → OTP verification
- If driver profile doesn't exist after auth → redirect to register screen
- If driver profile exists but not approved → redirect to pending screen

### 2. Driver Registration (`(auth)/register`)

- Vehicle type selector (motorcycle, bicycle, car)
- License plate input (optional for bicycle)
- License number input
- "Continuer" button → `POST /api/drivers/register`
- After success → redirect to document upload

### 3. Document Upload (`(auth)/documents`)

- Three upload steps: driver's license photo, ID card photo, vehicle plate photo (optional)
- Camera/gallery picker for each
- Upload progress indicator
- "Soumettre" button → `POST /api/drivers/me/documents`
- After success → redirect to pending approval screen

### 4. Pending Approval Screen

- Centered card: "Votre dossier est en cours de vérification"
- Animated loading indicator
- "Nous vous contacterons une fois votre compte approuvé" text
- Auto-check approval status every 30 seconds via React Query refetch
- When approved → redirect to home

### 5. Home — Offline (`(main)/index`)

- Full-screen map showing driver's last known position
- Bottom card with "Aller en ligne" toggle button (large, green)
- Stats: "Aujourd'hui: 0 FCFA | 0 courses"
- Navigation tabs at bottom: Accueil, Gains, Profil

### 6. Home — Online (Waiting for Delivery)

- Full-screen map with driver position marker
- Top status badge: "En ligne" (green)
- Bottom card: "En attente de course..." with activity indicator
- GPS coordinates sent to server every 5 seconds via Socket.IO
- Navigation tabs at bottom

### 7. Delivery Request (modal/sheet)

Triggered by `delivery_request` Socket.IO event when driver is online. **Note:** The current backend sends push notifications for delivery requests via `NotificationService`. A new Socket.IO event `delivery_request` needs to be added to `driverSocket.ts` that emits to the specific driver when `driverMatchingService.findDriver()` assigns an order. This event should include `{ orderId, orderNumber, restaurantName, pickupAddress, deliveryAddress, distanceKm, earnings }`.

- Slides up from bottom
- Restaurant name and logo
- Pickup address
- Delivery address
- Distance (e.g., "3.2 km")
- Estimated earnings (e.g., "500 FCFA")
- Two buttons: "Accepter" (green, full width) / "Refuser" (red, outline)
- Auto-dismiss after 30 seconds if no response
- Sound alert on receive (only when app is in foreground)

### 8. Active Delivery (`(main)/delivery/[id]`)

**Map section** (top 60%):
- Restaurant marker (green pin) with pickup address
- Customer marker (orange pin) with delivery address
- Route polyline from current position → restaurant → customer
- Driver position updates in real-time

**Details section** (bottom 40%):
- Order number and restaurant name
- Pickup address with "Naviguer" link (opens maps app)
- Customer name and phone with "Appeler" button
- Special instructions if any

**Action buttons** (progressive, based on order status):

The driver order lifecycle is: the server assigns a driver when an order is ready, then the driver accepts, picks up, and delivers. The relevant statuses and API calls are:

- `POST /api/orders/:id/accept` → status becomes `driver_assigned`
- `POST /api/orders/:id/pickup` → status becomes `picked_up`
- `POST /api/orders/:id/deliver` → status becomes `delivering`
- Client confirms delivery → status becomes `delivered`

**Button states:**
- **`driver_assigned`**: Show "Confirmer le ramassage" button (driver confirms food pickup from restaurant). Calls `POST /api/orders/:id/pickup`.
- **`picked_up`**: Show "Confirmer la livraison" button (driver confirms delivery to customer). Calls `POST /api/orders/:id/deliver`.
- **`delivering`**: Show waiting state — "En attente de confirmation du client".
- **`delivered`/`completed`**: Show "Retour à l'accueil" button

### 9. Earnings (`(main)/earnings`)

**EarningsCard** at top:
- Wallet balance: "Solde: 12 500 FCFA"
- Today's earnings: "Aujourd'hui: 3 200 FCFA"
- Today's deliveries: "4 courses"

**Delivery history** (scrollable list):
- Each row: date, restaurant name, amount earned
- Paginated (20 per page, load more on scroll)
- Pull to refresh

### 10. Profile (`(main)/profile`)

- Driver avatar (placeholder or photo)
- Name and phone number
- Vehicle type and plate
- Document status: "Vérifié ✓" or "En attente"
- Payout method: Orange Money / MTN MoMo (display only)
- "Historique des courses" link → earnings screen
- "Déconnexion" button at bottom
- "Passer hors ligne" toggle

## API Integration

### New Backend Endpoints (to add)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/drivers/register` | Create driver profile with vehicle info |
| POST | `/api/drivers/me/documents` | Upload driver documents (license, ID) |
| GET | `/api/drivers/me/earnings` | Get earnings summary + recent deliveries |

### Existing Endpoints Used

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/drivers/me` | driver | Fetch own driver profile |
| PUT | `/api/drivers/me/status` | driver | Toggle online/offline status |
| PUT | `/api/drivers/me/location` | driver | Update GPS position |
| POST | `/api/orders/:id/accept` | auth | Accept a delivery assignment |
| POST | `/api/orders/:id/pickup` | auth | Confirm food pickup |
| POST | `/api/orders/:id/deliver` | auth | Mark as delivered |

### Socket.IO Events

| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Client → Server | `driver_location_update` | `{ driver_id, lat, lng }` | GPS position (sent every 5s when online) |
| Client → Server | `join_room` | room name | Join order/restaurant room |
| Client → Server | `leave_room` | room name | Leave room |
| Server → Client | `delivery_request` | `{ orderId, orderNumber, restaurantName, pickupAddress, deliveryAddress, distanceKm, earnings }` | New delivery offer (**Note:** needs to be added to backend driverSocket.ts — emitted to the specific driver when driverMatchingService assigns an order) |
| Server → Client | `order_status_changed` | `{ orderId, status }` | Order status update |

### Service Layer

**`services/location.ts`** — Foreground GPS tracking:
- `startLocationUpdates()`: Uses `expo-location` `watchPositionAsync` with 5-second interval
- On each position update: emits `driver_location_update` via Socket.IO
- `stopLocationUpdates()`: Stops tracking when driver goes offline
- Requests foreground permissions on app start

**`services/socket.ts`** — Extended from client app:
- All client app Socket.IO functionality
- Plus: emit location updates, listen for `delivery_request` events
- Auto-connect on auth, auto-disconnect on logout

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Network error | Toast: "Vérifiez votre connexion" |
| 401 Unauthorized | Redirect to login, clear session |
| Delivery request timeout | Auto-dismiss after 30s, mark as missed |
| Location permission denied | Show explanation, redirect to settings |
| Driver not approved | Show pending approval screen |
| Socket disconnect | Banner: "Reconnexion..." at top |

## Testing Strategy

- Component tests for key screens (Home, Delivery, Earnings)
- Integration tests for the delivery lifecycle (accept → pickup → deliver)
- Manual E2E: register → upload docs → go online → accept delivery → complete delivery → check earnings