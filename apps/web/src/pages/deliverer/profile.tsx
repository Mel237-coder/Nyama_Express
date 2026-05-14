import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { StatusBadge } from '../../components/deliverer/StatusBadge';
import { LogOut, Bike, CreditCard } from 'lucide-react';

export default function DelivererProfile() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const token = storage.getAccessToken();

  useEffect(() => {
    if (!token) { router.push('/deliverer/login'); return; }
    api.getDelivererProfile(token).then(setProfile).catch(console.error);
  }, [token, router]);

  const handleLogout = () => {
    storage.clearTokens();
    localStorage.removeItem('user');
    router.push('/deliverer/login');
  };

  if (!profile) return <div className="p-4 text-[#9B958D] font-body">Chargement...</div>;

  return (
    <div className="p-6 font-body">
      <p className="text-[#9B958D] text-xs font-semibold tracking-widest uppercase mb-1 animate-reveal-up">Mon compte</p>
      <h1 className="font-display text-3xl text-[#1C1917] mb-6 animate-reveal-up stagger-1">Profil</h1>

      <div className="glass-strong-luxe rounded-[24px] p-7 text-center mb-6 shadow-warm animate-reveal-up stagger-2">
        <div className="w-24 h-24 rounded-full icon-box mx-auto mb-4 flex items-center justify-center shadow-lg">
          <span className="font-display text-3xl text-white">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
        </div>
        <p className="font-bold text-[#1C1917] text-lg font-body">{profile.firstName} {profile.lastName}</p>
        <p className="text-[#6B6560] text-sm font-medium">{profile.phone}</p>
        <div className="mt-4"><StatusBadge status={profile.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'} /></div>
      </div>

      <div className="space-y-3">
        <div className="card-luxe p-5 flex items-center gap-3 animate-reveal-up stagger-3">
          <div className="w-10 h-10 rounded-xl bg-[#C73E1D]/10 flex items-center justify-center"><Bike className="w-5 h-5 text-[#C73E1D]" /></div>
          <div>
            <p className="font-bold text-[#1C1917] text-sm font-body">Véhicule</p>
            <p className="text-[#6B6560] text-xs">{profile.vehicleType}{profile.vehiclePlate ? ` — ${profile.vehiclePlate}` : ''}</p>
          </div>
        </div>

        <div className="card-luxe p-5 animate-reveal-up stagger-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#D4A017]/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-[#D4A017]" /></div>
            <p className="font-bold text-[#1C1917] text-sm font-body">Documents</p>
          </div>
          <div className="space-y-2">
            {profile.documents?.map((doc: any) => (
              <div key={doc.id} className="flex justify-between items-center py-2 border-b border-[#E8E0D4] last:border-0">
                <span className="text-sm text-[#6B6560] font-medium">{doc.type}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-body ${doc.status === 'APPROVED' ? 'bg-[#3D6B4F] text-white' : 'bg-[#D4A017] text-white'}`}>{doc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleLogout} className="w-full mt-6 bg-white border border-[#E8E0D4] text-[#6B6560] font-bold py-4 rounded-[16px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all hover:bg-[#F3EDE4] font-body">
        <LogOut className="w-5 h-5" /> Déconnexion
      </button>
    </div>
  );
}
