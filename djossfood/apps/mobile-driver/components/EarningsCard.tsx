import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { BorderRadii } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface EarningsCardProps {
  walletBalance: number;
  todayEarnings: number;
  todayDeliveries: number;
}

function formatAmount(value: number): string {
  return value.toLocaleString('fr-FR');
}

const EarningsCard: React.FC<EarningsCardProps> = ({
  walletBalance,
  todayEarnings,
  todayDeliveries,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label}>Solde</Text>
        <Text style={styles.walletAmount}>{formatAmount(walletBalance)} FCFA</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.column}>
          <Text style={styles.statLabel}>Aujourd'hui</Text>
          <Text style={styles.statValue}>{formatAmount(todayEarnings)} FCFA</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.statLabel}>Courses</Text>
          <Text style={styles.statValue}>{todayDeliveries}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: BorderRadii.xl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.xs,
  },
  walletAmount: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: Spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  column: {
    flex: 1,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
});

export default EarningsCard;