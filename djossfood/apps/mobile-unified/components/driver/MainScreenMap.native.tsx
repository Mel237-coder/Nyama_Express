import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Colors } from '@/constants/colors';

interface MainScreenMapProps {
  driverLocation: { latitude: number; longitude: number } | null;
  isOnline: boolean;
  vehicleType?: string;
}

const DOUALA_REGION = {
  latitude: 4.0511,
  longitude: 9.7679,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MainScreenMap: React.FC<MainScreenMapProps> = ({ driverLocation, isOnline, vehicleType }) => {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={DOUALA_REGION}
      showsUserLocation={isOnline}
      showsMyLocationButton={isOnline}
      region={
        driverLocation && isOnline
          ? {
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }
          : undefined
      }
    >
      {isOnline && driverLocation && (
        <Marker
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          title={vehicleType === 'moto' ? 'Moto' : 'Voiture'}
          description="Votre position"
          pinColor={Colors.primaryGreen}
        />
      )}
    </MapView>
  );
};

export default MainScreenMap;
