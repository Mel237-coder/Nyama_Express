import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { Restaurant } from '@djossfood/database';
import Badge from './ui/Badge';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { BorderRadii } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface RestaurantCardProps {
  restaurant: Restaurant;
  distanceKm?: number;
  onPress: () => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  distanceKm,
  onPress,
}) => {
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

  const prepLabel = restaurant.avg_preparation_time
    ? `${restaurant.avg_preparation_time} min`
    : null;

  const metaLabel = prepLabel
    ? `${deliveryLabel} · ${prepLabel}`
    : deliveryLabel;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Cover image or placeholder */}
      {restaurant.cover_url ? (
        <Image
          source={{ uri: restaurant.cover_url }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverEmoji}>🍽️</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Name + status badge */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Badge label={statusLabel} variant={statusVariant} />
        </View>

        {/* Cuisine tags */}
        {restaurant.cuisine_types.length > 0 && (
          <View style={styles.tagsRow}>
            {restaurant.cuisine_types.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={styles.ratingText}>{ratingDisplay}</Text>
        </View>

        {/* Delivery fee + prep time */}
        <Text style={styles.metaText} numberOfLines={1}>
          {metaLabel}
        </Text>

        {/* Distance */}
        {distanceKm != null && (
          <Text style={styles.distanceText}>
            à {distanceKm.toFixed(1)} km
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  coverImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.border,
  },
  coverPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEmoji: {
    fontSize: 40,
  },
  content: {
    padding: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
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
  ratingRow: {
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
  metaText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  distanceText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default RestaurantCard;