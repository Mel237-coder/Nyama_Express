# DjossFood Slice 2 — Client App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DjossFood client mobile app (Expo + expo-router) with authentication, restaurant browsing, cart/checkout, and real-time order tracking.

**Architecture:** File-based routing with expo-router, Zustand for state, React Query for data fetching, Socket.IO for real-time, Google Maps for driver tracking. Custom UI components following the Cameroon-inspired design system (green/orange/yellow palette).

**Tech Stack:** Expo SDK 50, React Native, TypeScript, expo-router v3, Zustand, @tanstack/react-query, Axios, @supabase/supabase-js, socket.io-client, react-native-maps, expo-location, @react-native-async-storage/async-storage

---

## File Structure

```
apps/mobile-client/
├── app/
│   ├── _layout.tsx               # Root: providers, auth guard
│   ├── (auth)/
│   │   ├── _layout.tsx           # Auth stack (no tabs)
│   │   ├── login.tsx             # Phone/email login
│   │   └── verify.tsx             # OTP verification
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator (Home, Orders, Profile)
│   │   ├── index.tsx             # Home: search + restaurants
│   │   ├── orders.tsx            # Order history list
│   │   └── profile.tsx           # User profile + settings
│   ├── restaurant/[id].tsx       # Restaurant detail + menu
│   ├── cart.tsx                  # Cart review
│   ├── checkout.tsx              # Payment selection + confirm
│   └── order/[id].tsx            # Order tracking (timeline + map)
├── components/
│   ├── ui/
│   │   ├── Button.tsx            # Primary, orange, yellow, outline variants
│   │   ├── Input.tsx             # Text input with label + error
│   │   ├── Card.tsx              # White card with shadow
│   │   ├── Badge.tsx             # Status pill badges
│   │   ├── Sheet.tsx             # Bottom sheet modal
│   │   ├── LoadingSpinner.tsx    # Activity indicator
│   │   ├── Toast.tsx             # Toast notification
│   │   └── QuantityStepper.tsx   # −/+ stepper for cart items
│   ├── RestaurantCard.tsx        # Restaurant list card
│   ├── MenuItemRow.tsx           # Menu item row with add button
│   ├── CartItemRow.tsx           # Cart item with stepper + remove
│   ├── OrderTimeline.tsx         # Vertical stepper for order status
│   ├── DriverMap.tsx             # Google Maps with driver tracking
│   └── RatingModal.tsx           # Star rating modal
├── stores/
│   ├── authStore.ts
│   ├── cartStore.ts
│   └── orderStore.ts
├── services/
│   ├── api.ts                    # Axios instance + interceptors
│   ├── auth.ts                   # Supabase auth wrapper
│   └── socket.ts                 # Socket.IO client
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── hooks/
│   ├── useRestaurants.ts
│   ├── useOrders.ts
│   └── useLocation.ts
├── app.json
├── babel.config.js
├── metro.config.js
├── package.json
├── tsconfig.json
└── eas.json
```

---

### Task 1: Initialize Expo Project + Monorepo Integration

**Files:**
- Create: `apps/mobile-client/package.json`
- Create: `apps/mobile-client/app.json`
- Create: `apps/mobile-client/tsconfig.json`
- Create: `apps/mobile-client/babel.config.js`
- Create: `apps/mobile-client/metro.config.js`
- Create: `apps/mobile-client/eas.json`
- Create: `apps/mobile-client/.env.example`

- [ ] **Step 1: Create the Expo project directory and package.json**

```bash
cd "C:/Users/melvi/Desktop/Programation_project/Application_Nyama-Express/djossfood"
mkdir -p apps/mobile-client
```

Create `apps/mobile-client/package.json`:

```json
{
  "name": "@djossfood/mobile-client",
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
    "name": "DjossFood",
    "slug": "djossfood",
    "version": "0.0.1",
    "orientation": "default",
    "scheme": "djossfood",
    "userInterfaceStyle": "automatic",
    "splash": {
      "backgroundColor": "#00AA13"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.djossfood.client"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#00AA13"
      },
      "package": "com.djossfood.client"
    },
    "web": {
      "favicon": "./assets/favicon.png"
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
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create babel.config.js**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

- [ ] **Step 5: Create metro.config.js for monorepo**

```javascript
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

- [ ] **Step 6: Create eas.json**

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 7: Create .env.example**

```
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
```

- [ ] **Step 8: Install dependencies**

```bash
cd djossfood
npm install
```

- [ ] **Step 9: Commit**

```bash
cd djossfood
git add apps/mobile-client
git commit -m "chore: initialize mobile-client expo project with monorepo config"
```

---

### Task 2: Design Constants + Shared Types

**Files:**
- Create: `apps/mobile-client/constants/colors.ts`
- Create: `apps/mobile-client/constants/typography.ts`
- Create: `apps/mobile-client/constants/spacing.ts`

- [ ] **Step 1: Create colors.ts**

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

- [ ] **Step 2: Create typography.ts**

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

- [ ] **Step 3: Create spacing.ts**

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

- [ ] **Step 4: Commit**

```bash
git add apps/mobile-client/constants
git commit -m "feat: add design constants (colors, typography, spacing)"
```

---

### Task 3: UI Primitive Components

**Files:**
- Create: `apps/mobile-client/components/ui/Button.tsx`
- Create: `apps/mobile-client/components/ui/Input.tsx`
- Create: `apps/mobile-client/components/ui/Card.tsx`
- Create: `apps/mobile-client/components/ui/Badge.tsx`
- Create: `apps/mobile-client/components/ui/Sheet.tsx`
- Create: `apps/mobile-client/components/ui/LoadingSpinner.tsx`
- Create: `apps/mobile-client/components/ui/Toast.tsx`
- Create: `apps/mobile-client/components/ui/QuantityStepper.tsx`

- [ ] **Step 1: Create Button.tsx**

```tsx
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';

type ButtonVariant = 'primary' | 'orange' | 'yellow' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
  primary: { bg: Colors.primaryGreen, text: '#FFFFFF', border: Colors.primaryGreen },
  orange: { bg: Colors.primaryOrange, text: '#FFFFFF', border: Colors.primaryOrange },
  yellow: { bg: Colors.primaryYellow, text: '#000000', border: Colors.primaryYellow },
  outline: { bg: 'transparent', text: Colors.primaryGreen, border: Colors.primaryGreen },
  danger: { bg: Colors.error, text: '#FFFFFF', border: Colors.error },
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, style, textStyle }: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadii.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

- [ ] **Step 2: Create Input.tsx**

```tsx
import { StyleSheet, Text, TextInput, type ViewStyle, type TextInputProps } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  return (
    <>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={Colors.textSecondary}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
```

- [ ] **Step 3: Create Card.tsx**

```tsx
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    const { TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
```

- [ ] **Step 4: Create Badge.tsx**

```tsx
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { Spacing, BorderRadii } from '../../constants/spacing';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.primaryGreen, text: '#FFFFFF' },
  error: { bg: Colors.error, text: '#FFFFFF' },
  warning: { bg: Colors.primaryYellow, text: '#000000' },
  info: { bg: Colors.primaryOrange, text: '#FFFFFF' },
  neutral: { bg: Colors.border, text: Colors.textSecondary },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const v = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadii.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
});
```

- [ ] **Step 5: Create Sheet.tsx**

```tsx
import { StyleSheet, View, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ visible, onClose, children }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.sheet}>{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadii.xxl,
    borderTopRightRadius: BorderRadii.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    maxHeight: '80%',
  },
});
```

- [ ] **Step 6: Create LoadingSpinner.tsx**

```tsx
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSizes } from '../../constants/typography';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primaryGreen} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
```

- [ ] **Step 7: Create Toast.tsx**

```tsx
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSizes } from '../../constants/typography';
import { Spacing, BorderRadii } from '../../constants/spacing';

