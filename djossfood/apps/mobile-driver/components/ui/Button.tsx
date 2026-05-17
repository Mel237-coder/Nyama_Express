import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

type ButtonVariant = 'primary' | 'orange' | 'yellow' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantColors: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.primaryGreen, text: '#FFFFFF' },
  orange: { bg: Colors.primaryOrange, text: '#FFFFFF' },
  yellow: { bg: Colors.primaryYellow, text: '#111111' },
  outline: { bg: 'transparent', text: Colors.primaryGreen, border: Colors.primaryGreen },
  danger: { bg: Colors.error, text: '#FFFFFF' },
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const colors = variantColors[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: colors.bg },
        variant === 'outline' && { borderWidth: 2, borderColor: colors.border },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <Text style={[styles.text, { color: colors.text }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadii.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;