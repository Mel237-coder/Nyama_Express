import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { startLocationUpdates, stopLocationUpdates } from '../services/location';
import { connectSocket, disconnectSocket, joinRoom } from '../services/socket';
import type { Driver } from '@djossfood/database';

interface DriverProfileResponse {
  driver: Driver;
}

interface EarningsResponse {
  total: number;
  today: number;
  week: number;
  month: number;
}

export function useDriverProfile() {
  const { driver } = useAuthStore();

  return useQuery<Driver>({
    queryKey: ['driverProfile'],
    queryFn: async () => {
      const response = await api.get<DriverProfileResponse>('/api/drivers/me');
      return response.data.driver ?? response.data;
    },
    initialData: driver ?? undefined,
    enabled: !!driver,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleOnline() {
  const queryClient = useQueryClient();
  const { driver, setDriver } = useAuthStore();
  const { goOnline, goOffline } = useDeliveryStore();

  return useMutation({
    mutationFn: async (goOnlineFlag: boolean) => {
      const status = goOnlineFlag ? 'available' : 'offline';
      const response = await api.put<Driver>('/api/drivers/me/status', { status });
      return response.data;
    },
    onSuccess: (data, goOnlineFlag) => {
      setDriver(data);

      if (goOnlineFlag) {
        goOnline();
        startLocationUpdates();
        connectSocket();
        if (data.id) {
          joinRoom(`driver_${data.id}`);
        }
      } else {
        goOffline();
        stopLocationUpdates();
        disconnectSocket();
      }

      queryClient.invalidateQueries({ queryKey: ['driverProfile'] });
    },
    onError: (error) => {
      console.error('[useToggleOnline] Error toggling status:', error);
    },
  });
}

export function useDriverEarnings() {
  return useQuery<EarningsResponse>({
    queryKey: ['driverEarnings'],
    queryFn: async () => {
      const response = await api.get<EarningsResponse>('/api/driver-owner/earnings');
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}