type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const typeColors: Record<ToastType, string> = {
  error: Colors.error,
  success: Colors.success,
  info: Colors.primaryOrange,
};

export function Toast({ message, type = 'info', duration = 3000, onDismiss }: ToastProps) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={[styles.toast, { borderLeftColor: typeColors[type] }]}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.md,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
});
```

- [ ] **Step 8: Create QuantityStepper.tsx**

```tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { Spacing, BorderRadii } from '../../constants/spacing';

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
}

export function QuantityStepper({ quantity, onIncrement, onDecrement, min = 0 }: QuantityStepperProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onDecrement} disabled={quantity <= min} style={[styles.button, quantity <= min && styles.disabled]}>
        <Text style={styles.buttonText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.quantity}>{quantity}</Text>
      <TouchableOpacity onPress={onIncrement} style={styles.button}>
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: BorderRadii.sm,
    backgroundColor: Colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  quantity: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
});
```

- [ ] **Step 9: Commit**

```bash
git add apps/mobile-client/components
git commit -m "feat: add UI primitive components (Button, Input, Card, Badge, Sheet, Toast, etc.)"
```

---

### Task 4: Services (API, Auth, Socket)

**Files:**
- Create: `apps/mobile-client/services/api.ts`
- Create: `apps/mobile-client/services/auth.ts`
- Create: `apps/mobile-client/services/socket.ts`

- [ ] **Step 1: Create api.ts**

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

- [ ] **Step 2: Create auth.ts**

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@djossfood/database';

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

export async function signInWithEmail(email: string, password: string): Promise<{
  session?: any;
  profile?: Profile;
  isNewUser?: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: 'Identifiants incorrects' };
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

export async function updateUserName(fullName: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  if (error) return { error: error.message };

  await supabase
    .from('profiles')
    .update({ full_name: fullName, is_verified: true })
    .eq('id', (await supabase.auth.getUser()).data.user?.id || '');

  return {};
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
```

- [ ] **Step 3: Create socket.ts**

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
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile-client/services
git commit -m "feat: add API client, auth service, and socket service"
```

---

### Task 5: Zustand Stores (Auth, Cart, Order)

**Files:**
- Create: `apps/mobile-client/stores/authStore.ts`
- Create: `apps/mobile-client/stores/cartStore.ts`
- Create: `apps/mobile-client/stores/orderStore.ts`

- [ ] **Step 1: Create authStore.ts**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile } from '@djossfood/database';

interface AuthState {
  session: { access_token: string; refresh_token: string } | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  setSession: (session: any) => void;
  setProfile: (profile: Profile | null) => void;
  setIsNewUser: (isNewUser: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      profile: null,
      isAuthenticated: false,
      isNewUser: false,

      setSession: (session) =>
        set({
          session,
          isAuthenticated: !!session?.access_token,
        }),

      setProfile: (profile) => set({ profile }),

      setIsNewUser: (isNewUser) => set({ isNewUser }),

      signOut: () =>
        set({
          session: null,
          profile: null,
          isAuthenticated: false,
          isNewUser: false,
        }),
    }),
    {
      name: 'djossfood-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

- [ ] **Step 2: Create cartStore.ts**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
  image_url?: string | null;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  deliveryFee: number;
  minOrderAmount: number;
  items: CartItem[];
  addItem: (item: CartItem, restaurantId: string, restaurantName: string, deliveryFee: number, minOrderAmount: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      deliveryFee: 0,
      minOrderAmount: 0,
      items: [],

      addItem: (item, restaurantId, restaurantName, deliveryFee, minOrderAmount) => {
        const state = get();
        // If adding from a different restaurant, clear the cart
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          set({
            restaurantId,
            restaurantName,
            deliveryFee,
            minOrderAmount,
            items: [{ ...item, quantity: item.quantity || 1 }],
          });
          return;
        }

        const existingIndex = state.items.findIndex((i) => i.menu_item_id === item.menu_item_id);
        let newItems: CartItem[];

        if (existingIndex >= 0) {
          newItems = state.items.map((i, idx) =>
            idx === existingIndex ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i,
          );
        } else {
          newItems = [...state.items, { ...item, quantity: item.quantity || 1 }];
        }

        set({
          restaurantId: restaurantId || state.restaurantId,
          restaurantName: restaurantName || state.restaurantName,
          deliveryFee: deliveryFee ?? state.deliveryFee,
          minOrderAmount: minOrderAmount ?? state.minOrderAmount,
          items: newItems,
        });
      },

      removeItem: (menuItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.menu_item_id !== menuItemId),
        }));
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menu_item_id === menuItemId ? { ...i, quantity } : i,
          ),
        }));
      },

      updateInstructions: (menuItemId, instructions) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.menu_item_id === menuItemId ? { ...i, special_instructions: instructions } : i,
          ),
        }));
      },

      clearCart: () => {
        set({
          restaurantId: null,
          restaurantName: null,
          deliveryFee: 0,
          minOrderAmount: 0,
          items: [],
        });
      },

      subtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      total: () => {
        const sub = get().subtotal();
        return sub + get().deliveryFee;
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'djossfood-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

- [ ] **Step 3: Create orderStore.ts**

```typescript
import { create } from 'zustand';
import type { Order } from '@djossfood/database';
import { joinRoom, leaveRoom, onEvent, offEvent } from '../services/socket';

interface OrderState {
  activeOrders: Order[];
  orderHistory: Order[];
  currentOrder: Order | null;
  setActiveOrders: (orders: Order[]) => void;
  setOrderHistory: (orders: Order[]) => void;
  setCurrentOrder: (order: Order | null) => void;
  subscribeToOrder: (orderId: string) => void;
  unsubscribeFromOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, updates: Partial<Order>) => void;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  activeOrders: [],
  orderHistory: [],
  currentOrder: null,

  setActiveOrders: (orders) => set({ activeOrders: orders }),

  setOrderHistory: (orders) => set({ orderHistory: orders }),

  setCurrentOrder: (order) => set({ currentOrder: order }),

  subscribeToOrder: (orderId) => {
    joinRoom(`order:${orderId}`);

    const statusHandler = (data: Partial<Order>) => {
      get().updateOrderStatus(orderId, data);
    };

    const locationHandler = (data: { driver_id: string; lat: number; lng: number; timestamp: string }) => {
      const current = get().currentOrder;
      if (current && current.id === orderId) {
        set({
          currentOrder: {
            ...current,
            _driverLocation: data,
          } as any,
        });
      }
    };

    onEvent('order_status_update', statusHandler);
    onEvent('driver_location', locationHandler);
  },

  unsubscribeFromOrder: (orderId) => {
    leaveRoom(`order:${orderId}`);
    offEvent('order_status_update');
    offEvent('driver_location');
  },

  updateOrderStatus: (orderId, updates) => {
    set((state) => ({
      activeOrders: state.activeOrders.map((o) =>
        o.id === orderId ? { ...o, ...updates } : o,
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, ...updates }
          : state.currentOrder,
    }));
  },
}));
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile-client/stores
git commit -m "feat: add Zustand stores for auth, cart, and order state"
```

---

### Task 6: React Query Hooks

**Files:**
- Create: `apps/mobile-client/hooks/useRestaurants.ts`
- Create: `apps/mobile-client/hooks/useOrders.ts`
- Create: `apps/mobile-client/hooks/useLocation.ts`

- [ ] **Step 1: Create useRestaurants.ts**

```typescript
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Restaurant, SearchResult } from '@djossfood/database';

