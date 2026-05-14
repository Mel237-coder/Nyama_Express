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
    <div className="p-5">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-5 animate-fade-in-up">Missions</h1>

      <div className="flex gap-2 mb-5 p-1 bg-white rounded-2xl shadow-sm animate-fade-in-up stagger-1">
        {(['available', 'active', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-[#D84315] text-white shadow-md' : 'text-[#666666] hover:text-[#1A1A1A]'}`}
          >
            {t === 'available' ? 'Disponibles' : t === 'active' ? 'Actives' : 'Historique'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#D84315] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <p className="text-[#999999]">Aucune mission</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((mission, i) => (
            <div key={mission.id} style={{ animationDelay: `${i * 0.1}s` }}>
              <MissionCard mission={mission} showAccept={tab === 'available'} onAccept={() => acceptMission(mission.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
