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
    <div className="p-6">
      <p className="dv-section-label mb-1 animate-slide-up">Opportunités</p>
      <h1 className="dv-page-title mb-5 animate-slide-up d1">Missions</h1>

      <div className="flex gap-2 mb-5 p-1.5 bg-white rounded-[16px] border border-[#E7E5E4] shadow-sm animate-slide-up d2">
        {(['available', 'active', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-[12px] text-xs font-bold transition-all ${tab === t ? 'bg-[#D84315] text-white shadow-[0_2px_8px_rgba(216,67,21,0.25)]' : 'text-[#78716C] hover:text-[#1C1917]'}`}
          >
            {t === 'available' ? 'Disponibles' : t === 'active' ? 'Actives' : 'Historique'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-[#D84315] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-16 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F2ED] flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📭</span>
          </div>
          <p className="text-[#A8A29E] font-medium">Aucune mission pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((mission, i) => (
            <div key={mission.id} style={{ animationDelay: `${i * 0.06}s` }} className="animate-slide-up">
              <MissionCard mission={mission} showAccept={tab === 'available'} onAccept={() => acceptMission(mission.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
