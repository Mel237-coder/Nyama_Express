'use client';

import { useRestaurants } from '@/hooks/use-restaurants';
import { RestaurantTable } from '@/components/restaurants/restaurant-table';

export default function RestaurantsPage() {
  const { data, isLoading } = useRestaurants();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.restaurants.length} restaurant{data.restaurants.length !== 1 ? 's' : ''}
        </p>
      </div>
      <RestaurantTable restaurants={data.restaurants} />
    </div>
  );
}