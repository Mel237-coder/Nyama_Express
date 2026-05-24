import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useDriverEarnings } from '../../hooks/useDriver';
import EarningsCard from '../../components/EarningsCard';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(value: number): string {
  return value.toLocaleString('fr-FR');
}

export default function EarningsScreen() {
  const { data, isLoading, refetch, isRefetching } = useDriverEarnings();

  if (isLoading) {
    return <LoadingSpinner message="Chargement des gains..." />;
  }

  const walletBalance = data?.wallet_balance ?? 0;
  const todayEarnings = data?.today_earnings ?? 0;
  const todayDeliveries = data?.today_deliveries ?? 0;
  const deliveries = data?.deliveries ?? [];

  const renderItem = ({ item }: { item: typeof deliveries[0] }) => (
    <Card style={styles.deliveryCard}>
      <View style={styles.deliveryRow}>
        <View style={styles.deliveryInfo}>
          <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
          <Text style={styles.deliveryDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.earningsAmount}>+{formatAmount(item.amount)} FCFA</Text>
      </View>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Aucune course terminee</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes gains</Text>
      </View>

      <EarningsCard
        walletBalance={walletBalance}
        todayEarnings={todayEarnings}
        todayDeliveries={todayDeliveries}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Historique des courses</Text>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          deliveries.length === 0 ? styles.emptyList : styles.deliveryList
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.primaryOrange]}
            tintColor={Colors.primaryOrange}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  deliveryList: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  deliveryCard: {
    marginBottom: Spacing.md,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  deliveryDate: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  earningsAmount: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
  },
});