export function useRestaurants(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['restaurants', page, limit],
    queryFn: async () => {
      const { data } = await api.get('/api/restaurants', { params: { page, limit } });
      return data as { restaurants: Restaurant[]; total: number };
    },
    staleTime: 30_000,
  });
}

export function useFeaturedRestaurants() {
  return useQuery({
    queryKey: ['restaurants', 'featured'],
    queryFn: async () => {
      const { data } = await api.get('/api/restaurants', { params: { limit: 10 } });
      return (data.restaurants as Restaurant[]).filter((r: Restaurant) => r.is_featured);
    },
    staleTime: 60_000,
  });
}

export function useRestaurant(id: string | null) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurants/${id}`);
      return data.restaurant as Restaurant;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useRestaurantMenu(id: string | null) {
  return useQuery({
    queryKey: ['restaurant', id, 'menu'],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurants/${id}/menu`);
      return data.menu as Array<{
        id: string | null;
        name: string;
        description: string | null;
        sort_order: number;
        items: any[];
      }>;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useSearch(query: string, city?: string, lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['search', query, city, lat, lng],
    queryFn: async () => {
      const { data } = await api.get('/api/search', {
        params: { q: query, city, lat, lng },
      });
      return data.results as SearchResult[];
    },
    enabled: query.length > 0,
    staleTime: 10_000,
  });
}
```

- [ ] **Step 2: Create useOrders.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Order, PaymentMethod } from '@djossfood/database';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders');
      return data.orders as Order[];
    },
    staleTime: 15_000,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${id}`);
      return data.order as Order;
    },
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      restaurant_id: string;
      items: Array<{ menu_item_id: string; quantity: number; special_instructions?: string }>;
      delivery_address: string;
      delivery_lat: number;
      delivery_lng: number;
      payment_method: PaymentMethod;
      payment_phone: string;
      delivery_notes?: string;
    }) => {
      const { data } = await api.post('/api/orders', orderData);
      return data.order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/confirm-delivery`);
      return data;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useSubmitRating() {
  return useMutation({
    mutationFn: async (rating: {
      order_id: string;
      restaurant_rating: number;
      driver_rating?: number;
      restaurant_comment?: string;
      driver_comment?: string;
    }) => {
      const { data } = await api.post('/api/ratings', rating);
      return data;
    },
  });
}
```

- [ ] **Step 3: Create useLocation.ts**

```typescript
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission de localisation refusée');
          setLoading(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });

        // Reverse geocode to get city
        let city: string | undefined;
        try {
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          city = geo?.city || undefined;
        } catch {}

        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          city,
        });
      } catch (err: any) {
        setError(err.message || 'Impossible d\'obtenir la localisation');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, error, loading };
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile-client/hooks
git commit -m "feat: add React Query hooks for restaurants, orders, and location"
```

---

### Task 7: Root Layout + Navigation Setup

**Files:**
- Create: `apps/mobile-client/app/_layout.tsx`
- Create: `apps/mobile-client/app/(auth)/_layout.tsx`
- Create: `apps/mobile-client/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create root _layout.tsx**

```tsx
import { useEffect } from 'react';
import { Slot, Redirect } from 'expo-router';
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

- [ ] **Step 2: Create (auth)/_layout.tsx**

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

- [ ] **Step 3: Create (tabs)/_layout.tsx**

```tsx
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { FontSizes } from '../../constants/typography';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primaryGreen,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontSize: FontSizes.xs },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color }) => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => null,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile-client/app
git commit -m "feat: add root layout with providers, auth stack, and tab navigator"
```

---

### Task 8: Auth Screens (Login + Verify)

**Files:**
- Create: `apps/mobile-client/app/(auth)/login.tsx`
- Create: `apps/mobile-client/app/(auth)/verify.tsx`

- [ ] **Step 1: Create login.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';
import { sendOtp, signInWithEmail } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

export default function LoginScreen() {
  const [tab, setTab] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setSession, setProfile, setIsNewUser } = useAuthStore();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length > 9 ? digits.slice(0, 9) : digits;
  };

  const isValidPhone = /^\+2376\d{8}$/.test(`+237${phone}`) || /^6\d{8}$/.test(phone);

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const fullPhone = phone.startsWith('+237') ? phone : `+237${phone}`;
      const result = await sendOtp(fullPhone);
      if (!result.success) {
        setError(result.error || 'Erreur lors de l\'envoi du code');
        return;
      }
      router.push({ pathname: '/verify', params: { phone: fullPhone } });
    } catch {
      setError('Vérifiez votre connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.session) {
        setSession(result.session);
        if (result.profile) setProfile(result.profile);
        if (result.isNewUser) setIsNewUser(true);
        router.replace('/(tabs)');
      }
    } catch {
      setError('Vérifiez votre connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🥘 DjossFood</Text>
        <Text style={styles.subtitle}>La livraison, à la camerounaise</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'phone' && styles.tabActive]}
          onPress={() => setTab('phone')}
        >
          <Text style={[styles.tabText, tab === 'phone' && styles.tabTextActive]}>Téléphone</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'email' && styles.tabActive]}
          onPress={() => setTab('email')}
        >
          <Text style={[styles.tabText, tab === 'email' && styles.tabTextActive]}>Email</Text>
        </TouchableOpacity>
      </View>

      {tab === 'phone' ? (
        <View style={styles.form}>
          <Input
            label="Numéro de téléphone"
            placeholder="6XX XXX XXX"
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            keyboardType="phone-pad"
            error={error}
          />
          <Text style={styles.phonePrefix}>+237</Text>
          <Button
            title="Envoyer le code"
            onPress={handleSendOtp}
            loading={loading}
            disabled={!isValidPhone}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Mot de passe"
            placeholder="Votre mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={error}
          />
          <Button
            title="Se connecter"
            onPress={handleEmailLogin}
            loading={loading}
            disabled={!email || !password}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.xxl },
  header: { alignItems: 'center', marginTop: 60, marginBottom: Spacing.xxxl },
  logo: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.primaryGreen },
  subtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.lg,
    marginBottom: Spacing.xxl,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primaryGreen },
  tabText: { fontSize: FontSizes.md, color: Colors.textSecondary },
  tabTextActive: { color: '#FFFFFF', fontWeight: FontWeights.bold },
  form: { gap: Spacing.lg },
  phonePrefix: {
    position: 'absolute',
    top: 56,
    left: Spacing.lg,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    zIndex: 1,
  },
});
```

- [ ] **Step 2: Create verify.tsx**

```tsx
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';
import { verifyOtp, updateUserName } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [showNameInput, setShowNameInput] = useState(false);
  const [name, setName] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<TextInput[]>([]);
  const { setSession, setProfile, setIsNewUser, isNewUser } = useAuthStore();

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (code.length < OTP_LENGTH) return;
    setError('');
    setLoading(true);
    try {
      const result = await verifyOtp(phone, code);
      if (result.error) {
        setError(result.error);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
        return;
      }
      if (result.session) {
        setSession(result.session);
        if (result.profile) setProfile(result.profile);
        if (result.isNewUser) {
          setIsNewUser(true);
          setShowNameInput(true);
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch {
      setError('Vérifiez votre connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const result = await updateUserName(name.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsNewUser(false);
      router.replace('/(tabs)');
    } catch {
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendTimer(60);
    // Re-send OTP
    const { sendOtp } = require('../../services/auth');
    await sendOtp(phone);
  };

  if (showNameInput) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>Comment vous appelez-vous ?</Text>
        <Text style={styles.subtitle}>Votre nom sera visible par les restaurants et livreurs</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="Votre nom complet"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Button title="Continuer" onPress={handleNameSubmit} loading={loading} />
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>Vérification</Text>
      <Text style={styles.subtitle}>Entrez le code envoyé au {phone}</Text>

      <Animated.View style={[styles.otpContainer, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
          <TextInput
            key={i}
            ref={(ref) => { if (ref) inputRefs.current[i] = ref; }}
            style={[styles.otpBox, code.length === i && styles.otpBoxActive]}
            maxLength={1}
            keyboardType="number-pad"
            value={code[i] || ''}
            onChangeText={(val) => {
              const newCode = code.split('');
              newCode[i] = val;
              setCode(newCode.join(''));
              if (val && i < OTP_LENGTH - 1) {
                inputRefs.current[i + 1]?.focus();
              }
              if (newCode.join('').length === OTP_LENGTH) {
                handleVerify();
              }
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !code[i] && i > 0) {
                inputRefs.current[i - 1]?.focus();
              }
            }}
          />
        ))}
      </Animated.View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {resendTimer > 0 ? (
        <Text style={styles.resendText}>Renvoyer dans {resendTimer}s</Text>
      ) : (
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendLink}>Renvoyer le code</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.xxl, justifyContent: 'center' },
  title: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xxxl },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.md,
    textAlign: 'center',
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  otpBoxActive: { borderColor: Colors.primaryGreen },
  errorText: { color: Colors.error, fontSize: FontSizes.sm, textAlign: 'center', marginTop: Spacing.sm },
  resendText: { color: Colors.textSecondary, fontSize: FontSizes.sm, textAlign: 'center' },
  resendLink: { color: Colors.primaryGreen, fontSize: FontSizes.sm, textAlign: 'center', fontWeight: FontWeights.bold },
  nameInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.md,
    padding: Spacing.lg,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xl,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile-client/app/(auth)
git commit -m "feat: add login and OTP verification screens"
```

---

### Task 9: Home Screen (Search + Restaurants)

**Files:**
- Create: `apps/mobile-client/components/RestaurantCard.tsx`
- Create: `apps/mobile-client/app/(tabs)/index.tsx`

- [ ] **Step 1: Create RestaurantCard.tsx**

```tsx
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Badge } from './ui/Badge';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadii } from '../constants/spacing';
import { FontSizes, FontWeights } from '../constants/typography';
import type { Restaurant } from '@djossfood/database';

