import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { EarningsCard } from '../../components/deliverer/EarningsCard';

export default function DelivererEarnings() {
  const [earnings, setEarnings] = useState<any>(null);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    api.getEarnings(token).then(setEarnings).catch(console.error);
  }, [token, router]);

  if (!earnings) return <div className="p-4 text-[#999999]">Chargement...</div>;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-5 animate-fade-in-up">Gains</h1>
      <EarningsCard totalEarned={earnings.totalEarned} totalWithdrawn={earnings.totalWithdrawn} balance={earnings.balance} />

      <h2 className="font-bold text-[#1A1A1A] mt-6 mb-3 text-sm">Historique</h2>
      <div className="space-y-3">
        {earnings.history?.map((item: any, i: number) => (
          <div key={item.id} className="card-premium p-4 flex justify-between items-center animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F9A825] to-[#F57F17] flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">{item.earning}</span>
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A] text-sm">{item.restaurant?.name}</p>
                <p className="text-[#999999] text-xs">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#2E7D32]">+{item.earning} FCFA</p>
              <p className="text-[#999999] text-[10px]">Comm. {item.commission}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => router.push('/deliverer/withdrawals')} className="w-full mt-6 btn-premium py-4">Retirer mes gains</button>
    </div>
  );
}
