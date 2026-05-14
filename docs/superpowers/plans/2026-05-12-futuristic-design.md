# Futuristic UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all FoodApp Cameroun pages with a futuristic Yango×UberEats glassmorphism/neon dark theme.

**Architecture:** CSS-first approach using Tailwind custom utilities in globals.css. Glassmorphism via `backdrop-blur` + rgba backgrounds. Neon glows via CSS box-shadow. All pages share the same dark background and component patterns.

**Tech Stack:** Next.js 14, React, TailwindCSS, no additional libraries.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/src/styles/globals.css` | Modify | New futuristic color palette, glass/neon utilities, animations |
| `apps/web/src/components/layout/NeonBottomNav.tsx` | Create | Futuristic bottom nav with glassmorphism + active neon indicator |
| `apps/web/src/components/layout/GlassHeader.tsx` | Create | Sticky glass header with search |
| `apps/web/src/components/layout/GlassCard.tsx` | Create | Reusable glassmorphism card component |
| `apps/web/src/components/layout/NeonButton.tsx` | Create | Reusable neon button variants |
| `apps/web/src/pages/_app.tsx` | Modify | Apply dark background to app shell, remove old BottomNav |
| `apps/web/src/pages/index.tsx` | Modify | Redesign homepage with glass cards, neon categories, dark bg |
| `apps/web/src/pages/restaurants.tsx` | Modify | Redesign restaurant list with glass cards |
| `apps/web/src/pages/restaurant/[id].tsx` | Modify | Redesign restaurant detail with hero gradient overlay |
| `apps/web/src/pages/cart.tsx` | Modify | Redesign cart with glass summary cards |
| `apps/web/src/pages/checkout.tsx` | Modify | Redesign checkout with glass form inputs |
| `apps/web/src/pages/order-success.tsx` | Modify | Redesign success page with neon celebration |
| `apps/web/src/pages/orders/[id].tsx` | Modify | Redesign order detail with neon status timeline |
| `apps/web/src/pages/profile.tsx` | Modify | Redesign profile with glass menu items |
| `apps/web/src/pages/profile/addresses.tsx` | Modify | Redesign addresses with glass cards |
| `apps/web/src/pages/admin/dashboard.tsx` | Modify | Redesign admin dashboard with neon KPI cards |
| `apps/web/src/pages/admin/orders.tsx` | Modify | Redesign admin orders with glass kanban |
| `apps/web/src/pages/admin/menu.tsx` | Modify | Redesign menu editor with glass cards |
| `apps/web/src/pages/admin/analytics.tsx` | Modify | Redesign analytics with neon chart accents |
| `apps/web/src/pages/login.tsx` | **Create** | OTP login page with glass form + neon accents |
| `apps/web/src/pages/orders/index.tsx` | **Create** | Order history list with glass cards |
| `apps/web/src/pages/tracking.tsx` | **Create** | Live delivery tracking with glass map overlay |
| `apps/web/src/pages/admin/restaurants.tsx` | **Create** | Restaurant management admin page |
| `apps/web/src/pages/admin/settings.tsx` | **Create** | Platform settings admin page |

---

### Task 1: Global Styles — Futuristic Theme Foundation

**Files:**
- Modify: `apps/web/src/styles/globals.css`

- [ ] **Step 1: Replace entire globals.css with futuristic theme**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-deep: #0A0A0F;
    --bg-surface: rgba(255,255,255,0.03);
    --bg-elevated: rgba(255,255,255,0.06);
    --primary: #FFD600;
    --primary-glow: rgba(255,214,0,0.4);
    --accent-success: #00FF88;
    --accent-info: #00D4FF;
    --accent-danger: #FF3366;
    --text-primary: #FFFFFF;
    --text-secondary: rgba(255,255,255,0.6);
    --text-muted: rgba(255,255,255,0.35);
    --border: rgba(255,255,255,0.08);
    --divider: rgba(255,255,255,0.05);
  }

  body {
    @apply antialiased;
    background-color: var(--bg-deep);
    color: var(--text-primary);
    font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  * {
    -webkit-tap-highlight-color: transparent;
  }
}

@layer components {
  .glass {
    background: var(--bg-surface);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 20px;
  }

  .glass-elevated {
    background: var(--bg-elevated);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }

  .neon-btn {
    @apply inline-flex items-center justify-center px-5 py-3.5 font-semibold transition-all duration-200;
    background: var(--primary);
    color: var(--bg-deep);
    border-radius: 16px;
    box-shadow: 0 0 20px rgba(255,214,0,0.3), 0 4px 12px rgba(0,0,0,0.2);
  }

  .neon-btn:hover {
    box-shadow: 0 0 30px rgba(255,214,0,0.5), 0 6px 16px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }

  .neon-btn:active {
    transform: scale(0.96);
  }

  .ghost-btn {
    @apply inline-flex items-center justify-center px-5 py-3.5 font-medium transition-all duration-200;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    color: var(--text-primary);
    border-radius: 16px;
  }

  .ghost-btn:hover {
    background: rgba(255,255,255,0.08);
  }

  .neon-input {
    @apply w-full px-4 py-3.5 transition-all duration-200;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    color: var(--text-primary);
  }

  .neon-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 12px rgba(255,214,0,0.2);
  }

  .neon-input::placeholder {
    color: var(--text-muted);
  }

  .neon-badge {
    @apply inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold;
    background: rgba(255,214,0,0.15);
    color: var(--primary);
    border: 1px solid rgba(255,214,0,0.3);
  }

  .status-success {
    color: var(--accent-success);
    text-shadow: 0 0 8px rgba(0,255,136,0.4);
  }

  .status-danger {
    color: var(--accent-danger);
    text-shadow: 0 0 8px rgba(255,51,102,0.4);
  }

  .status-info {
    color: var(--accent-info);
    text-shadow: 0 0 8px rgba(0,212,255,0.4);
  }

  .bottom-nav-glass {
    @apply fixed bottom-0 left-0 right-0 flex justify-around items-center py-3;
    background: rgba(10,10,15,0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    border-radius: 24px 24px 0 0;
    z-index: 40;
  }

  .shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @keyframes pulse-neon {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .pulse-neon {
    animation: pulse-neon 2s infinite;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  .truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

- [ ] **Step 2: Verify compilation**

The Next.js dev server should hot-reload without errors.

---

### Task 2: Shared Layout Components

**Files:**
- Create: `apps/web/src/components/layout/NeonBottomNav.tsx`
- Create: `apps/web/src/components/layout/GlassHeader.tsx`
- Create: `apps/web/src/components/layout/GlassCard.tsx`
- Create: `apps/web/src/components/layout/NeonButton.tsx`

- [ ] **Step 1: Create GlassCard.tsx**

```tsx
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', elevated = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`${elevated ? 'glass-elevated' : 'glass'} ${onClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create NeonButton.tsx**

