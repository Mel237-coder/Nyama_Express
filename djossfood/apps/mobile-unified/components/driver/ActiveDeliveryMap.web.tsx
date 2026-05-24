import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { FontSizes } from '@/constants/typography';
import { FontWeights } from '@/constants/typography';

interface Location {
  lat: number;
  lng: number;
}

interface ActiveDeliveryMapProps {
  restaurantLocation: Location | null;
  deliveryLocation: Location | null;
  driverLocation: Location | null;
  routePolyline: string | null;
}

const ActiveDeliveryMap: React.FC<ActiveDeliveryMapProps> = () => {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderIcon}>🗺️</Text>
      <Text style={styles.placeholderText}>Carte non disponible sur le web</Text>
      <Text style={styles.placeholderSubtext}>
        La carte  s'affichera sur l'application mobile
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  placeholderSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default ActiveDeliveryMap;
