# Restaurant Detail & Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the restaurant detail page, menu categorization, item customization via modals, and a floating cart bar.

**Architecture:** Use Next.js dynamic routing for restaurant pages. State for the cart is managed via the existing `useCart` hook. UI components are built with Tailwind CSS for a mobile-first experience.

**Tech Stack:** Next.js 14, React, Tailwind CSS, Lucide React (for icons).

---

## File Structure

- Create: `apps/web/src/pages/restaurant/[id].tsx` - Main page component.
- Create: `apps/web/src/components/restaurant/RestaurantHero.tsx` - Top section with image, logo, and basic info.
- Create: `apps/web/src/components/restaurant/RestaurantInfo.tsx` - Expandable details section.
- Create: `apps/web/src/components/restaurant/MenuCategoryNav.tsx` - Sticky category selector.
- Create: `apps/web/src/components/restaurant/MenuItem.tsx` - Individual menu item card.
- Create: `apps/web/src/components/restaurant/ItemCustomizerModal.tsx` - Modal for options and quantity.
- Create: `apps/web/src/components/layout/FloatingCartBar.tsx` - Sticky cart summary and checkout trigger.

---

### Task 1: Layout & Routing

**Files:**
- Create: `apps/web/src/pages/restaurant/[id].tsx`

- [ ] **Step 1: Create the dynamic page shell**

```tsx
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useCart } from '../../hooks/useCart';

export default function RestaurantPage() {
  const router = useRouter();
  const { id } = router.query;
  const { restaurantId: cartRestaurantId, clearCart } = useCart();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    // Guard: Check if cart contains items from another restaurant
    if (cartRestaurantId && cartRestaurantId !== id) {
      if (confirm('Your cart contains items from another restaurant. Clear cart to order from here?')) {
        clearCart();
      } else {
        router.push('/');
      }
    }

    const fetchRestaurant = async () => {
      try {
        const data = await api.getRestaurantById(id as string);
        setRestaurant(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!restaurant) return <div className="p-4 text-center">Restaurant not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
       {/* Components will be inserted here */}
       <h1 className="p-4 text-2xl font-bold">{restaurant.name}</h1>
    </div>
  );
}
```

- [ ] **Step 2: Run and verify page loads with a valid ID**
- [ ] **Step 3: Commit**

---

### Task 2: Restaurant Hero & Info

**Files:**
- Create: `apps/web/src/components/restaurant/RestaurantHero.tsx`
- Create: `apps/web/src/components/restaurant/RestaurantInfo.tsx`
- Modify: `apps/web/src/pages/restaurant/[id].tsx`

- [ ] **Step 1: Implement RestaurantHero**

```tsx
import { formatPrice } from '../../lib/i18n';

export function RestaurantHero({ restaurant }: { restaurant: any }) {
  return (
    <div className="relative h-64 w-full">
      <img 
        src={restaurant.coverImage || 'https://via.placeholder.com/800x400'} 
        className="w-full h-full object-cover" 
        alt={restaurant.name} 
      />
      <div className="absolute -bottom-8 left-4">
        <img 
          src={restaurant.logo || 'https://via.placeholder.com/100'} 
          className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover" 
          alt="logo" 
        />
      </div>
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold shadow">
        🚀 {formatPrice(restaurant.deliveryFee)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement RestaurantInfo (Expandable)**

```tsx
import { useState } from 'react';

