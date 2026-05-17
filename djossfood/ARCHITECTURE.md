# DjossFood - Architecture Overview

## Product

DjossFood is a food delivery platform built for Cameroon (Yaounde, Douala, Bafoussam). It connects three user types:

- **Clients** — browse restaurants, place orders, track delivery
- **Restaurants** — manage menu, receive and process orders
- **Drivers** — accept delivery assignments, navigate to pickup/dropoff

Payments are processed exclusively via **Orange Money** and **MTN Mobile Money** through the Campay aggregator. The entire interface is in **French**. All prices use **FCFA (XAF)** with no decimals.

---

## Architecture

Turborepo monorepo with the following structure:

```
djossfood/
  apps/
    api/               # Express + TypeScript backend
    mobile-client/     # React Native + Expo (client app)
    mobile-driver/     # React Native + Expo (driver app)
    web-restaurant/    # Next.js dashboard for restaurants
    web-admin/         # Next.js admin panel
  packages/
    database/          # Supabase client, types, and generated schema
    ui/                # Shared UI components (React Native + Web)
    config/            # Shared ESLint, TypeScript, and Turborepo configs
```

**Supabase** provides PostgreSQL 15 with PostGIS, authentication, realtime subscriptions, and object storage.

---

## Tech Stack

| Layer        | Technology                                                    |
|--------------|---------------------------------------------------------------|
| Backend      | Node 20, Express, TypeScript, Socket.IO                      |
| Mobile       | React Native 0.73, Expo SDK 50                                |
| Web          | Next.js 14, TailwindCSS, shadcn/ui                            |
| Database     | Supabase PostgreSQL 15, PostGIS                               |
| Payments     | Campay (Orange Money + MTN Mobile Money)                      |
| Queues       | Bull, Redis                                                   |
| Notifications| expo-server-sdk                                               |
| Maps         | Google Maps                                                   |
| State        | Zustand, React Query                                          |

---

## Order Lifecycle

```
pending → confirmed → preparing → ready → driver_assigned → picked_up → delivering → delivered → completed
```

Branches:
- `pending` → `rejected` (restaurant rejects)
- Any state before `picked_up` → `cancelled` (client cancels)
- `pending` → auto-cancelled after 5-minute timeout if not confirmed

---

## Payment Flow

- **60% upfront** at order creation (reserved from client)
- **40% on delivery** when client confirms receipt
- **Refund** the 60% upfront if the restaurant rejects or the order times out
- All payment states are logged in a `payment_logs` table

---

## Absolute Rules

1. **Never expose** the Supabase service role key to any client app
2. All FCFA amounts stored and transmitted as **integers** (no decimals)
3. Phone numbers use format **+237XXXXXXXXX**
4. **Row-Level Security (RLS)** must be enabled on every table
5. **5-minute timeout** on pending orders before auto-cancellation
6. **60/40 payment split** — 60% upfront, 40% at delivery
7. Rating values capped at **5.00** maximum
8. **One driver** per order — no multi-driver assignment
9. **Log all payments** in `payment_logs` with status, amount, and timestamps
10. **Log all admin actions** in `admin_audit_log` with actor, action, and target