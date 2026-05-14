import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { Phone, User, CreditCard, Bike } from 'lucide-react';

export default function DelivererRegister() {
  const router = useRouter();
  const [form, setForm] = useState({
    phone: '', firstName: '', lastName: '', cniNumber: '', cniPhotoUrl: '', selfieUrl: '',
    vehicleType: 'MOTORCYCLE', vehiclePlate: '', zoneId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try { await api.registerDeliverer(form); router.push('/deliverer/login'); }
    catch (e) { alert('Erreur lors de l\'inscription'); }
    finally { setLoading(false); }
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-[#F5F0E8] p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-1">Devenir livreur</h1>
        <p className="text-[#666666] text-sm mb-6">Remplissez vos informations pour commencer</p>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4">
            <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><User className="w-5 h-5 text-[#D84315]" /> Identité</h2>
            <div className="space-y-3">
              <input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Prénom" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              <input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Nom" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              <div className="relative"><Phone className="absolute left-4 top-3.5 w-4 h-4 text-[#999999]" />
                <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="6XX XXX XXX" className="w-full bg-[#F5F0E8] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4">
            <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#D84315]" /> Documents</h2>
            <div className="space-y-3">
              <input value={form.cniNumber} onChange={e => update('cniNumber', e.target.value)} placeholder="Numéro CNI" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              <input value={form.cniPhotoUrl} onChange={e => update('cniPhotoUrl', e.target.value)} placeholder="URL photo CNI (Cloudinary)" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
              <input value={form.selfieUrl} onChange={e => update('selfieUrl', e.target.value)} placeholder="URL selfie (Cloudinary)" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4">
            <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><Bike className="w-5 h-5 text-[#D84315]" /> Véhicule</h2>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {['MOTORCYCLE', 'BICYCLE', 'CAR', 'FOOT'].map(type => (
                <button key={type} onClick={() => update('vehicleType', type)}
                  className={`py-2 rounded-xl text-xs font-bold ${form.vehicleType === type ? 'bg-[#D84315] text-white' : 'bg-[#F5F0E8] text-[#666666]'}`}>
                  {type === 'MOTORCYCLE' ? 'Moto' : type === 'BICYCLE' ? 'Vélo' : type === 'CAR' ? 'Voiture' : 'Pied'}
                </button>
              ))}
            </div>
            <input value={form.vehiclePlate} onChange={e => update('vehiclePlate', e.target.value)} placeholder="Plaque d'immatriculation" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-[#D84315] text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50">
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
}
