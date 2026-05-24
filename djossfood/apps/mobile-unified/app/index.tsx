import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RoleSelectorScreen() {
  const router = useRouter();
  const { isAuthenticated, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const savedRole = await AsyncStorage.getItem('selected-role');
      if (savedRole && isAuthenticated && profile) {
        if (savedRole === profile.role) {
          router.replace(savedRole === 'client' ? '/(tabs)' : '/driver/main');
        } else {
          await AsyncStorage.removeItem('selected-role');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkRole();
  }, [isAuthenticated, profile]);

  const selectRole = async (role: 'client' | 'driver') => {
    await AsyncStorage.setItem('selected-role', role);
    if (isAuthenticated && profile?.role === role) {
      router.replace(role === 'client' ? '/(tabs)' : '/driver/main');
    } else {
      router.replace('/auth/login');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DjossFood</Text>
      <Text style={styles.subtitle}>Choisissez votre espace</Text>

      <TouchableOpacity style={[styles.card, styles.clientCard]} onPress={() => selectRole('client')}>
        <Text style={styles.cardTitle}>Client</Text>
        <Text style={styles.cardDesc}>Commandez vos plats favoris et suivez votre livraison en temps réel</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.driverCard]} onPress={() => selectRole('driver')}>
        <Text style={styles.cardTitle}>Livreur</Text>
        <Text style={styles.cardDesc}>Acceptez des courses et gérez vos gains</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primaryGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  clientCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryGreen,
  },
  driverCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryOrange,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
