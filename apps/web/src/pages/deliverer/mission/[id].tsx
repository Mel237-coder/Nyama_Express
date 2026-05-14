import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../../lib/api';
import { TrackingMap } from '../../../components/deliverer/TrackingMap';
import { StatusButtons } from '../../../components/deliverer/StatusButtons';
import { ArrowLeft, Phone, MapPin } from 'lucide-react';

export default function MissionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [mission, setMission] = useState<any>(null);
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!id || !token) return;
    api.getOrder(id as string, token).then(setMission).catch(console.error);
  }, [id, token]);

  const handleStatusChange = async (status: string) => {
    if (!token || !id) return;
    try {
      await api.updateMissionStatus(id as string, status, token);
      if (status === 'DELIVERED') router.push('/deliverer/missions');
      else api.getOrder(id as string, token).then(setMission);
    } catch (e) { alert('Erreur de mise à jour'); }
  };

  if (!mission) return <div className="p-4 text-[#9B958D] font-body">Chargement...</div>;

  return (
    <div className="p-6 font-body">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-[#6B6560] mb-6 hover:text-[#1C1917] transition-colors animate-reveal-up">
        <ArrowLeft className="w-5 h-5" /> Retour
      </button>

      <div className="mb-6 animate-reveal-up stagger-1">
        <p className="text-[#9B958D] text-xs font-semibold tracking-widest uppercase mb-1">MISSION #{mission.id?.slice(-6).toUpperCase()}</p>
        <h1 className="font-display text-3xl text-[#1C1917]">{mission.restaurant?.name}</h1>
      </div>

      <div className="rounded-[24px] overflow-hidden shadow-warm mb-6 animate-reveal-up stagger-2">
        <TrackingMap
          lat={mission.restaurant?.latitude || 3.848}
          lng={mission.restaurant?.longitude || 11.5021}
          restaurantLat={mission.restaurant?.latitude}
          restaurantLng={mission.restaurant?.longitude}
          clientLat={mission.deliveryLatitude}
          clientLng={mission.deliveryLongitude}
        />
      </div>

      <div className="space-y-3 mb-6">
        <div className="card-luxe p-5 flex items-start gap-3 animate-reveal-up stagger-3">
          <div className="w-10 h-10 rounded-xl bg-[#C73E1D]/10 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-[#C73E1D]" /></div>
          <div>
            <p className="font-bold text-[#1C1917] text-sm font-body">Restaurant</p>
            <p className="text-[#6B6560] text-xs">{mission.restaurant?.address}</p>
            <a href={`tel:${mission.restaurant?.phone}`} className="flex items-center gap-1 text-[#C73E1D] text-xs mt-1 font-bold"><Phone className="w-3 h-3" /> Appeler</a>
          </div>
        </div>

        <div className="card-luxe p-5 flex items-start gap-3 animate-reveal-up stagger-4">
          <div className="w-10 h-10 rounded-xl bg-[#3D6B4F]/10 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-[#3D6B4F]" /></div>
          <div>
            <p className="font-bold text-[#1C1917] text-sm font-body">Client</p>
            <p className="text-[#6B6560] text-xs">{mission.deliveryAddress}</p>
            <p className="text-[#6B6560] text-xs">{mission.client?.firstName} {mission.client?.lastName}</p>
          </div>
        </div>
      </div>

      <div className="animate-reveal-up stagger-5"><StatusButtons currentStatus={mission.status} onStatusChange={handleStatusChange} /></div>
    </div>
  );
}
