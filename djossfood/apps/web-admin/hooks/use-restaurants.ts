import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Restaurant } from '@djossfood/database';

export function useRestaurants() {
  return useQuery<{ restaurants: Restaurant[] }>({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/restaurants');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useBoostRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, boost, reason }: { id: string; boost: number; reason: string }) => {
      const { data } = await api.put(`/api/admin/restaurants/${id}/boost`, { boost, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
    },
  });
}

export function useApproveRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const { data } = await api.put(`/api/admin/restaurants/${id}/approve`, { is_approved: isApproved });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
    },
  });
}