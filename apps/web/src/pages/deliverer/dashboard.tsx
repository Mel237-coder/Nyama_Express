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

  if (loading) return <div className="flex items-center justify-center h-screen text-[#6B6560] font-body">Chargement...</div>;

  return (
    <div className="p-6 font-body">
      <div className="flex items-center justify-between mb-8 animate-reveal-up">
        <div>
          <p className="text-[#9B958D] text-xs font-semibold tracking-widest uppercase mb-1">Bienvenue</p>
          <h1 className="font-display text-3xl text-[#1C1917]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-11 h-11 rounded-2xl bg-white shadow-warm-sm flex items-center justify-center text-[#6B6560] hover:text-[#C73E1D] transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <StatusBadge status={online ? 'ONLINE' : 'OFFLINE'} />
        </div>
      </div>

      <div className="mb-8 animate-reveal-up stagger-1">
        <button
          onClick={toggleOnline}
          className={`w-full py-6 rounded-[24px] font-bold text-white text-lg flex items-center justify-center gap-3 transition-all duration-500 font-body ${online ? 'bg-gradient-to-r from-[#6B6560] to-[#4A4540] shadow-warm' : 'bg-gradient-to-r from-[#3D6B4F] to-[#2A4D38] shadow-[0_12px_40px_rgba(61,107,79,0.35)] hover:shadow-[0_16px_48px_rgba(61,107,79,0.45)]'}`}
        >
          <Power className="w-6 h-6" strokeWidth={2.5} />
          {online ? 'Passer hors ligne' : 'Passer en ligne'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 animate-reveal-up stagger-2">
        <button onClick={() => router.push('/deliverer/missions')} className="card-luxe p-6 text-left group">
          <div className="w-12 h-12 rounded-2xl icon-box flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-[#1C1917] font-body text-lg">Missions</p>
          <p className="text-[#9B958D] text-xs font-medium mt-1">Voir disponibles</p>
        </button>
        <button onClick={() => router.push('/deliverer/earnings')} className="card-luxe p-6 text-left group">
          <div className="w-12 h-12 rounded-2xl icon-box-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-[#1C1917] font-body text-lg">Gains</p>
          <p className="text-[#9B958D] text-xs font-medium mt-1">Historique</p>
        </button>
      </div>
    </div>
  );
}
