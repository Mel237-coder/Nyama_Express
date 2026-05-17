import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

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

function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  const points: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

const ActiveDeliveryMap: React.FC<ActiveDeliveryMapProps> = ({
  restaurantLocation,
  deliveryLocation,
  driverLocation,
  routePolyline,
}) => {
  if (!deliveryLocation || !restaurantLocation) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🗺️</Text>
        <Text style={styles.placeholderText}>Carte non disponible</Text>
        <Text style={styles.placeholderSubtext}>
          L'adresse de livraison n'a pas été définie
        </Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: deliveryLocation.lat,
    longitude: deliveryLocation.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const polylineCoords = routePolyline ? decodePolyline(routePolyline) : null;

  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton
    >
      {/* Restaurant marker */}
      <Marker
        coordinate={{
          latitude: restaurantLocation.lat,
          longitude: restaurantLocation.lng,
        }}
        pinColor="green"
        title="Restaurant"
      />

      {/* Customer marker */}
      <Marker
        coordinate={{
          latitude: deliveryLocation.lat,
          longitude: deliveryLocation.lng,
        }}
        pinColor="orange"
        title="Client"
      />

      {/* Driver marker */}
      {driverLocation && (
        <Marker
          coordinate={{
            latitude: driverLocation.lat,
            longitude: driverLocation.lng,
          }}
          pinColor="blue"
          title="Vous"
        />
      )}

      {/* Route polyline */}
      {polylineCoords && polylineCoords.length > 1 && (
        <Polyline
          coordinates={polylineCoords}
          strokeColor={Colors.primaryOrange}
          strokeWidth={3}
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
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