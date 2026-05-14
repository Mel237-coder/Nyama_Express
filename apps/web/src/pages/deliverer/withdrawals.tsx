import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';

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
    const [wList, earnings] = await Promise.all([api.getWithdrawals(token!), api.getEarnings(token!)]);
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
    <div className="p-4">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-4">Retraits</h1>
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 mb-4 text-center">
        <p className="text-[#999999] text-sm">Solde disponible</p>
        <p className="text-3xl font-extrabold text-[#1A1A1A]">{balance} FCFA</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 mb-4">
        <h2 className="font-bold text-[#1A1A1A] mb-3">Nouveau retrait</h2>
        <div className="space-y-3">
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (min 500)" type="number" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
          <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]">
            <option value="mtn_momo">MTN MoMo</option>
            <option value="orange_money">Orange Money</option>
          </select>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro de téléphone" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
          <button onClick={handleWithdraw} className="w-full bg-[#D84315] text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-transform">Retirer</button>
        </div>
      </div>
      <h2 className="font-bold text-[#1A1A1A] mb-3">Historique</h2>
      <div className="space-y-2">
        {withdrawals.map(w => (
          <div key={w.id} className="bg-white rounded-2xl border border-[#E8E4DC] p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-[#1A1A1A] text-sm">{w.amount} FCFA</p>
              <p className="text-[#999999] text-xs">{w.provider === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}</p>
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
