import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { StatusBadge } from '../../components/deliverer/StatusBadge';
import { Power, MapPin } from 'lucide-react';

export default function DelivererDashboard() {
  const [status, setStatus] = useState<any>(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    api.getDelivererStatus(token).then(s => { setStatus(s); setOnline(s.isOnline); }).catch(() => router.push('/deliverer/login')).finally(() => setLoading(false));
  }, [token, router]);

  const toggleOnline = async () => {
    if (!token) return;
    if (online) { await api.setDelivererOffline(token); setOnline(false); }
    else { await api.setDelivererOnline(token); setOnline(true); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-[#666666]">Chargement...</div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-extrabold text-[#1A1A1A]">Dashboard</h1><p className="text-[#666666] text-sm">Bienvenue, livreur</p></div>
        <StatusBadge status={online ? 'ONLINE' : 'OFFLINE'} />
      </div>

      <button onClick={toggleOnline} className={`w-full py-4 rounded-2xl font-bold text-white mb-6 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${online ? 'bg-[#999999]' : 'bg-[#2E7D32]'}`}>
        <Power className="w-5 h-5" />{online ? 'Passer hors ligne' : 'Passer en ligne'}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push('/deliverer/missions')} className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-left active:scale-[0.98] transition-transform">
          <MapPin className="w-6 h-6 text-[#D84315] mb-2" /><p className="font-bold text-[#1A1A1A]">Missions</p><p className="text-[#999999] text-xs">Voir disponibles</p>
        </button>
        <button onClick={() => router.push('/deliverer/earnings')} className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-left active:scale-[0.98] transition-transform">
          <p className="text-2xl font-extrabold text-[#F9A825]">FCFA</p><p className="font-bold text-[#1A1A1A]">Gains</p><p className="text-[#999999] text-xs">Historique</p>
        </button>
      </div>
    </div>
  );
}
