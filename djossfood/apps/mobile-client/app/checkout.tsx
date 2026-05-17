import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useLocation } from '../hooks/useLocation';
import { useCreateOrder } from '../hooks/useOrders';
import type { PaymentMethod } from '@djossfood/database';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadii } from '../constants/spacing';
import { FontSizes, FontWeights } from '../constants/typography';

const PHONE_REGEX = /^(\+237|237)?6\d{8}$/;

export default function CheckoutScreen() {
  const cartStore = useCartStore();
  const items = cartStore.items;
  const subtotal = cartStore.subtotal();
  const total = cartStore.total();
  const deliveryFee = cartStore.deliveryFee;
  const restaurantId = cartStore.restaurantId;
  const clearCart = cartStore.clearCart;

  const profile = useAuthStore((s) => s.profile);
  const { location } = useLocation();
  const createOrder = useCreateOrder();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentPhone, setPaymentPhone] = useState(profile?.phone ?? '');

  const upfrontAmount = Math.ceil(total * 0.6);

  const isPhoneValid = PHONE_REGEX.test(paymentPhone.trim());
  const isAddressValid = deliveryAddress.trim().length > 0;
  const canSubmit =
    paymentMethod !== null && isPhoneValid && isAddressValid && !createOrder.isPending;

  const handleSubmit = () => {
    if (!restaurantId) return;

    const phoneToSubmit = paymentPhone.trim();

    createOrder.mutate(
      {
        restaurant_id: restaurantId,
        items: items.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          special_instructions: item.special_instructions,
        })),
        delivery_address: deliveryAddress.trim(),
        delivery_lat: location?.latitude ?? 0,
        delivery_lng: location?.longitude ?? 0,
        payment_method: paymentMethod!,
        payment_phone: phoneToSubmit,
        delivery_notes: deliveryNotes.trim() || undefined,
      },
      {
        onSuccess: (order) => {
          clearCart();
          router.replace(`/order/${order.id}` as any);
        },
        onError: (error: any) => {
          Alert.alert(
            'Erreur',
            error?.response?.data?.error || error?.message || 'Impossible de créer la commande. Veuillez réessayer.'
          );
        },
      }
    );
  };

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paiement</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Delivery section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          <Input
            label="Adresse"
            placeholder="Entrez votre adresse de livraison"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
          />
          <Input
            label="Instructions (optionnel)"
            placeholder="Porte, étage, instructions..."
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
          />
        </View>

        {/* Payment method section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode de paiement</Text>
          <View style={styles.paymentButtons}>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                styles.orangeButton,
                paymentMethod === 'orange_money' && styles.paymentButtonSelected,
              ]}
              onPress={() => setPaymentMethod('orange_money')}
              activeOpacity={0.7}
            >
              <Text style={styles.orangeButtonText}>🟠 Orange Money</Text>
              {paymentMethod === 'orange_money' && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentButton,
                styles.yellowButton,
                paymentMethod === 'mtn_mobile_money' && styles.paymentButtonSelected,
              ]}
              onPress={() => setPaymentMethod('mtn_mobile_money')}
              activeOpacity={0.7}
            >
              <Text style={styles.yellowButtonText}>🟡 MTN MoMo</Text>
              {paymentMethod === 'mtn_mobile_money' && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Phone confirmation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Numéro de téléphone</Text>
          <Input
            label="Téléphone"
            placeholder="+237 6XX XXX XXX"
            value={paymentPhone}
            onChangeText={setPaymentPhone}
            keyboardType="phone-pad"
            error={
              paymentPhone.trim().length > 0 && !isPhoneValid
                ? 'Format invalide (ex: +2376XXXXXXXX ou 6XXXXXXXX)'
                : undefined
            }
          />
        </View>

        {/* Order summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé de la commande</Text>
          <View style={styles.itemsSummary}>
            {items.map((item) => (
              <View key={item.menu_item_id} style={styles.itemRow}>
                <Text style={styles.itemQtyName}>
                  {item.quantity} × {item.name}
                </Text>
                <Text style={styles.itemPrice}>
                  {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

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
          <View style={styles.upfrontRow}>
            <Text style={styles.upfrontLabel}>Acompte (60%)</Text>
            <Text style={styles.upfrontValue}>
              {upfrontAmount.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.footer}>
        <Button
          title={
            createOrder.isPending
              ? 'Traitement en cours...'
              : `Payer l'acompte ${upfrontAmount.toLocaleString('fr-FR')} FCFA`
          }
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={createOrder.isPending}
          style={styles.confirmButton}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
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
  paymentButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  paymentButton: {
    flex: 1,
    borderRadius: BorderRadii.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orangeButton: {
    backgroundColor: '#FF6600',
  },
  yellowButton: {
    backgroundColor: '#FFCC00',
  },
  paymentButtonSelected: {
    borderWidth: 3,
    borderColor: Colors.primaryGreen,
  },
  orangeButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },
  yellowButtonText: {
    color: '#111111',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primaryGreen,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  itemsSummary: {
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  itemQtyName: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  itemPrice: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
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
  upfrontRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadii.sm,
  },
  upfrontLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.primaryGreen,
  },
  upfrontValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.primaryGreen,
  },
  footer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  confirmButton: {
    width: '100%',
  },
});