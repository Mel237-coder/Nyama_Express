import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { Wallet } from 'lucide-react';

export default function DelivererWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('mtn_momo');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(0);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    loadData();
  }, [token, router]);

  const loadData = async () => {
    const [wList, earnings] = await Promise.all([api.getWithdrawals(token!), api.getEarnings(token!)]) as [any[], any];
    setWithdrawals(wList || []);
    setBalance(earnings.balance);
  };

  const handleWithdraw = async () => {
    if (!token) return;
    const numAmount = parseInt(amount);
    if (numAmount < 500) { alert('Montant minimum 500 FCFA'); return; }
    if (numAmount > balance) { alert('Solde insuffisant'); return; }
    try { await api.createWithdrawal({ amount: numAmount, provider, providerAccount: phone }, token); setAmount(''); loadData(); }
    catch (e) { alert('Erreur lors du retrait'); }
  };

  return (
    <div className="p-6">
      <p className="dv-section-label mb-1 animate-slide-up">Finances</p>
      <h1 className="dv-page-title mb-5 animate-slide-up d1">Retraits</h1>

      <div className="dv-card p-6 mb-5 text-center shadow-md animate-slide-up d2">
        <div className="dv-icon-gold w-14 h-14 rounded-[14px] mx-auto mb-3">
          <Wallet className="w-7 h-7" />
        </div>
        <p className="text-[#78716C] text-sm font-medium">Solde disponible</p>
        <p className="text-3xl font-extrabold text-[#1C1917] mt-1">{balance} FCFA</p>
      </div>

      <div className="dv-card p-5 mb-5 animate-slide-up d3">
        <h2 className="font-bold text-[#1C1917] mb-4 text-sm">Nouveau retrait</h2>
        <div className="space-y-2.5">
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (min 500)" type="number" className="dv-input" />
          <select value={provider} onChange={e => setProvider(e.target.value)} className="dv-input appearance-none">
            <option value="mtn_momo">MTN MoMo</option>
            <option value="orange_money">Orange Money</option>
          </select>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro de téléphone" className="dv-input" />
          <button onClick={handleWithdraw} className="w-full dv-btn py-3.5">Retirer</button>
        </div>
      </div>

      <h2 className="font-bold text-[#1C1917] mb-3 text-sm flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-[#D97706]" /> Historique
      </h2>
      <div className="space-y-2.5">
        {withdrawals.map((w, i) => (
          <div key={w.id} className="dv-card p-4 flex justify-between items-center animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${w.status === 'COMPLETED' ? 'dv-icon-green' : w.status === 'FAILED' ? 'dv-icon-red' : 'dv-icon-gold'}`}>
                <span className="font-bold text-xs">{w.amount}</span>
              </div>
              <div>
                <p className="font-bold text-[#1C1917] text-sm">{w.amount} FCFA</p>
                <p className="text-[#A8A29E] text-xs">{w.provider === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}</p>
              </div>
            </div>
            <span className={`dv-badge ${w.status === 'COMPLETED' ? 'bg-[#166534] text-white' : w.status === 'FAILED' ? 'bg-[#D84315] text-white' : 'bg-[#D97706] text-white'}`}>
              {w.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
