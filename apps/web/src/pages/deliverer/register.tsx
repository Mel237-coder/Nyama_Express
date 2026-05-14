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
    <div className="min-h-screen bg-[#EDE9E2] p-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="mb-6 animate-slide-up">
          <div className="dv-icon-red w-12 h-12 rounded-[14px] mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="dv-page-title">Devenir livreur</h1>
          <p className="text-[#78716C] text-sm font-medium mt-1">Rejoignez l'équipe Nyama Express</p>
        </div>

        <div className="space-y-3">
          <div className="dv-card p-5 animate-slide-up d1">
            <h2 className="font-bold text-[#1C1917] mb-3 flex items-center gap-2 text-sm"><User className="w-4 h-4 text-[#D84315]" /> Identité</h2>
            <div className="space-y-2.5">
              <input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Prénom" className="dv-input" />
              <input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Nom" className="dv-input" />
              <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="6XX XXX XXX" className="dv-input pl-10" />
              </div>
            </div>
          </div>

          <div className="dv-card p-5 animate-slide-up d2">
            <h2 className="font-bold text-[#1C1917] mb-3 flex items-center gap-2 text-sm"><CreditCard className="w-4 h-4 text-[#D84315]" /> Documents</h2>
            <div className="space-y-2.5">
              <input value={form.cniNumber} onChange={e => update('cniNumber', e.target.value)} placeholder="Numéro CNI" className="dv-input" />
              <input value={form.cniPhotoUrl} onChange={e => update('cniPhotoUrl', e.target.value)} placeholder="URL photo CNI" className="dv-input" />
              <input value={form.selfieUrl} onChange={e => update('selfieUrl', e.target.value)} placeholder="URL selfie" className="dv-input" />
            </div>
          </div>

          <div className="dv-card p-5 animate-slide-up d3">
            <h2 className="font-bold text-[#1C1917] mb-3 flex items-center gap-2 text-sm"><Bike className="w-4 h-4 text-[#D84315]" /> Véhicule</h2>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {['MOTORCYCLE', 'BICYCLE', 'CAR', 'FOOT'].map(type => (
                <button key={type} onClick={() => update('vehicleType', type)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${form.vehicleType === type ? 'bg-[#D84315] text-white shadow-[0_2px_8px_rgba(216,67,21,0.25)]' : 'bg-[#F5F2ED] text-[#78716C] hover:bg-[#E7E5E4]'}`}
                >
                  {type === 'MOTORCYCLE' ? 'Moto' : type === 'BICYCLE' ? 'Vélo' : type === 'CAR' ? 'Voiture' : 'Pied'}
                </button>
              ))}
            </div>
            <input value={form.vehiclePlate} onChange={e => update('vehiclePlate', e.target.value)} placeholder="Plaque d'immatriculation" className="dv-input" />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full dv-btn py-4 flex items-center justify-center gap-2 animate-slide-up d4"
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
