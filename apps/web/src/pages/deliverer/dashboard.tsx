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

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666666]">Chargement...</div>;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-[#666666] text-sm mt-1">Bienvenue, livreur</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#666666] hover:text-[#D84315] transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <StatusBadge status={online ? 'ONLINE' : 'OFFLINE'} />
        </div>
      </div>

      {/* Big Online Toggle */}
      <div className="mb-8 animate-fade-in-up stagger-1">
        <button
          onClick={toggleOnline}
          className={`w-full py-6 rounded-3xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all duration-500 ${online ? 'bg-gradient-to-r from-[#999999] to-[#757575] shadow-lg' : 'bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] shadow-[0_8px_32px_rgba(46,125,50,0.3)] hover:shadow-[0_12px_40px_rgba(46,125,50,0.4)]'}`}
        >
          <Power className="w-6 h-6" />
          {online ? 'Passer hors ligne' : 'Passer en ligne'}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in-up stagger-2">
        <button onClick={() => router.push('/deliverer/missions')} className="card-premium p-5 text-left group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D84315] to-[#BF360C] flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-[#1A1A1A]">Missions</p>
          <p className="text-[#999999] text-xs">Voir disponibles</p>
        </button>
        <button onClick={() => router.push('/deliverer/earnings')} className="card-premium p-5 text-left group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F9A825] to-[#F57F17] flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-[#1A1A1A]">Gains</p>
          <p className="text-[#999999] text-xs">Historique</p>
        </button>
      </div>
    </div>
  );
}
