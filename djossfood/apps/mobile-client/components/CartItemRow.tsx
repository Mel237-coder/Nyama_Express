import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { type CartItem } from '../stores/cartStore';
import QuantityStepper from './ui/QuantityStepper';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const lineTotal = item.price * item.quantity;

  const handleIncrement = () => {
    onUpdateQuantity(item.menu_item_id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      onRemove(item.menu_item_id);
    } else {
      onUpdateQuantity(item.menu_item_id, item.quantity - 1);
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.special_instructions ? (
          <Text style={styles.instructions} numberOfLines={1}>
            {item.special_instructions}
          </Text>
        ) : null}
      </View>

      <Text style={styles.price}>
        {lineTotal.toLocaleString('fr-FR')} FCFA
      </Text>

      <QuantityStepper
        quantity={item.quantity}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        min={1}
      />

      <TouchableOpacity onPress={() => onRemove(item.menu_item_id)} activeOpacity={0.6}>
        <Text style={styles.removeText}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  instructions: {
    fontSize: FontSizes.xs,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
  },
  removeText: {
    fontSize: FontSizes.xs,
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
});

export default CartItemRow;