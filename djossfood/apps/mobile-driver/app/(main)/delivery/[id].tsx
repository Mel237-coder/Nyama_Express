import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { Order } from '@djossfood/database';
import api from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { useDeliveryStore } from '../../../stores/deliveryStore';
import { usePickupDelivery, useDeliverOrder } from '../../../hooks/useDeliveries';
import ActiveDeliveryMap from '../../../components/ActiveDeliveryMap';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { FontSizes } from '../../../constants/typography';
import { FontWeights } from '../../../constants/typography';

function geoJsonToLatLn(geoJson: { type: 'Point'; coordinates: [number, number] } | null) {
  if (!geoJson) return null;
  // GeoJSON coordinates are [longitude, latitude]
  return { lat: geoJson.coordinates[1], lng: geoJson.coordinates[0] };
}

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { driver } = useAuthStore();
  const { setActiveOrderId } = useDeliveryStore();
  const pickupMutation = usePickupDelivery();
  const deliverMutation = useDeliverOrder();

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ['activeDelivery', id],
    queryFn: async () => {
      const response = await api.get(`/api/orders/${id}`);
      return response.data;
    },
    refetchInterval: 5000,
    enabled: !!id,
  });

  // Derive locations from order data
  const deliveryLocation = order?.delivery_location
    ? geoJsonToLatLn(order.delivery_location)
    : null;

  const driverLocation = driver?.current_location
    ? geoJsonToLatLn(driver.current_location)
    : null;

  // For restaurant location, we need to fetch from order's restaurant relationship
  // The API might return the restaurant data embedded. For now, we attempt to use
  // any restaurant_location field that may come with the order detail response.
  const orderAny = order as Order & { restaurant_location?: { type: 'Point'; coordinates: [number, number] } } | null;
  const restaurantLoc = orderAny?.restaurant_location
    ? geoJsonToLatLn(orderAny.restaurant_location)
    : null;

  const routePolyline = order?.route_polyline ?? null;

  const handlePickup = () => {
    if (id) {
      pickupMutation.mutate(id);
    }
  };

  const handleDeliver = () => {
    if (id) {
      deliverMutation.mutate(id);
    }
  };

  const handleGoHome = () => {
    setActiveOrderId(null);
    router.replace('/(main)');
  };

  const openNavigation = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryOrange} />
        <Text style={styles.loadingText}>Chargement de la commande...</Text>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Impossible de charger la commande</Text>
        <Button title="Retour" onPress={handleGoHome} variant="outline" />
      </View>
    );
  }

  const orderStatus = order.status;

  const renderActionButton = () => {
    switch (orderStatus) {
      case 'driver_assigned':
        return (
          <Button
            title="Confirmer le ramassage"
            onPress={handlePickup}
            variant="primary"
            loading={pickupMutation.isPending}
            disabled={pickupMutation.isPending}
          />
        );
      case 'picked_up':
      case 'delivering':
        return (
          <Button
            title="Confirmer la livraison"
            onPress={handleDeliver}
            variant="orange"
            loading={deliverMutation.isPending}
            disabled={deliverMutation.isPending}
          />
        );
      case 'delivered':
      case 'completed':
      case 'cancelled':
      case 'rejected':
        return (
          <Button
            title="Retour à l'accueil"
            onPress={handleGoHome}
            variant="primary"
          />
        );
      default:
        return (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={Colors.primaryOrange} />
            <Text style={styles.waitingText}>En attente de mise à jour...</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Map section — top 60% */}
      <View style={styles.mapContainer}>
        <ActiveDeliveryMap
          restaurantLocation={restaurantLoc}
          deliveryLocation={deliveryLocation}
          driverLocation={driverLocation}
          routePolyline={routePolyline}
        />
      </View>

      {/* Details section — bottom 40%, scrollable */}
      <ScrollView
        style={styles.detailsContainer}
        contentContainerStyle={styles.detailsContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Commande #{order.order_number}</Text>
          </View>

          {/* Pickup address */}
          <View style={styles.addressSection}>
            <View style={styles.addressRow}>
              <View style={[styles.dot, styles.dotGreen]} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>Retrait</Text>
                <Text style={styles.addressText}>
                  {(order as any).restaurant?.name ?? 'Restaurant'}
                </Text>
              </View>
              {restaurantLoc && (
                <Text
                  style={styles.navigateLink}
                  onPress={() => openNavigation(restaurantLoc.lat, restaurantLoc.lng)}
                >
                  Naviguer
                </Text>
              )}
            </View>
          </View>

          {/* Delivery address */}
          <View style={styles.addressSection}>
            <View style={styles.addressRow}>
              <View style={[styles.dot, styles.dotOrange]} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>Livraison</Text>
                <Text style={styles.addressText}>{order.delivery_address}</Text>
              </View>
              {deliveryLocation && (
                <Text
                  style={styles.navigateLink}
                  onPress={() => openNavigation(deliveryLocation.lat, deliveryLocation.lng)}
                >
                  Naviguer
                </Text>
              )}
            </View>
          </View>

          {/* Delivery notes */}
          {order.delivery_notes ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes de livraison</Text>
              <Text style={styles.notesText}>{order.delivery_notes}</Text>
            </View>
          ) : null}

          {/* Total amount */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{order.total_amount.toLocaleString()} FCFA</Text>
          </View>
        </Card>

        {/* Action button */}
        <View style={styles.actionContainer}>
          {renderActionButton()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  mapContainer: {
    height: '60%',
  },
  detailsContainer: {
    flex: 1,
  },
  detailsContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: 'center',
  },
  orderCard: {
    gap: Spacing.md,
  },
  orderHeader: {
    marginBottom: Spacing.xs,
  },
  orderNumber: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  addressSection: {
    paddingVertical: Spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotGreen: {
    backgroundColor: Colors.primaryGreen,
  },
  dotOrange: {
    backgroundColor: Colors.primaryOrange,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  addressText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    color: Colors.textPrimary,
  },
  navigateLink: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.primaryOrange,
  },
  notesSection: {
    backgroundColor: Colors.bg,
    borderRadius: Spacing.md,
    padding: Spacing.md,
  },
  notesLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  notesText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.primaryGreen,
  },
  actionContainer: {
    marginTop: Spacing.sm,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  waitingText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
});