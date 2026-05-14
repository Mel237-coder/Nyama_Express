import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { MissionCard } from '../../components/deliverer/MissionCard';

export default function DelivererMissions() {
  const [missions, setMissions] = useState<any[]>([]);
  const [tab, setTab] = useState<'available' | 'active' | 'history'>('available');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    loadMissions();
  }, [tab, token, router]);

  const loadMissions = async () => {
    setLoading(true);
    try { const data = await api.getMissions(token!, tab) as any[]; setMissions(data || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const acceptMission = async (orderId: string) => {
    if (!token) return;
    try { await api.acceptMission(orderId, token); router.push(`/deliverer/mission/${orderId}`); }
    catch (e) { alert('Mission déjà prise ou erreur'); loadMissions(); }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-4">Missions</h1>
      <div className="flex gap-2 mb-4">
        {(['available', 'active', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-sm font-bold ${tab === t ? 'bg-[#D84315] text-white' : 'bg-white text-[#666666] border border-[#E8E4DC]'}`}>
            {t === 'available' ? 'Disponibles' : t === 'active' ? 'Actives' : 'Historique'}
          </button>
        ))}
      </div>
      {loading ? <p className="text-[#999999] text-center py-8">Chargement...</p> : missions.length === 0 ? <p className="text-[#999999] text-center py-8">Aucune mission</p> : (
        <div className="space-y-3">{missions.map(mission => <MissionCard key={mission.id} mission={mission} showAccept={tab === 'available'} onAccept={() => acceptMission(mission.id)} />)}</div>
      )}
    </div>
  );
}
