'use client';

import { createContext, useContext } from 'react';
import type { Restaurant } from '@djossfood/database';

interface RestaurantContextType {
  restaurant: Restaurant;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export function RestaurantProvider({
  restaurant,
  children,
}: {
  restaurant: Restaurant;
  children: React.ReactNode;
}) {
  return (
    <RestaurantContext.Provider value={{ restaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurantContext() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurantContext must be used within a RestaurantProvider');
  }
  return context;
}