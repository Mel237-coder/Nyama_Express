import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { StatusBadge } from '../../components/deliverer/StatusBadge';
import { Power, MapPin, TrendingUp, Bell } from 'lucide-react';

export default function DelivererDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    api.getDelivererStatus(token).then((s: any) => { setStatus(s); setOnline(s.isOnline); }).catch(() => router.push('/deliverer/login')).finally(() => setLoading(false));
  }, [token, router]);

  const toggleOnline = async () => {
    if (!token) return;
    if (online) { await api.setDelivererOffline(token); setOnline(false); }
    else { await api.setDelivererOnline(token); setOnline(true); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-[#78716C]">Chargement...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <div>
          <p className="dv-section-label mb-1">Bienvenue</p>
          <h1 className="dv-page-title">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl bg-white border border-[#E7E5E4] shadow-sm flex items-center justify-center text-[#78716C] hover:text-[#D84315] transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <StatusBadge status={online ? 'ONLINE' : 'OFFLINE'} />
        </div>
      </div>

      <div className="mb-6 animate-slide-up d1">
        <button onClick={toggleOnline}
          className={`w-full py-5 rounded-[16px] font-bold text-white text-base flex items-center justify-center gap-3 transition-all duration-300 ${online ? 'bg-[#78716C] shadow-md' : 'bg-[#166534] shadow-[0_8px_24px_rgba(22,101,52,0.30)] hover:shadow-[0_12px_32px_rgba(22,101,52,0.40)]'}`}
        >
          <Power className="w-6 h-6" strokeWidth={2.5} />
          {online ? 'Passer hors ligne' : 'Passer en ligne'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 animate-slide-up d2">
        <button onClick={() => router.push('/deliverer/missions')} className="dv-card p-5 text-left active:scale-[0.98] transition-transform">
          <div className="dv-icon-red w-12 h-12 rounded-[14px] mb-3">
            <MapPin className="w-6 h-6" />
          </div>
          <p className="font-bold text-[#1C1917] text-[15px]">Missions</p>
          <p className="text-[#A8A29E] text-xs font-medium mt-0.5">Voir disponibles</p>
        </button>
        <button onClick={() => router.push('/deliverer/earnings')} className="dv-card p-5 text-left active:scale-[0.98] transition-transform">
          <div className="dv-icon-gold w-12 h-12 rounded-[14px] mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="font-bold text-[#1C1917] text-[15px]">Gains</p>
          <p className="text-[#A8A29E] text-xs font-medium mt-0.5">Historique</p>
        </button>
      </div>
    </div>
  );
}
