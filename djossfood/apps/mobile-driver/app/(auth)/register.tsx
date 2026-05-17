import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { registerDriver } from '../../services/auth';

const VEHICLE_TYPES = [
  { key: 'motorcycle', label: 'Moto', emoji: '🛵' },
  { key: 'bicycle', label: 'Vélo', emoji: '🛲' },
  { key: 'car', label: 'Voiture', emoji: '🚗' },
] as const;

type VehicleKey = (typeof VEHICLE_TYPES)[number]['key'];

export default function RegisterScreen() {
  const [vehicleType, setVehicleType] = useState<VehicleKey | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBicycle = vehicleType === 'bicycle';

  const handleRegister = async () => {
    if (!vehicleType) {
      setError('Sélectionnez un type de véhicule');
      return;
    }
    if (!licenseNumber.trim()) {
      setError('Numéro de permis requis');
      return;
    }
    if (!isBicycle && !vehiclePlate.trim()) {
      setError('Plaque d\'immatriculation requise');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await registerDriver({
        vehicle_type: vehicleType,
        vehicle_plate: isBicycle ? '' : vehiclePlate.trim(),
        license_number: licenseNumber.trim(),
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.replace('/(auth)/documents');
      }
    } catch {
      setError('Vérifiez votre connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Inscription Chauffeur</Text>
        <Text style={styles.subtitle}>
          Choisissez votre type de véhicule pour commencer
        </Text>

        {/* Vehicle type selector */}
        <View style={styles.vehicleRow}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.vehicleCard,
                vehicleType === v.key && styles.vehicleCardSelected,
              ]}
              onPress={() => {
                setVehicleType(v.key);
                setError(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
              <Text
                style={[
                  styles.vehicleLabel,
                  vehicleType === v.key && styles.vehicleLabelSelected,
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vehicle plate — hidden for bicycles */}
        {!isBicycle ? (
          <Input
            label="Plaque d'immatriculation"
            placeholder="Ex: AB-123-CD"
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            autoCapitalize="characters"
            editable={!loading}
          />
        ) : null}

        {/* License number — always required */}
        <Input
          label="Numéro de permis"
          placeholder="Ex: 123456789"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          keyboardType="number-pad"
          editable={!loading}
        />

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Submit */}
        <Button
          title="Continuer"
          onPress={handleRegister}
          loading={loading}
          disabled={!vehicleType}
          variant="orange"
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadii.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleCardSelected: {
    borderColor: Colors.primaryOrange,
    backgroundColor: '#FFF3E8',
  },
  vehicleEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  vehicleLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  vehicleLabelSelected: {
    color: Colors.primaryOrange,
    fontWeight: FontWeights.bold,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  submitButton: {
    width: '100%',
    marginTop: Spacing.md,
  },
});