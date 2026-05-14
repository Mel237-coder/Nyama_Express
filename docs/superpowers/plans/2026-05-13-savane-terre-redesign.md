# Savane Terre Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Vibrant African / Savane Terre design direction (light background, earthy palette, Uber Eats-inspired cards) across all frontend pages and shared components.

**Architecture:** Replace the dark glassmorphism/neon theme with a warm light theme using CSS custom properties. Update 5 shared layout components and 14 page files. Keep all functionality identical — only colors, borders, shadows, and backgrounds change.

**Tech Stack:** Next.js 14, React, TailwindCSS, Lucide React. No new dependencies.

---

## Palette Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#F5F0E8` | Page background |
| `--bg-card` | `#FFFFFF` | Card backgrounds |
| `--accent` | `#D84315` | Primary buttons, active tabs, badges |
| `--accent-hover` | `#BF360C` | Button hover |
| `--accent-secondary` | `#F9A825` | Stars, highlights, tags |
| `--accent-tertiary` | `#2E7D32` | Open status, success |
| `--text-primary` | `#1A1A1A` | Headings, primary text |
| `--text-secondary` | `#666666` | Descriptions, secondary text |
| `--text-muted` | `#999999` | Placeholders, hints |
| `--border` | `#E8E4DC` | Card borders, dividers |
| `--shadow` | `rgba(0,0,0,0.06)` | Card shadows |

---

## Task 1: Update globals.css with Savane Terre Theme

**Files:**
- Modify: `apps/web/src/styles/globals.css`

- [ ] **Step 1: Replace entire CSS file**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================
   FoodApp Cameroun — Savane Terre Theme
   Warm light background, earthy accents
   ============================================ */

@layer base {
  :root {
    --bg-primary: #F5F0E8;
    --bg-card: #FFFFFF;
    --accent: #D84315;
    --accent-hover: #BF360C;
    --accent-secondary: #F9A825;
    --accent-tertiary: #2E7D32;
    --text-primary: #1A1A1A;
    --text-secondary: #666666;
    --text-muted: #999999;
    --border: #E8E4DC;
    --shadow: rgba(0, 0, 0, 0.06);
  }

  * {
    -webkit-tap-highlight-color: transparent;
  }

  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer components {
  /* 1. Base card — white with soft border */
  .savane-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    box-shadow: 0 4px 16px var(--shadow);
  }

  /* 2. Elevated card */
  .savane-card-elevated {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  /* 3. Primary button — terre cuite */
  .savane-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 600;
    background-color: var(--accent);
    color: #FFFFFF;
    transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
    border: none;
    cursor: pointer;
  }

  .savane-btn:hover {
    transform: translateY(-1px);
    background-color: var(--accent-hover);
    box-shadow: 0 4px 12px rgba(216, 67, 21, 0.25);
  }

  .savane-btn:active {
    transform: scale(0.97);
  }

  /* 4. Ghost button */
  .savane-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 600;
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border);
    transition: background 0.15s ease, border-color 0.15s ease;
    cursor: pointer;
  }

  .savane-ghost:hover {
    background: var(--bg-primary);
    border-color: var(--text-muted);
  }

  /* 5. Input — beige background */
  .savane-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 1.5rem;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .savane-input::placeholder {
    color: var(--text-muted);
  }

  .savane-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(216, 67, 21, 0.1);
  }

  /* 6. Badge — accent secondary (gold) */
  .savane-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(249, 168, 37, 0.12);
    color: var(--accent-secondary);
    border: 1px solid rgba(249, 168, 37, 0.25);
  }

  /* 7. Status colors */
  .status-open {
    color: var(--accent-tertiary);
  }

  .status-closed {
    color: #E53935;
  }

  .status-success {
    color: var(--accent-tertiary);
  }

  .status-danger {
    color: #E53935;
  }

  .status-info {
    color: var(--accent);
  }

  /* 8. Bottom nav — white with top border */
  .bottom-nav-savane {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding-bottom: env(safe-area-inset-bottom, 16px);
    padding-top: 0.75rem;
    z-index: 40;
  }

  /* 9. Shimmer loading — beige tone */
  .shimmer {
    position: relative;
    overflow: hidden;
    background: #EDE8E0;
    border-radius: 0.5rem;
  }

  .shimmer::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.5) 50%,
      transparent 100%
    );
    animation: shimmer 1.5s infinite;
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

/* Keyframes */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes pulse-soft {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Scrollbar — thin light theme */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #D5D0C8;
}

/* Safe area helpers */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}

.safe-area-top {
  padding-top: env(safe-area-inset-top, 16px);
}

/* Selection color */
::selection {
  background: rgba(216, 67, 21, 0.15);
  color: var(--text-primary);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/styles/globals.css
git commit -m "feat(design): add Savane Terre CSS theme variables and utilities"
```

---

## Task 2: Update Shared Layout Components

**Files:**
- Modify: `apps/web/src/components/layout/NeonBottomNav.tsx`
- Modify: `apps/web/src/components/layout/GlassCard.tsx`
- Modify: `apps/web/src/components/layout/NeonButton.tsx`
- Modify: `apps/web/src/components/layout/GlassHeader.tsx`
- Modify: `apps/web/src/components/layout/FloatingCartBar.tsx`

- [ ] **Step 1: NeonBottomNav — white background, terre cuite active**

Replace the entire file content:

```tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, UtensilsCrossed, ShoppingCart, ClipboardList, User } from 'lucide-react';