export function RestaurantInfo({ restaurant }: { restaurant: any }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="px-4 pt-10 pb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
        <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-1 rounded text-sm font-bold">
          ⭐ {restaurant.avgRating}
        </div>
      </div>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-orange-500 text-sm font-medium underline"
      >
        {isOpen ? 'Hide info' : 'Restaurant info'}
      </button>
      {isOpen && (
        <div className="mt-2 p-3 bg-white rounded-lg text-sm text-gray-600 shadow-sm">
          <p className="mb-2">{restaurant.description}</p>
          <p className="font-bold text-gray-800">📍 {restaurant.address}</p>
          <p>🕒 Open: 09:00 - 22:00</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Integrate into [id].tsx**
- [ ] **Step 4: Commit**

---

### Task 3: Menu Categories and Listing

**Files:**
- Create: `apps/web/src/components/restaurant/MenuCategoryNav.tsx`
- Create: `apps/web/src/components/restaurant/MenuItem.tsx`
- Modify: `apps/web/src/pages/restaurant/[id].tsx`

- [ ] **Step 1: Implement MenuCategoryNav**

```tsx
export function MenuCategoryNav({ categories, onSelect }: { categories: any[], onSelect: (id: string) => void }) {
  return (
    <div className="sticky top-0 z-20 bg-gray-50 overflow-x-auto flex gap-2 p-4 border-b border-gray-200">
      {categories.map(cat => (
        <button 
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="px-4 py-1 rounded-full bg-white border border-gray-200 text-sm whitespace-nowrap active:bg-orange-500 active:text-white"
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement MenuItem card**

```tsx
export function MenuItem({ item, onAdd }: { item: any, onAdd: (item: any) => void }) {
  return (
    <div className="flex gap-4 p-4 bg-white mb-2 rounded-xl shadow-sm border border-gray-100">
      <div className="flex-1">
        <h4 className="font-bold text-gray-900">{item.name}</h4>
        <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
        <p className="mt-2 font-bold text-orange-600">{item.price} FCFA</p>
      </div>
      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
        <img src={item.image || 'https://via.placeholder.com/80'} className="w-full h-full object-cover" />
      </div>
      <button 
        onClick={() => onAdd(item)}
        className="absolute right-2 bottom-2 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold"
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Integrate listing logic in [id].tsx**
- [ ] **Step 4: Commit**

---

### Task 4: Item Customizer Modal

**Files:**
- Create: `apps/web/src/components/restaurant/ItemCustomizerModal.tsx`
- Modify: `apps/web/src/pages/restaurant/[id].tsx`

- [ ] **Step 1: Implement the Modal logic**

```tsx
import { useState } from 'react';
import { formatPrice } from '../../lib/i18n';

export function ItemCustomizerModal({ item, onClose, onAddToCart }: { item: any, onClose: () => void, onAddToCart: (details: any) => void }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState('');

  const total = (item.price + (selectedOption ? 100 : 0)) * quantity;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">{item.name}</h3>
          <button onClick={onClose} className="text-gray-400 text-2xl">&times;</button>
        </div>
        
        <div className="mb-6">
          <p className="text-sm font-bold mb-2 text-gray-700">Choose Size (Required)</p>
          <div className="flex gap-2">
            {['Small', 'Large'].map(s => (
              <button 
                key={s} 
                onClick={() => setSelectedOption(s)}
                className={`px-4 py-2 rounded-lg border ${selectedOption === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <span className="text-gray-600">Quantity</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-gray-100 font-bold">-</button>
            <span className="font-bold">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full bg-gray-100 font-bold">+</button>
          </div>
        </div>

        <button 
          disabled={!selectedOption}
          onClick={() => onAddToCart({ item, quantity, option: selectedOption })}
          className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold disabled:bg-gray-300"
        >
          Add to Cart — {formatPrice(total)}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire up modal state in [id].tsx**
- [ ] **Step 3: Commit**

---

### Task 5: Floating Cart Bar

**Files:**
- Create: `apps/web/src/components/layout/FloatingCartBar.tsx`
- Modify: `apps/web/src/pages/_app.tsx`

- [ ] **Step 1: Implement FloatingCartBar**

```tsx
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../lib/i18n';
import Link from 'next/link';

export function FloatingCartBar() {
  const { items, total } = useCart();
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <Link href="/cart" className="flex justify-between items-center p-4 bg-orange-600 text-white rounded-2xl shadow-xl font-bold animate-bounce-subtle">
        <div className="flex items-center gap-2">
          <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs">{items.length}</span>
          <span>View Cart</span>
        </div>
        <span>{formatPrice(total)} FCFA</span>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Add to _app.tsx**
- [ ] **Step 3: Commit**
