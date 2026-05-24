import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Order, PaymentMethod } from '@djossfood/database';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders');
      return data.orders as Order[];
    },
    staleTime: 15_000,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${id}`);
      return data.order as Order;
    },
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      restaurant_id: string;
      items: Array<{ menu_item_id: string; quantity: number; special_instructions?: string }>;
      delivery_address: string;
      delivery_lat: number;
      delivery_lng: number;
      payment_method: PaymentMethod;
      payment_phone: string;
      delivery_notes?: string;
    }) => {
      const { data } = await api.post('/api/orders', orderData);
      return data.order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/confirm-delivery`);
      return data;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useSubmitRating() {
  return useMutation({
    mutationFn: async (rating: {
      order_id: string;
      restaurant_rating: number;
      driver_rating?: number;
      restaurant_comment?: string;
      driver_comment?: string;
    }) => {
      const { data } = await api.post('/api/ratings', rating);
      return data;
    },
  });
}