import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useOrder, useConfirmDelivery, useSubmitRating } from '../../hooks/useOrders';
import { useOrderStore } from '../../stores/orderStore';
import OrderTimeline from '../../components/OrderTimeline';
import DriverMap from '../../components/DriverMap';
import RatingModal from '../../components/RatingModal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import type { OrderStatus } from '@djossfood/database';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  preparing: 'En preparation',
  ready: 'Prette',
  driver_assigned: 'Livreur assigne',
  picked_up: 'Recuperee',
  delivering: 'En livraison',
  delivered: 'Livree',
  completed: 'Terminee',
  cancelled: 'Annulee',
  rejected: 'Rejetee',
};

const STATUS_VARIANTS: Record<OrderStatus, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'info',
  driver_assigned: 'info',
  picked_up: 'info',
  delivering: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'error',
  rejected: 'error',
};

const DRIVER_ACTIVE_STATUSES: OrderStatus[] = [
  'driver_assigned',
  'picked_up',
  'delivering',
];

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: fetchedOrder, isLoading, error } = useOrder(id);
  const confirmDelivery = useConfirmDelivery();
  const submitRating = useSubmitRating();

  const storeOrder = useOrderStore((s) => s.currentOrder);
  const subscribeToOrder = useOrderStore((s) => s.subscribeToOrder);
  const unsubscribeFromOrder = useOrderStore((s) => s.unsubscribeFromOrder);

  const [showRating, setShowRating] = useState(false);

  // Use store order for real-time updates, fall back to fetched order
  const order = storeOrder?.id === id ? storeOrder : fetchedOrder;

  // Subscribe to real-time order updates
  useEffect(() => {
    if (id) {
      subscribeToOrder(id);
    }
    return () => {
      if (id) {
        unsubscribeFromOrder(id);
      }
    };
  }, [id]);

  // Build timestamps map from order fields
  const timestamps: Record<string, string | null> = order
    ? {
        pending: order.created_at,
        confirmed: order.confirmed_at,
        preparing: order.preparing_started_at,
        ready: order.ready_at,
        driver_assigned: order.driver_assigned_at,
        picked_up: order.picked_up_at,
        delivering: order.driver_assigned_at, // approximate
        delivered: order.delivered_at,
        completed: order.completed_at,
      }
    : {};

  const showDriverMap =
    order && DRIVER_ACTIVE_STATUSES.includes(order.status);

  const canConfirmDelivery =
    order && order.status === 'delivered' && !order.client_confirmed_delivery;

  // Extract locations for the map
  const restaurantLocation = order?.route_polyline
    ? null // Would need restaurant location from order data
    : null;

  const deliveryLocation = order?.delivery_location
    ? {
        lat: order.delivery_location.coordinates[1],
        lng: order.delivery_location.coordinates[0],
      }
    : null;

  const driverLocation = (order as any)?._driverLocation
    ? {
        lat: (order as any)._driverLocation.lat,
        lng: (order as any)._driverLocation.lng,
        timestamp: (order as any)._driverLocation.timestamp,
      }
    : null;

  const handleConfirmDelivery = () => {
    if (!id) return;

    confirmDelivery.mutate(id, {
      onSuccess: () => {
        Alert.alert('Confirmation', 'Livraison confirmee ! Merci.');
        setShowRating(true);
      },
      onError: (err: any) => {
        Alert.alert(
          'Erreur',
          err?.response?.data?.error || err?.message || 'Impossible de confirmer la livraison.',
        );
      },
    });
  };

  const handleRatingSubmit = (ratings: {
    restaurant_rating: number;
    driver_rating?: number;
    restaurant_comment?: string;
    driver_comment?: string;
  }) => {
    if (!id) return;

    submitRating.mutate(
      { order_id: id, ...ratings },
      {
        onSuccess: () => {
          setShowRating(false);
          Alert.alert('Merci !', 'Votre evaluation a ete envoyee.');
        },
        onError: () => {
          Alert.alert('Erreur', "Impossible d'envoyer l'evaluation. Veuillez reessayer.");
        },
      },
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
        <Text style={styles.loadingText}>Chargement de la commande...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorSubtitle}>
          Impossible de charger les details de la commande.
        </Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  // Empty / no order state
  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>📦</Text>
        <Text style={styles.errorTitle}>Commande introuvable</Text>
        <Text style={styles.errorSubtitle}>
          Cette commande n'existe pas ou a ete supprimee.
        </Text>
        <Button title="Retour a l'accueil" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusVariant = STATUS_VARIANTS[order.status] || 'neutral';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commande {order.order_number}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status badge */}
        <View style={styles.statusSection}>
          <Badge label={statusLabel} variant={statusVariant} />
          <Text style={styles.orderAmount}>
            {order.total_amount.toLocaleString('fr-FR')} FCFA
          </Text>
        </View>

        {/* Driver map (shown when driver is active) */}
        {showDriverMap && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suivi du livreur</Text>
            <DriverMap
              restaurantLocation={restaurantLocation}
              deliveryLocation={deliveryLocation}
              driverLocation={driverLocation}
              routePolyline={order.route_polyline}
            />
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suivi de la commande</Text>
          <OrderTimeline
            currentStatus={order.status}
            timestamps={timestamps}
          />
        </View>

        {/* Confirm delivery button */}
        {canConfirmDelivery && (
          <View style={styles.confirmSection}>
            <Button
              title="Confirmer la reception"
              onPress={handleConfirmDelivery}
              loading={confirmDelivery.isPending}
              style={styles.confirmButton}
            />
          </View>
        )}
      </ScrollView>

      {/* Rating modal */}
      <RatingModal
        visible={showRating}
        onClose={() => setShowRating(false)}
        restaurantName="" // Will be populated when order data includes restaurant name
        hasDriver={!!order.driver_id}
        onSubmit={handleRatingSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xxl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  errorSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Spacing.md,
  },
  backButtonText: {
    fontSize: FontSizes.md,
    color: Colors.primaryGreen,
    fontWeight: FontWeights.bold,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  statusSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  orderAmount: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  section: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  confirmSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  confirmButton: {
    width: '100%',
  },
});