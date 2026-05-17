import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { useDriverProfile } from '../../hooks/useDriver';
import { signOut } from '../../services/auth';
import { stopLocationUpdates } from '../../services/location';
import { disconnectSocket } from '../../services/socket';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

function formatAmount(value: number): string {
  return value.toLocaleString('fr-FR');
}

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: 'Moto',
  bicycle: 'Velo',
  car: 'Voiture',
  moto: 'Moto',
  velo: 'Velo',
  voiture: 'Voiture',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, driver } = useAuthStore();
  const { goOffline } = useDeliveryStore();
  const { data: freshDriver, isLoading } = useDriverProfile();

  const currentDriver = freshDriver ?? driver;

  if (isLoading && !currentDriver) {
    return <LoadingSpinner message="Chargement du profil..." />;
  }

  const displayName = profile?.full_name || 'Chauffeur';
  const phone = profile?.phone || '';
  const initial = displayName.charAt(0).toUpperCase();

  const vehicleType = currentDriver?.vehicle_type
    ? VEHICLE_LABELS[currentDriver.vehicle_type] ?? currentDriver.vehicle_type
    : 'Non renseigne';
  const vehiclePlate = currentDriver?.vehicle_plate || null;
  const isVerified = currentDriver?.is_approved ?? false;
  const totalDeliveries = currentDriver?.total_deliveries ?? 0;
  const rating = currentDriver?.rating ?? 0;

  const handleSignOut = () => {
    Alert.alert(
      'Deconnexion',
      'Voulez-vous vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Deconnecter',
          style: 'destructive',
          onPress: async () => {
            goOffline();
            stopLocationUpdates();
            disconnectSocket();
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar and name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.nameText}>{displayName}</Text>
        {phone ? <Text style={styles.phoneText}>{phone}</Text> : null}
      </View>

      {/* Info card */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vehicule</Text>
          <Text style={styles.infoValue}>{vehicleType}</Text>
        </View>

        {vehiclePlate ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plaque</Text>
            <Text style={styles.infoValue}>{vehiclePlate}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Documents</Text>
          {isVerified ? (
            <Badge label="Verifie ✓" variant="success" />
          ) : (
            <Badge label="En attente" variant="warning" />
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Courses totales</Text>
          <Text style={styles.infoValue}>{totalDeliveries}</Text>
        </View>

        <View style={[styles.infoRow, styles.lastInfoRow]}>
          <Text style={styles.infoLabel}>Note</Text>
          <Text style={styles.infoValue}>{rating > 0 ? `${rating.toFixed(1)} / 5` : 'N/A'}</Text>
        </View>
      </Card>

      {/* Sign out button */}
      <Button
        title="Deconnexion"
        onPress={handleSignOut}
        variant="outline"
        style={styles.signOutButton}
        textStyle={styles.signOutButtonText}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadii.full,
    backgroundColor: Colors.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  nameText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  phoneText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
  },
  infoCard: {
    marginBottom: Spacing.xxl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderColor: Colors.error,
    borderWidth: 2,
    borderRadius: BorderRadii.lg,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButtonText: {
    color: Colors.error,
    fontWeight: FontWeights.bold,
  },
});