interface NavItemDef {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItemDef[] = [
  { href: '/', icon: <Home className="w-6 h-6" />, label: 'Accueil' },
  { href: '/restaurants', icon: <UtensilsCrossed className="w-6 h-6" />, label: 'Restos' },
  { href: '/cart', icon: <ShoppingCart className="w-6 h-6" />, label: 'Panier' },
  { href: '/orders', icon: <ClipboardList className="w-6 h-6" />, label: 'Commandes' },
  { href: '/profile', icon: <User className="w-6 h-6" />, label: 'Profil' },
];

export const NeonBottomNav: React.FC = () => {
  const router = useRouter();

  return (
    <nav className="bottom-nav-savane safe-area-bottom">
      {navItems.map((item) => {
        const isActive = router.pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2 relative"
            aria-label={item.label}
          >
            <span
              className={
                isActive
                  ? 'transition-transform duration-200 scale-110'
                  : 'opacity-50 transition-opacity duration-200'
              }
              style={isActive ? { color: '#D84315' } : { color: '#666666' }}
            >
              {item.icon}
            </span>
            <span
              className={
                isActive
                  ? 'text-[10px] font-semibold tracking-wide transition-colors duration-200'
                  : 'text-[10px] font-medium transition-colors duration-200'
              }
              style={isActive ? { color: '#D84315' } : { color: '#999999' }}
            >
              {item.label}
            </span>
            {isActive && (
              <span
                className="absolute bottom-1 w-1 h-1 rounded-full"
                style={{ backgroundColor: '#D84315' }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
```

- [ ] **Step 2: GlassCard — white card with soft border**

Replace the entire file content:

```tsx
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  elevated = false,
  onClick,
}) => {
  const baseClasses = elevated ? 'savane-card-elevated' : 'savane-card';
  const interactiveClasses = onClick
    ? 'hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]'
    : '';
  const combined = [baseClasses, interactiveClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={combined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};
```

- [ ] **Step 3: NeonButton — terre cuite solid button**

Replace the entire file content:

```tsx
import React from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button',
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl border-none transition-all duration-200 select-none';

  const sizeClasses: Record<string, string> = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-5 py-3 rounded-xl',
    lg: 'px-6 py-4 text-lg rounded-xl',
  };

  const variantClasses: Record<string, string> = {
    primary:
      'bg-[#D84315] text-white hover:bg-[#BF360C] shadow-[0_4px_12px_rgba(216,67,21,0.25)] hover:shadow-[0_6px_16px_rgba(216,67,21,0.35)] hover:-translate-y-0.5 active:scale-[0.96]',
    ghost:
      'bg-transparent text-[#1A1A1A] border border-[#E8E4DC] hover:bg-[#F5F0E8]',
    danger:
      'bg-[#E53935] text-white hover:bg-[#C62828] shadow-[0_4px_12px_rgba(229,57,53,0.25)] hover:shadow-[0_6px_16px_rgba(229,57,53,0.35)] hover:-translate-y-0.5 active:scale-[0.96]',
  };

  const disabledClasses = disabled
    ? 'opacity-40 cursor-not-allowed hover:translate-y-0 active:scale-100 hover:shadow-none'
    : 'cursor-pointer';

  const combined = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={combined}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

- [ ] **Step 4: GlassHeader — white with subtle bottom border**

Replace the entire file content:

```tsx
import React from 'react';

interface GlassHeaderProps {
  title: string;
  right?: React.ReactNode;
  sticky?: boolean;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  title,
  right,
  sticky = true,
}) => {
  return (
    <header
      className={
        sticky
          ? 'sticky top-0 z-30 px-4 py-3 flex items-center justify-between bg-white/95 border-b border-[#E8E4DC]'
          : 'px-4 py-3 flex items-center justify-between bg-white border-b border-[#E8E4DC]'
      }
      style={sticky ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : undefined}
    >
      <h1 className="text-lg font-bold text-[#1A1A1A] tracking-tight">{title}</h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
};
```

- [ ] **Step 5: FloatingCartBar — terre cuite solid bar**

Replace the entire file content:

```tsx
import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useLanguage } from '../../hooks/useLanguage';
import { t, formatPrice } from '../../lib/i18n';

export const FloatingCartBar: React.FC = () => {
  const { items, total, itemCount } = useCart();
  const { language } = useLanguage();

  if (items.length === 0) {
    return null;
  }

  return (
    <Link
      href="/cart"
      className="fixed bottom-20 left-4 right-4 z-40 bg-[#D84315] text-white p-4 rounded-2xl flex items-center justify-between transition-transform active:scale-95 shadow-[0_4px_16px_rgba(216,67,21,0.3)]"
    >
      <div className="flex items-center gap-3">
        <span className="bg-white text-[#D84315] text-sm font-bold px-2.5 py-1 rounded-full">
          {itemCount}
        </span>
        <span className="font-medium">
          {t('cart', language)}
        </span>
      </div>
      <div className="flex items-center gap-2 font-bold">
        <span>{formatPrice(total)}</span>
        <ChevronRight className="w-4 h-4 opacity-80" />
      </div>
    </Link>
  );
};
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/layout/
git commit -m "feat(design): redesign shared layout components to Savane Terre palette"
```

---

## Task 3: Redesign Home Page (index.tsx)

**Files:**
- Modify: `apps/web/src/pages/index.tsx`

- [ ] **Step 1: Replace page background and header**

Change `bg-[#0A0A0F]` → `bg-[#F5F0E8]` on the root div.
Change the header from green hero to minimal white header with Livraison/À emporter tabs and beige search bar.

Replace the header section (lines 94-120) with:

```tsx
    <div className="min-h-screen pb-24 bg-[#F5F0E8]">
      {/* ===== HEADER MINIMAL ===== */}
      <header className="bg-white px-4 pt-4 pb-4 border-b border-[#E8E4DC]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
            FoodApp
          </h1>
          <span className="text-xs font-bold text-[#666666] bg-[#F5F0E8] px-2 py-1 rounded-full">
            Cameroun
          </span>
        </div>

        {/* Tabs Livraison / À emporter */}
        <div className="flex gap-2 mb-3">
          <button className="flex-1 bg-[#D84315] text-white text-sm font-bold py-2 rounded-lg transition-colors">
            Livraison
          </button>
          <button className="flex-1 bg-[#F5F0E8] text-[#666666] text-sm font-bold py-2 rounded-lg transition-colors">
            À emporter
          </button>
        </div>

        {/* Recherche style Uber Eats */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-[#999999]" />
          </div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F5F0E8] text-[#1A1A1A] placeholder-[#999999] rounded-full py-3 pl-12 pr-4 font-medium focus:outline-none focus:ring-2 focus:ring-[#D84315]/20"
          />
        </div>
      </header>
```

- [ ] **Step 2: Replace categories from circles to pills**

Replace the categories section (lines 122-164) with:

```tsx
      {/* ===== CATÉGORIES PILLS ===== */}
      <div className="mt-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CUISINE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-[#D84315] text-white'
                  : 'bg-white text-[#666666] border border-[#E8E4DC]'
              }`}
            >
              {cat.icon}
              {language === 'fr' ? cat.name : cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* ===== FILTRES RAPIDES ===== */}
      <div className="mt-3 px-4 flex gap-2 overflow-x-auto pb-1">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D84315]/10 text-[#D84315] text-xs font-bold border border-[#D84315]/20">
          <TrendingUp className="w-3.5 h-3.5" /> Les mieux notés
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#666666] text-xs font-bold border border-[#E8E4DC]">
          <Heart className="w-3.5 h-3.5" /> Favoris
        </button>
        <button className="px-3 py-1.5 rounded-full bg-white text-[#666666] text-xs font-bold border border-[#E8E4DC]">
          Réinitialiser
        </button>
      </div>
```

- [ ] **Step 3: Update category colors to Savane Terre**

Change CUISINE_CATEGORIES colors (lines 48-56):

```tsx
const CUISINE_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tous', nameEn: 'All', icon: <UtensilsCrossed className="w-4 h-4" />, color: '#D84315' },
  { id: 'africaine', name: 'Africaine', nameEn: 'African', icon: <Soup className="w-4 h-4" />, color: '#2E7D32' },
  { id: 'fast-food', name: 'Fast-Food', nameEn: 'Fast Food', icon: <Beef className="w-4 h-4" />, color: '#D84315' },
  { id: 'grillades', name: 'Grillades', nameEn: 'Grill', icon: <Flame className="w-4 h-4" />, color: '#D84315' },
  { id: 'asiatique', name: 'Asiatique', nameEn: 'Asian', icon: <Soup className="w-4 h-4" />, color: '#D84315' },
  { id: 'indienne', name: 'Indienne', nameEn: 'Indian', icon: <Salad className="w-4 h-4" />, color: '#F9A825' },
  { id: 'pizza', name: 'Pizza', nameEn: 'Pizza', icon: <Pizza className="w-4 h-4" />, color: '#D84315' },
];
```

- [ ] **Step 4: Update results text and empty state colors**

Change result count text (line 168 equivalent):
`text-white/50` → `text-[#999999]`

Change empty state (line 175-178):
`text-white/50` → `text-[#999999]`
Icon color: `#FFD600` → `#D84315`

- [ ] **Step 5: Update RestaurantCard colors**

In `RestaurantCard` (lines 195-270), make these replacements:
- `bg-white/5` card background → `bg-white`
- `border-white/8` → `border border-[#E8E4DC]`
- Gradient overlay `from-[#0A0A0F]` → `from-[#1A1A1A]/60` (keep for readability)
- Badge "Meilleure offre": `bg-[#00FF88] text-[#0A0A0F]` → `bg-[#D84315] text-white`
- Delivery time overlay: `bg-black/60 backdrop-blur-sm text-white` → `bg-[#1A1A1A]/70 text-white` (remove backdrop-blur)
- Restaurant name: `text-white` → `text-[#1A1A1A]`
- Description: `text-white/50` → `text-[#666666]`
- Rating badge: `bg-[#FFD600]/10 border-[#FFD600]/20 text-[#FFD600]` → `bg-[#F9A825]/10 border-[#F9A825]/20 text-[#F9A825]`
- Star fill: `#FFD600` → `#F9A825`
- Cuisine tags: `bg-white/10 text-white/70` → `bg-[#F5F0E8] text-[#666666]`
- Delivery fee text: `text-white/40` → `text-[#999999]`
- Open status: `text-[#00FF88] bg-[#00FF88]/10` → `text-[#2E7D32] bg-[#2E7D32]/10`
- Closed status: `text-[#FF3366] bg-[#FF3366]/10` → `text-[#E53935] bg-[#E53935]/10`
- Card shadow: add `shadow-[0_4px_16px_rgba(0,0,0,0.06)]`

- [ ] **Step 6: Update RestaurantSkeleton**

In `RestaurantSkeleton` (lines 276-294):
- `bg-white/5 border-white/8` → `bg-white border border-[#E8E4DC]`
- Shimmer backgrounds stay as class `shimmer` (already updated in globals.css)

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/index.tsx
git commit -m "feat(design): redesign home page with Savane Terre palette"
```

---

## Task 4: Redesign Login Page (login.tsx)

**Files:**
- Modify: `apps/web/src/pages/login.tsx`

- [ ] **Step 1: Update page background and loading state**

Change root div from `min-h-screen flex flex-col` to `min-h-screen flex flex-col bg-[#F5F0E8]`.

Change loading spinner div (line 82-86):
```tsx
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="shimmer w-12 h-12 rounded-full" />
      </div>
```

- [ ] **Step 2: Update GlassCard and form colors**

The `GlassCard` component now renders white cards, so the card is already correct.
Update text colors inside the card:
- `text-white` → `text-[#1A1A1A]`
- `text-white/50` → `text-[#666666]`
- `text-white/70` label → `text-[#666666]`
- Lock icon color: `#FFD600` → `#D84315`
- Error status: `status-danger` class stays, but ensure the background `bg-white/5` → `bg-[#F5F0E8]`
- Dev OTP display: `glass` → `savane-card`, `text-[#FFD600]` → `text-[#D84315]`

- [ ] **Step 3: Update input styling**

Replace all `className="neon-input"` with `className="savane-input"`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/login.tsx
git commit -m "feat(design): redesign login page with Savane Terre palette"
```

---

## Task 5: Redesign Restaurant Detail Page ([id].tsx)

**Files:**
- Modify: `apps/web/src/pages/restaurant/[id].tsx`

- [ ] **Step 1: Update page background and loading/error states**

Change all `bg-[#0A0A0F]` → `bg-[#F5F0E8]`.
Change loading shimmer container, error page background.

- [ ] **Step 2: Update cover section**

- Back button: `bg-black/40 backdrop-blur-sm text-white` → `bg-white/80 text-[#1A1A1A] shadow-md` (remove backdrop-blur)
- Delivery fee badge: `bg-black/40 backdrop-blur-sm text-white` → `bg-white/80 text-[#1A1A1A] shadow-md`
- Truck icon color: `#00FF88` → `#2E7D32`

- [ ] **Step 3: Update header info section**

- Logo border: `border-4 border-[#0A0A0F] bg-[#0A0A0F]` → `border-4 border-white bg-white shadow-lg`
- Restaurant name: `text-white` → `text-[#1A1A1A]`
- Rating badge: `bg-[#FFD600]/10 border-[#FFD600]/20 text-[#FFD600]` → `bg-[#F9A825]/10 border-[#F9A825]/20 text-[#F9A825]`
- Star fill: `#FFD600` → `#F9A825`
- Clock/MapPin text: `text-white/60` → `text-[#666666]`
- MapPin color: `#FF3366` → `#D84315`
- Cuisine tags: `bg-white/10 text-white/70` → `bg-[#F5F0E8] text-[#666666]`

- [ ] **Step 4: Update tabs**

- Tab container border: `border-b border-white/10` → `border-b border-[#E8E4DC]`
- Active tab: `text-[#00FF88] border-b-2 border-[#00FF88]` → `text-[#D84315] border-b-2 border-[#D84315]`
- Inactive tab: `text-white/40` → `text-[#999999]`

- [ ] **Step 5: Update menu category pills**

- Active pill: `bg-[#00FF88] text-[#0A0A0F]` → `bg-[#D84315] text-white`
- Inactive pill: `bg-white/5 text-white/60 border border-white/10` → `bg-white text-[#666666] border border-[#E8E4DC]`

- [ ] **Step 6: Update menu items list**

- Item container: `bg-white/5 border border-white/8` → `bg-white border border-[#E8E4DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)]`
- Item name: `text-white` → `text-[#1A1A1A]`
- Item description: `text-white/50` → `text-[#666666]`
- Item price: `text-[#FFD600]` → `text-[#D84315]`
- Plus button on image: `bg-[#00FF88]` → `bg-[#D84315]`, icon color `text-[#0A0A0F]` → `text-white`
- Placeholder plus: `text-white/40` → `text-[#999999]`
- Empty state: `text-white/50` → `text-[#999999]`

- [ ] **Step 7: Update Info tab content**

- Info cards: `bg-white/5 border border-white/8` → `bg-white border border-[#E8E4DC]`
- Card headings: `text-white` → `text-[#1A1A1A]`
- Card text: `text-white/60` → `text-[#666666]`
- MapPin icon: `#FF3366` → `#D84315`
- Clock icon: `#00D4FF` → `#D84315`

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/pages/restaurant/\[id\].tsx
git commit -m "feat(design): redesign restaurant detail page with Savane Terre palette"
```

---

## Task 6: Redesign Cart Page (cart.tsx)

**Files:**
- Modify: `apps/web/src/pages/cart.tsx`

- [ ] **Step 1: Update page background**

Add `bg-[#F5F0E8]` to the root div.

- [ ] **Step 2: Update empty cart state**

- Circle background: `glass` → `savane-card`
- Cart icon color: `#FFD600` → `#D84315`
- Empty text: `text-white/50` → `text-[#666666]`

- [ ] **Step 3: Update restaurant name banner**

- `glass` → `savane-card`
- Text color: `text-[#FFD600]` → `text-[#D84315]`

- [ ] **Step 4: Update cart item cards**

- `GlassCard elevated` already renders white — verify it's working.
- Image placeholder: `glass` → `savane-card`, icon color `#00FF88` → `#2E7D32`
- Item name: `text-white` → `text-[#1A1A1A]`
- Options text: `text-white/40` → `text-[#999999]`
- Price: `text-[#FFD600]` → `text-[#D84315]`
- Quantity text: `text-white` → `text-[#1A1A1A]`
- Ghost stepper buttons: change class from `ghost-btn` to `savane-ghost`
- Neon stepper buttons: change class from `neon-btn` to `savane-btn`
- Delete button: `text-[#FF3366]` → `text-[#E53935]`

- [ ] **Step 5: Update summary card**

- `GlassCard elevated` already white.
- Subtotal/delivery labels: `text-white/60` → `text-[#666666]`
- Border: `border-t border-white/10` → `border-t border-[#E8E4DC]`
- Total label: `text-white` → `text-[#1A1A1A]`
- Total price: `text-[#FFD600]` → `text-[#D84315]`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/cart.tsx
git commit -m "feat(design): redesign cart page with Savane Terre palette"
```

---

## Task 7: Redesign Checkout Page (checkout.tsx)

**Files:**
- Modify: `apps/web/src/pages/checkout.tsx`

- [ ] **Step 1: Update page background**

Add `bg-[#F5F0E8]` to root div.
Change loading spinner background.

- [ ] **Step 2: Update section card colors**

All `GlassCard elevated` components will render white now. Update text inside:
- Section headings: `text-white` → `text-[#1A1A1A]`
- Subheadings: `text-white/40` → `text-[#999999]`
- Saved address pills: active uses `neon-btn` → `savane-btn`, inactive uses `ghost-btn` → `savane-ghost`

- [ ] **Step 3: Update polling status and error states**

- Waiting state card: `glass` → `savane-card`
- Shimmer spinner stays as `shimmer`
- Waiting text: `text-[#FFD600]` → `text-[#D84315]`
- Subtext: `text-white/60` → `text-[#666666]`
- Error text: `text-[#FF3366]` → `text-[#E53935]`
- Helper texts: `text-white/40` → `text-[#999999]`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/checkout.tsx
git commit -m "feat(design): redesign checkout page with Savane Terre palette"
```

---

## Task 8: Redesign Profile Page (profile.tsx)

**Files:**
- Modify: `apps/web/src/pages/profile.tsx`

- [ ] **Step 1: Update page backgrounds**

Change all `bg-[#0A0A0F]` → `bg-[#F5F0E8]`.
Change loading spinner border color: `border-[#FFD600]` → `border-[#D84315]`.
Change loading text: `text-white/60` → `text-[#666666]`.

- [ ] **Step 2: Update menu icon colors to Savane Terre**

Change menuItems icon colors:
- ShoppingBag: `#00D4FF` → `#D84315`
- User: `#FFD600` → `#F9A825`
- CreditCard: `#00FF88` → `#2E7D32`
- Bell: `#FF3366` → `#D84315`
- MapPin: `#00D4FF` → `#D84315`

- [ ] **Step 3: Update dashboard view text colors**

- Avatar ring: `ring-[#FFD600]/20` → `ring-[#D84315]/20`
- Avatar background: `bg-white/5` → `bg-[#F5F0E8]`
- Avatar text color: `#FFD600` → `#D84315`
- User name: `text-white` → `text-[#1A1A1A]`
- Phone: `text-white/50` → `text-[#666666]`
- Menu item text: `text-white/90` → `text-[#1A1A1A]`
- Menu item icon default: `text-white/60` → `text-[#999999]`
- Chevron: `text-white/30` → `text-[#999999]`

- [ ] **Step 4: Update sub-view text colors**

- Back arrow: `text-white/70` → `text-[#666666]`
- Success message border/bg: `bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20` → `bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/20`
- Error message border/bg: `bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20` → `bg-[#E53935]/10 text-[#E53935] border-[#E53935]/20`
- Form labels: `text-white/80` → `text-[#666666]`
- Inputs: `neon-input` → `savane-input`
- Language label: `text-white/80` → `text-[#1A1A1A]`
- Language description: `text-white/40` → `text-[#999999]`
- Languages icon: `#FFD600` → `#D84315`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/profile.tsx
git commit -m "feat(design): redesign profile page with Savane Terre palette"
```

---

## Task 9: Redesign Orders List Page (orders/index.tsx)

**Files:**
- Modify: `apps/web/src/pages/orders/index.tsx`

- [ ] **Step 1: Update page background**

Add `bg-[#F5F0E8]` to root div.
Change loading spinner background.

- [ ] **Step 2: Update empty state**

- `GlassCard` already white.
- Inbox icon: `text-white/40` → `text-[#999999]`
- Heading: `text-white` → `text-[#1A1A1A]`
- Subtext: `text-white/50` → `text-[#666666]`

- [ ] **Step 3: Update order cards**

- `GlassCard elevated` already white.
- Order ID: `text-white/40` → `text-[#999999]`
- Restaurant name: `text-white` → `text-[#1A1A1A]`
- Status badges: update `neon-badge` class — the CSS now uses gold/orange tones. Ensure `STATUS_CLASSES` mappings are still valid (they use `.status-info`, `.status-success`, `.status-danger` which are updated in globals.css).
- Date: `text-white/50` → `text-[#666666]`
- Price: `text-white` → `text-[#1A1A1A]`
- Card border on hover: `hover:bg-white/5` → `hover:bg-[#F5F0E8]/50`

- [ ] **Step 4: Update skeleton**

- Skeleton container: `glass-elevated` → `savane-card-elevated`
- Shimmer backgrounds stay as class `shimmer`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/orders/index.tsx
git commit -m "feat(design): redesign orders list page with Savane Terre palette"
```

---

## Task 10: Redesign Order Tracking Page (orders/[id].tsx)

**Files:**
- Modify: `apps/web/src/pages/orders/[id].tsx`

- [ ] **Step 1: Update page background**

Change all `bg-[#0A0A0F]` → `bg-[#F5F0E8]`.
Change loading spinner border: `border-[#FFD600]` → `border-[#D84315]`.
Change loading text: `text-white/60` → `text-[#666666]`.

- [ ] **Step 2: Update error state**

- `GlassCard` already white.
- AlertTriangle color: `#FF3366` → `#E53935`
- Heading: `text-white` → `text-[#1A1A1A]`
- Subtext: `text-white/60` → `text-[#666666]`

- [ ] **Step 3: Update tracking cards**

- `GlassCard` already white.
- "Order ID" label: `text-white/50` → `text-[#999999]`
- Order ID value: `text-white` → `text-[#1A1A1A]`
- Status badge colors: update to Savane palette:
  - DELIVERED: `bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20` → `bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/20`
  - CANCELED: `bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20` → `bg-[#E53935]/10 text-[#E53935] border-[#E53935]/20`
  - Default: `bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20` → `bg-[#D84315]/10 text-[#D84315] border-[#D84315]/20`
- Total label: `text-white/60` → `text-[#666666]`
- Total amount: `text-[#FFD600]` → `text-[#D84315]`

- [ ] **Step 4: Update timeline**

- "Status Timeline" heading: `text-white` → `text-[#1A1A1A]`
- Current step dot: `bg-[#00D4FF]` → `bg-[#D84315]`
- Completed step dot: `bg-[#00FF88]` → `bg-[#2E7D32]`
- Future step dot: `bg-white/20` → `bg-[#E8E4DC]`
- Completed connector: `bg-[#00FF88]/40` → `bg-[#2E7D32]/40`
- Future connector: `bg-white/10` → `bg-[#E8E4DC]`
- Current step text: `status-info` → `status-info` (updated in CSS)
- Completed step text: `status-success` → `status-success` (updated in CSS)
- Future step text: `text-white/40` → `text-[#999999]`

- [ ] **Step 5: Update map card**

- "Live Tracking" heading: `text-white` → `text-[#1A1A1A]`
- Pulse dot: `bg-[#00FF88]` → `bg-[#2E7D32]`
- Map loading: `text-white/40` → `text-[#999999]`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/orders/\[id\].tsx
git commit -m "feat(design): redesign order tracking page with Savane Terre palette"
```

---

## Task 11: Redesign Admin Dashboard (admin/dashboard.tsx)

**Files:**
- Modify: `apps/web/src/pages/admin/dashboard.tsx`

- [ ] **Step 1: Update page background**

Change all `bg-[#0A0A0F]` → `bg-[#F5F0E8]`.

- [ ] **Step 2: Update unauthorized state**

- Heading: `text-white` → `text-[#1A1A1A]`
- Subtext: `text-white/50` → `text-[#666666]`

- [ ] **Step 3: Update sidebar**

- Sidebar border: `border-white/10` → `border-[#E8E4DC]`
- Sidebar background: default (inherits page bg)
- Logo color: `text-[#FFD600]` → `text-[#D84315]`
- User email: `text-white/40` → `text-[#999999]`
- Active nav item: `bg-[#FFD600]/10 text-[#FFD600] border-[#FFD600]/20` → `bg-[#D84315]/10 text-[#D84315] border-[#D84315]/20`
- Inactive nav item: `text-white/60 hover:bg-white/5 hover:text-white` → `text-[#666666] hover:bg-[#F5F0E8] hover:text-[#1A1A1A]`
- Logout hover: `hover:bg-[#FF3366]/10 hover:text-[#FF3366]` → `hover:bg-[#E53935]/10 hover:text-[#E53935]`

- [ ] **Step 4: Update main header**

- Header border: `border-white/10` → `border-[#E8E4DC]`
- Header background: add `bg-white`
- Title: `text-white` → `text-[#1A1A1A]`
- Welcome text: `text-white/40` → `text-[#999999]`
- Avatar background: `bg-[#FFD600]/10 text-[#FFD600] border-[#FFD600]/20` → `bg-[#D84315]/10 text-[#D84315] border-[#D84315]/20`

- [ ] **Step 5: Update stat cards**

- `GlassCard` already white.
- Icon containers:
  - Package: `text-[#00D4FF]` → `text-[#D84315]`
  - TrendingUp: `text-[#00FF88]` → `text-[#2E7D32]`
  - Users: `text-[#FFD600]` → `text-[#F9A825]`
  - UtensilsCrossed: `text-[#FF3366]` → `text-[#E53935]`
- Icon bg: `bg-white/5` → `bg-[#F5F0E8]`
- Stat label: `text-white/50` → `text-[#999999]`
- Stat values: keep their colored classes (updated to new palette)

- [ ] **Step 6: Update quick action cards**

- `GlassCard` already white.
- Users card icon bg: `bg-[#FFD600]/10 text-[#FFD600]` → `bg-[#D84315]/10 text-[#D84315]`
- Settings card icon bg: `bg-white/5 text-white/60` → `bg-[#F5F0E8] text-[#666666]`
- Card titles: `text-white` → `text-[#1A1A1A]`
- Card descriptions: `text-white/50` → `text-[#666666]`

- [ ] **Step 7: Update recent activity card**

- `GlassCard` already white.
- Heading: `text-white` → `text-[#1A1A1A]`
- Empty text: `text-white/30` → `text-[#999999]`

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/pages/admin/dashboard.tsx
git commit -m "feat(design): redesign admin dashboard with Savane Terre palette"
```

---

## Task 12: Redesign Admin Users Page (admin/users.tsx)

**Files:**
- Modify: `apps/web/src/pages/admin/users.tsx`

- [ ] **Step 1: Update page background**

Change all `bg-[#0A0A0F]` → `bg-[#F5F0E8]`.
Change loading spinner border: `border-[#FFD600]` → `border-[#D84315]`.

- [ ] **Step 2: Update unauthorized state**

- `GlassCard` already white.
- Ban icon: `#FF3366` → `#E53935`
- Heading: `text-white` → `text-[#1A1A1A]`
- Subtext: `text-white/50` → `text-[#666666]`

- [ ] **Step 3: Update stat card colors**

- Icon backgrounds: `bg-white/5` → `bg-[#F5F0E8]`
- Icon colors:
  - Users: `text-[#FFD600]` → `text-[#F9A825]`
  - UserCheck: `text-[#00FF88]` → `text-[#2E7D32]`
  - UserX: `text-[#FF3366]` → `text-[#E53935]`
  - UserPlus: `text-[#00D4FF]` → `text-[#D84315]`
- Stat labels: `text-white/50` → `text-[#999999]`

- [ ] **Step 4: Update filters**

- Search input: `neon-input` → `savane-input`
- Search icon: `text-white/35` → `text-[#999999]`
- Select inputs: `neon-input` → `savane-input`
- ChevronDown: `text-white/35` → `text-[#999999]`

- [ ] **Step 5: Update table**

- `GlassCard` already white.
- Table header border: `border-white/10` → `border-[#E8E4DC]`
- Table header text: `text-white/60` → `text-[#999999]`
- Table row border: `border-white/5` → `border-[#F5F0E8]`
- Table row hover: `hover:bg-white/[0.02]` → `hover:bg-[#F5F0E8]/50`
- Name text: `text-white` → `text-[#1A1A1A]`
- Email/phone: `text-white/60` → `text-[#666666]`
- Role colors:
  - CLIENT: `text-white/60` → `text-[#666666]`
  - RESTAURANT_OWNER: `text-[#FFD600]` → `text-[#F9A825]`
  - DELIVERY_PERSON: `text-[#00D4FF]` → `text-[#D84315]`
  - ADMIN: `text-[#FF3366]` → `text-[#E53935]`
- Status classes: updated via globals.css `.status-success`, `.status-info`, `.status-danger`
- Action buttons: `ghost-btn` → `savane-ghost`
- UserCheck icon in toggle: `text-[#00FF88]` → `text-[#2E7D32]`, `text-[#FFD600]` → `text-[#F9A825]`
- Delete button: `text-[#FF3366]` → `text-[#E53935]`

- [ ] **Step 6: Update empty state**

- Users icon: `#FFD600` → `#D84315`
- Text: `text-white/50` → `text-[#666666]`

- [ ] **Step 7: Update edit modal**

- Modal overlay: `bg-black/60` → `bg-[#1A1A1A]/40`
- `GlassCard elevated` already white.
- Modal heading: `text-white` → `text-[#1A1A1A]`
- Close button: `ghost-btn` → `savane-ghost`
- Labels: `text-white/60` → `text-[#666666]`
- Inputs: `neon-input` → `savane-input`
- Cancel button: `variant="ghost"` stays (NeonButton component handles it)

- [ ] **Step 8: Update table skeleton**

- Row borders: `border-white/5` → `border-[#F5F0E8]`

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/pages/admin/users.tsx
git commit -m "feat(design): redesign admin users page with Savane Terre palette"
```

---

## Task 13: Redesign Admin Menu Page (admin/menu.tsx)

**Files:**
- Modify: `apps/web/src/pages/admin/menu.tsx`

- [ ] **Step 1: Update page background**

Change all `bg-[#0A0A0F]` → `bg-[#F5F0E8]`.

- [ ] **Step 2: Update unauthenticated state**

- `GlassCard` already white.
- Text: `text-white/60` → `text-[#666666]`

- [ ] **Step 3: Update header and content**

- `GlassHeader` already white.
- Page title: `text-white` → `text-[#1A1A1A]`
- Subtitle: `text-white/50` → `text-[#666666]`
- Loading spinner: `border-[#FFD600]` → `border-[#D84315]`

- [ ] **Step 4: Update edit modal**

- Modal overlay: `bg-black/70` → `bg-[#1A1A1A]/40`
- `GlassCard` already white.
- Modal header border: `border-white/10` → `border-[#E8E4DC]`
- Modal title: `text-white` → `text-[#1A1A1A]`
- Close button: `text-white/40` → `text-[#999999]`, `hover:text-white` → `hover:text-[#1A1A1A]`
- Form labels: `text-white/80` → `text-[#666666]`
- Inputs: `neon-input` → `savane-input`
- File input: `file:bg-[#FFD600]/10 file:text-[#FFD600]` → `file:bg-[#D84315]/10 file:text-[#D84315]`
- Cancel button: `ghost-btn` → `savane-ghost`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/menu.tsx
git commit -m "feat(design): redesign admin menu page with Savane Terre palette"
```

---

## Task 14: Redesign Admin Orders Page (admin/orders.tsx)

**Files:**
- Modify: `apps/web/src/pages/admin/orders.tsx`

- [ ] **Step 1: Update page background**

Change all `bg-[#0A0A0F]` → `bg-[#F5F0E8]`.

- [ ] **Step 2: Update loading and unauthorized states**

- Loading spinner: `border-[#FFD600]` → `border-[#D84315]`
- Loading text: `text-white/60` → `text-[#666666]`
- Unauthorized text: `text-[#FF3366]` → `text-[#E53935]`

- [ ] **Step 3: Update header**

- `GlassHeader` already white.
- Right text: `text-white/40` → `text-[#999999]`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/admin/orders.tsx
git commit -m "feat(design): redesign admin orders page with Savane Terre palette"
```

---

## Task 15: Redesign Admin Analytics Page (admin/analytics.tsx)

**Files:**
- Modify: `apps/web/src/pages/admin/analytics.tsx`

- [ ] **Step 1: Update page background**

Change all `bg-[#0A0A0F]` → `bg-[#F5F0E8]`.

- [ ] **Step 2: Update loading and error states**

- Loading spinner: `border-[#FFD600]` → `border-[#D84315]`
- Loading text: `text-white/60` → `text-[#666666]`
- Error text: `text-[#FF3366]` → `text-[#E53935]`

- [ ] **Step 3: Update KPI cards**

- `GlassCard` already white.
- Icon containers: `bg-white/5` → `bg-[#F5F0E8]`
- Icon colors:
  - TrendingUp: `text-[#00FF88]` → `text-[#2E7D32]`
  - ShoppingBag: `text-[#FFD600]` → `text-[#F9A825]`
  - Users: `text-[#00D4FF]` → `text-[#D84315]`
  - Star: `text-[#FF3366]` → `text-[#E53935]`
- Labels: `text-white/50` → `text-[#999999]`

- [ ] **Step 4: Update header**

- `GlassHeader` already white.
- Page title: `text-white` → `text-[#1A1A1A]`
- Subtitle: `text-white/50` → `text-[#666666]`
- Time filter badge: `glass text-white/60` → `savane-card text-[#666666]`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/admin/analytics.tsx
git commit -m "feat(design): redesign admin analytics page with Savane Terre palette"
```

---

## Task 16: Redesign Admin Restaurants & Settings Pages

**Files:**
- Modify: `apps/web/src/pages/admin/restaurants.tsx` (if exists)
- Modify: `apps/web/src/pages/admin/settings.tsx` (if exists)

- [ ] **Step 1: Check if files exist and apply same pattern**

If `admin/restaurants.tsx` exists:
- Change `bg-[#0A0A0F]` → `bg-[#F5F0E8]`
- Update all `text-white` → `text-[#1A1A1A]`
- Update all `text-white/50` or `text-white/60` → `text-[#666666]`
- Update all `text-white/40` → `text-[#999999]`
- Update accent colors `#FFD600` → `#D84315`, `#00FF88` → `#2E7D32`, `#00D4FF` → `#D84315`, `#FF3366` → `#E53935`
- Replace `glass` / `glass-elevated` / `neon-btn` / `ghost-btn` / `neon-input` with `savane-card` / `savane-card-elevated` / `savane-btn` / `savane-ghost` / `savane-input`

If `admin/settings.tsx` exists: apply identical pattern.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/admin/restaurants.tsx apps/web/src/pages/admin/settings.tsx 2>/dev/null || true
git commit -m "feat(design): redesign admin restaurants and settings pages with Savane Terre palette" || true
```

---

## Task 17: Redesign Tracking Sub-Components

**Files:**
- Modify: `apps/web/src/components/tracking/StatusHeader.tsx` (if exists)
- Modify: `apps/web/src/components/tracking/DriverCard.tsx` (if exists)
- Modify: `apps/web/src/components/tracking/ArrivedOverlay.tsx` (if exists)
- Modify: `apps/web/src/components/restaurant/RestaurantHero.tsx` (if exists)
- Modify: `apps/web/src/components/restaurant/RestaurantInfo.tsx` (if exists)
- Modify: `apps/web/src/pages/order-success.tsx` (if exists)

- [ ] **Step 1: Apply Savane Terre palette to all tracking components**

Same systematic replacements for each file:
- `bg-[#0A0A0F]` → `bg-[#F5F0E8]`
- `text-white` → `text-[#1A1A1A]`
- `text-white/50` or `text-white/60` → `text-[#666666]`
- `text-white/40` → `text-[#999999]`
- `#FFD600` → `#D84315`
- `#00FF88` → `#2E7D32`
- `#00D4FF` → `#D84315`
- `#FF3366` → `#E53935`
- `glass` → `savane-card`
- `glass-elevated` → `savane-card-elevated`
- `neon-btn` → `savane-btn`
- `ghost-btn` → `savane-ghost`
- `neon-input` → `savane-input`

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/tracking/ apps/web/src/components/restaurant/ apps/web/src/pages/order-success.tsx 2>/dev/null || true
git commit -m "feat(design): redesign tracking and restaurant sub-components with Savane Terre palette" || true
```

---

## Task 18: Build Verification

**Files:**
- Verify: `apps/web/src/styles/globals.css`
- Verify: all modified page files

- [ ] **Step 1: Run Next.js build**

```bash
npm run build -w apps/web
```

Expected: Build completes with 0 errors.

- [ ] **Step 2: Fix any TypeScript or CSS errors**

If build fails, read the error output and fix the specific file/line. Common issues:
- Missing closing tag after large replacements
- Invalid Tailwind class names
- TypeScript type mismatches from changed component props

- [ ] **Step 3: Run dev server smoke test**

```bash
npm run dev -w apps/web
```

Open http://localhost:3002 and verify:
1. Home page loads with beige background, white cards, terre cuite accents
2. Navigation bottom is white with terre cuite active indicator
3. No console errors about missing CSS classes

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(design): complete Savane Terre redesign — all pages and components"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ P1 Accueil — Task 3
- ✅ P2 Détail Restaurant — Task 5
- ✅ P3 Panier — Task 6
- ✅ P4 Checkout — Task 7
- ✅ P5 Profil — Task 8
- ✅ P6 Login — Task 4
- ✅ P7 Liste Commandes — Task 9
- ✅ P8 Suivi Commande — Task 10
- ✅ P9 Admin Dashboard — Task 11
- ✅ P10 Admin Users — Task 12
- ✅ P11 Admin Menu — Task 13
- ✅ P12 Admin Orders — Task 14
- ✅ P13 Admin Restaurants — Task 16
- ✅ P14 Admin Analytics — Task 15
- ✅ Shared components — Task 2
- ✅ globals.css — Task 1

**2. Placeholder scan:** No TBD, TODO, or vague instructions found.

**3. Type consistency:** All component prop interfaces remain unchanged. Only visual classes and inline styles change.