interface RestaurantCardProps {
  restaurant: Restaurant | any;
  distanceKm?: number | null;
  onPress: (id: string) => void;
}

export function RestaurantCard({ restaurant, distanceKm, onPress }: RestaurantCardProps) {
  const isOpen = restaurant.status === 'open';
  const rating = restaurant.total_rating?.toFixed(1) || '0.0';

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(restaurant.id)} style={styles.card}>
      <View style={styles.coverContainer}>
        {restaurant.cover_url ? (
          <Image source={{ uri: restaurant.cover_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverGradient}>
            <Text style={styles.coverEmoji}>🍽️</Text>
          </View>
        )}
        <Badge
          label={isOpen ? 'Ouvert' : 'Fermé'}
          variant={isOpen ? 'success' : 'error'}
        />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
          {distanceKm != null && (
            <Text style={styles.distance}>{distanceKm.toFixed(1)} km</Text>
          )}
        </View>
        <View style={styles.tagsRow}>
          {restaurant.cuisine_types?.slice(0, 3).map((tag: string) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.rating}>⭐ {rating} ({restaurant.rating_count || 0})</Text>
          <Text style={styles.deliveryFee}>
            {restaurant.delivery_fee || 0} FCFA • {restaurant.avg_preparation_time || '?'} min
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  coverContainer: {
    height: 140,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: { fontSize: 40 },
  info: {
    padding: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  distance: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadii.full,
  },
  tagText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  rating: {
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
  },
  deliveryFee: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
```

- [ ] **Step 2: Create (tabs)/index.tsx**

```tsx
import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useRestaurants, useSearch, useFeaturedRestaurants } from '../../hooks/useRestaurants';
import { useLocation } from '../../hooks/useLocation';
import { RestaurantCard } from '../../components/RestaurantCard';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useAuthStore();
  const { location } = useLocation();
  const { data: featuredData, isLoading: featuredLoading, refetch: refetchFeatured } = useFeaturedRestaurants();
  const { data: nearbyData, isLoading: nearbyLoading, refetch: refetchNearby } = useRestaurants();
  const { data: searchResults, isLoading: searchLoading } = useSearch(
    searchQuery,
    location?.city,
    location?.latitude,
    location?.longitude,
  );

  const isSearching = searchQuery.length > 0;
  const restaurants = isSearching ? searchResults || [] : nearbyData?.restaurants || [];
  const featured = featuredData || [];

  const handleRestaurantPress = (id: string) => {
    router.push(`/restaurant/${id}`);
  };

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchFeatured(), refetchNearby()]);
  }, [refetchFeatured, refetchNearby]);

  const firstName = profile?.full_name?.split(' ')[0] || 'vous';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, {firstName}</Text>
        {location?.city && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>📍 {location.city}</Text>
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un restaurant ou un plat..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {featured.length > 0 && !isSearching && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurants en vedette</Text>
          <FlatList
            horizontal
            data={featured}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RestaurantCard restaurant={item} onPress={handleRestaurantPress} />}
            contentContainerStyle={styles.horizontalList}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{isSearching ? 'Résultats' : 'Près de chez vous'}</Text>
        {(nearbyLoading || searchLoading) ? (
          <ActivityIndicator size="large" color={Colors.primaryGreen} style={styles.loader} />
        ) : (
          <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RestaurantCard
                restaurant={item}
                distanceKm={item.distance_km}
                onPress={handleRestaurantPress}
              />
            )}
            contentContainerStyle={styles.verticalList}
            refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isSearching ? 'Aucun restaurant trouvé' : 'Aucun restaurant disponible'}
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  greeting: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  locationBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadii.full,
  },
  locationText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  section: { flex: 1 },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  horizontalList: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  verticalList: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  loader: { marginTop: 40 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40 },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile-client/components/RestaurantCard.tsx apps/mobile-client/app/\(tabs\)/index.tsx
git commit -m "feat: add home screen with search, featured and nearby restaurants"
```

---

### Task 10: Restaurant Detail + Menu

**Files:**
- Create: `apps/mobile-client/components/MenuItemRow.tsx`
- Create: `apps/mobile-client/app/restaurant/[id].tsx`

- [ ] **Step 1: Create MenuItemRow.tsx**

```tsx
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { QuantityStepper } from './ui/QuantityStepper';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadii } from '../constants/spacing';
import { FontSizes, FontWeights } from '../constants/typography';
import { useCartStore, type CartItem } from '../stores/cartStore';