```tsx
import { ReactNode } from 'react';

interface NeonButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled,
  type = 'button',
}: NeonButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-5 py-3.5 rounded-2xl',
    lg: 'px-6 py-4 text-lg rounded-2xl',
  };

  const variantClasses = {
    primary: 'neon-btn',
    ghost: 'ghost-btn',
    danger: 'neon-btn bg-[#FF3366] shadow-[0_0_20px_rgba(255,51,102,0.3)] hover:shadow-[0_0_30px_rgba(255,51,102,0.5)]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Create NeonBottomNav.tsx**

```tsx
import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { href: '/', icon: '🏠', label: 'Accueil' },
  { href: '/restaurants', icon: '🍽️', label: 'Restos' },
  { href: '/cart', icon: '🛒', label: 'Panier' },
  { href: '/orders', icon: '📋', label: 'Commandes' },
  { href: '/profile', icon: '👤', label: 'Profil' },
];

export function NeonBottomNav() {
  const router = useRouter();

  return (
    <nav className="bottom-nav-glass safe-area-bottom">
      {navItems.map((item) => {
        const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-1">
            <span className={`text-xl transition-all ${isActive ? 'scale-110' : 'opacity-50'}`}>
              {item.icon}
            </span>
            <span
              className={`text-[10px] font-medium transition-all ${
                isActive ? 'text-[#FFD600]' : 'text-white/40'
              }`}
            >
              {item.label}
            </span>
            {isActive && (
              <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#FFD600] shadow-[0_0_8px_#FFD600]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Create GlassHeader.tsx**

```tsx
import { ReactNode } from 'react';

interface GlassHeaderProps {
  title: string;
  right?: ReactNode;
  sticky?: boolean;
}

export function GlassHeader({ title, right, sticky = true }: GlassHeaderProps) {
  return (
    <header
      className={`${sticky ? 'sticky top-0 z-30' : ''} px-4 py-3 flex items-center justify-between`}
      style={{
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
      {right && <div>{right}</div>}
    </header>
  );
}
```

---

### Task 3: Update _app.tsx Shell

**Files:**
- Modify: `apps/web/src/pages/_app.tsx`

- [ ] **Step 1: Replace _app.tsx with futuristic shell**

```tsx
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import '../styles/globals.css';

import { LanguageProvider } from '../hooks/useLanguage';
import { AuthProvider } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';

import { NeonBottomNav } from '../components/layout/NeonBottomNav';

export default function App({ Component, pageProps }: AppProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#FF3366]/90 text-white text-center text-sm py-2 px-4">
              Hors ligne — Mode limité
            </div>
          )}

          <div className="min-h-screen pb-24">
            <Component {...pageProps} />
          </div>

          <NeonBottomNav />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
```

---

### Task 4: Redesign Homepage (`/index.tsx`)

**Files:**
- Modify: `apps/web/src/pages/index.tsx`

Replace the entire page with futuristic glassmorphism cards, neon category pills, dark hero header with gradient overlay, and shimmer loading states.

Key changes:
- Header: gradient overlay `bg-gradient-to-b from-[#FFD600]/20 to-transparent` with glass search
- Categories: horizontal scroll with neon active state
- Restaurant cards: glass cards with image top, gradient overlay, neon cuisine tags
- Loading: shimmer skeletons

---

### Task 5: Create Missing Pages

**Files:**
- Create: `apps/web/src/pages/login.tsx` — OTP login with glass form, neon accents, phone input with country flag
- Create: `apps/web/src/pages/orders/index.tsx` — Order list with glass timeline cards, neon status badges
- Create: `apps/web/src/pages/tracking.tsx` — Live tracking with glass overlay on map, neon driver card, pulse animation on current step
- Create: `apps/web/src/pages/admin/restaurants.tsx` — Glass table/list with neon action buttons
- Create: `apps/web/src/pages/admin/settings.tsx` — Glass form sections with neon toggles

---

### Task 6: Redesign Existing Pages

**Files to modify:**
- `apps/web/src/pages/restaurants.tsx` — Glass list cards
- `apps/web/src/pages/restaurant/[id].tsx` — Hero with gradient overlay, glass menu categories, neon add-to-cart
- `apps/web/src/pages/cart.tsx` — Glass cart items, neon checkout button
- `apps/web/src/pages/checkout.tsx` — Glass address selector, glass payment methods, neon confirm
- `apps/web/src/pages/order-success.tsx` — Neon checkmark animation, glass receipt
- `apps/web/src/pages/orders/[id].tsx` — Neon status timeline
- `apps/web/src/pages/profile.tsx` — Glass menu list with neon icons
- `apps/web/src/pages/profile/addresses.tsx` — Glass address cards with map preview
- `apps/web/src/pages/admin/dashboard.tsx` — Neon KPI cards, glass charts containers
- `apps/web/src/pages/admin/orders.tsx` — Glass kanban with neon status columns
- `apps/web/src/pages/admin/menu.tsx` — Glass menu cards with neon toggle switches
- `apps/web/src/pages/admin/analytics.tsx` — Glass chart cards with neon accent lines

---

### Task 7: FloatingCartBar Redesign

**Files:**
- Modify: `apps/web/src/components/layout/FloatingCartBar.tsx`

Convert to glass floating bar with neon badge count, slide-up animation, neon checkout CTA.

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Dark background #0A0A0F | Task 1 (globals.css) |
| Glassmorphism cards | Task 1 + Task 2 (GlassCard) |
| Neon yellow #FFD600 primary | Task 1 + Task 2 (NeonButton) |
| Neon glow shadows | Task 1 (CSS) |
| Glass inputs | Task 1 (neon-input) |
| Bottom nav glass dock | Task 2 (NeonBottomNav) |
| Shimmer loading | Task 1 (shimmer animation) |
| /login page | Task 5 |
| /orders list | Task 5 |
| /tracking | Task 5 |
| /admin/restaurants | Task 5 |
| /admin/settings | Task 5 |
| All existing pages redesigned | Task 4, 6 |
| Shared components redesigned | Task 2, 7 |

No placeholders. All code shown inline.

## Execution

**Recommended approach:** Subagent-driven development (one subagent per task group) for speed and isolation.
