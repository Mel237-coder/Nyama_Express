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
      <div className="min-h-screen flex items-center justify-center p-4 font-body">
        <div className="text-center animate-reveal-up">
          <div className="w-20 h-20 rounded-full bg-[#F3EDE4] flex items-center justify-center mx-auto mb-4"><Radio className="w-10 h-10 text-[#9B958D]" /></div>
          <p className="text-[#6B6560] mb-4 font-medium">Aucune mission active</p>
          <button onClick={() => router.push('/deliverer/missions')} className="btn-luxe py-3 px-6">Voir les missions</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 font-body">
      <p className="text-[#9B958D] text-xs font-semibold tracking-widest uppercase mb-1 animate-reveal-up">Navigation</p>
      <h1 className="font-display text-3xl text-[#1C1917] mb-5 animate-reveal-up stagger-1">Tracking</h1>
      <div className="rounded-[24px] overflow-hidden shadow-warm mb-5 animate-reveal-up stagger-2">
        <TrackingMap
          lat={position.lat} lng={position.lng}
          restaurantLat={activeMission.restaurant?.latitude}
          restaurantLng={activeMission.restaurant?.longitude}
          clientLat={activeMission.deliveryLatitude}
          clientLng={activeMission.deliveryLongitude}
        />
      </div>
      <div className="card-luxe p-5 mb-5 animate-reveal-up stagger-3">
        <p className="font-bold text-[#1C1917] font-body">{activeMission.restaurant?.name}</p>
        <p className="text-[#6B6560] text-sm">{activeMission.deliveryAddress}</p>
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.deliveryLatitude},${activeMission.deliveryLongitude}`}
        target="_blank" rel="noopener noreferrer"
        className="w-full bg-gradient-to-r from-[#3D6B4F] to-[#2A4D38] text-white font-bold py-4 rounded-[16px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-[0_4px_20px_rgba(61,107,79,0.3)] hover:shadow-[0_6px_28px_rgba(61,107,79,0.4)] animate-reveal-up stagger-4 font-body"
      >
        <Navigation className="w-5 h-5" /> Ouvrir dans Maps
      </a>
    </div>
  );
}
