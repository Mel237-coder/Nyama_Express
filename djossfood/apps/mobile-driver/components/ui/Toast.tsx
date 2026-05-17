import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const typeColors: Record<ToastType, string> = {
  error: Colors.error,
  success: Colors.success,
  info: Colors.primaryOrange,
};

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const backgroundColor = typeColors[type];

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss, opacity]);

  return (
    <TouchableWithoutFeedback onPress={onDismiss}>
      <Animated.View style={[styles.container, { backgroundColor, opacity }]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    zIndex: 9999,
    elevation: 5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    textAlign: 'center',
  },
});

export default Toast;