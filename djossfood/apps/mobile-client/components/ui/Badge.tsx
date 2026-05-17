import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.success, text: '#FFFFFF' },
  error: { bg: Colors.error, text: '#FFFFFF' },
  warning: { bg: Colors.warning, text: '#111111' },
  info: { bg: Colors.primaryOrange, text: '#FFFFFF' },
  neutral: { bg: '#E0E0E0', text: Colors.textSecondary },
};

const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  const colors = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadii.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
});

export default Badge;