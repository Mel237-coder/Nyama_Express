import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useOrders } from '../../hooks/useOrders';
import Badge from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import type { OrderStatus } from '@djossfood/database';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'En attente', variant: 'warning' },
  confirmed: { label: 'Confirmée', variant: 'info' },
  preparing: { label: 'En préparation', variant: 'info' },
  ready: { label: 'Prête', variant: 'info' },
  driver_assigned: { label: 'Livreur assigné', variant: 'info' },
  picked_up: { label: 'Récupérée', variant: 'info' },
  delivering: { label: 'En livraison', variant: 'info' },
  delivered: { label: 'Livrée', variant: 'success' },
  completed: { label: 'Terminée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'error' },
  rejected: { label: 'Refusée', variant: 'error' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export default function OrdersScreen() {
  const { data: orders, isLoading } = useOrders();

  const handleOrderPress = useCallback((orderId: string) => {
    router.push(`/order/${orderId}` as any);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const statusConfig = STATUS_CONFIG[item.status] ?? {
        label: item.status,
        variant: 'neutral' as BadgeVariant,
      };

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleOrderPress(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardTop}>
            <Text style={styles.orderNumber}>#{item.order_number}</Text>
            <Badge label={statusConfig.label} variant={statusConfig.variant} />
          </View>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          <Text style={styles.amount}>{formatAmount(item.total_amount)}</Text>
        </TouchableOpacity>
      );
    },
    [handleOrderPress],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune commande pour le moment</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes commandes</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  separator: {
    height: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.lg,
    padding: Spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orderNumber: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.primaryGreen,
  },
});