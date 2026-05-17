import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useCartStore } from '../stores/cartStore';
import CartItemRow from '../components/CartItemRow';
import Button from '../components/ui/Button';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { BorderRadii } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

export default function CartScreen() {
  const cartStore = useCartStore();
  const items = cartStore.items;
  const subtotal = cartStore.subtotal();
  const total = cartStore.total();
  const deliveryFee = cartStore.deliveryFee;
  const minOrderAmount = cartStore.minOrderAmount;
  const restaurantName = cartStore.restaurantName;

  const isBelowMinimum = minOrderAmount > 0 && subtotal < minOrderAmount;

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Votre panier est vide</Text>
        <Text style={styles.emptySubtitle}>
          Ajoutez des plats depuis un restaurant
        </Text>
        <Button
          title="Explorer les restaurants"
          onPress={() => router.replace('/(tabs)')}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panier</Text>
        {restaurantName ? (
          <Text style={styles.headerSubtitle}>{restaurantName}</Text>
        ) : null}
      </View>

      {/* Cart items */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {items.map((item) => (
          <CartItemRow
            key={item.menu_item_id}
            item={item}
            onUpdateQuantity={cartStore.updateQuantity}
            onRemove={cartStore.removeItem}
          />
        ))}
      </ScrollView>

      {/* Footer summary */}
      <View style={styles.footer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>
              {subtotal.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Livraison</Text>
            <Text style={styles.summaryValue}>
              {deliveryFee > 0
                ? `${deliveryFee.toLocaleString('fr-FR')} FCFA`
                : 'Gratuite'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
        </View>

        {isBelowMinimum && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Minimum de commande : {minOrderAmount.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
        )}

        <Button
          title="Commander →"
          onPress={() => router.push('/checkout' as any)}
          variant="primary"
          disabled={isBelowMinimum}
          style={styles.orderButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  emptyButton: {
    width: '100%',
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  footer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.primaryGreen,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: BorderRadii.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warningText: {
    fontSize: FontSizes.xs,
    color: Colors.primaryOrange,
    fontWeight: FontWeights.medium,
    textAlign: 'center',
  },
  orderButton: {
    width: '100%',
  },
});