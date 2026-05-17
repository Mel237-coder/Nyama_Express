import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useDeliveryStore } from '../stores/deliveryStore';

export function useAcceptDelivery() {
  const queryClient = useQueryClient();
  const { dismissRequest, setActiveOrderId } = useDeliveryStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(`/api/orders/${orderId}/accept`);
      return response.data;
    },
    onSuccess: (_data, orderId) => {
      dismissRequest();
      setActiveOrderId(orderId);
      queryClient.invalidateQueries({ queryKey: ['activeDelivery'] });
      queryClient.invalidateQueries({ queryKey: ['driverEarnings'] });
    },
    onError: (error) => {
      console.error('[useAcceptDelivery] Error accepting delivery:', error);
    },
  });
}

export function useRejectDelivery() {
  const { dismissRequest } = useDeliveryStore();

  return useMutation({
    mutationFn: async (_orderId: string) => {
      // No explicit reject endpoint — request auto-expires
      // We just dismiss it locally
      return Promise.resolve();
    },
    onSuccess: () => {
      dismissRequest();
    },
  });
}

export function usePickupDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(`/api/orders/${orderId}/pickup`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeDelivery'] });
    },
    onError: (error) => {
      console.error('[usePickupDelivery] Error picking up delivery:', error);
    },
  });
}

export function useDeliverOrder() {
  const queryClient = useQueryClient();
  const { setActiveOrderId } = useDeliveryStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(`/api/orders/${orderId}/deliver`);
      return response.data;
    },
    onSuccess: () => {
      setActiveOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['activeDelivery'] });
      queryClient.invalidateQueries({ queryKey: ['driverEarnings'] });
      queryClient.invalidateQueries({ queryKey: ['driverProfile'] });
    },
    onError: (error) => {
      console.error('[useDeliverOrder] Error delivering order:', error);
    },
  });
}