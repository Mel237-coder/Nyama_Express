import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';
import { useDeliveryStore } from '../stores/deliveryStore';
import { useAcceptDelivery, useRejectDelivery } from '../hooks/useDeliveries';

const DeliveryRequestSheet: React.FC = () => {
  const { isRequestVisible, deliveryRequest, dismissRequest } = useDeliveryStore();
  const acceptMutation = useAcceptDelivery();
  const rejectMutation = useRejectDelivery();

  if (!isRequestVisible || !deliveryRequest) {
    return null;
  }

  const handleAccept = () => {
    acceptMutation.mutate(deliveryRequest.orderId);
  };

  const handleReject = () => {
    rejectMutation.mutate(deliveryRequest.orderId);
  };

  const handleClose = () => {
    dismissRequest();
  };

  return (
    <Sheet visible={isRequestVisible} onClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Badge label="Nouvelle course" variant="info" />
          <Text style={styles.timerText}>30s</Text>
        </View>

        <Text style={styles.restaurantName}>{deliveryRequest.restaurantName}</Text>

        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <View style={[styles.dot, styles.dotGreen]} />
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Retrait</Text>
            <Text style={styles.addressText}>{deliveryRequest.pickupAddress}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <View style={[styles.dot, styles.dotOrange]} />
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Livraison</Text>
            <Text style={styles.addressText}>{deliveryRequest.deliveryAddress}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{deliveryRequest.distanceKm.toFixed(1)} km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Gains</Text>
            <Text style={styles.earningsValue}>{deliveryRequest.earnings.toLocaleString()} FCFA</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Accepter"
            onPress={handleAccept}
            variant="primary"
            loading={acceptMutation.isPending}
            disabled={acceptMutation.isPending || rejectMutation.isPending}
          />
          <View style={styles.spacer} />
          <Button
            title="Refuser"
            onPress={handleReject}
            variant="danger"
            loading={rejectMutation.isPending}
            disabled={acceptMutation.isPending || rejectMutation.isPending}
          />
        </View>
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  restaurantName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
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
  addressContainer: {
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.bg,
    borderRadius: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  earningsValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.primaryGreen,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  actions: {
    marginTop: Spacing.md,
  },
  spacer: {
    height: Spacing.md,
  },
});

export default DeliveryRequestSheet;