import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useCartStore, type CartItem } from '../stores/cartStore';
import QuantityStepper from './ui/QuantityStepper';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { BorderRadii } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface MenuItemRowProps {
  item: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  };
  restaurantId: string;
  restaurantName: string;
  deliveryFee: number;
  minOrderAmount: number;
}

const MenuItemRow: React.FC<MenuItemRowProps> = ({
  item,
  restaurantId,
  restaurantName,
  deliveryFee,
  minOrderAmount,
}) => {
  const cartStore = useCartStore();

  const quantity = cartStore.items.find(
    (i) => i.menu_item_id === item.id,
  )?.quantity ?? 0;

  const handleAdd = () => {
    const cartItem: CartItem = {
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url,
    };
    cartStore.addItem(cartItem, restaurantId, restaurantName, deliveryFee, minOrderAmount);
  };

  const handleIncrement = () => {
    cartStore.updateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    cartStore.updateQuantity(item.id, quantity - 1);
  };

  return (
    <View style={styles.row}>
      {/* Image thumbnail */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailEmoji}>🍽️</Text>
        </View>
      )}

      {/* Text content */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Price */}
      <Text style={styles.price}>
        {item.price.toLocaleString('fr-FR')} FCFA
      </Text>

      {/* Add button or quantity stepper */}
      {quantity === 0 ? (
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      ) : (
        <QuantityStepper
          quantity={quantity}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
        />
      )}
    </View>
  );
};

const THUMBNAIL_SIZE = 56;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: BorderRadii.sm,
    backgroundColor: Colors.border,
  },
  thumbnailPlaceholder: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: BorderRadii.sm,
    backgroundColor: Colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailEmoji: {
    fontSize: FontSizes.md,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  description: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadii.sm,
    backgroundColor: Colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
});

export default MenuItemRow;