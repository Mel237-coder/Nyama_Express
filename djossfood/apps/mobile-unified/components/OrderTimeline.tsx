import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { OrderStatus } from '@djossfood/database';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  timestamps: Record<string, string | null>;
}

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Commande passee' },
  { status: 'confirmed', label: 'Confirmee' },
  { status: 'preparing', label: 'En preparation' },
  { status: 'ready', label: 'Prette' },
  { status: 'driver_assigned', label: 'Livreur assigne' },
  { status: 'picked_up', label: 'Recuperee' },
  { status: 'delivering', label: 'En livraison' },
  { status: 'delivered', label: 'Livree' },
  { status: 'completed', label: 'Confirmee' },
];

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'driver_assigned',
  'picked_up',
  'delivering',
  'delivered',
  'completed',
];

function getStepState(
  stepStatus: OrderStatus,
  currentStatus: OrderStatus,
): 'completed' | 'current' | 'future' {
  const stepIndex = STATUS_ORDER.indexOf(stepStatus);
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'future';
}

function formatTimestamp(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({
  currentStatus,
  timestamps,
}) => {
  // Handle cancelled/rejected status: show timeline up to current step
  const effectiveStatus: OrderStatus =
    currentStatus === 'cancelled' || currentStatus === 'rejected'
      ? 'pending'
      : currentStatus;

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const state = getStepState(step.status, effectiveStatus);
        const isLast = index === STEPS.length - 1;
        const ts = formatTimestamp(timestamps[step.status] ?? null);

        return (
          <View key={step.status} style={styles.stepRow}>
            {/* Line + dot column */}
            <View style={styles.indicatorColumn}>
              {/* Top line */}
              {!isLast && (
                <View
                  style={[
                    styles.lineTop,
                    state === 'future'
                      ? styles.lineFuture
                      : styles.lineCompleted,
                  ]}
                />
              )}
              {/* Dot */}
              <View
                style={[
                  styles.dot,
                  state === 'completed' && styles.dotCompleted,
                  state === 'current' && styles.dotCurrent,
                  state === 'future' && styles.dotFuture,
                ]}
              >
                {state === 'current' && <View style={styles.dotRing} />}
              </View>
              {/* Bottom line */}
              {index > 0 && (
                <View
                  style={[
                    styles.lineBottom,
                    getStepState(STEPS[index - 1].status, effectiveStatus) ===
                    'future'
                      ? styles.lineFuture
                      : styles.lineCompleted,
                  ]}
                />
              )}
            </View>

            {/* Label + timestamp */}
            <View style={styles.labelContainer}>
              <Text
                style={[
                  styles.label,
                  state === 'future' && styles.labelFuture,
                  state === 'completed' && styles.labelCompleted,
                  state === 'current' && styles.labelCurrent,
                ]}
              >
                {step.label}
              </Text>
              {ts && (
                <Text style={styles.timestamp}>{ts}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const DOT_SIZE = 14;
const RING_SIZE = 22;

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 48,
  },
  indicatorColumn: {
    width: RING_SIZE + 4,
    alignItems: 'center',
    position: 'relative',
  },
  lineTop: {
    position: 'absolute',
    top: 0,
    bottom: '50%',
    width: 2,
    left: (RING_SIZE + 4 - 2) / 2,
  },
  lineBottom: {
    position: 'absolute',
    top: '50%',
    bottom: 0,
    width: 2,
    left: (RING_SIZE + 4 - 2) / 2,
  },
  lineCompleted: {
    backgroundColor: Colors.success,
  },
  lineFuture: {
    backgroundColor: Colors.border,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    position: 'absolute',
    top: '50%',
    marginTop: -DOT_SIZE / 2,
    left: (RING_SIZE + 4 - DOT_SIZE) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: Colors.success,
  },
  dotCurrent: {
    backgroundColor: Colors.success,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    marginTop: -RING_SIZE / 2,
    left: (RING_SIZE + 4 - RING_SIZE) / 2,
  },
  dotFuture: {
    backgroundColor: Colors.border,
  },
  dotRing: {
    width: DOT_SIZE - 4,
    height: DOT_SIZE - 4,
    borderRadius: (DOT_SIZE - 4) / 2,
    backgroundColor: Colors.surface,
  },
  labelContainer: {
    flex: 1,
    paddingBottom: Spacing.md,
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  labelCompleted: {
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  labelCurrent: {
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  labelFuture: {
    color: Colors.textSecondary,
  },
  timestamp: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default OrderTimeline;