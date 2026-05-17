import * as Location from 'expo-location';
import { emitLocationUpdate } from './socket';
import { useAuthStore } from '../stores/authStore';

let locationSubscription: Location.LocationSubscription | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function startLocationUpdates(): Promise<void> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.warn('[Location] Permission not granted');
    return;
  }

  await stopLocationUpdates(); // Stop any existing subscription

  locationSubscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
    (location) => {
      const { driver } = useAuthStore.getState();
      if (driver?.id) {
        emitLocationUpdate(driver.id, location.coords.latitude, location.coords.longitude);
      }
    },
  );
}

export async function stopLocationUpdates(): Promise<void> {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}

export async function getCurrentPosition(): Promise<Location.LocationObject | null> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return null;
  try {
    return await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  } catch {
    return null;
  }
}