import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Restaurant } from '@djossfood/database';

export function useRestaurant() {
  return useQuery<{ restaurant: Restaurant }>({
    queryKey: ['restaurant'],
    queryFn: async () => {
      const { data } = await api.get('/api/restaurant-owner/restaurant');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}