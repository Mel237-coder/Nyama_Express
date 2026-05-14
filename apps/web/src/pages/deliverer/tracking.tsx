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
        <div className="text-center animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-4"><Radio className="w-10 h-10 text-[#999999]" /></div>
          <p className="text-[#666666] mb-4">Aucune mission active</p>
          <button onClick={() => router.push('/deliverer/missions')} className="btn-premium py-3 px-6">Voir les missions</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-4 animate-fade-in-up">Tracking</h1>
      <div className="rounded-3xl overflow-hidden shadow-lg mb-4 animate-fade-in-up stagger-1">
        <TrackingMap
          lat={position.lat} lng={position.lng}
          restaurantLat={activeMission.restaurant?.latitude}
          restaurantLng={activeMission.restaurant?.longitude}
          clientLat={activeMission.deliveryLatitude}
          clientLng={activeMission.deliveryLongitude}
        />
      </div>
      <div className="card-premium p-4 mb-4 animate-fade-in-up stagger-2">
        <p className="font-bold text-[#1A1A1A]">{activeMission.restaurant?.name}</p>
        <p className="text-[#666666] text-sm">{activeMission.deliveryAddress}</p>
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.deliveryLatitude},${activeMission.deliveryLongitude}`}
        target="_blank" rel="noopener noreferrer"
        className="w-full bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-[0_4px_20px_rgba(46,125,50,0.3)] hover:shadow-[0_6px_28px_rgba(46,125,50,0.4)] animate-fade-in-up stagger-3"
      >
        <Navigation className="w-5 h-5" /> Ouvrir dans Maps
      </a>
    </div>
  );
}
