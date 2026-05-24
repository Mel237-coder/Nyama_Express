import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface KpiData {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalRestaurants: number;
  totalDrivers: number;
  activeOrders: number;
  ordersByStatus: Record<string, number>;
  dailyRevenue: Array<{ date: string; revenue: number }>;
}

export function useKpis() {
  return useQuery<KpiData>({
    queryKey: ['admin-kpis'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/kpis');
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}