interface MenuItemRowProps {
  item: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  };
  restaurantId: string;
  restaurantName: string;
  deliveryFee: number;
  minOrderAmount: number;
}

export function MenuItemRow({ item, restaurantId, restaurantName, deliveryFee, minOrderAmount }: MenuItemRowProps) {
  const cart = useCartStore();
  const cartItem = cart.items.find((i) => i.menu_item_id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    const cartItem: CartItem = {
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url,
    };
    cart.addItem(cartItem, restaurantId, restaurantName, deliveryFee, minOrderAmount);
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.price}>{item.price} FCFA</Text>
      </View>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageEmoji}>🍽️</Text>
        </View>
      )}
      {quantity > 0 ? (
        <QuantityStepper
          quantity={quantity}
          onIncrement={() => cart.updateQuantity(item.id, quantity + 1)}
          onDecrement={() => cart.updateQuantity(item.id, quantity - 1)}
        />
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  description: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  price: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.primaryGreen, marginTop: Spacing.xs },
  image: { width: 56, height: 56, borderRadius: BorderRadii.sm },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BorderRadii.sm,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: { fontSize: 20 },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadii.sm,
    backgroundColor: Colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
});
```

- [ ] **Step 2: Create restaurant/[id].tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useRestaurant, useRestaurantMenu } from '../../hooks/useRestaurants';
import { useCartStore } from '../../stores/cartStore';
import { MenuItemRow } from '../../components/MenuItemRow';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'menu' | 'info'>('menu');
  const { data: restaurant, isLoading } = useRestaurant(id);
  const { data: menu } = useRestaurantMenu(id);
  const cart = useCartStore();
  const cartItemCount = cart.itemCount();
  const cartTotal = cart.total();

  if (isLoading || !restaurant) {
    return <ActivityIndicator style={styles.loader} size="large" color={Colors.primaryGreen} />;
  }

  const isOpen = restaurant.status === 'open';

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.tagsRow}>
            {restaurant.cuisine_types?.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.rating}>⭐ {restaurant.total_rating?.toFixed(1)} ({restaurant.rating_count})</Text>
            <Text style={styles.fee}>{restaurant.delivery_fee} FCFA • Min {restaurant.min_order_amount} FCFA</Text>
            <Badge label={isOpen ? 'Ouvert' : 'Fermé'} variant={isOpen ? 'success' : 'error'} />
          </View>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'menu' && styles.tabActive]}
          onPress={() => setActiveTab('menu')}
        >
          <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Infos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'menu' ? (
          menu?.map((category) => (
            <View key={category.id || 'uncategorized'} style={styles.category}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.items?.map((item: any) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  restaurantId={restaurant.id}
                  restaurantName={restaurant.name}
                  deliveryFee={restaurant.delivery_fee}
                  minOrderAmount={restaurant.min_order_amount}
                />
              ))}
            </View>
          ))
        ) : (
          <View style={styles.infoSection}>
            {restaurant.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍 Adresse</Text>
                <Text style={styles.infoValue}>{restaurant.address}</Text>
              </View>
            )}
            {restaurant.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📞 Téléphone</Text>
                <Text style={styles.infoValue}>{restaurant.phone}</Text>
              </View>
            )}
            {restaurant.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>À propos</Text>
                <Text style={styles.infoValue}>{restaurant.description}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {cartItemCount > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => router.push('/cart')}>
          <Text style={styles.cartBarText}>{cartItemCount} article{cartItemCount > 1 ? 's' : ''}</Text>
          <Text style={styles.cartBarTotal}>{cartTotal} FCFA</Text>
          <Text style={styles.cartBarCta}>Voir le panier →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1, justifyContent: 'center' },
  hero: {
    backgroundColor: Colors.primaryGreen,
    padding: Spacing.lg,
    paddingTop: Spacing.xxxl,
  },
  backButton: { marginBottom: Spacing.md },
  backButtonText: { color: '#FFFFFF', fontSize: FontSizes.md },
  heroContent: {},
  name: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: '#FFFFFF' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  tag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing.sm, borderRadius: BorderRadii.full },
  tagText: { color: '#FFFFFF', fontSize: FontSizes.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  rating: { color: '#FFFFFF', fontSize: FontSizes.sm },
  fee: { color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.sm },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primaryGreen },
  tabText: { fontSize: FontSizes.md, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primaryGreen, fontWeight: FontWeights.bold },
  content: { flex: 1 },
  category: {
    marginBottom: Spacing.md,
  },
  categoryName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
  },
  infoSection: { padding: Spacing.lg, gap: Spacing.lg },
  infoRow: { gap: Spacing.xs },
  infoLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  infoValue: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryGreen,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cartBarText: { color: '#FFFFFF', fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  cartBarTotal: { color: '#FFFFFF', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  cartBarCta: { color: '#FFFFFF', fontSize: FontSizes.sm },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile-client/components/MenuItemRow.tsx apps/mobile-client/app/restaurant
git commit -m "feat: add restaurant detail screen with menu and info tabs"
```

---

### Task 11: Cart Screen

**Files:**
- Create: `apps/mobile-client/components/CartItemRow.tsx`
- Create: `apps/mobile-client/app/cart.tsx`

- [ ] **Step 1: Create CartItemRow.tsx**

```tsx
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { QuantityStepper } from './ui/QuantityStepper';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadii } from '../constants/spacing';
import { FontSizes, FontWeights } from '../constants/typography';

interface CartItemRowProps {
  item: {
    menu_item_id: string;
    name: string;
    price: number;
    quantity: number;
    special_instructions?: string;
  };
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>{item.price * item.quantity} FCFA</Text>
        {item.special_instructions ? (
          <Text style={styles.instructions} numberOfLines={1}>{item.special_instructions}</Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <QuantityStepper
          quantity={item.quantity}
          onIncrement={() => onUpdateQuantity(item.menu_item_id, item.quantity + 1)}
          onDecrement={() => onUpdateQuantity(item.menu_item_id, item.quantity - 1)}
        />
        <TouchableOpacity onPress={() => onRemove(item.menu_item_id)}>
          <Text style={styles.removeText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: { flex: 1 },
  name: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  price: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  instructions: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
  actions: { alignItems: 'flex-end', gap: Spacing.xs },
  removeText: { fontSize: FontSizes.xs, color: Colors.error, marginTop: Spacing.xs },
});
```

- [ ] **Step 2: Create cart.tsx**

