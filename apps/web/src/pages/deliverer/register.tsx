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
    <div className="min-h-screen bg-[#F3EDE4] p-4 relative font-body">
      <div className="max-w-md mx-auto relative z-10 py-6">
        <div className="mb-8 animate-reveal-up">
          <div className="w-14 h-14 rounded-2xl icon-box flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-3xl text-[#1C1917]">Devenir livreur</h1>
          <p className="text-[#6B6560] text-sm font-medium mt-1">Rejoignez l'équipe Nyama Express</p>
        </div>

        <div className="space-y-4">
          <div className="card-luxe p-6 animate-reveal-up stagger-1">
            <h2 className="font-bold text-[#1C1917] mb-4 flex items-center gap-2 text-sm font-body"><User className="w-4 h-4 text-[#C73E1D]" /> Identité</h2>
            <div className="space-y-3">
              <input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Prénom" className="input-luxe" />
              <input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Nom" className="input-luxe" />
              <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B958D]" />
                <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="6XX XXX XXX" className="input-luxe pl-10" />
              </div>
            </div>
          </div>

          <div className="card-luxe p-6 animate-reveal-up stagger-2">
            <h2 className="font-bold text-[#1C1917] mb-4 flex items-center gap-2 text-sm font-body"><CreditCard className="w-4 h-4 text-[#C73E1D]" /> Documents</h2>
            <div className="space-y-3">
              <input value={form.cniNumber} onChange={e => update('cniNumber', e.target.value)} placeholder="Numéro CNI" className="input-luxe" />
              <input value={form.cniPhotoUrl} onChange={e => update('cniPhotoUrl', e.target.value)} placeholder="URL photo CNI" className="input-luxe" />
              <input value={form.selfieUrl} onChange={e => update('selfieUrl', e.target.value)} placeholder="URL selfie" className="input-luxe" />
            </div>
          </div>

          <div className="card-luxe p-6 animate-reveal-up stagger-3">
            <h2 className="font-bold text-[#1C1917] mb-4 flex items-center gap-2 text-sm font-body"><Bike className="w-4 h-4 text-[#C73E1D]" /> Véhicule</h2>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {['MOTORCYCLE', 'BICYCLE', 'CAR', 'FOOT'].map(type => (
                <button key={type} onClick={() => update('vehicleType', type)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all font-body ${form.vehicleType === type ? 'bg-gradient-to-r from-[#C73E1D] to-[#D84315] text-white shadow-terracotta' : 'bg-[#F3EDE4] text-[#6B6560] hover:bg-[#E8E0D4]'}`}
                >
                  {type === 'MOTORCYCLE' ? 'Moto' : type === 'BICYCLE' ? 'Vélo' : type === 'CAR' ? 'Voiture' : 'Pied'}
                </button>
              ))}
            </div>
            <input value={form.vehiclePlate} onChange={e => update('vehiclePlate', e.target.value)} placeholder="Plaque d'immatriculation" className="input-luxe" />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full btn-luxe py-4 flex items-center justify-center gap-2 animate-reveal-up stagger-4"
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
