import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AdminNotification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(page: number) {
  return useQuery<{ notifications: AdminNotification[]; total: number }>({
    queryKey: ['admin-notifications', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '30' });
      const { data } = await api.get(`/api/admin/notifications?${params.toString()}`);
      return data;
    },
    staleTime: 15_000,
  });
}