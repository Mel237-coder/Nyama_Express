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
    <div className="p-5">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-5 animate-fade-in-up">Retraits</h1>

      <div className="glass-strong rounded-3xl p-6 mb-5 text-center shadow-lg animate-fade-in-up stagger-1">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F9A825] to-[#F57F17] flex items-center justify-center mx-auto mb-3 shadow-md">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <p className="text-[#666666] text-sm">Solde disponible</p>
        <p className="text-4xl font-extrabold text-[#1A1A1A] mt-1">{balance} FCFA</p>
      </div>

      <div className="card-premium p-5 mb-5 animate-fade-in-up stagger-2">
        <h2 className="font-bold text-[#1A1A1A] mb-4 text-sm">Nouveau retrait</h2>
        <div className="space-y-3">
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (min 500)" type="number"
            className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all font-medium" />
          <select value={provider} onChange={e => setProvider(e.target.value)}
            className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all appearance-none"
          >
            <option value="mtn_momo">MTN MoMo</option>
            <option value="orange_money">Orange Money</option>
          </select>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro de téléphone"
            className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all font-medium" />
          <button onClick={handleWithdraw} className="w-full btn-premium py-3.5">Retirer</button>
        </div>
      </div>

      <h2 className="font-bold text-[#1A1A1A] mb-3 text-sm">Historique</h2>
      <div className="space-y-3">
        {withdrawals.map((w, i) => (
          <div key={w.id} className="card-premium p-4 flex justify-between items-center animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${w.status === 'COMPLETED' ? 'bg-[#2E7D32]/10' : w.status === 'FAILED' ? 'bg-[#D84315]/10' : 'bg-[#F9A825]/10'}`}>
                <span className={`font-bold text-xs ${w.status === 'COMPLETED' ? 'text-[#2E7D32]' : w.status === 'FAILED' ? 'text-[#D84315]' : 'text-[#F9A825]'}`}>{w.amount}</span>
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A] text-sm">{w.amount} FCFA</p>
                <p className="text-[#999999] text-xs">{w.provider === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${w.status === 'COMPLETED' ? 'bg-[#2E7D32] text-white' : w.status === 'FAILED' ? 'bg-[#D84315] text-white' : 'bg-[#F9A825] text-white'}`}>
              {w.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
