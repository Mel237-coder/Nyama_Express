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
    <div className="p-6 font-body">
      <p className="text-[#9B958D] text-xs font-semibold tracking-widest uppercase mb-1 animate-reveal-up">Opportunités</p>
      <h1 className="font-display text-3xl text-[#1C1917] mb-6 animate-reveal-up stagger-1">Missions</h1>

      <div className="flex gap-2 mb-6 p-1.5 bg-white rounded-[20px] shadow-warm-sm animate-reveal-up stagger-2">
        {(['available', 'active', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 rounded-[16px] text-xs font-bold transition-all font-body ${tab === t ? 'bg-gradient-to-r from-[#C73E1D] to-[#D84315] text-white shadow-terracotta' : 'text-[#6B6560] hover:text-[#1C1917]'}`}
          >
            {t === 'available' ? 'Disponibles' : t === 'active' ? 'Actives' : 'Historique'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-[3px] border-[#C73E1D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-16 animate-reveal-up">
          <div className="w-16 h-16 rounded-2xl bg-[#E8E0D4] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📭</span>
          </div>
          <p className="text-[#9B958D] font-medium">Aucune mission pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((mission, i) => (
            <div key={mission.id} style={{ animationDelay: `${i * 0.08}s` }} className="animate-reveal-up">
              <MissionCard mission={mission} showAccept={tab === 'available'} onAccept={() => acceptMission(mission.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
