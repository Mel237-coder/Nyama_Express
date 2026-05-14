import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../../lib/api';
import { TrackingMap } from '../../../components/deliverer/TrackingMap';
import { StatusButtons } from '../../../components/deliverer/StatusButtons';
import { ArrowLeft, Phone } from 'lucide-react';

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
    <div className="p-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-[#666666] mb-4"><ArrowLeft className="w-5 h-5" /> Retour</button>
      <h1 className="text-xl font-extrabold text-[#1A1A1A] mb-4">Mission #{mission.id?.slice(-6)}</h1>

      <TrackingMap
        lat={mission.restaurant?.latitude || 3.848}
        lng={mission.restaurant?.longitude || 11.5021}
        restaurantLat={mission.restaurant?.latitude}
        restaurantLng={mission.restaurant?.longitude}
        clientLat={mission.deliveryLatitude}
        clientLng={mission.deliveryLongitude}
      />

      <div className="mt-4 bg-white rounded-2xl border border-[#E8E4DC] p-4">
        <h2 className="font-bold text-[#1A1A1A] mb-2">Restaurant</h2>
        <p className="text-[#666666] text-sm">{mission.restaurant?.name}</p>
        <p className="text-[#666666] text-sm">{mission.restaurant?.address}</p>
        <a href={`tel:${mission.restaurant?.phone}`} className="flex items-center gap-2 text-[#D84315] text-sm mt-2 font-bold"><Phone className="w-4 h-4" /> Appeler</a>
      </div>

      <div className="mt-3 bg-white rounded-2xl border border-[#E8E4DC] p-4">
        <h2 className="font-bold text-[#1A1A1A] mb-2">Client</h2>
        <p className="text-[#666666] text-sm">{mission.deliveryAddress}</p>
        <p className="text-[#666666] text-sm">{mission.client?.firstName} {mission.client?.lastName}</p>
      </div>

      <div className="mt-4"><StatusButtons currentStatus={mission.status} onStatusChange={handleStatusChange} /></div>
    </div>
  );
}
