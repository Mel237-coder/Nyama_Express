import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { signOut } from '../../services/auth';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BorderRadii } from '../../constants/spacing';
import { FontSizes } from '../../constants/typography';
import { FontWeights } from '../../constants/typography';

interface SettingsRowProps {
  label: string;
  onPress?: () => void;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ label, onPress }) => (
  <TouchableOpacity
    style={styles.settingsRow}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
  >
    <Text style={styles.settingsRowLabel}>{label}</Text>
    <Text style={styles.settingsRowChevron}>→</Text>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const clearAuth = useAuthStore((s) => s.signOut);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            clearAuth();
            router.replace('/(auth)/login' as any);
          },
        },
      ],
      { cancelable: true },
    );
  }, [clearAuth]);

  const initial = profile?.full_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Avatar & user info */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.userName}>
          {profile?.full_name || 'Utilisateur'}
        </Text>
        {profile?.phone ? (
          <Text style={styles.userPhone}>{profile.phone}</Text>
        ) : null}
      </View>

      {/* Settings section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.sectionCard}>
          <SettingsRow label="Notifications" />
          <View style={styles.divider} />
          <SettingsRow label="Adresses enregistrées" />
          <View style={styles.divider} />
          <SettingsRow label="Moyens de paiement" />
        </View>
      </View>

      {/* Help section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aide</Text>
        <View style={styles.sectionCard}>
          <SettingsRow label="Conditions d'utilisation" />
          <View style={styles.divider} />
          <SettingsRow label="Politique de confidentialité" />
          <View style={styles.divider} />
          <SettingsRow label="Contacter le support" />
        </View>
      </View>

      {/* Sign out button */}
      <View style={styles.signOutSection}>
        <Button
          title="Se déconnecter"
          onPress={handleSignOut}
          variant="outline"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  contentContainer: {
    paddingBottom: Spacing.xxxl,
  },
  avatarSection: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: BorderRadii.full,
    backgroundColor: Colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  userPhone: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadii.lg,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  settingsRowLabel: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  settingsRowChevron: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  signOutSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
});