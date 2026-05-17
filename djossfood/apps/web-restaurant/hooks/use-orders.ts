import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import {
  connectSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  onEvent,
  offEvent,
  getSocket,
} from '@/lib/socket';
import { useRestaurantContext } from '@/contexts/restaurant-context';
import type { Order, OrderItem, OrderStatus } from '@djossfood/database';

const COMPLETED_STATUSES: OrderStatus[] = [
  'delivered',
  'completed',
  'cancelled',
  'rejected',
];

type OrderWithItems = Order & { order_items: OrderItem[] };

interface OrdersResponse {
  orders: OrderWithItems[];
}

export function useOrders() {
  const { restaurant } = useRestaurantContext();
  const queryClient = useQueryClient();
  const queryKey = ['orders', restaurant.id];
  const soundRef = useRef<HTMLAudioElement | null>(null);

  const query = useQuery<OrdersResponse>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get('/api/restaurant-owner/orders');
      return data;
    },
    refetchInterval: 30000,
  });

  // Socket.IO real-time updates
  useEffect(() => {
    const roomId = `restaurant_${restaurant.id}`;
    connectSocket();

    const handleNewOrder = () => {
      // Play notification sound if tab is not focused
      if (typeof document !== 'undefined' && document.hidden) {
        if (!soundRef.current) {
          soundRef.current = new Audio('/sounds/notification.mp3');
        }
        soundRef.current.play().catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey });
    };

    const handleStatusChange = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    const handleConnect = () => {
      joinRoom(roomId);
    };

    onEvent('connect', handleConnect);
    onEvent('new_order', handleNewOrder);
    onEvent('order_status_changed', handleStatusChange);

    // If already connected, join the room immediately
    const s = getSocket();
    if (s.connected) {
      joinRoom(roomId);
    }

    return () => {
      leaveRoom(roomId);
      offEvent('connect', handleConnect);
      offEvent('new_order', handleNewOrder);
      offEvent('order_status_changed', handleStatusChange);
      disconnectSocket();
    };
  }, [restaurant.id, queryClient]);

  const orders = query.data?.orders ?? [];

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const completedOrders = orders.filter((o) =>
    COMPLETED_STATUSES.includes(o.status),
  );

  return {
    orders,
    pendingOrders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/confirm`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { data } = await api.post(`/api/orders/${orderId}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useMarkReady() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/api/orders/${orderId}/ready`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}