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
import Input from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';
import { sendOtp } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setSession, setProfile, setIsNewUser } = useAuthStore();

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 9);
  };

  const getFullPhone = (localPhone: string): string | null => {
    const digits = localPhone.replace(/\D/g, '');
    if (/^6\d{8}$/.test(digits)) return `+237${digits}`;
    if (/^\+2376\d{8}$/.test(digits)) return digits;
    return null;
  };

  const handleSendOtp = async () => {
    setError(null);
    const fullPhone = getFullPhone(phone);
    if (!fullPhone) {
      setError('Numéro invalide. Ex: 6XXXXXXXX');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(fullPhone);
      if (result.success) {
        router.push({ pathname: '/(auth)/verify', params: { phone: fullPhone } });
      } else {
        setError('Vérifiez votre connexion');
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <Text style={styles.appName}>DjossFood</Text>
          <Text style={styles.tagline}>Espace Livreur</Text>
        </View>

        {/* Phone Form */}
        <View style={styles.form}>
          <Input
            label="Numéro de téléphone"
            placeholder="6XXXXXXXX"
            value={phone}
            onChangeText={(text) => { setPhone(formatPhone(text)); setError(null); }}
            keyboardType="phone-pad"
            maxLength={9}
            error={error ?? undefined}
          />
          <View style={styles.prefixHint}>
            <Text style={styles.prefixText}>Indicatif : +237 (Cameroun)</Text>
          </View>
          <Button
            title="Envoyer le code"
            onPress={handleSendOtp}
            loading={loading}
            disabled={phone.length < 9}
          />
        </View>
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
    paddingVertical: Spacing.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  appName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  prefixHint: {
    marginBottom: Spacing.lg,
  },
  prefixText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});