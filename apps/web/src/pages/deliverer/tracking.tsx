import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { TrackingMap } from '../../components/deliverer/TrackingMap';
import { Navigation } from 'lucide-react';

export default function DelivererTracking() {
  const [position, setPosition] = useState({ lat: 3.848, lng: 11.5021 });
  const [activeMission, setActiveMission] = useState<any>(null);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    api.getMissions(token, 'active').then(missions => { if (missions?.length > 0) setActiveMission(missions[0]); });
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        api.updateDelivererLocation(token, latitude, longitude).catch(console.error);
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [token, router]);

  if (!activeMission) {
    return (
      <div className="p-4 flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-[#666666] mb-4">Aucune mission active</p>
          <button onClick={() => router.push('/deliverer/missions')} className="bg-[#D84315] text-white font-bold py-3 px-6 rounded-xl">Voir les missions</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-extrabold text-[#1A1A1A] mb-4">Tracking</h1>
      <TrackingMap
        lat={position.lat} lng={position.lng}
        restaurantLat={activeMission.restaurant?.latitude}
        restaurantLng={activeMission.restaurant?.longitude}
        clientLat={activeMission.deliveryLatitude}
        clientLng={activeMission.deliveryLongitude}
      />
      <div className="mt-4 bg-white rounded-2xl border border-[#E8E4DC] p-4">
        <p className="font-bold text-[#1A1A1A]">{activeMission.restaurant?.name}</p>
        <p className="text-[#666666] text-sm">{activeMission.deliveryAddress}</p>
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.deliveryLatitude},${activeMission.deliveryLongitude}`}
        target="_blank" rel="noopener noreferrer"
        className="mt-4 w-full bg-[#2E7D32] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Navigation className="w-5 h-5" /> Ouvrir dans Maps
      </a>
    </div>
  );
}