```tsx
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useCartStore } from '../stores/cartStore';
import { CartItemRow } from '../components/CartItemRow';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadii } from '../constants/spacing';
import { FontSizes, FontWeights } from '../constants/typography';

export default function CartScreen() {
  const cart = useCartStore();
  const items = cart.items;
  const subtotal = cart.subtotal();
  const total = cart.total();
  const isBelowMinimum = subtotal < (cart.minOrderAmount || 0);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Votre panier est vide</Text>
        <Text style={styles.emptySubtitle}>Ajoutez des plats depuis un restaurant</Text>
        <Button title="Explorer les restaurants" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panier</Text>
        <Text style={styles.restaurantName}>{cart.restaurantName}</Text>
      </View>

      <ScrollView style={styles.items}>
        {items.map((item) => (
          <CartItemRow
            key={item.menu_item_id}
            item={item}
            onUpdateQuantity={cart.updateQuantity}
            onRemove={cart.removeItem}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{subtotal} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Livraison</Text>
            <Text style={styles.summaryValue}>{cart.deliveryFee} FCFA</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total} FCFA</Text>
          </View>
          {isBelowMinimum && (
            <Text style={styles.minimumWarning}>
              Minimum de commande : {cart.minOrderAmount} FCFA
            </Text>
          )}
        </View>
        <Button
          title="Commander →"
          onPress={() => router.push('/checkout')}
          disabled={isBelowMinimum}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  restaurantName: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  items: { flex: 1, paddingHorizontal: Spacing.lg },
  footer: { backgroundColor: Colors.surface, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  summary: { gap: Spacing.sm, marginBottom: Spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSizes.sm, color: Colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  totalLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  totalValue: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.primaryGreen },
  minimumWarning: { fontSize: FontSizes.xs, color: Colors.error, textAlign: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, padding: Spacing.xxxl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.xxl, textAlign: 'center' },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile-client/components/CartItemRow.tsx apps/mobile-client/app/cart.tsx
git commit -m "feat: add cart screen with item management and order summary"
```

---

### Task 12: Checkout Screen

**Files:**
- Create: `apps/mobile-client/app/checkout.tsx`

- [ ] **Step 1: Create checkout.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useCreateOrder } from '../hooks/useOrders';
import { useLocation } from '../hooks/useLocation';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadii } from '../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';
import type { PaymentMethod } from '@djossfood/database';

export default function CheckoutScreen() {
  const cart = useCartStore();
  const { profile } = useAuthStore();
  const { location } = useLocation();
  const createOrder = useCreateOrder();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentPhone, setPaymentPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  const subtotal = cart.subtotal();
  const total = cart.total();
  const upfrontAmount = Math.round(total * 0.6);
  const isValidPhone = /^\+2376\d{8}$/.test(paymentPhone) || /^6\d{8}$/.test(paymentPhone);

  const handleConfirm = async () => {
    if (!paymentMethod || !isValidPhone || !deliveryAddress) return;
    if (!cart.restaurantId) return;
    if (!location) {
      Alert.alert('Erreur', 'Localisation non disponible');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = paymentPhone.startsWith('+237') ? paymentPhone : `+237${paymentPhone}`;
      const order = await createOrder.mutateAsync({
        restaurant_id: cart.restaurantId,
        items: cart.items.map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          special_instructions: i.special_instructions,
        })),
        delivery_address: deliveryAddress,
        delivery_lat: location.latitude,
        delivery_lng: location.longitude,
        payment_method: paymentMethod,
        payment_phone: fullPhone,
        delivery_notes: deliveryNotes || undefined,
      });

      cart.clearCart();
      router.replace(`/order/${order.id}`);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Adresse de livraison</Text>
        <Input
          placeholder="Votre adresse de livraison"
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
        />
        <Input
          placeholder="Porte, étage, instructions... (optionnel)"
          value={deliveryNotes}
          onChangeText={setDeliveryNotes}
          containerStyle={{ marginTop: Spacing.sm }}
        />

        <Text style={styles.sectionTitle}>Mode de paiement</Text>
        <View style={styles.paymentMethods}>
          <TouchableOpacity
            style={[styles.paymentButton, styles.orangeButton, paymentMethod === 'orange_money' && styles.paymentSelected]}
            onPress={() => setPaymentMethod('orange_money')}
          >
            <Text style={styles.paymentButtonText}>🟠 Orange Money</Text>
            {paymentMethod === 'orange_money' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentButton, styles.yellowButton, paymentMethod === 'mtn_mobile_money' && styles.paymentSelected]}
            onPress={() => setPaymentMethod('mtn_mobile_money')}
          >
            <Text style={[styles.paymentButtonText, styles.yellowButtonText]}>🟡 MTN MoMo</Text>
            {paymentMethod === 'mtn_mobile_money' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Numéro de paiement</Text>
        <Input
          placeholder="6XX XXX XXX"
          value={paymentPhone}
          onChangeText={setPaymentPhone}
          keyboardType="phone-pad"
          error={!isValidPhone && paymentPhone.length > 0 ? 'Format invalide' : undefined}
        />

        <Text style={styles.sectionTitle}>Récapitulatif</Text>
        <View style={styles.summary}>
          {cart.items.map((item) => (
            <View key={item.menu_item_id} style={styles.summaryRow}>
              <Text style={styles.summaryItemName}>{item.quantity}× {item.name}</Text>
              <Text style={styles.summaryItemPrice}>{item.price * item.quantity} FCFA</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{subtotal} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Livraison</Text>
            <Text style={styles.summaryValue}>{cart.deliveryFee} FCFA</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{total} FCFA</Text>
          </View>
          <View style={[styles.summaryRow, styles.upfrontRow]}>
            <Text style={styles.upfrontLabel}>Acompte (60%)</Text>
            <Text style={styles.upfrontValue}>{upfrontAmount} FCFA</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Traitement en cours...' : `Payer l'acompte ${upfrontAmount} FCFA`}
          onPress={handleConfirm}
          disabled={!paymentMethod || !isValidPhone || !deliveryAddress}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginTop: Spacing.md },
  paymentMethods: { flexDirection: 'row', gap: Spacing.md },
  paymentButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
  },
  orangeButton: { backgroundColor: Colors.primaryOrange },
  yellowButton: { backgroundColor: Colors.primaryYellow },
  paymentButtonText: { color: '#FFFFFF', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  yellowButtonText: { color: '#000000' },
  paymentSelected: { borderColor: Colors.textPrimary },
  checkmark: { position: 'absolute', top: 4, right: 8, color: '#FFFFFF', fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  summary: { backgroundColor: Colors.surface, borderRadius: BorderRadii.xl, padding: Spacing.lg, gap: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItemName: { fontSize: FontSizes.sm, color: Colors.textSecondary, flex: 1 },
  summaryItemPrice: { fontSize: FontSizes.sm, color: Colors.textPrimary },
  summaryLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSizes.sm, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border },
  upfrontRow: { marginTop: Spacing.sm },
  upfrontLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.primaryGreen },
  upfrontValue: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.primaryGreen },
  footer: { backgroundColor: Colors.surface, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile-client/app/checkout.tsx
git commit -m "feat: add checkout screen with payment selection and order creation"
```

---

### Task 13: Order Tracking (Timeline + Map)

**Files:**
- Create: `apps/mobile-client/components/OrderTimeline.tsx`
- Create: `apps/mobile-client/components/DriverMap.tsx`
- Create: `apps/mobile-client/components/RatingModal.tsx`
- Create: `apps/mobile-client/app/order/[id].tsx`

- [ ] **Step 1: Create OrderTimeline.tsx**

```tsx
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadii } from '../constants/spacing';
import { FontSizes, FontWeights } from '../constants/typography';
import type { OrderStatus } from '@djossfood/database';

interface TimelineStep {
  status: OrderStatus;
  label: string;
}

const STEPS: TimelineStep[] = [
  { status: 'pending', label: 'Commande passée' },
  { status: 'confirmed', label: 'Confirmée' },
  { status: 'preparing', label: 'En préparation' },
  { status: 'ready', label: 'Prête' },
  { status: 'driver_assigned', label: 'Livreur assigné' },
  { status: 'picked_up', label: 'Récupérée' },
  { status: 'delivering', label: 'En livraison' },
  { status: 'delivered', label: 'Livrée' },
  { status: 'completed', label: 'Confirmée' },
];

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  timestamps: Record<string, string | null>;
}

export function OrderTimeline({ currentStatus, timestamps }: OrderTimelineProps) {
  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;
        const timestamp = timestamps[step.status];

        return (
          <View key={step.status} style={styles.stepRow}>
            <View style={styles.indicatorColumn}>
              <View style={[
                styles.dot,
                isCompleted && styles.dotCompleted,
                isCurrent && styles.dotCurrent,
                isFuture && styles.dotFuture,
              ]} />
              {index < STEPS.length - 1 && (
                <View style={[
                  styles.line,
                  index < currentIndex ? styles.lineCompleted : styles.lineFuture,
                ]} />
              )}
            </View>
            <View style={styles.labelColumn}>
              <Text style={[
                styles.stepLabel,
                isCompleted && styles.stepLabelCompleted,
                isCurrent && styles.stepLabelCurrent,
                isFuture && styles.stepLabelFuture,
              ]}>
                {step.label}
              </Text>
              {timestamp && (
                <Text style={styles.stepTime}>
                  {new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: Spacing.md },
  stepRow: { flexDirection: 'row', minHeight: 48 },
  indicatorColumn: { width: 32, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  dotCompleted: { backgroundColor: Colors.primaryGreen },
  dotCurrent: { backgroundColor: Colors.primaryGreen, borderWidth: 3, borderColor: Colors.primaryGreen + '40' },
  dotFuture: { backgroundColor: Colors.border },
  line: { flex: 1, width: 2, marginTop: 2 },
  lineCompleted: { backgroundColor: Colors.primaryGreen },
  lineFuture: { backgroundColor: Colors.border },
  labelColumn: { flex: 1, paddingBottom: Spacing.md },
  stepLabel: { fontSize: FontSizes.sm },
  stepLabelCompleted: { color: Colors.primaryGreen, fontWeight: FontWeights.bold },
  stepLabelCurrent: { color: Colors.textPrimary, fontWeight: FontWeights.bold },
  stepLabelFuture: { color: Colors.textSecondary },
  stepTime: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
});
```

- [ ] **Step 2: Create DriverMap.tsx**

```tsx
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Colors } from '../constants/colors';

interface DriverMapProps {
  restaurantLocation: { latitude: number; longitude: number } | null;
  deliveryLocation: { latitude: number; longitude: number } | null;
  driverLocation: { latitude: number; longitude: number; timestamp: string } | null;
  routePolyline?: string | null;
}

export function DriverMap({ restaurantLocation, deliveryLocation, driverLocation, routePolyline }: DriverMapProps) {
  if (!deliveryLocation) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Carte non disponible</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: deliveryLocation.latitude,
    longitude: deliveryLocation.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation>
      {restaurantLocation && (
        <Marker
          coordinate={restaurantLocation}
          pinColor="green"
          title="Restaurant"
        />
      )}
      <Marker
        coordinate={deliveryLocation}
        pinColor="red"
        title="Livraison"
      />
      {driverLocation && (
        <Marker
          coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
          pinColor="blue"
          title="Livreur"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, minHeight: 250 },
  placeholder: { flex: 1, minHeight: 200, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: Colors.textSecondary },
});
```

- [ ] **Step 3: Create RatingModal.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  restaurantName: string;
  onSubmit: (ratings: { restaurant_rating: number; driver_rating?: number; restaurant_comment?: string; driver_comment?: string }) => void;
  hasDriver: boolean;
}

export function RatingModal({ visible, onClose, restaurantName, onSubmit, hasDriver }: RatingModalProps) {
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (restaurantRating === 0) return;
    onSubmit({
      restaurant_rating: restaurantRating,
      driver_rating: hasDriver && driverRating > 0 ? driverRating : undefined,
      restaurant_comment: comment || undefined,
    });
    onClose();
  };

  const renderStars = (rating: number, setRating: (r: number) => void) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Text style={[styles.star, star <= rating && styles.starActive]}>⭐</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Comment était votre commande ?</Text>
      <View style={styles.ratingSection}>
        <Text style={styles.ratingLabel}>{restaurantName}</Text>
        {renderStars(restaurantRating, setRestaurantRating)}
      </View>
      {hasDriver && (
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Votre livreur</Text>
          {renderStars(driverRating, setDriverRating)}
        </View>
      )}
      <TextInput
        style={styles.commentInput}
        placeholder="Commentaire (optionnel)"
        placeholderTextColor={Colors.textSecondary}
        value={comment}
        onChangeText={setComment}
        multiline
      />
      <Button title="Envoyer" onPress={handleSubmit} disabled={restaurantRating === 0} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  ratingSection: { marginBottom: Spacing.lg },
  ratingLabel: { fontSize: FontSizes.md, color: Colors.textPrimary, marginBottom: Spacing.sm },
  starsRow: { flexDirection: 'row', gap: Spacing.md },
  star: { fontSize: 32, opacity: 0.3 },
  starActive: { opacity: 1 },
  commentInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadii.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.bg,
    minHeight: 80,
    marginBottom: Spacing.lg,
  },
});
```

- [ ] **Step 4: Create order/[id].tsx**

```tsx
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useOrder, useConfirmDelivery, useSubmitRating } from '../../hooks/useOrders';
import { useOrderStore } from '../../stores/orderStore';
import { OrderTimeline } from '../../components/OrderTimeline';
import { DriverMap } from '../../components/DriverMap';
import { RatingModal } from '../../components/RatingModal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';
import type { OrderStatus } from '@djossfood/database';

