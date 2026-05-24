import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface DriverWithProfile {
  id: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  current_location: any;
  status: string;
  rating: number;
  rating_count: number;
  total_deliveries: number;
  wallet_balance: number;
  is_approved: boolean;
  documents: Record<string, unknown>;
  created_at: string;
  profiles: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
}

export function useDrivers() {
  return useQuery<{ drivers: DriverWithProfile[] }>({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/drivers');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useApproveDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/api/admin/drivers/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
    },
  });
}

export function useDriverDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin-driver', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/drivers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export type { DriverWithProfile };