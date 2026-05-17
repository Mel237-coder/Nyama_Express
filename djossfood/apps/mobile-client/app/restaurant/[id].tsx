import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useRestaurant, useRestaurantMenu } from '../../hooks/useRestaurants';
import { useCartStore } from '../../stores/cartStore';
import Badge from '../../components/ui/Badge';
import MenuItemRow from '../../components/MenuItemRow';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

type Tab = 'menu' | 'infos';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('menu');

  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(id);
  const { data: menu, isLoading: menuLoading } = useRestaurantMenu(id);

  const cartStore = useCartStore();

  if (restaurantLoading || !restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
      </View>
    );
  }

  const isOpen = restaurant.status === 'open';
  const statusLabel = isOpen ? 'Ouvert' : 'Fermé';
  const statusVariant = isOpen ? 'success' : 'error';

  const ratingDisplay =
    restaurant.rating_count > 0
      ? `${restaurant.total_rating.toFixed(1)} (${restaurant.rating_count})`
      : 'Nouveau';

  const deliveryLabel =
    restaurant.delivery_fee > 0
      ? `Livraison ${restaurant.delivery_fee.toLocaleString('fr-FR')} FCFA`
      : 'Livraison gratuite';

  const minOrderLabel = restaurant.min_order_amount > 0
    ? `Min. ${restaurant.min_order_amount.toLocaleString('fr-FR')} FCFA`
    : null;

  const metaLabel = minOrderLabel
    ? `${deliveryLabel} · ${minOrderLabel}`
    : deliveryLabel;

  const cartItemCount = cartStore.itemCount();
  const cartTotal = cartStore.total();
  const showCartButton = cartStore.items.length > 0;

  return (
    <View style={styles.container}>
      {/* Hero header */}
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        {restaurant.cover_url ? (
          <Image
            source={{ uri: restaurant.cover_url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroEmoji}>🍽️</Text>
          </View>
        )}

        <View style={styles.heroOverlay}>
          <Text style={styles.restaurantName} numberOfLines={2}>
            {restaurant.name}
          </Text>

          {restaurant.cuisine_types.length > 0 && (
            <View style={styles.tagsRow}>
              {restaurant.cuisine_types.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingText}>{ratingDisplay}</Text>
            <Text style={styles.metaSeparator}>·</Text>
            <Text style={styles.metaText}>{metaLabel}</Text>
          </View>

          <View style={styles.statusRow}>
            <Badge label={statusLabel} variant={statusVariant} />
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'menu' && styles.tabActive]}
          onPress={() => setActiveTab('menu')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
            Menu
          </Text>
          {activeTab === 'menu' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'infos' && styles.tabActive]}
          onPress={() => setActiveTab('infos')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'infos' && styles.tabTextActive]}>
            Infos
          </Text>
          {activeTab === 'infos' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      {activeTab === 'menu' ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {menuLoading ? (
            <ActivityIndicator size="large" color={Colors.primaryGreen} style={styles.inlineLoader} />
          ) : menu && menu.length > 0 ? (
            menu.map((category) => (
              <View key={category.id ?? category.name}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.description ? (
                    <Text style={styles.categoryDescription} numberOfLines={1}>
                      {category.description}
                    </Text>
                  ) : null}
                </View>
                {category.items.map((menuItem: any) => (
                  <MenuItemRow
                    key={menuItem.id}
                    item={menuItem}
                    restaurantId={restaurant.id}
                    restaurantName={restaurant.name}
                    deliveryFee={restaurant.delivery_fee}
                    minOrderAmount={restaurant.min_order_amount}
                  />
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun menu disponible</Text>
            </View>
          )}
          {/* Bottom spacer for cart button */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {restaurant.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Adresse</Text>
                <Text style={styles.infoValue}>{restaurant.address}</Text>
              </View>
            </View>
          )}
          {restaurant.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{restaurant.phone}</Text>
              </View>
            </View>
          )}
          {restaurant.description && (
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>À propos</Text>
              <Text style={styles.infoDescription}>{restaurant.description}</Text>
            </View>
          )}
          {restaurant.opening_hours &&
            typeof restaurant.opening_hours === 'object' &&
            Object.keys(restaurant.opening_hours).length > 0 && (
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Horaires d'ouverture</Text>
                {Object.entries(restaurant.opening_hours).map(([day, hours]) => (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>{day}</Text>
                    <Text style={styles.hoursTime}>
                      {typeof hours === 'string' ? hours : JSON.stringify(hours)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
        </ScrollView>
      )}

      {/* Floating cart button */}
      {showCartButton && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/cart' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
          </View>
          <View style={styles.cartInfo}>
            <Text style={styles.cartTotal}>
              {cartTotal.toLocaleString('fr-FR')} FCFA
            </Text>
            <Text style={styles.cartAction}>Voir le panier →</Text>
          </View>
        </TouchableOpacity>
      )}
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
  hero: {
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xxxl + Spacing.xs,
    left: Spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadii.full,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  heroImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.border,
  },
  heroPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
  },
  heroOverlay: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  restaurantName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tagPill: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadii.full,
  },
  tagText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  ratingStar: {
    fontSize: FontSizes.xs,
  },
  ratingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  metaSeparator: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  statusRow: {
    marginTop: Spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primaryGreen,
    fontWeight: FontWeights.bold,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: Colors.primaryGreen,
    borderRadius: BorderRadii.full,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xxxl,
  },
  inlineLoader: {
    paddingVertical: Spacing.xxxl,
  },
  categoryHeader: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  categoryName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  categoryDescription: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 80,
  },
  // Infos tab styles
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  infoIcon: {
    fontSize: FontSizes.lg,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  infoSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  infoSectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  hoursDay: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeights.medium,
  },
  hoursTime: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  // Cart floating button
  cartButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGreen,
    borderRadius: BorderRadii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cartBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 32,
    height: 32,
    borderRadius: BorderRadii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  cartInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTotal: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  cartAction: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});