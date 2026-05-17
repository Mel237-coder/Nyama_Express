import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { BorderRadii } from '../../constants/spacing';
import { fetchDriverProfile } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

export default function PendingScreen() {
  const { setDriver } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['driverApproval'],
    queryFn: async () => {
      const result = await fetchDriverProfile();
      return result.driver ?? null;
    },
    refetchInterval: 30_000,
  });

  // Navigate to main when approved
  React.useEffect(() => {
    if (data?.is_approved) {
      setDriver(data);
      router.replace('/(main)');
    }
  }, [data, setDriver]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primaryOrange} />
        <Text style={styles.title}>En cours de vérification</Text>
        <Text style={styles.message}>
          Nous vous contacterons une fois votre compte approuvé
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.xl,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});