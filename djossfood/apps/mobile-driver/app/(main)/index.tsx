import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useAuthStore } from '../../stores/authStore';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useToggleOnline } from '../../hooks/useDriver';
import { useDriverEarnings } from '../../hooks/useDriver';
import { getCurrentPosition } from '../../services/location';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DeliveryRequestSheet from '../../components/DeliveryRequestSheet';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

const DOUALA_REGION: Region = {
  latitude: 4.0511,
  longitude: 9.7679,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

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

  const todayEarnings = earnings?.today ?? 0;

  const handleToggleOnline = () => {
    toggleOnlineMutation.mutate(!isOnline);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={DOUALA_REGION}
        showsUserLocation={isOnline}
        showsMyLocationButton={isOnline}
        region={
          driverLocation && isOnline
            ? {
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }
            : undefined
        }
      >
        {isOnline && driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title={driver?.vehicle_type === 'moto' ? 'Moto' : 'Voiture'}
            description="Votre position"
            pinColor={Colors.primaryGreen}
          />
        )}
      </MapView>

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
                Aujourd'hui: {todayEarnings.toLocaleString()} FCFA | 0 courses
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