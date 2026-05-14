# Spec: Futuristic UI Redesign — Yango × UberEats Hybrid

## Overview

Complete redesign of FoodApp Cameroun with a futuristic cyberpunk/glassmorphism aesthetic inspired by **Yango** (African VTC app) and **UberEats**.

## Design Language

### Color Palette (Dark Mode First)
- **Background**: `#0A0A0F` (deep space black)
- **Surface**: `rgba(255,255,255,0.03)` + `backdrop-blur-xl` (glassmorphism)
- **Surface Elevated**: `rgba(255,255,255,0.06)`
- **Primary**: `#FFD600` (Yango neon yellow)
- **Primary Glow**: `0 0 20px rgba(255,214,0,0.4)`
- **Accent Success**: `#00FF88` (neon green)
- **Accent Info**: `#00D4FF` (neon cyan)
- **Accent Danger**: `#FF3366` (neon pink-red)
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `rgba(255,255,255,0.6)`
- **Text Muted**: `rgba(255,255,255,0.35)`
- **Border**: `rgba(255,255,255,0.08)`
- **Divider**: `rgba(255,255,255,0.05)`

### Typography
- **Font**: `'Inter', 'SF Pro Display', system-ui, sans-serif`
- **Headings**: Bold, tight tracking (`-0.02em`)
- **Body**: Regular, `0.01em` tracking for readability
- **Labels**: Medium weight, uppercase, `0.05em` tracking

### Components

#### Glass Card
```
bg: rgba(255,255,255,0.03)
border: 1px solid rgba(255,255,255,0.08)
backdrop-filter: blur(20px)
border-radius: 20px
box-shadow: 0 8px 32px rgba(0,0,0,0.3)
```

#### Neon Button (Primary)
```
bg: #FFD600
color: #0A0A0F
border-radius: 16px
font-weight: 600
box-shadow: 0 0 20px rgba(255,214,0,0.3), 0 4px 12px rgba(0,0,0,0.2)
hover: box-shadow: 0 0 30px rgba(255,214,0,0.5), 0 6px 16px rgba(0,0,0,0.3)
transform: translateY(-1px)
```

#### Ghost Button
```
bg: transparent
border: 1px solid rgba(255,255,255,0.15)
color: #FFFFFF
border-radius: 16px
hover: bg rgba(255,255,255,0.08)
```

#### Bottom Navigation
```
bg: rgba(10,10,15,0.85)
backdrop-filter: blur(20px)
border-top: 1px solid rgba(255,255,255,0.08)
border-radius: 24px 24px 0 0 (top rounded)
```

#### Input Field (Futuristic)
```
bg: rgba(255,255,255,0.05)
border: 1px solid rgba(255,255,255,0.1)
border-radius: 16px
color: #FFFFFF
focus: border-color #FFD600, box-shadow 0 0 12px rgba(255,214,0,0.2)
```

### Animations
- **Page transitions**: Fade + slide up, 300ms ease-out
- **Card hover**: `transform: translateY(-4px)`, glow intensifies
- **Button press**: Scale 0.96, 100ms
- **Skeleton loading**: Shimmer gradient `linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)`
- **Pulse neon**: `animation: pulse 2s infinite` on status indicators

## Page Inventory

### Client Pages (to redesign/create)
1. **`/`** — Home / Restaurant discovery (redesign)
2. **`/restaurants`** — Restaurant list (redesign)
3. **`/restaurant/[id]`** — Restaurant detail + menu (redesign)
4. **`/cart`** — Shopping cart (redesign)
5. **`/checkout`** — Checkout flow (redesign)
6. **`/order-success`** — Confirmation (redesign)
7. **`/orders`** — Order history list (CREATE)
8. **`/orders/[id]`** — Order detail + tracking (redesign)
9. **`/tracking`** — Live delivery tracking (CREATE)
10. **`/login`** — Phone OTP login (CREATE)
11. **`/profile`** — User profile (redesign)
12. **`/profile/addresses`** — Address management (redesign)

### Admin Pages (to redesign)
13. **`/admin/dashboard`** — Admin overview (redesign)
14. **`/admin/orders`** — Order management (redesign)
15. **`/admin/menu`** — Menu editor (redesign)
16. **`/admin/analytics`** — Business analytics (redesign)
17. **`/admin/restaurants`** — Restaurant management (CREATE)
18. **`/admin/settings`** — Platform settings (CREATE)

### Shared Components (to redesign)
- `FloatingCartBar` → Glass floating bar with neon badge
- `BottomNav` → Rounded glass dock with active neon indicator
- `AddressCard` → Glass card with map preview
- `OrderCard` / `OrderKanban` → Glass cards with status neon glow

## Key UX Patterns

### Yango Inspirations
- **Bold yellow CTAs** on dark background for maximum contrast
- **Rounded everything** (buttons 16px, cards 20px, inputs 16px)
- **Bottom sheet** interactions for filters/details
- **Minimal text** — icons + short labels

### UberEats Inspirations
- **Hero image** at top of restaurant page with gradient overlay
- **Horizontal scroll** categories like UberEats cuisine pills
- **Sticky cart summary** at bottom
- **Clean hierarchy**: image → name → rating → price → CTA

## Responsive Strategy
- **Mobile-first** (primary target: Cameroon smartphones)
- Max-width container on desktop: `max-w-md mx-auto` with dark background bleeding to edges
- Touch targets: minimum 48×48px

## Performance
- Lazy load images with blur-up placeholder
- Reduce motion support: `@media (prefers-reduced-motion: reduce)`
- CSS-only animations where possible (no JS animation libraries)
