import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { EarningsCard } from '../../components/deliverer/EarningsCard';
import { ArrowUpRight } from 'lucide-react';

export default function DelivererEarnings() {
  const [earnings, setEarnings] = useState<any>(null);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    api.getEarnings(token).then(setEarnings).catch(console.error);
  }, [token, router]);

  if (!earnings) return <div className="p-4 text-[#A8A29E]">Chargement...</div>;

  return (
    <div className="p-6">
      <p className="dv-section-label mb-1 animate-slide-up">Finances</p>
      <h1 className="dv-page-title mb-5 animate-slide-up d1">Gains</h1>
      <EarningsCard totalEarned={earnings.totalEarned} totalWithdrawn={earnings.totalWithdrawn} balance={earnings.balance} />

      <h2 className="font-bold text-[#1C1917] mt-7 mb-3 text-sm flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-[#D97706]" /> Historique
      </h2>
      <div className="space-y-2.5">
        {earnings.history?.map((item: any, i: number) => (
          <div key={item.id} className="dv-card p-4 flex justify-between items-center animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="flex items-center gap-3">
              <div className="dv-icon-gold w-10 h-10 rounded-[12px]">
                <span className="text-white font-bold text-[11px]">{item.earning}</span>
              </div>
              <div>
                <p className="font-bold text-[#1C1917] text-sm">{item.restaurant?.name}</p>
                <p className="text-[#A8A29E] text-xs">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#166534]">+{item.earning} FCFA</p>
              <p className="text-[#A8A29E] text-[10px]">Comm. {item.commission}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => router.push('/deliverer/withdrawals')} className="w-full mt-6 dv-btn py-4 flex items-center justify-center gap-2">
        Retirer mes gains <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
}
