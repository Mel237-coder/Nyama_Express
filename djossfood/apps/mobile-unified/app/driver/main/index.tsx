import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useToggleOnline } from '@/hooks/useDriver';
import { useDriverEarnings } from '@/hooks/useDriver';
import { getCurrentPosition } from '@/services/location';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DeliveryRequestSheet from '@/components/driver/DeliveryRequestSheet';
import MainScreenMap from '@/components/driver/MainScreenMap';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { FontSizes } from '@/constants/typography';
import { FontWeights } from '@/constants/typography';

export default function HomeScreen() {
  const { driver } = useAuthStore();
  const { isOnline } = useDeliveryStore();
  const toggleOnlineMutation = useToggleOnline();
  const { data: earnings } = useDriverEarnings();
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (isOnline) {
      getCurrentPosition().then((location) => {
        if (location) {
          setDriverLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      });
    }
  }, [isOnline]);

  const todayEarnings = earnings?.today_earnings ?? 0;
  const todayDeliveries = earnings?.today_deliveries ?? 0;

  const handleToggleOnline = () => {
    toggleOnlineMutation.mutate(!isOnline);
  };

  return (
    <View style={styles.container}>
      <MainScreenMap
        driverLocation={driverLocation}
        isOnline={isOnline}
        vehicleType={driver?.vehicle_type}
      />

      <View style={styles.bottomCardContainer}>
        <Card style={styles.bottomCard}>
          {isOnline ? (
            <View style={styles.onlineContent}>
              <Badge label="En ligne" variant="success" />
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="small" color={Colors.primaryGreen} />
                <Text style={styles.waitingText}>En attente de course...</Text>
              </View>
              <Text style={styles.earningsText}>
                Aujourd'hui: {todayEarnings.toLocaleString()} FCFA
              </Text>
              <Button
                title="Passer hors ligne"
                onPress={handleToggleOnline}
                variant="outline"
                loading={toggleOnlineMutation.isPending}
                style={styles.offlineButton}
              />
            </View>
          ) : (
            <View style={styles.offlineContent}>
              <Text style={styles.offlineTitle}>Hors ligne</Text>
              <Text style={styles.offlineSubtitle}>
                Aujourd'hui: {todayEarnings.toLocaleString()} FCFA | {todayDeliveries} courses
              </Text>
              <Button
                title="Aller en ligne"
                onPress={handleToggleOnline}
                variant="primary"
                loading={toggleOnlineMutation.isPending}
                style={styles.goOnlineButton}
              />
            </View>
          )}
        </Card>
      </View>

      <DeliveryRequestSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  bottomCard: {
    marginBottom: Spacing.lg,
  },
  onlineContent: {
    gap: Spacing.md,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  waitingText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  earningsText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
  },
  offlineButton: {
    backgroundColor: 'transparent',
  },
  offlineContent: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  offlineTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  offlineSubtitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
  },
  goOnlineButton: {
    width: '100%',
  },
});