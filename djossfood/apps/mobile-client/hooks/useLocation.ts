import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission de localisation refusée');
          setLoading(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });

        let city: string | undefined;
        try {
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          city = geo?.city || undefined;
        } catch {}

        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          city,
        });
      } catch (err: any) {
        setError(err.message || 'Impossible d\'obtenir la localisation');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, error, loading };
}