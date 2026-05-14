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

  if (!mission) return <div className="p-4 text-[#999999]">Chargement...</div>;

  return (
    <div className="p-5">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-[#666666] mb-5 hover:text-[#1A1A1A] transition-colors">
        <ArrowLeft className="w-5 h-5" /> Retour
      </button>

      <div className="mb-5 animate-fade-in-up">
        <p className="text-[#999999] text-xs font-medium mb-1">MISSION #{mission.id?.slice(-6).toUpperCase()}</p>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">{mission.restaurant?.name}</h1>
      </div>

      <div className="rounded-3xl overflow-hidden shadow-lg mb-5 animate-fade-in-up stagger-1">
        <TrackingMap
          lat={mission.restaurant?.latitude || 3.848}
          lng={mission.restaurant?.longitude || 11.5021}
          restaurantLat={mission.restaurant?.latitude}
          restaurantLng={mission.restaurant?.longitude}
          clientLat={mission.deliveryLatitude}
          clientLng={mission.deliveryLongitude}
        />
      </div>

      <div className="space-y-3 mb-5">
        <div className="card-premium p-4 flex items-start gap-3 animate-fade-in-up stagger-2">
          <div className="w-10 h-10 rounded-xl bg-[#D84315]/10 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-[#D84315]" /></div>
          <div>
            <p className="font-bold text-[#1A1A1A] text-sm">Restaurant</p>
            <p className="text-[#666666] text-xs">{mission.restaurant?.address}</p>
            <a href={`tel:${mission.restaurant?.phone}`} className="flex items-center gap-1 text-[#D84315] text-xs mt-1 font-bold"><Phone className="w-3 h-3" /> Appeler</a>
          </div>
        </div>

        <div className="card-premium p-4 flex items-start gap-3 animate-fade-in-up stagger-3">
          <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-[#2E7D32]" /></div>
          <div>
            <p className="font-bold text-[#1A1A1A] text-sm">Client</p>
            <p className="text-[#666666] text-xs">{mission.deliveryAddress}</p>
            <p className="text-[#666666] text-xs">{mission.client?.firstName} {mission.client?.lastName}</p>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up stagger-4"><StatusButtons currentStatus={mission.status} onStatusChange={handleStatusChange} /></div>
    </div>
  );
}