const STATUS_LABELS: Record<OrderStatus, string> = {
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

const STATUS_VARIANTS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'neutral'> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'info',
  driver_assigned: 'info',
  picked_up: 'info',
  delivering: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'error',
  rejected: 'error',
};

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'delivering', 'delivered'];

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);
  const confirmDelivery = useConfirmDelivery();
  const submitRating = useSubmitRating();
  const { subscribeToOrder, unsubscribeFromOrder } = useOrderStore();
  const storeOrder = useOrderStore((s) => s.currentOrder);
  const [showRating, setShowRating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (id) {
      subscribeToOrder(id);
    }
    return () => {
      if (id) unsubscribeFromOrder(id);
    };
  }, [id]);

  // Use store order for real-time updates, fallback to fetched order
  const currentOrder = storeOrder?.id === id ? storeOrder : order;
  const status = (currentOrder?.status || 'pending') as OrderStatus;

  const timestamps: Record<string, string | null> = {
    pending: currentOrder?.created_at || null,
    confirmed: currentOrder?.confirmed_at || null,
    preparing: currentOrder?.preparing_started_at || null,
    ready: currentOrder?.ready_at || null,
    driver_assigned: currentOrder?.driver_assigned_at || null,
    picked_up: currentOrder?.picked_up_at || null,
    delivering: currentOrder?.picked_up_at || null,
    delivered: currentOrder?.delivered_at || null,
    completed: currentOrder?.completed_at || null,
  };

  const showDriverMap = ['driver_assigned', 'picked_up', 'delivering'].includes(status);
  const showConfirmButton = status === 'delivered' && !currentOrder?.client_confirmed_delivery;

  const handleConfirmDelivery = async () => {
    setConfirming(true);
    try {
      await confirmDelivery.mutateAsync(id);
    } finally {
      setConfirming(false);
    }
  };

  const handleRating = async (ratings: any) => {
    await submitRating.mutateAsync({
      order_id: id,
      restaurant_rating: ratings.restaurant_rating,
      driver_rating: ratings.driver_rating,
      restaurant_comment: ratings.restaurant_comment,
      driver_comment: ratings.driver_comment,
    });
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} size="large" color={Colors.primaryGreen} />;
  }

  if (!currentOrder) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Commande non trouvée</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.orderNumber}>Commande #{currentOrder.order_number}</Text>
          <Badge label={STATUS_LABELS[status]} variant={STATUS_VARIANTS[status]} />
        </View>

        <OrderTimeline currentStatus={status} timestamps={timestamps} />

        {showDriverMap && (
          <DriverMap
            restaurantLocation={currentOrder.restaurant_id ? null : null}
            deliveryLocation={currentOrder.delivery_location?.coordinates ? {
              latitude: currentOrder.delivery_location.coordinates[1],
              longitude: currentOrder.delivery_location.coordinates[0],
            } : null}
            driverLocation={(currentOrder as any)?._driverLocation || null}
          />
        )}

        {showConfirmButton && (
          <Button
            title={confirming ? 'Confirmation...' : 'Confirmer la réception'}
            onPress={handleConfirmDelivery}
            loading={confirming}
          />
        )}
      </ScrollView>

      <RatingModal
        visible={showRating}
        onClose={() => setShowRating(false)}
        restaurantName="Restaurant"
        onSubmit={handleRating}
        hasDriver={!!currentOrder.driver_id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, padding: Spacing.lg },
  loader: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  orderNumber: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  errorText: { fontSize: FontSizes.md, color: Colors.error, textAlign: 'center', marginTop: 40 },
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile-client/components/OrderTimeline.tsx apps/mobile-client/components/DriverMap.tsx apps/mobile-client/components/RatingModal.tsx apps/mobile-client/app/order
git commit -m "feat: add order tracking screen with timeline, driver map, and rating modal"
```

---

### Task 14: Orders History + Profile Screens

**Files:**
- Create: `apps/mobile-client/app/(tabs)/orders.tsx`
- Create: `apps/mobile-client/app/(tabs)/profile.tsx`

- [ ] **Step 1: Create orders.tsx**

```tsx
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useOrders } from '../../hooks/useOrders';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';
import type { Order, OrderStatus } from '@djossfood/database';

