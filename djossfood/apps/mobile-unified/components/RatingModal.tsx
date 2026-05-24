import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Sheet from './ui/Sheet';
import Button from './ui/Button';
import Input from './ui/Input';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  restaurantName: string;
  hasDriver: boolean;
  onSubmit: (ratings: {
    restaurant_rating: number;
    driver_rating?: number;
    restaurant_comment?: string;
    driver_comment?: string;
  }) => void;
}

const MAX_STARS = 5;

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  restaurantName,
  hasDriver,
  onSubmit,
}) => {
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [driverComment, setDriverComment] = useState('');

  const canSubmit = restaurantRating > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const payload: {
      restaurant_rating: number;
      driver_rating?: number;
      restaurant_comment?: string;
      driver_comment?: string;
    } = {
      restaurant_rating: restaurantRating,
    };

    if (hasDriver && driverRating > 0) {
      payload.driver_rating = driverRating;
    }

    if (comment.trim()) {
      payload.restaurant_comment = comment.trim();
    }

    if (hasDriver && driverComment.trim()) {
      payload.driver_comment = driverComment.trim();
    }

    onSubmit(payload);
  };

  const handleClose = () => {
    setRestaurantRating(0);
    setDriverRating(0);
    setComment('');
    setDriverComment('');
    onClose();
  };

  const renderStars = (
    rating: number,
    onRate: (star: number) => void,
  ) => {
    return (
      <View style={styles.starsRow}>
        {Array.from({ length: MAX_STARS }, (_, i) => i + 1).map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRate(star)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Text
              style={[
                styles.star,
                star <= rating ? styles.starFilled : styles.starEmpty,
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Sheet visible={visible} onClose={handleClose}>
      <Text style={styles.title}>Evaluer votre commande</Text>

      {/* Restaurant rating */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{restaurantName}</Text>
        {renderStars(restaurantRating, setRestaurantRating)}
      </View>

      {/* Driver rating (optional) */}
      {hasDriver && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Votre livreur</Text>
          {renderStars(driverRating, setDriverRating)}
        </View>
      )}

      {/* Comment */}
      <View style={styles.section}>
        <Input
          label="Commentaire (optionnel)"
          placeholder="Partagez votre experience..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Driver comment */}
      {hasDriver && (
        <View style={styles.section}>
          <Input
            label="Commentaire livreur (optionnel)"
            placeholder="Comment etait la livraison ?"
            value={driverComment}
            onChangeText={setDriverComment}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Submit */}
      <View style={styles.buttonRow}>
        <Button
          title="Envoyer"
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={styles.submitButton}
        />
        <Button
          title="Plus tard"
          onPress={handleClose}
          variant="outline"
          style={styles.laterButton}
        />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
  star: {
    fontSize: 36,
  },
  starFilled: {
    color: Colors.primaryOrange,
  },
  starEmpty: {
    color: Colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  submitButton: {
    flex: 1,
  },
  laterButton: {
    flex: 1,
  },
});

export default RatingModal;