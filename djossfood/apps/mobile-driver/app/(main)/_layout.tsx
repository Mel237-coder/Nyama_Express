import { useEffect } from 'react';
import { Redirect, Slot } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { fetchDriverProfile } from '../../services/auth';
import { onEvent, offEvent } from '../../services/socket';
import { useDeliveryStore } from '../../stores/deliveryStore';

export default function MainLayout() {
  const { isAuthenticated, driver, isApproved } = useAuthStore();
  const { showRequest } = useDeliveryStore();

  const { isLoading } = useQuery({
    queryKey: ['driverProfile'],
    queryFn: async () => {
      const result = await fetchDriverProfile();
      if (result.error) throw new Error(result.error);
      return result.driver;
    },
    enabled: isAuthenticated && !driver,
    retry: 1,
  });

  useEffect(() => {
    const handleDeliveryRequest = (data: any) => {
      showRequest(data);
    };

    onEvent('delivery_request', handleDeliveryRequest);
    return () => {
      offEvent('delivery_request', handleDeliveryRequest);
    };
  }, [showRequest]);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!isApproved) {
    return <Redirect href="/(auth)/pending" />;
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
});