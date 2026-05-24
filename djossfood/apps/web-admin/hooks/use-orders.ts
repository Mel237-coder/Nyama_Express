import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Order } from '@djossfood/database';

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface OrdersResponse {
  orders: OrderWithItems[];
  total: number;
  page: number;
  limit: number;
}

export function useOrders(page: number, status?: string) {
  return useQuery<OrdersResponse>({
    queryKey: ['admin-orders', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (status) params.set('status', status);
      const { data } = await api.get(`/api/admin/orders?${params.toString()}`);
      return data;
    },
    staleTime: 15_000,
  });
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmee', className: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'En preparation', className: 'bg-blue-100 text-blue-800' },
  ready: { label: 'Prette', className: 'bg-orange-100 text-orange-800' },
  driver_assigned: { label: 'Livreur assigne', className: 'bg-purple-100 text-purple-800' },
  picked_up: { label: 'Recuperee', className: 'bg-cyan-100 text-cyan-800' },
  delivering: { label: 'En livraison', className: 'bg-amber-100 text-amber-800' },
  delivered: { label: 'Livree', className: 'bg-green-100 text-green-800' },
  completed: { label: 'Terminee', className: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Annulee', className: 'bg-red-100 text-red-800' },
  rejected: { label: 'Refusee', className: 'bg-red-100 text-red-800' },
};

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
}

export type { OrderWithItems };