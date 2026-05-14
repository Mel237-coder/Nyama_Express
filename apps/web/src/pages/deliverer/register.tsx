import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { Phone, User, CreditCard, Bike, ChevronRight, Shield } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] via-[#EDE8DF] to-[#F5F0E8] p-4 relative">
      <div className="max-w-md mx-auto relative z-10">
        <div className="mb-6 animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D84315] to-[#BF360C] flex items-center justify-center mb-3 shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Devenir livreur</h1>
          <p className="text-[#666666] text-sm">Rejoignez l'équipe Nyama Express</p>
        </div>

        <div className="space-y-4">
          {/* Identity */}
          <div className="card-premium p-5 animate-fade-in-up stagger-1">
            <h2 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 text-sm"><User className="w-4 h-4 text-[#D84315]" /> Identité</h2>
            <div className="space-y-3">
              <input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Prénom" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all" />
              <input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Nom" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all" />
              <div className="relative"><Phone className="absolute left-4 top-3.5 w-4 h-4 text-[#999999]" />
                <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="6XX XXX XXX" className="w-full bg-[#F5F0E8] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all" />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card-premium p-5 animate-fade-in-up stagger-2">
            <h2 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 text-sm"><CreditCard className="w-4 h-4 text-[#D84315]" /> Documents</h2>
            <div className="space-y-3">
              <input value={form.cniNumber} onChange={e => update('cniNumber', e.target.value)} placeholder="Numéro CNI" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all" />
              <input value={form.cniPhotoUrl} onChange={e => update('cniPhotoUrl', e.target.value)} placeholder="URL photo CNI" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all" />
              <input value={form.selfieUrl} onChange={e => update('selfieUrl', e.target.value)} placeholder="URL selfie" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all" />
            </div>
          </div>

          {/* Vehicle */}
          <div className="card-premium p-5 animate-fade-in-up stagger-3">
            <h2 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 text-sm"><Bike className="w-4 h-4 text-[#D84315]" /> Véhicule</h2>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {['MOTORCYCLE', 'BICYCLE', 'CAR', 'FOOT'].map(type => (
                <button key={type} onClick={() => update('vehicleType', type)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${form.vehicleType === type ? 'bg-[#D84315] text-white shadow-md' : 'bg-[#F5F0E8] text-[#666666] hover:bg-[#E8E4DC]'}`}
                >
                  {type === 'MOTORCYCLE' ? 'Moto' : type === 'BICYCLE' ? 'Vélo' : type === 'CAR' ? 'Voiture' : 'Pied'}
                </button>
              ))}
            </div>
            <input value={form.vehiclePlate} onChange={e => update('vehiclePlate', e.target.value)} placeholder="Plaque d'immatriculation" className="w-full bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D84315] transition-all" />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full btn-premium py-4 flex items-center justify-center gap-2 animate-fade-in-up stagger-4"
          >
            {loading ? 'Inscription...' : (
              <>S'inscrire <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
