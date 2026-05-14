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
    <div className="p-4">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-4">Gains</h1>
      <EarningsCard totalEarned={earnings.totalEarned} totalWithdrawn={earnings.totalWithdrawn} balance={earnings.balance} />
      <h2 className="font-bold text-[#1A1A1A] mt-6 mb-3">Historique</h2>
      <div className="space-y-2">
        {earnings.history?.map((item: any) => (
          <div key={item.id} className="bg-white rounded-2xl border border-[#E8E4DC] p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-[#1A1A1A] text-sm">{item.restaurant?.name}</p>
              <p className="text-[#999999] text-xs">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#2E7D32]">+{item.earning} FCFA</p>
              <p className="text-[#999999] text-xs">Comm. {item.commission}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => router.push('/deliverer/withdrawals')} className="w-full mt-6 bg-[#D84315] text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-transform">Retirer mes gains</button>
    </div>
  );
}
