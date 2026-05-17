import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRestaurantContext } from '@/contexts/restaurant-context';
import type { MenuItem } from '@djossfood/database';

interface MenuData {
  menu: Array<{
    id: string | null;
    name: string;
    description: string | null;
    sort_order: number;
    items: MenuItem[];
  }>;
}

export function useMenu() {
  const { restaurant } = useRestaurantContext();
  const queryClient = useQueryClient();
  const queryKey = ['menu', restaurant.id];

  const query = useQuery<MenuData>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurants/${restaurant.id}/menu`);
      return data;
    },
  });

  return {
    ...query,
    menu: query.data?.menu ?? [],
    queryKey,
  };
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; sort_order?: number }) => {
      const { data: result } = await api.post('/api/restaurant-owner/menu-categories', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; sort_order?: number; is_active?: boolean }) => {
      const { data: result } = await api.put(`/api/restaurant-owner/menu-categories/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/restaurant-owner/menu-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      price: number;
      category_id?: string;
      image_url?: string;
      tags?: string[];
      is_available?: boolean;
    }) => {
      const { data: result } = await api.post('/api/restaurant-owner/menu-items', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      name?: string;
      description?: string;
      price?: number;
      category_id?: string;
      image_url?: string;
      tags?: string[];
      is_available?: boolean;
    }) => {
      const { data: result } = await api.put(`/api/restaurant-owner/menu-items/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/restaurant-owner/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}