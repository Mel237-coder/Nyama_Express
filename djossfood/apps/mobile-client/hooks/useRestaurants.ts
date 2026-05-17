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