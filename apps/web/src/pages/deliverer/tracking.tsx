import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { TrackingMap } from '../../components/deliverer/TrackingMap';
import { Navigation, Radio } from 'lucide-react';

export default function DelivererTracking() {
  const [position, setPosition] = useState({ lat: 3.848, lng: 11.5021 });
  const [activeMission, setActiveMission] = useState<any>(null);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    api.getMissions(token, 'active').then((missions: any[]) => { if (missions?.length > 0) setActiveMission(missions[0]); });
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F2ED] flex items-center justify-center mx-auto mb-3"><Radio className="w-8 h-8 text-[#A8A29E]" /></div>
          <p className="text-[#78716C] mb-4 font-medium">Aucune mission active</p>
          <button onClick={() => router.push('/deliverer/missions')} className="dv-btn py-3 px-6">Voir les missions</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <p className="dv-section-label mb-1 animate-slide-up">Navigation</p>
      <h1 className="dv-page-title mb-4 animate-slide-up d1">Tracking</h1>
      <div className="mb-4 animate-slide-up d2">
        <TrackingMap
          lat={position.lat} lng={position.lng}
          restaurantLat={activeMission.restaurant?.latitude}
          restaurantLng={activeMission.restaurant?.longitude}
          clientLat={activeMission.deliveryLatitude}
          clientLng={activeMission.deliveryLongitude}
        />
      </div>
      <div className="dv-card p-4 mb-4 animate-slide-up d3">
        <p className="font-bold text-[#1C1917]">{activeMission.restaurant?.name}</p>
        <p className="text-[#78716C] text-sm">{activeMission.deliveryAddress}</p>
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.deliveryLatitude},${activeMission.deliveryLongitude}`}
        target="_blank" rel="noopener noreferrer"
        className="w-full bg-[#166534] text-white font-bold py-4 rounded-[14px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-[0_4px_16px_rgba(22,101,52,0.30)] hover:shadow-[0_6px_24px_rgba(22,101,52,0.40)] animate-slide-up d4"
      >
        <Navigation className="w-5 h-5" /> Ouvrir dans Maps
      </a>
    </div>
  );
}
