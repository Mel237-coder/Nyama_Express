import * as Location from 'expo-location';

let locationSubscription: Location.LocationSubscription | null = null;

export async function getCurrentPosition(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Location] Permission denied');
      return null;
    }
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  } catch (err) {
    console.error('[Location] getCurrentPosition error:', err);
    return null;
  }
}

export async function startLocationUpdates(callback?: (location: Location.LocationObject) => void): Promise<void> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Location] Permission denied for updates');
      return;
    }

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        callback?.(location);
      },
    );
  } catch (err) {
    console.error('[Location] startLocationUpdates error:', err);
  }
}

export function stopLocationUpdates(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}
