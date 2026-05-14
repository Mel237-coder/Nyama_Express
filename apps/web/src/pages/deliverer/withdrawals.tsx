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
    <div className="p-6 font-body">
      <p className="text-[#9B958D] text-xs font-semibold tracking-widest uppercase mb-1 animate-reveal-up">Finances</p>
      <h1 className="font-display text-3xl text-[#1C1917] mb-6 animate-reveal-up stagger-1">Retraits</h1>

      <div className="glass-strong-luxe rounded-[24px] p-7 mb-6 text-center shadow-warm animate-reveal-up stagger-2">
        <div className="w-14 h-14 rounded-2xl icon-box-gold flex items-center justify-center mx-auto mb-4 shadow-md">
          <Wallet className="w-7 h-7 text-white" />
        </div>
        <p className="text-[#6B6560] text-sm font-medium">Solde disponible</p>
        <p className="font-display text-4xl text-[#1C1917] mt-2">{balance} FCFA</p>
      </div>

      <div className="card-luxe p-6 mb-6 animate-reveal-up stagger-3">
        <h2 className="font-bold text-[#1C1917] mb-5 text-sm font-body">Nouveau retrait</h2>
        <div className="space-y-3">
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (min 500)" type="number"
            className="input-luxe" />
          <select value={provider} onChange={e => setProvider(e.target.value)}
            className="input-luxe appearance-none"
          >
            <option value="mtn_momo">MTN MoMo</option>
            <option value="orange_money">Orange Money</option>
          </select>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro de téléphone"
            className="input-luxe" />
          <button onClick={handleWithdraw} className="w-full btn-luxe py-4">Retirer</button>
        </div>
      </div>

      <h2 className="font-bold text-[#1C1917] mb-4 text-sm font-body flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" /> Historique
      </h2>
      <div className="space-y-3">
        {withdrawals.map((w, i) => (
          <div key={w.id} className="card-luxe-sym p-4 flex justify-between items-center animate-reveal-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${w.status === 'COMPLETED' ? 'bg-[#3D6B4F]/10' : w.status === 'FAILED' ? 'bg-[#C73E1D]/10' : 'bg-[#D4A017]/10'}`}>
                <span className={`font-bold text-xs ${w.status === 'COMPLETED' ? 'text-[#3D6B4F]' : w.status === 'FAILED' ? 'text-[#C73E1D]' : 'text-[#D4A017]'}`}>{w.amount}</span>
              </div>
              <div>
                <p className="font-bold text-[#1C1917] text-sm font-body">{w.amount} FCFA</p>
                <p className="text-[#9B958D] text-xs">{w.provider === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-body ${w.status === 'COMPLETED' ? 'bg-[#3D6B4F] text-white' : w.status === 'FAILED' ? 'bg-[#C73E1D] text-white' : 'bg-[#D4A017] text-white'}`}>
              {w.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
