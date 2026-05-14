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

  if (!earnings) return <div className="p-4 text-[#9B958D] font-body">Chargement...</div>;

  return (
    <div className="p-6 font-body">
      <p className="text-[#9B958D] text-xs font-semibold tracking-widest uppercase mb-1 animate-reveal-up">Finances</p>
      <h1 className="font-display text-3xl text-[#1C1917] mb-6 animate-reveal-up stagger-1">Gains</h1>
      <EarningsCard totalEarned={earnings.totalEarned} totalWithdrawn={earnings.totalWithdrawn} balance={earnings.balance} />

      <h2 className="font-bold text-[#1C1917] mt-8 mb-4 text-sm font-body flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" /> Historique
      </h2>
      <div className="space-y-3">
        {earnings.history?.map((item: any, i: number) => (
          <div key={item.id} className="card-luxe-sym p-4 flex justify-between items-center animate-reveal-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl icon-box-gold flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">{item.earning}</span>
              </div>
              <div>
                <p className="font-bold text-[#1C1917] text-sm font-body">{item.restaurant?.name}</p>
                <p className="text-[#9B958D] text-xs">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#3D6B4F] font-body">+{item.earning} FCFA</p>
              <p className="text-[#9B958D] text-[10px]">Comm. {item.commission}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => router.push('/deliverer/withdrawals')} className="w-full mt-6 btn-luxe py-4 flex items-center justify-center gap-2">
        Retirer mes gains <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
}
