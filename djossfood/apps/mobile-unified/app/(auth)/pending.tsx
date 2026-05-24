import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { FontSizes } from '@/constants/typography';
import { FontWeights } from '@/constants/typography';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';

export default function PendingApprovalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Verification en cours</Text>
      <Text style={styles.subtitle}>
        Votre compte livreur est en attente de validation par notre equipe. Vous recevrez une notification des que votre profil sera approuve.
      </Text>
      <Button
        title="Retour"
        onPress={() => router.replace('/(auth)/login')}
        variant="outline"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  button: {
    width: '100%',
  },
});
