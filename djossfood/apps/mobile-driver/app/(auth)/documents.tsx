import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Button from '../../components/ui/Button';
import DocumentUpload from '../../components/DocumentUpload';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { uploadDocuments, fetchDriverProfile } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

export default function DocumentsScreen() {
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setDriver } = useAuthStore();

  const handleSubmit = async () => {
    if (!licensePhoto) {
      setError('Photo du permis de conduire requise');
      return;
    }
    if (!idPhoto) {
      setError('Photo de la carte d\'identité requise');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();

      // Append license photo
      const licenseFile = {
        uri: licensePhoto,
        type: 'image/jpeg',
        name: 'license_photo.jpg',
      };
      formData.append('license_photo', licenseFile as any);

      // Append ID photo
      const idFile = {
        uri: idPhoto,
        type: 'image/jpeg',
        name: 'id_photo.jpg',
      };
      formData.append('id_photo', idFile as any);

      // Append vehicle photo (optional)
      if (vehiclePhoto) {
        const vehicleFile = {
          uri: vehiclePhoto,
          type: 'image/jpeg',
          name: 'vehicle_photo.jpg',
        };
        formData.append('vehicle_photo', vehicleFile as any);
      }

      const result = await uploadDocuments(formData);

      if (result.error) {
        setError(result.error);
      } else {
        // Refresh driver profile to get updated document status
        const profileResult = await fetchDriverProfile();
        if (profileResult.driver) {
          setDriver(profileResult.driver);
        }
        router.replace('/(auth)/pending');
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
        <Text style={styles.title}>Documents requis</Text>
        <Text style={styles.subtitle}>
          Téléchargez les photos de vos documents pour vérification
        </Text>

        <DocumentUpload
          label="Permis de conduire"
          onImageSelected={setLicensePhoto}
          imageUri={licensePhoto}
          required
        />

        <DocumentUpload
          label="Carte d'identité"
          onImageSelected={setIdPhoto}
          imageUri={idPhoto}
          required
        />

        <DocumentUpload
          label="Photo du véhicule"
          onImageSelected={setVehiclePhoto}
          imageUri={vehiclePhoto}
          required={false}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Soumettre"
          onPress={handleSubmit}
          loading={loading}
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
    marginBottom: Spacing.xl,
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