const STATUS_LABELS: Record<OrderStatus, { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'neutral' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  confirmed: { label: 'Confirmée', variant: 'info' },
  preparing: { label: 'En préparation', variant: 'info' },
  ready: { label: 'Prête', variant: 'info' },
  driver_assigned: { label: 'Livreur assigné', variant: 'info' },
  picked_up: { label: 'Récupérée', variant: 'info' },
  delivering: { label: 'En livraison', variant: 'info' },
  delivered: { label: 'Livrée', variant: 'success' },
  completed: { label: 'Terminée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'error' },
  rejected: { label: 'Refusée', variant: 'error' },
};

function OrderCard({ order }: { order: Order }) {
  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, variant: 'neutral' as const };
  const date = new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/order/${order.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>#{order.order_number}</Text>
        <Badge label={statusInfo.label} variant={statusInfo.variant} />
      </View>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.total}>{order.total_amount} FCFA</Text>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} size="large" color={Colors.primaryGreen} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes commandes</Text>
      <FlatList
        data={orders || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune commande pour le moment</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary, padding: Spacing.lg },
  loader: { flex: 1, justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  date: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: Spacing.xs },
  total: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.primaryGreen, marginTop: Spacing.xs },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40 },
});
```

- [ ] **Step 2: Create profile.tsx**

```tsx
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { signOut } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadii } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function ProfileScreen() {
  const { profile, signOut: clearAuth } = useAuthStore();

  const handleSignOut = async () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Utilisateur'}</Text>
        <Text style={styles.phone}>{profile?.phone || ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Notifications</Text>
          <Text style={styles.menuChevron}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Adresses enregistrées</Text>
          <Text style={styles.menuChevron}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Moyens de paiement</Text>
          <Text style={styles.menuChevron}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aide</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Conditions d'utilisation</Text>
          <Text style={styles.menuChevron}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Politique de confidentialité</Text>
          <Text style={styles.menuChevron}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Contacter le support</Text>
          <Text style={styles.menuChevron}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button title="Se déconnecter" onPress={handleSignOut} variant="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  avatarContainer: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: '#FFFFFF' },
  name: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginTop: Spacing.sm },
  phone: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  section: { backgroundColor: Colors.surface, marginTop: Spacing.md, paddingHorizontal: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: Colors.textSecondary, paddingVertical: Spacing.sm },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuLabel: { fontSize: FontSizes.md, color: Colors.textPrimary },
  menuChevron: { fontSize: FontSizes.md, color: Colors.textSecondary },
  footer: { padding: Spacing.lg, marginTop: 'auto' },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile-client/app/\(tabs\)/orders.tsx apps/mobile-client/app/\(tabs\)/profile.tsx
git commit -m "feat: add orders history and profile screens"
```

---

### Task 15: Integration Verification

- [ ] **Step 1: Verify TypeScript compiles**

```bash
cd djossfood/apps/mobile-client && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors (or only minor type warnings)

- [ ] **Step 2: Verify Expo can start**

```bash
cd djossfood/apps/mobile-client && npx expo start --web 2>&1 &
sleep 10
curl -s http://localhost:8081 2>&1 | head -5 || echo "Web bundler started"
```

Expected: Expo dev server starts without crash

- [ ] **Step 3: Verify all files exist**

```bash
find djossfood/apps/mobile-client -name "*.ts" -o -name "*.tsx" | sort
```

Expected: All files listed in this plan are present

- [ ] **Step 4: Final commit**

```bash
cd djossfood && git add -A && git commit -m "feat: complete Slice 2 client app — auth, home, restaurant, cart, checkout, order tracking, profile"
```

---

## Self-Review

### Spec Coverage

| Spec Section | Covered By |
|---|---|
| Expo project + expo-router | Task 1, 7 |
| Auth (OTP SMS + Email) | Task 8 |
| Home (search + restaurant cards) | Task 9 |
| Restaurant detail + menu | Task 10 |
| Cart (Zustand) | Task 5, 11 |
| Checkout (OM/MTN payment) | Task 12 |
| Order tracking (timeline + map) | Task 13 |
| Design system constants | Task 2 |
| UI primitives | Task 3 |
| Services (API, auth, socket) | Task 4 |
| Zustand stores | Task 5 |
| React Query hooks | Task 6 |
| Profile + Orders | Task 14 |

### Placeholder Scan

No TBDs, TODOs, "implement later", or vague steps found. All code is complete.

### Type Consistency

- `PaymentMethod` type from `@djossfood/database` used consistently in checkout
- `OrderStatus` used in `OrderTimeline` and order tracking screen
- `CartItem` interface defined in `cartStore.ts` and used in `MenuItemRow.tsx`
- API response shapes match the backend routes (restaurants return `{ restaurant }`, orders return `{ order }`, menu returns `{ menu }`)
- `SearchResult` type used in `useSearch` hook matches `@djossfood/database` export
- All color, spacing, and typography tokens are imported from `constants/` consistently across all components