# DjossFood Slice 4 — Driver App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DjossFood driver mobile app (Expo SDK 50 + expo-router v3) with driver registration, document upload, approval flow, online/offline toggle, delivery request acceptance, active delivery with map, earnings tracking, and profile.

**Architecture:** Expo SDK 50 app in `apps/mobile-driver/`, mirroring the client app's patterns (Zustand stores, React Query hooks, Socket.IO, custom UI components with same design tokens). Backend additions in `apps/api/src/routes/` for driver registration, document upload, and earnings endpoints. A new `delivery_request` Socket.IO event will be added to `driverSocket.ts`.

**Tech Stack:** Expo SDK 50, expo-router v3, react-native-maps, expo-location, Zustand (persisted), React Query, Socket.IO client, Supabase Auth (phone OTP), TypeScript, same DjossFood design system (#00AA13 green, #FF6600 orange, #FFCC00 yellow).

---

## Task 1: Expo Project Setup + Expo Router

**Files:**
- Create: `apps/mobile-driver/package.json`
- Create: `apps/mobile-driver/app.json`
- Create: `apps/mobile-driver/tsconfig.json`
- Create: `apps/mobile-driver/babel.config.js`
- Create: `apps/mobile-driver/metro.config.js`
- Create: `apps/mobile-driver/app/_layout.tsx`
- Create: `apps/mobile-driver/constants/colors.ts`
- Create: `apps/mobile-driver/constants/spacing.ts`
- Create: `apps/mobile-driver/constants/typography.ts`
- Create: `apps/mobile-driver/.env.example`

- [ ] **Step 1: Create the package.json**

```json
{
  "name": "@djossfood/mobile-driver",
  "version": "0.0.1",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "expo-status-bar": "~1.11.1",
    "expo-location": "~16.5.0",
    "expo-linking": "~6.2.0",
    "expo-constants": "~15.4.0",
    "expo-font": "~11.10.0",
    "expo-image-picker": "~14.7.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-maps": "1.10.0",
    "@react-native-async-storage/async-storage": "1.21.0",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "~18.2.0",
    "@types/react-native": "~0.73.0",
    "@djossfood/config": "*",
    "@djossfood/database": "*"
  }
}
```

- [ ] **Step 2: Create app.json**

```json
{
  "expo": {
    "name": "DjossFood Driver",
    "slug": "djossfood-driver",
    "version": "0.0.1",
    "orientation": "default",
    "scheme": "djossfood-driver",
    "userInterfaceStyle": "automatic",
    "splash": {
      "backgroundColor": "#FF6600"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.djossfood.driver"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#FF6600"
      },
      "package": "com.djossfood.driver"
    },
    "plugins": ["expo-router"],
    "extra": {
      "router": {
        "origin": false
      }
    }
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "@djossfood/config/tsconfig.base.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create babel.config.js**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

- [ ] **Step 5: Create metro.config.js**

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  monorepoRoot,
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
```

- [ ] **Step 6: Create .env.example**

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 7: Create design tokens — constants/colors.ts**

```typescript
export const Colors = {
  primaryGreen: '#00AA13',
  primaryOrange: '#FF6600',
  primaryYellow: '#FFCC00',
  bg: '#F7F7F7',
  surface: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#E53935',
  success: '#00AA13',
  warning: '#FFCC00',
  shadow: 'rgba(0, 0, 0, 0.08)',
} as const;

export type ColorKey = keyof typeof Colors;
```

- [ ] **Step 8: Create constants/spacing.ts**

```typescript
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BorderRadii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;
```

- [ ] **Step 9: Create constants/typography.ts**

```typescript
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  bold: '700' as const,
} as const;
```

- [ ] **Step 10: Create app/_layout.tsx — Root layout with providers**

```tsx
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/authStore';
import { connectSocket, disconnectSocket } from '../services/socket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { isAuthenticated, session } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && session) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [isAuthenticated, session]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Slot />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 11: Install dependencies and verify TypeScript compilation**

Run: `cd apps/mobile-driver && npm install`
Run: `cd apps/mobile-driver && npx tsc --noEmit`

Expected: TypeScript compiles without errors.

- [ ] **Step 12: Commit**

```bash
cd apps/mobile-driver
git add package.json app.json tsconfig.json babel.config.js metro.config.js .env.example app/_layout.tsx constants/
git commit -m "feat(driver): scaffold driver app with Expo SDK 50 + expo-router + design tokens"
```

---

## Task 2: Backend Driver Endpoints

**Files:**
- Create: `apps/api/src/routes/driverOwner.ts`
- Modify: `apps/api/src/routes/index.ts`
- Modify: `apps/api/src/sockets/driverSocket.ts`

- [ ] **Step 1: Create driverOwner.ts — driver registration, document upload, and earnings endpoints**

Create `apps/api/src/routes/driverOwner.ts`:

```typescript
import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { getSupabaseAdmin } from '../config/supabase';

const router = Router();

// All driver-owner routes require authentication + driver role
router.use(authMiddleware);
router.use(roleGuard('driver'));

// POST /api/driver-owner/register - Create driver profile with vehicle info
router.post('/register', async (req: AuthRequest, res: Response) => {
  const { vehicle_type, vehicle_plate, license_number } = req.body;

  if (!vehicle_type || !['motorcycle', 'bicycle', 'car'].includes(vehicle_type)) {
    return res.status(400).json({ error: 'Type de véhicule invalide. Valeurs acceptées: motorcycle, bicycle, car' });
  }
  if (vehicle_type !== 'bicycle' && !vehicle_plate) {
    return res.status(400).json({ error: 'Plaque du véhicule requise pour ce type de véhicule' });
  }
  if (!license_number) {
    return res.status(400).json({ error: 'Numéro de permis requis' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Check if driver profile already exists
    const { data: existing } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', req.userId!)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Profil livreur déjà existant' });
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .insert({
        id: req.userId!,
        vehicle_type,
        vehicle_plate: vehicle_type === 'bicycle' ? null : vehicle_plate,
        license_number,
        status: 'offline',
        is_approved: false,
        documents: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Driver register error:', error.message);
      return res.status(500).json({ error: 'Erreur lors de la création du profil' });
    }

    return res.status(201).json({ driver });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('Driver register error:', message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/driver-owner/documents - Upload driver documents (license, ID)
router.post('/documents', async (req: AuthRequest, res: Response) => {
  const { license_photo_url, id_photo_url, vehicle_photo_url } = req.body;

  if (!license_photo_url || !id_photo_url) {
    return res.status(400).json({ error: 'Photo du permis et photo de la pièce d\'identité requises' });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: driver, error } = await supabase
      .from('drivers')
      .update({
        documents: {
          license_photo_url,
          id_photo_url,
          vehicle_photo_url: vehicle_photo_url || null,
        },
      })
      .eq('id', req.userId!)
      .select()
      .single();

    if (error || !driver) {
      return res.status(404).json({ error: 'Profil livreur non trouvé' });
    }

    return res.json({ driver });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('Driver documents upload error:', message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/driver-owner/earnings - Get earnings summary + recent deliveries
router.get('/earnings', async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();

    // Get driver wallet balance
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('wallet_balance, total_deliveries')
      .eq('id', req.userId!)
      .single();

    if (driverError || !driver) {
      return res.status(404).json({ error: 'Profil livreur non trouvé' });
    }

    // Get recent completed deliveries (last 30)
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('orders')
      .select('id, order_number, restaurant_id, delivery_fee, total_amount, created_at, status')
      .eq('driver_id', req.userId!)
      .in('status', ['delivered', 'completed'])
      .order('created_at', { ascending: false })
      .limit(30);

    if (deliveriesError) {
      console.error('Earnings deliveries error:', deliveriesError.message);
      return res.status(500).json({ error: 'Erreur lors du chargement des gains' });
    }

    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDeliveries = (deliveries || []).filter(
      (d) => new Date(d.created_at) >= today
    );
    const todayEarnings = todayDeliveries.reduce((sum, d) => {
      // Driver earns 85% of delivery_fee (platform takes 15%)
      return sum + Math.round(d.delivery_fee * 0.85);
    }, 0);

    // Get restaurant names for deliveries
    const restaurantIds = [...new Set((deliveries || []).map((d) => d.restaurant_id))];
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name')
      .in('id', restaurantIds);

    const restaurantMap = new Map((restaurants || []).map((r) => [r.id, r.name]));

    const deliveriesWithNames = (deliveries || []).map((d) => ({
      ...d,
      restaurant_name: restaurantMap.get(d.restaurant_id) || 'Restaurant',
      driver_earning: Math.round(d.delivery_fee * 0.85),
    }));

    return res.json({
      wallet_balance: driver.wallet_balance,
      total_deliveries: driver.total_deliveries,
      today_earnings: todayEarnings,
      today_deliveries: todayDeliveries.length,
      deliveries: deliveriesWithNames,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('Earnings error:', message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const driverOwnerRouter = router;
```

- [ ] **Step 2: Register the new route in apps/api/src/routes/index.ts**

Add the import after the existing imports:

```typescript
import { driverOwnerRouter } from './driverOwner';
```

Add the route after the `restaurantOwner` line:

```typescript
// Driver owner routes (auth + role guard applied inside the router)
router.use('/driver-owner', driverOwnerRouter);
```

- [ ] **Step 3: Modify apps/api/src/sockets/driverSocket.ts — add delivery_request event emission**

The spec requires a new `delivery_request` Socket.IO event. Instead of emitting from the socket handler, we export a helper that the `DriverMatchingService` can call after finding a driver. Replace the entire file:

```typescript
import { Server, Socket } from 'socket.io';
import { getSupabaseAdmin } from '../config/supabase';

let io: Server | null = null;

export function setSocketServer(server: Server): void {
  io = server;
}

export function registerDriverHandlers(_io: Server, socket: Socket) {
  // Driver sends GPS location update
  socket.on('driver_location_update', async (data: {
    driver_id: string;
    lat: number;
    lng: number;
  }) => {
    const supabase = getSupabaseAdmin();
    await supabase
      .from('drivers')
      .update({
        current_location: `SRID=4326;POINT(${data.lng},${data.lat})`,
        current_location_updated_at: new Date().toISOString(),
      })
      .eq('id', data.driver_id);

    // Broadcast to any active order tracking rooms
    socket.broadcast.emit('driver_location', {
      driver_id: data.driver_id,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('join_room', (room: string) => {
    socket.join(room);
  });

  socket.on('leave_room', (room: string) => {
    socket.leave(room);
  });
}

// Emit delivery_request to a specific driver room
export function emitDeliveryRequest(driverId: string, payload: {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  earnings: number;
}): void {
  if (io) {
    io.to(`driver:${driverId}`).emit('delivery_request', payload);
  }
}
```

- [ ] **Step 4: Update the Socket.IO server setup to call setSocketServer**

Find where the Socket.IO `io` server is initialized in the API (likely `apps/api/src/index.ts` or `apps/api/src/server.ts`). After creating the `io` instance and before registering handlers, add:

```typescript
import { setSocketServer } from './sockets/driverSocket';
// ... after io is created:
setSocketServer(io);
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/api && npx tsc --noEmit`

Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
cd apps/api
git add src/routes/driverOwner.ts src/routes/index.ts src/sockets/driverSocket.ts
git commit -m "feat(api): add driver registration, documents, and earnings endpoints + delivery_request socket event"
```

---

## Task 3: Driver Auth Store + Services

**Files:**
- Create: `apps/mobile-driver/stores/authStore.ts`
- Create: `apps/mobile-driver/services/api.ts`
- Create: `apps/mobile-driver/services/auth.ts`
- Create: `apps/mobile-driver/services/socket.ts`

- [ ] **Step 1: Create stores/authStore.ts — Zustand persisted store with driver-specific fields**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile, Driver } from '@djossfood/database';

interface AuthState {
  session: { access_token: string; refresh_token: string } | null;
  profile: Profile | null;
  driver: Driver | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  isApproved: boolean;
  setSession: (session: any) => void;
  setProfile: (profile: Profile | null) => void;
  setDriver: (driver: Driver | null) => void;
  setIsNewUser: (isNewUser: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      driver: null,
      isAuthenticated: false,
      isNewUser: false,
      isApproved: false,

      setSession: (session) =>
        set({
          session,
          isAuthenticated: !!session?.access_token,
        }),

      setProfile: (profile) => set({ profile }),

      setDriver: (driver) =>
        set({
          driver,
          isApproved: driver?.is_approved ?? false,
        }),

      setIsNewUser: (isNewUser) => set({ isNewUser }),

      signOut: () =>
        set({
          session: null,
          profile: null,
          driver: null,
          isAuthenticated: false,
          isNewUser: false,
          isApproved: false,
        }),
    }),
    {
      name: 'djossfood-driver-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        profile: state.profile,
        driver: state.driver,
        isAuthenticated: state.isAuthenticated,
        isApproved: state.isApproved,
      }),
    },
  ),
);
```

- [ ] **Step 2: Create services/api.ts — Axios instance with auth interceptor**

```typescript
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { session } = useAuthStore.getState();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { signOut } = useAuthStore.getState();
      await signOut();
    }
    return Promise.reject(error);
  },
);

export default api;
```

- [ ] **Step 3: Create services/auth.ts — Supabase Auth for driver (phone OTP only)**

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@djossfood/database';
import api from './api';
import { useAuthStore } from '../stores/authStore';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function verifyOtp(phone: string, token: string): Promise<{
  session?: any;
  profile?: Profile;
  isNewUser?: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) return { error: 'Code invalide ou expiré' };
  if (!data.user) return { error: 'Erreur de connexion' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const isNewUser = !profile?.full_name;

  return {
    session: data.session,
    profile: profile as Profile | undefined,
    isNewUser,
  };
}

export async function registerDriver(data: {
  vehicle_type: string;
  vehicle_plate?: string;
  license_number: string;
}): Promise<{ driver?: any; error?: string }> {
  try {
    const { data: result } = await api.post('/api/driver-owner/register', data);
    return { driver: result.driver };
  } catch (err: any) {
    const message = err.response?.data?.error || 'Erreur lors de l\'inscription';
    return { error: message };
  }
}

export async function uploadDocuments(data: {
  license_photo_url: string;
  id_photo_url: string;
  vehicle_photo_url?: string;
}): Promise<{ driver?: any; error?: string }> {
  try {
    const { data: result } = await api.post('/api/driver-owner/documents', data);
    return { driver: result.driver };
  } catch (err: any) {
    const message = err.response?.data?.error || 'Erreur lors de l\'envoi des documents';
    return { error: message };
  }
}

export async function fetchDriverProfile(): Promise<{ driver?: any; error?: string }> {
  try {
    const { data } = await api.get('/api/drivers/me');
    return { driver: data.driver };
  } catch (err: any) {
    const message = err.response?.data?.error || 'Erreur lors du chargement du profil';
    return { error: message };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
```

- [ ] **Step 4: Create services/socket.ts — Socket.IO with driver-specific events**

```typescript
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

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

export function connectSocket(): void {
  const { session } = useAuthStore.getState();
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

export function emitLocationUpdate(driverId: string, lat: number, lng: number): void {
  const s = getSocket();
  s.emit('driver_location_update', { driver_id: driverId, lat, lng });
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
cd apps/mobile-driver
git add stores/ services/
git commit -m "feat(driver): add auth store, API service, auth service, and socket service"
```

---

## Task 4: Auth Screens (Login + Verify)

**Files:**
- Create: `apps/mobile-driver/app/(auth)/_layout.tsx`
- Create: `apps/mobile-driver/app/(auth)/login.tsx`
- Create: `apps/mobile-driver/app/(auth)/verify.tsx`

- [ ] **Step 1: Create app/(auth)/_layout.tsx — Auth group layout**

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create app/(auth)/login.tsx — Driver phone OTP login**

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { sendOtp } from '../../services/auth';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 9);
  };

  const getFullPhone = (localPhone: string): string | null => {
    const digits = localPhone.replace(/\D/g, '');
    if (/^6\d{8}$/.test(digits)) return `+237${digits}`;
    if (/^\+2376\d{8}$/.test(digits)) return digits;
    return null;
  };

  const handleSendOtp = async () => {
    setError(null);
    const fullPhone = getFullPhone(phone);
    if (!fullPhone) {
      setError('Numéro invalide. Ex: 6XXXXXXXX');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(fullPhone);
      if (result.success) {
        router.push({ pathname: '/(auth)/verify', params: { phone: fullPhone } });
      } else {
        setError('Vérifiez votre connexion');
      }
    } catch {
      setError('Vérifiez votre connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <Text style={styles.appName}>DjossFood</Text>
          <Text style={styles.tagline}>Espace Livreur</Text>
        </View>

        {/* Phone Form */}
        <View style={styles.form}>
          <Input
            label="Numéro de téléphone"
            placeholder="6XXXXXXXX"
            value={phone}
            onChangeText={(text) => { setPhone(formatPhone(text)); setError(null); }}
            keyboardType="phone-pad"
            maxLength={9}
            error={error ?? undefined}
          />
          <View style={styles.prefixHint}>
            <Text style={styles.prefixText}>Indicatif : +237 (Cameroun)</Text>
          </View>
          <Button
            title="Envoyer le code"
            onPress={handleSendOtp}
            loading={loading}
            disabled={phone.length < 9}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  appName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  prefixHint: {
    marginBottom: Spacing.lg,
  },
  prefixText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
```

- [ ] **Step 3: Create app/(auth)/verify.tsx — OTP verification with driver profile check**

```tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { verifyOtp } from '../../services/auth';
import { fetchDriverProfile } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const { setSession, setProfile, setDriver, setIsNewUser } = useAuthStore();

  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === OTP_LENGTH - 1) {
      const fullCode = newCode.join('');
      if (fullCode.length === OTP_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otp?: string) => {
    const fullCode = otp || code.join('');
    if (fullCode.length < OTP_LENGTH) return;

    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(phone!, fullCode);
      if (result.error) {
        setError('Code invalide');
        setCode(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        triggerShake();
      } else if (result.session) {
        setSession(result.session);
        if (result.profile) setProfile(result.profile);
        if (result.isNewUser) {
          setIsNewUser(true);
          // New user, needs to register as driver
          router.replace('/(auth)/register');
        } else {
          // Existing user, check if driver profile exists
          const driverResult = await fetchDriverProfile();
          if (driverResult.driver) {
            setDriver(driverResult.driver);
            if (driverResult.driver.is_approved) {
              router.replace('/(main)');
            } else {
              router.replace('/(auth)/pending');
            }
          } else {
            // Has profile but no driver profile, needs registration
            router.replace('/(auth)/register');
          }
        }
      }
    } catch {
      setError('Vérifiez votre connexion');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>
          Entrez le code envoyé au {phone}
        </Text>

        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[styles.otpBox, error ? styles.otpBoxError : null]}
              value={code[i]}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Vérifier"
          onPress={() => handleVerify()}
          loading={loading}
          disabled={code.join('').length < OTP_LENGTH}
          style={styles.verifyButton}
        />

        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={() => {
              setCanResend(false);
              setResendTimer(RESEND_TIMEOUT);
              setCode(Array(OTP_LENGTH).fill(''));
              setError(null);
            }}>
              <Text style={styles.resendLink}>Renvoyer le code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Renvoyer dans {resendTimer}s
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.md,
    backgroundColor: Colors.surface,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  otpBoxError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    marginTop: Spacing.md,
  },
  resendContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  resendTimer: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  resendLink: {
    fontSize: FontSizes.sm,
    color: Colors.primaryOrange,
    fontWeight: FontWeights.bold,
  },
});
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
cd apps/mobile-driver
git add app/\(auth\)/
git commit -m "feat(driver): add login and verify auth screens with OTP"
```

---

## Task 5: UI Primitives (Shared Components)

**Files:**
- Create: `apps/mobile-driver/components/ui/Button.tsx`
- Create: `apps/mobile-driver/components/ui/Input.tsx`
- Create: `apps/mobile-driver/components/ui/Card.tsx`
- Create: `apps/mobile-driver/components/ui/Badge.tsx`
- Create: `apps/mobile-driver/components/ui/Sheet.tsx`
- Create: `apps/mobile-driver/components/ui/LoadingSpinner.tsx`
- Create: `apps/mobile-driver/components/ui/Toast.tsx`

These are identical to the client app components but use the driver app's local imports. Copy each component, adapting imports to use relative paths from the driver app's constants.

- [ ] **Step 1: Create components/ui/Button.tsx**

(Copy from `apps/mobile-client/components/ui/Button.tsx`, identical code — same design tokens, same variants, same API.)

- [ ] **Step 2: Create components/ui/Input.tsx**

(Copy from `apps/mobile-client/components/ui/Input.tsx` — identical code.)

- [ ] **Step 3: Create components/ui/Card.tsx**

(Copy from `apps/mobile-client/components/ui/Card.tsx` — identical code.)

- [ ] **Step 4: Create components/ui/Badge.tsx**

(Copy from `apps/mobile-client/components/ui/Badge.tsx` — identical code.)

- [ ] **Step 5: Create components/ui/Sheet.tsx**

(Copy from `apps/mobile-client/components/ui/Sheet.tsx` — identical code.)

- [ ] **Step 6: Create components/ui/LoadingSpinner.tsx**

(Copy from `apps/mobile-client/components/ui/LoadingSpinner.tsx` — identical code.)

- [ ] **Step 7: Create components/ui/Toast.tsx**

(Copy from `apps/mobile-client/components/ui/Toast.tsx` — identical code.)

- [ ] **Step 8: Verify TypeScript compiles**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

- [ ] **Step 9: Commit**

```bash
cd apps/mobile-driver
git add components/ui/
git commit -m "feat(driver): add UI primitive components (Button, Input, Card, Badge, Sheet, LoadingSpinner, Toast)"
```

---

## Task 6: Driver Registration + Document Upload Screens

**Files:**
- Create: `apps/mobile-driver/app/(auth)/register.tsx`
- Create: `apps/mobile-driver/app/(auth)/documents.tsx`
- Create: `apps/mobile-driver/app/(auth)/pending.tsx`
- Create: `apps/mobile-driver/components/DocumentUpload.tsx`

- [ ] **Step 1: Create components/DocumentUpload.tsx — Camera/gallery document upload**

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { BorderRadii } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface DocumentUploadProps {
  label: string;
  onImageSelected: (uri: string) => void;
  imageUri: string | null;
  required?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  onImageSelected,
  imageUri,
  required = true,
}) => {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch {
      // Fallback to camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.uploadArea, imageUri ? styles.uploadAreaFilled : null]}
        onPress={pickImage}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <ActivityIndicator color={Colors.primaryOrange} />
        ) : imageUri ? (
          <View style={styles.filledContainer}>
            <Text style={styles.filledIcon}>✓</Text>
            <Text style={styles.filledText}>Photo sélectionnée</Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Ajouter une photo</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadii.lg,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  uploadAreaFilled: {
    borderColor: Colors.primaryGreen,
    borderStyle: 'solid',
    backgroundColor: '#F0FFF0',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  filledContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filledIcon: {
    fontSize: FontSizes.lg,
    color: Colors.primaryGreen,
    fontWeight: FontWeights.bold,
  },
  filledText: {
    fontSize: FontSizes.sm,
    color: Colors.primaryGreen,
    fontWeight: FontWeights.medium,
  },
});

export default DocumentUpload;
```

- [ ] **Step 2: Create app/(auth)/register.tsx — Driver vehicle info registration**

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { registerDriver } from '../../services/auth';

type VehicleType = 'motorcycle' | 'bicycle' | 'car';

const VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: string }[] = [
  { type: 'motorcycle', label: 'Moto', icon: '🏍️' },
  { type: 'bicycle', label: 'Vélo', icon: '🚲' },
  { type: 'car', label: 'Voiture', icon: '🚗' },
];

export default function RegisterScreen() {
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!vehicleType) {
      setError('Sélectionnez un type de véhicule');
      return;
    }
    if (vehicleType !== 'bicycle' && !vehiclePlate.trim()) {
      setError('Plaque du véhicule requise');
      return;
    }
    if (!licenseNumber.trim()) {
      setError('Numéro de permis requis');
      return;
    }

    setLoading(true);
    try {
      const result = await registerDriver({
        vehicle_type: vehicleType,
        vehicle_plate: vehicleType !== 'bicycle' ? vehiclePlate.trim() : undefined,
        license_number: licenseNumber.trim(),
      });

      if (result.error) {
        setError(result.error);
      } else if (result.driver) {
        router.replace('/(auth)/documents');
      }
    } catch {
      setError('Vérifiez votre connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Inscription Livreur</Text>
        <Text style={styles.subtitle}>
          Renseignez les informations de votre véhicule
        </Text>

        {/* Vehicle type selector */}
        <Text style={styles.sectionLabel}>Type de véhicule</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.vehicleOption,
                vehicleType === option.type && styles.vehicleOptionSelected,
              ]}
              onPress={() => setVehicleType(option.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.vehicleIcon}>{option.icon}</Text>
              <Text style={[
                styles.vehicleLabel,
                vehicleType === option.type && styles.vehicleLabelSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {vehicleType && vehicleType !== 'bicycle' && (
          <Input
            label="Plaque du véhicule"
            placeholder="EX: LT-1234-AB"
            value={vehiclePlate}
            onChangeText={(text) => { setVehiclePlate(text); setError(null); }}
            autoCapitalize="characters"
          />
        )}

        <Input
          label="Numéro de permis"
          placeholder="Numéro de permis de conduire"
          value={licenseNumber}
          onChangeText={(text) => { setLicenseNumber(text); setError(null); }}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Continuer"
          onPress={handleSubmit}
          loading={loading}
          disabled={!vehicleType}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  vehicleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  vehicleOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadii.lg,
    backgroundColor: Colors.surface,
  },
  vehicleOptionSelected: {
    borderColor: Colors.primaryOrange,
    backgroundColor: '#FFF5EB',
  },
  vehicleIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  vehicleLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  vehicleLabelSelected: {
    color: Colors.primaryOrange,
    fontWeight: FontWeights.bold,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
```

- [ ] **Step 3: Create app/(auth)/documents.tsx — Document upload screen**

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Button from '../../components/ui/Button';
import DocumentUpload from '../../components/DocumentUpload';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { uploadDocuments } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

export default function DocumentsScreen() {
  const [licenseUri, setLicenseUri] = useState<string | null>(null);
  const [idUri, setIdUri] = useState<string | null>(null);
  const [vehicleUri, setVehicleUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setDriver } = useAuthStore();

  const handleSubmit = async () => {
    setError(null);
    if (!licenseUri || !idUri) {
      setError('Photo du permis et pièce d\'identité requises');
      return;
    }

    setLoading(true);
    try {
      // In production, upload images to Supabase Storage first and get URLs
      // For now, use local URIs as placeholders
      const result = await uploadDocuments({
        license_photo_url: licenseUri,
        id_photo_url: idUri,
        vehicle_photo_url: vehicleUri || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.driver) {
        setDriver(result.driver);
        router.replace('/(auth)/pending');
      }
    } catch {
      setError('Vérifiez votre connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.subtitle}>
          Envoyez les photos de vos documents pour vérification
        </Text>

        <DocumentUpload
          label="Permis de conduire"
          onImageSelected={setLicenseUri}
          imageUri={licenseUri}
          required
        />

        <DocumentUpload
          label="Pièce d'identité"
          onImageSelected={setIdUri}
          imageUri={idUri}
          required
        />

        <DocumentUpload
          label="Photo du véhicule (optionnel)"
          onImageSelected={setVehicleUri}
          imageUri={vehicleUri}
          required={false}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Soumettre"
          onPress={handleSubmit}
          loading={loading}
          disabled={!licenseUri || !idUri}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
```

- [ ] **Step 4: Create app/(auth)/pending.tsx — Approval pending screen with auto-check**

```tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { fetchDriverProfile } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

export default function PendingScreen() {
  const { setDriver } = useAuthStore();

  const { data: driverResult } = useQuery({
    queryKey: ['driverApproval'],
    queryFn: fetchDriverProfile,
    refetchInterval: 30_000, // Check every 30 seconds
  });

  useEffect(() => {
    if (driverResult?.driver) {
      setDriver(driverResult.driver);
      if (driverResult.driver.is_approved) {
        router.replace('/(main)');
      }
    }
  }, [driverResult, setDriver]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primaryOrange} />
        <Text style={styles.title}>En cours de vérification</Text>
        <Text style={styles.message}>
          Votre dossier est en cours de vérification. Nous vous contacterons une fois votre compte approuvé.
        </Text>
        <Text style={styles.hint}>
          Vérification automatique toutes les 30 secondes...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
cd apps/mobile-driver
git add app/\(auth\)/register.tsx app/\(auth\)/documents.tsx app/\(auth\)/pending.tsx components/DocumentUpload.tsx
git commit -m "feat(driver): add driver registration, document upload, and pending approval screens"
```

---

## Task 7: Main Layout + Route Guards + Location Service

**Files:**
- Create: `apps/mobile-driver/app/(main)/_layout.tsx`
- Create: `apps/mobile-driver/services/location.ts`
- Create: `apps/mobile-driver/stores/deliveryStore.ts`

- [ ] **Step 1: Create services/location.ts — Foreground GPS tracking**

```typescript
import * as Location from 'expo-location';
import { emitLocationUpdate } from './socket';
import { useAuthStore } from '../stores/authStore';

let locationSubscription: Location.LocationSubscription | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function startLocationUpdates(): Promise<void> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.warn('[Location] Permission not granted');
    return;
  }

  // Stop any existing subscription
  await stopLocationUpdates();

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // Update every 5 seconds
      distanceInterval: 10, // Also update if moved 10+ meters
    },
    (location) => {
      const { driver } = useAuthStore.getState();
      if (driver?.id) {
        emitLocationUpdate(
          driver.id,
          location.coords.latitude,
          location.coords.longitude,
        );
      }
    },
  );
}

export async function stopLocationUpdates(): Promise<void> {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}

export async function getCurrentPosition(): Promise<Location.LocationObject | null> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return null;

  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Create stores/deliveryStore.ts — Delivery state management**

```typescript
import { create } from 'zustand';

interface DeliveryRequest {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  earnings: number;
}

interface DeliveryState {
  isOnline: boolean;
  activeOrderId: string | null;
  deliveryRequest: DeliveryRequest | null;
  isRequestVisible: boolean;
  requestTimer: ReturnType<typeof setTimeout> | null;

  goOnline: () => void;
  goOffline: () => void;
  setActiveOrderId: (id: string | null) => void;
  setDeliveryRequest: (request: DeliveryRequest | null) => void;
  showRequest: (request: DeliveryRequest) => void;
  dismissRequest: () => void;
}

export const useDeliveryStore = create<DeliveryState>()((set, get) => ({
  isOnline: false,
  activeOrderId: null,
  deliveryRequest: null,
  isRequestVisible: false,
  requestTimer: null,

  goOnline: () => set({ isOnline: true }),
  goOffline: () => {
    const { requestTimer } = get();
    if (requestTimer) clearTimeout(requestTimer);
    set({ isOnline: false, deliveryRequest: null, isRequestVisible: false, requestTimer: null });
  },

  setActiveOrderId: (id) => set({ activeOrderId: id }),

  setDeliveryRequest: (request) => set({ deliveryRequest: request }),

  showRequest: (request) => {
    const { requestTimer } = get();
    if (requestTimer) clearTimeout(requestTimer);

    // Auto-dismiss after 30 seconds
    const timer = setTimeout(() => {
      set({ deliveryRequest: null, isRequestVisible: false, requestTimer: null });
    }, 30_000);

    set({ deliveryRequest: request, isRequestVisible: true, requestTimer: timer });
  },

  dismissRequest: () => {
    const { requestTimer } = get();
    if (requestTimer) clearTimeout(requestTimer);
    set({ deliveryRequest: null, isRequestVisible: false, requestTimer: null });
  },
}));
```

- [ ] **Step 3: Create app/(main)/_layout.tsx — Main tabs layout with auth + approval guard**

```tsx
import { useEffect } from 'react';
import { Redirect, Slot } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { fetchDriverProfile } from '../../services/auth';
import { startLocationUpdates, stopLocationUpdates } from '../../services/location';
import { connectSocket, disconnectSocket, joinRoom } from '../../services/socket';
import { onEvent, offEvent } from '../../services/socket';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { Colors } from '../../constants/colors';

export default function MainLayout() {
  const { isAuthenticated, session, driver, isApproved, setDriver } = useAuthStore();
  const { showRequest } = useDeliveryStore();

  // Fetch driver profile if not yet loaded
  const { isLoading } = useQuery({
    queryKey: ['driverProfile'],
    queryFn: async () => {
      const result = await fetchDriverProfile();
      if (result.driver) {
        setDriver(result.driver);
      }
      return result;
    },
    enabled: isAuthenticated && !driver,
  });

  // Listen for delivery requests via Socket.IO
  useEffect(() => {
    if (!isApproved) return;

    const handleDeliveryRequest = (data: any) => {
      showRequest({
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        restaurantName: data.restaurantName,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        distanceKm: data.distanceKm,
        earnings: data.earnings,
      });
    };

    onEvent('delivery_request', handleDeliveryRequest);
    return () => offEvent('delivery_request', handleDeliveryRequest);
  }, [isApproved, showRequest]);

  // Not authenticated → go to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Still loading driver profile
  if (isLoading || !driver) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryOrange} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Not approved → go to pending screen
  if (!isApproved) {
    return <Redirect href="/(auth)/pending" />;
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
cd apps/mobile-driver
git add app/\(main\)/_layout.tsx services/location.ts stores/deliveryStore.ts
git commit -m "feat(driver): add main layout with auth guard, location service, and delivery store"
```

---

## Task 8: Home Screen (Offline + Online + Delivery Request Sheet)

**Files:**
- Create: `apps/mobile-driver/app/(main)/index.tsx`
- Create: `apps/mobile-driver/components/DeliveryRequestSheet.tsx`
- Create: `apps/mobile-driver/hooks/useDriver.ts`
- Create: `apps/mobile-driver/hooks/useDeliveries.ts`

- [ ] **Step 1: Create hooks/useDriver.ts — Driver profile + status mutations**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { startLocationUpdates, stopLocationUpdates } from '../services/location';
import { connectSocket, disconnectSocket } from '../services/socket';
import { joinRoom } from '../services/socket';

export function useDriverProfile() {
  const { driver } = useAuthStore();

  return useQuery({
    queryKey: ['driverProfile'],
    queryFn: async () => {
      const { data } = await api.get('/api/drivers/me');
      return data.driver;
    },
    initialData: driver,
    staleTime: 30_000,
  });
}

export function useToggleOnline() {
  const queryClient = useQueryClient();
  const { setDriver } = useAuthStore();

  return useMutation({
    mutationFn: async ({ isOnline }: { isOnline: boolean }) => {
      const { data } = await api.put('/api/drivers/me/status', {
        status: isOnline ? 'available' : 'offline',
      });
      return data.driver;
    },
    onSuccess: (driver) => {
      setDriver(driver);
      queryClient.invalidateQueries({ queryKey: ['driverProfile'] });

      if (driver.status === 'available') {
        startLocationUpdates();
        connectSocket();
        if (driver.id) {
          joinRoom(`driver:${driver.id}`);
        }
      } else {
        stopLocationUpdates();
      }
    },
  });
}

export function useDriverEarnings() {
  return useQuery({
    queryKey: ['driverEarnings'],
    queryFn: async () => {
      const { data } = await api.get('/api/driver-owner/earnings');
      return data;
    },
    staleTime: 30_000,
  });
}
```

- [ ] **Step 2: Create hooks/useDeliveries.ts — Accept/pickup/deliver mutations**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useDeliveryStore } from '../stores/deliveryStore';

export function useAcceptDelivery() {
  const queryClient = useQueryClient();
  const { dismissRequest, setActiveOrderId } = useDeliveryStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/accept`);
      return data;
    },
    onSuccess: (_, orderId) => {
      dismissRequest();
      setActiveOrderId(orderId);
      queryClient.invalidateQueries({ queryKey: ['activeDelivery'] });
    },
  });
}

export function useRejectDelivery() {
  const { dismissRequest } = useDeliveryStore();

  return useMutation({
    mutationFn: async (_orderId: string) => {
      // Reject by dismissing the request — the backend will reassign
      // No explicit reject endpoint needed; request auto-expires
    },
    onSuccess: () => {
      dismissRequest();
    },
  });
}

export function usePickupDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/pickup`);
      return data;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['activeDelivery', orderId] });
    },
  });
}

export function useDeliverOrder() {
  const queryClient = useQueryClient();
  const { setActiveOrderId } = useDeliveryStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/deliver`);
      return data;
    },
    onSuccess: () => {
      setActiveOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['activeDelivery'] });
      queryClient.invalidateQueries({ queryKey: ['driverEarnings'] });
    },
  });
}

export function useActiveDelivery(orderId: string | null) {
  return useQueryClient().getQueryData(['activeDelivery', orderId]) ?? null;
}
```

- [ ] **Step 3: Create components/DeliveryRequestSheet.tsx — Incoming delivery request modal**

```tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { BorderRadii } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';
import { useDeliveryStore } from '../stores/deliveryStore';
import { useAcceptDelivery, useRejectDelivery } from '../hooks/useDeliveries';

const DeliveryRequestSheet: React.FC = () => {
  const { deliveryRequest, isRequestVisible, dismissRequest } = useDeliveryStore();
  const acceptMutation = useAcceptDelivery();
  const rejectMutation = useRejectDelivery();

  if (!isRequestVisible || !deliveryRequest) return null;

  const handleAccept = () => {
    acceptMutation.mutate(deliveryRequest.orderId);
  };

  const handleReject = () => {
    rejectMutation.mutate(deliveryRequest.orderId);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nouvelle course !</Text>
          <TouchableOpacity onPress={dismissRequest} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{deliveryRequest.restaurantName}</Text>

          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>📍 Ramassage</Text>
            <Text style={styles.addressText}>{deliveryRequest.pickupAddress}</Text>
          </View>

          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>🏠 Livraison</Text>
            <Text style={styles.addressText}>{deliveryRequest.deliveryAddress}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{deliveryRequest.distanceKm.toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{deliveryRequest.earnings.toLocaleString('fr-FR')} FCFA</Text>
              <Text style={styles.statLabel}>Gains</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleAccept}
            disabled={acceptMutation.isPending}
            activeOpacity={0.7}
          >
            {acceptMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptText}>Accepter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={handleReject}
            disabled={rejectMutation.isPending}
            activeOpacity={0.7}
          >
            <Text style={styles.rejectText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadii.xxl,
    borderTopRightRadius: BorderRadii.xxl,
    padding: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  closeButton: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  infoSection: {
    marginBottom: Spacing.xl,
  },
  restaurantName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.primaryOrange,
    marginBottom: Spacing.md,
  },
  addressRow: {
    marginBottom: Spacing.sm,
  },
  addressLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  addressText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  actions: {
    gap: Spacing.sm,
  },
  button: {
    borderRadius: BorderRadii.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  acceptButton: {
    backgroundColor: Colors.primaryGreen,
  },
  acceptText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  rejectText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.error,
  },
});

export default DeliveryRequestSheet;
```

- [ ] **Step 4: Create app/(main)/index.tsx — Home screen with map + online toggle**

```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useToggleOnline, useDriverProfile } from '../../hooks/useDriver';
import { getCurrentPosition } from '../../services/location';
import DeliveryRequestSheet from '../../components/DeliveryRequestSheet';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

const DOUALA_REGION: Region = {
  latitude: 4.0511,
  longitude: 9.7679,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function HomeScreen() {
  const { driver } = useAuthStore();
  const { isOnline, activeOrderId } = useDeliveryStore();
  const toggleOnlineMutation = useToggleOnline();
  const { data: driverProfile } = useDriverProfile();
  const router = useRouter();

  const [currentLocation, setCurrentLocation] = useState<Region>(DOUALA_REGION);

  useEffect(() => {
    getCurrentPosition().then((pos) => {
      if (pos) {
        setCurrentLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    });
  }, []);

  // Navigate to active delivery
  useEffect(() => {
    if (activeOrderId) {
      router.push(`/(main)/delivery/${activeOrderId}` as any);
    }
  }, [activeOrderId]);

  const handleToggleOnline = () => {
    toggleOnlineMutation.mutate({ isOnline: !isOnline });
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={currentLocation}
        showsUserLocation
        showsMyLocationButton
      >
        {isOnline && driverProfile?.current_location && (
          <Marker
            coordinate={{
              latitude: driverProfile.current_location.coordinates[1],
              longitude: driverProfile.current_location.coordinates[0],
            }}
            pinColor={Colors.primaryOrange}
            title="Vous"
          />
        )}
      </MapView>

      {/* Online/Offline toggle card */}
      <View style={styles.bottomCard}>
        {isOnline ? (
          <>
            <View style={styles.onlineHeader}>
              <Badge label="En ligne" variant="success" />
            </View>
            <ActivityIndicator size="small" color={Colors.primaryGreen} />
            <Text style={styles.waitingText}>En attente de course...</Text>
          </>
        ) : (
          <>
            <Text style={styles.offlineTitle}>Hors ligne</Text>
            <Text style={styles.offlineSubtitle}>
              Aujourd'hui: 0 FCFA | 0 courses
            </Text>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.toggleButton,
            isOnline ? styles.offlineButton : styles.onlineButton,
          ]}
          onPress={handleToggleOnline}
          disabled={toggleOnlineMutation.isPending}
          activeOpacity={0.7}
        >
          {toggleOnlineMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.toggleButtonText}>
              {isOnline ? 'Passer hors ligne' : 'Aller en ligne'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Delivery request overlay */}
      <DeliveryRequestSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  map: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadii.xxl,
    borderTopRightRadius: BorderRadii.xxl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  onlineHeader: {
    marginBottom: Spacing.md,
  },
  waitingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  offlineTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  offlineSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    width: '100%',
    borderRadius: BorderRadii.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  onlineButton: {
    backgroundColor: Colors.primaryGreen,
  },
  offlineButton: {
    backgroundColor: Colors.textSecondary,
  },
  toggleButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
});
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
cd apps/mobile-driver
git add app/\(main\)/index.tsx components/DeliveryRequestSheet.tsx hooks/useDriver.ts hooks/useDeliveries.ts
git commit -m "feat(driver): add home screen with map, online toggle, and delivery request sheet"
```

---

## Task 9: Active Delivery Screen

**Files:**
- Create: `apps/mobile-driver/app/(main)/delivery/[id].tsx`
- Create: `apps/mobile-driver/components/ActiveDeliveryMap.tsx`

- [ ] **Step 1: Create components/ActiveDeliveryMap.tsx — Map with route for active delivery**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface Location {
  lat: number;
  lng: number;
}

interface ActiveDeliveryMapProps {
  restaurantLocation: Location | null;
  deliveryLocation: Location | null;
  driverLocation: Location | null;
  routePolyline: string | null;
}

function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  const points: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

const ActiveDeliveryMap: React.FC<ActiveDeliveryMapProps> = ({
  restaurantLocation,
  deliveryLocation,
  driverLocation,
  routePolyline,
}) => {
  if (!deliveryLocation && !restaurantLocation) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🗺️</Text>
        <Text style={styles.placeholderText}>Carte non disponible</Text>
      </View>
    );
  }

  const centerLat = deliveryLocation?.lat ?? restaurantLocation?.lat ?? 4.0511;
  const centerLng = deliveryLocation?.lng ?? restaurantLocation?.lng ?? 9.7679;

  const initialRegion = {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const polylineCoords = routePolyline ? decodePolyline(routePolyline) : null;

  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton
    >
      {/* Restaurant marker - green */}
      {restaurantLocation && (
        <Marker
          coordinate={{
            latitude: restaurantLocation.lat,
            longitude: restaurantLocation.lng,
          }}
          pinColor="green"
          title="Restaurant"
        />
      )}

      {/* Customer marker - orange */}
      {deliveryLocation && (
        <Marker
          coordinate={{
            latitude: deliveryLocation.lat,
            longitude: deliveryLocation.lng,
          }}
          pinColor="orange"
          title="Client"
        />
      )}

      {/* Driver marker - blue */}
      {driverLocation && (
        <Marker
          coordinate={{
            latitude: driverLocation.lat,
            longitude: driverLocation.lng,
          }}
          pinColor="blue"
          title="Vous"
        />
      )}

      {/* Route polyline */}
      {polylineCoords && polylineCoords.length > 1 && (
        <Polyline
          coordinates={polylineCoords}
          strokeColor={Colors.primaryOrange}
          strokeWidth={3}
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
});

export default ActiveDeliveryMap;
```

- [ ] **Step 2: Create app/(main)/delivery/[id].tsx — Active delivery with map + actions**

```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { usePickupDelivery, useDeliverOrder } from '../../../hooks/useDeliveries';
import { useAuthStore } from '../../../stores/authStore';
import { useDeliveryStore } from '../../../stores/deliveryStore';
import ActiveDeliveryMap from '../../../components/ActiveDeliveryMap';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { BorderRadii } from '../../../constants/spacing';
import { FontSizes } from '../../../constants/typography';
import { FontWeights } from '../../../constants/typography';
import type { Order, OrderStatus } from '@djossfood/database';

const STATUS_ACTIONS: Record<OrderStatus, { label: string; action: 'pickup' | 'deliver' | 'waiting' | 'done' }> = {
  pending: { label: 'En attente', action: 'waiting' },
  confirmed: { label: 'Confirmée', action: 'waiting' },
  preparing: { label: 'En préparation', action: 'waiting' },
  ready: { label: 'Prête', action: 'waiting' },
  driver_assigned: { label: 'Confirmé ramassage', action: 'pickup' },
  picked_up: { label: 'Confirmer livraison', action: 'deliver' },
  delivering: { label: 'En attente de confirmation', action: 'waiting' },
  delivered: { label: 'Terminée', action: 'done' },
  completed: { label: 'Terminée', action: 'done' },
  cancelled: { label: 'Annulée', action: 'done' },
  rejected: { label: 'Refusée', action: 'done' },
};

export default function DeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { driver } = useAuthStore();
  const { setActiveOrderId } = useDeliveryStore();
  const pickupMutation = usePickupDelivery();
  const deliverMutation = useDeliverOrder();

  const { data: order, isLoading } = useQuery({
    queryKey: ['activeDelivery', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${id}`);
      return data.order as Order;
    },
    refetchInterval: 5_000,
    enabled: !!id,
  });

  useEffect(() => {
    if (order && ['completed', 'cancelled', 'rejected'].includes(order.status)) {
      setActiveOrderId(null);
    }
  }, [order?.status]);

  if (isLoading || !order) {
    return <LoadingSpinner message="Chargement de la course..." />;
  }

  const statusConfig = STATUS_ACTIONS[order.status as OrderStatus] ?? {
    label: order.status,
    action: 'waiting' as const,
  };

  const restaurantLocation = order.delivery_location
    ? { lat: order.delivery_location.coordinates[1], lng: order.delivery_location.coordinates[0] }
    : null;

  // Note: restaurant location would need to come from the order's restaurant data
  // For now, we use the delivery_location as a fallback
  const driverLocation = driver?.current_location
    ? { lat: driver.current_location.coordinates[1], lng: driver.current_location.coordinates[0] }
    : null;

  const openMaps = (lat: number, lng: number) => {
    const url = `https://maps.apple.com/?ll=${lat},${lng}`;
    Linking.openURL(url);
  };

  const handleAction = () => {
    if (statusConfig.action === 'pickup') {
      pickupMutation.mutate(id);
    } else if (statusConfig.action === 'deliver') {
      deliverMutation.mutate(id);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map section (top 60%) */}
      <View style={styles.mapContainer}>
        <ActiveDeliveryMap
          restaurantLocation={null} // Would need restaurant coords from joined data
          deliveryLocation={restaurantLocation}
          driverLocation={driverLocation}
          routePolyline={order.route_polyline}
        />
      </View>

      {/* Details section (bottom 40%) */}
      <ScrollView style={styles.detailsContainer} contentContainerStyle={styles.detailsContent}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{order.order_number}</Text>
          <Text style={styles.restaurantName}>Restaurant</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>📍 Ramassage</Text>
            <TouchableOpacity onPress={() => { /* Navigate to restaurant */ }}>
              <Text style={styles.addressLink}>Naviguer →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.addressText}>{order.delivery_address}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.addressLabel}>🏠 Livraison</Text>
          <Text style={styles.addressText}>{order.delivery_address}</Text>
        </View>

        {order.delivery_notes && (
          <View style={styles.infoSection}>
            <Text style={styles.addressLabel}>📝 Instructions</Text>
            <Text style={styles.addressText}>{order.delivery_notes}</Text>
          </View>
        )}

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Montant total</Text>
          <Text style={styles.amountValue}>
            {order.total_amount.toLocaleString('fr-FR')} FCFA
          </Text>
        </View>

        {/* Action button */}
        {statusConfig.action === 'pickup' && (
          <Button
            title="Confirmer le ramassage"
            onPress={handleAction}
            variant="primary"
            loading={pickupMutation.isPending}
          />
        )}
        {statusConfig.action === 'deliver' && (
          <Button
            title="Confirmer la livraison"
            onPress={handleAction}
            variant="orange"
            loading={deliverMutation.isPending}
          />
        )}
        {statusConfig.action === 'waiting' && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator color={Colors.primaryOrange} />
            <Text style={styles.waitingText}>{statusConfig.label}</Text>
          </View>
        )}
        {statusConfig.action === 'done' && (
          <Button
            title="Retour à l'accueil"
            onPress={() => {
              setActiveOrderId(null);
              router.replace('/(main)');
            }}
            variant="primary"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  mapContainer: {
    flex: 3,
  },
  detailsContainer: {
    flex: 2,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadii.xxl,
    borderTopRightRadius: BorderRadii.xxl,
    marginTop: -Spacing.md,
  },
  detailsContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  orderHeader: {
    marginBottom: Spacing.md,
  },
  orderNumber: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  restaurantName: {
    fontSize: FontSizes.sm,
    color: Colors.primaryOrange,
    fontWeight: FontWeights.medium,
  },
  infoSection: {
    marginBottom: Spacing.md,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  addressLink: {
    fontSize: FontSizes.sm,
    color: Colors.primaryGreen,
    fontWeight: FontWeights.bold,
  },
  addressText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.lg,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  amountLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.primaryGreen,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  waitingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
cd apps/mobile-driver
git add app/\(main\)/delivery/ components/ActiveDeliveryMap.tsx
git commit -m "feat(driver): add active delivery screen with map and lifecycle actions"
```

---

## Task 10: Earnings + Profile Screens

**Files:**
- Create: `apps/mobile-driver/app/(main)/earnings.tsx`
- Create: `apps/mobile-driver/app/(main)/profile.tsx`
- Create: `apps/mobile-driver/components/EarningsCard.tsx`

- [ ] **Step 1: Create components/EarningsCard.tsx — Wallet balance + today's earnings**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { BorderRadii } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface EarningsCardProps {
  walletBalance: number;
  todayEarnings: number;
  todayDeliveries: number;
}

const EarningsCard: React.FC<EarningsCardProps> = ({
  walletBalance,
  todayEarnings,
  todayDeliveries,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.balanceSection}>
          <Text style={styles.label}>Solde</Text>
          <Text style={styles.walletBalance}>
            {walletBalance.toLocaleString('fr-FR')} FCFA
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.todayRow}>
        <View style={styles.todayItem}>
          <Text style={styles.todayValue}>
            {todayEarnings.toLocaleString('fr-FR')} FCFA
          </Text>
          <Text style={styles.todayLabel}>Aujourd'hui</Text>
        </View>
        <View style={styles.todayItem}>
          <Text style={styles.todayValue}>{todayDeliveries}</Text>
          <Text style={styles.todayLabel}>Courses</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: BorderRadii.xl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    marginBottom: Spacing.md,
  },
  balanceSection: {},
  label: {
    fontSize: FontSizes.sm,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  walletBalance: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: Spacing.md,
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  todayItem: {
    alignItems: 'center',
  },
  todayValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  todayLabel: {
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: Spacing.xs,
  },
});

export default EarningsCard;
```

- [ ] **Step 2: Create app/(main)/earnings.tsx — Earnings summary + delivery history**

```tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useDriverEarnings } from '../../hooks/useDriver';
import EarningsCard from '../../components/EarningsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EarningsScreen() {
  const { data, isLoading } = useDriverEarnings();

  if (isLoading || !data) {
    return <LoadingSpinner message="Chargement des gains..." />;
  }

  const deliveries = data.deliveries || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes gains</Text>
      </View>

      <View style={styles.cardContainer}>
        <EarningsCard
          walletBalance={data.wallet_balance || 0}
          todayEarnings={data.today_earnings || 0}
          todayDeliveries={data.today_deliveries || 0}
        />
      </View>

      <Text style={styles.sectionTitle}>Historique des courses</Text>

      {deliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune course terminée</Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.deliveryItem}>
              <View style={styles.deliveryInfo}>
                <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
                <Text style={styles.deliveryDate}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={styles.deliveryEarnings}>
                <Text style={styles.earningAmount}>
                  +{item.driver_earning.toLocaleString('fr-FR')} FCFA
                </Text>
                <Text style={styles.earningLabel}>gains</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  cardContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  deliveryItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  deliveryDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  deliveryEarnings: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.primaryGreen,
  },
  earningLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  separator: {
    height: Spacing.sm,
  },
});
```

- [ ] **Step 3: Create app/(main)/profile.tsx — Driver profile and settings**

```tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useDriverProfile } from '../../hooks/useDriver';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { signOut } from '../../services/auth';
import { stopLocationUpdates } from '../../services/location';
import { disconnectSocket } from '../../services/socket';

export default function ProfileScreen() {
  const { driver, profile, signOut: clearAuth } = useAuthStore();
  const { goOffline } = useDeliveryStore();
  const { data: driverProfile } = useDriverProfile();
  const router = useRouter();

  const currentDriver = driverProfile || driver;

  const handleSignOut = async () => {
    goOffline();
    await stopLocationUpdates();
    disconnectSocket();
    await signOut();
    clearAuth();
    router.replace('/(auth)/login');
  };

  if (!currentDriver) {
    return <LoadingSpinner message="Chargement du profil..." />;
  }

  const vehicleLabels: Record<string, string> = {
    motorcycle: 'Moto',
    bicycle: 'Vélo',
    car: 'Voiture',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'D'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Livreur'}</Text>
        <Text style={styles.phone}>{profile?.phone || ''}</Text>
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Véhicule</Text>
          <Text style={styles.infoValue}>
            {vehicleLabels[currentDriver.vehicle_type ?? ''] || currentDriver.vehicle_type}
          </Text>
        </View>
        {currentDriver.vehicle_plate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plaque</Text>
            <Text style={styles.infoValue}>{currentDriver.vehicle_plate}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Documents</Text>
          <Badge
            label={currentDriver.is_approved ? 'Vérifié ✓' : 'En attente'}
            variant={currentDriver.is_approved ? 'success' : 'warning'}
          />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Courses totales</Text>
          <Text style={styles.infoValue}>{currentDriver.total_deliveries}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Note</Text>
          <Text style={styles.infoValue}>
            {currentDriver.rating > 0 ? `${currentDriver.rating.toFixed(1)}/5` : 'N/A'}
          </Text>
        </View>
      </Card>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  name: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  phone: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  infoCard: {
    margin: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  logoutButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadii.lg,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.error,
  },
});
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
cd apps/mobile-driver
git add app/\(main\)/earnings.tsx app/\(main\)/profile.tsx components/EarningsCard.tsx
git commit -m "feat(driver): add earnings and profile screens"
```

---

## Task 11: Root Layout with Route Resolution

**Files:**
- Modify: `apps/mobile-driver/app/_layout.tsx` (update to handle initial route based on auth state)
- Create: `apps/mobile-driver/app/index.tsx` — Root redirect

- [ ] **Step 1: Create app/index.tsx — Root redirect**

```tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { isAuthenticated, isApproved } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isApproved) {
    return <Redirect href="/(auth)/pending" />;
  }

  return <Redirect href="/(main)" />;
}
```

- [ ] **Step 2: Verify the root _layout.tsx is correct (already created in Task 1)**

The root `_layout.tsx` from Task 1 should have the QueryClientProvider and Socket connection. Verify it matches this pattern:

```tsx
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/authStore';
import { connectSocket, disconnectSocket } from '../services/socket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { isAuthenticated, session } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && session) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [isAuthenticated, session]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Slot />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
cd apps/mobile-driver
git add app/index.tsx
git commit -m "feat(driver): add root redirect based on auth and approval state"
```

---

## Task 12: Integration Verification

**Files:**
- Verify all screens compile and route correctly
- Fix any TypeScript errors
- Ensure design system consistency

- [ ] **Step 1: Run TypeScript compilation on the driver app**

Run: `cd apps/mobile-driver && npx tsc --noEmit`

Expected: No errors. Fix any that appear.

- [ ] **Step 2: Run TypeScript compilation on the API**

Run: `cd apps/api && npx tsc --noEmit`

Expected: No errors. Fix any that appear.

- [ ] **Step 3: Verify file structure matches the spec**

Check that all files from the design spec exist:

```
apps/mobile-driver/
├── app/
│   ├── _layout.tsx           ✓ (Task 1 + 11)
│   ├── index.tsx             ✓ (Task 11)
│   ├── (auth)/
│   │   ├── _layout.tsx       ✓ (Task 4)
│   │   ├── login.tsx         ✓ (Task 4)
│   │   ├── verify.tsx        ✓ (Task 4)
│   │   ├── register.tsx      ✓ (Task 6)
│   │   ├── documents.tsx    ✓ (Task 6)
│   │   └── pending.tsx      ✓ (Task 6)
│   ├── (main)/
│   │   ├── _layout.tsx       ✓ (Task 7)
│   │   ├── index.tsx         ✓ (Task 8)
│   │   ├── delivery/
│   │   │   └── [id].tsx     ✓ (Task 9)
│   │   ├── earnings.tsx      ✓ (Task 10)
│   │   └── profile.tsx       ✓ (Task 10)
├── components/
│   ├── ui/                   ✓ (Task 5)
│   ├── DeliveryRequestSheet  ✓ (Task 8)
│   ├── ActiveDeliveryMap     ✓ (Task 9)
│   ├── EarningsCard          ✓ (Task 10)
│   └── DocumentUpload        ✓ (Task 6)
├── services/
│   ├── api.ts                ✓ (Task 3)
│   ├── auth.ts               ✓ (Task 3)
│   ├── socket.ts             ✓ (Task 3)
│   └── location.ts           ✓ (Task 7)
├── stores/
│   ├── authStore.ts           ✓ (Task 3)
│   └── deliveryStore.ts       ✓ (Task 7)
├── hooks/
│   ├── useDriver.ts           ✓ (Task 8)
│   └── useDeliveries.ts       ✓ (Task 8)
├── constants/
│   ├── colors.ts             ✓ (Task 1)
│   ├── typography.ts          ✓ (Task 1)
│   └── spacing.ts            ✓ (Task 1)
```

- [ ] **Step 4: Verify backend endpoints are registered**

Check that `apps/api/src/routes/index.ts` includes the `driverOwnerRouter`.

- [ ] **Step 5: Final commit for any fixes**

```bash
git add -A
git commit -m "fix(driver): resolve integration issues from verification"
```

---

## Spec Coverage Self-Review

**Spec section: Authentication & Onboarding Flow** → Task 4 (login + verify), Task 6 (register + documents + pending), Task 11 (root redirect)

**Spec section: Protected Routes** → Task 7 (main layout guard checks `isAuthenticated` + `isApproved`)

**Spec section: Home — Offline** → Task 8 (index.tsx with map + "Aller en ligne" toggle)

**Spec section: Home — Online (Waiting)** → Task 8 (online state with "En attente de course..." and location broadcasting)

**Spec section: Delivery Request (modal/sheet)** → Task 8 (DeliveryRequestSheet with accept/reject, 30s auto-dismiss)

**Spec section: Active Delivery** → Task 9 (delivery/[id].tsx with map, actions per status)

**Spec section: Earnings** → Task 10 (earnings.tsx with EarningsCard + delivery history)

**Spec section: Profile** → Task 10 (profile.tsx with vehicle info, document status, sign out)

**Spec section: API — New Backend Endpoints** → Task 2 (driverOwner.ts: register, documents, earnings)

**Spec section: API — Socket.IO Events** → Task 2 (delivery_request event emission via `emitDeliveryRequest`)

**Spec section: Service Layer — Location** → Task 7 (location.ts with foreground GPS, 5s interval)

**Spec section: Service Layer — Socket** → Task 3 (socket.ts with driver-specific events + `emitLocationUpdate`)

**Spec section: Error Handling** → All screens handle network errors with inline messages, 401 redirects to login via API interceptor

**Spec section: Design System** → Task 1 (same DjossFood palette, Plus Jakarta Sans typography tokens)

No placeholder sections found. All code is complete. Type names and method signatures are consistent across tasks.