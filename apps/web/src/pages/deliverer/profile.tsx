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

  if (!profile) return <div className="p-4 text-[#A8A29E]">Chargement...</div>;

  return (
    <div className="p-6">
      <p className="dv-section-label mb-1 animate-slide-up">Mon compte</p>
      <h1 className="dv-page-title mb-5 animate-slide-up d1">Profil</h1>

      <div className="dv-card p-6 text-center mb-5 shadow-md animate-slide-up d2">
        <div className="dv-icon-red w-20 h-20 rounded-full mx-auto mb-3">
          <span className="text-2xl font-bold text-white">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
        </div>
        <p className="font-bold text-[#1C1917] text-lg">{profile.firstName} {profile.lastName}</p>
        <p className="text-[#78716C] text-sm font-medium">{profile.phone}</p>
        <div className="mt-3"><StatusBadge status={profile.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'} /></div>
      </div>

      <div className="space-y-2.5">
        <div className="dv-card p-4 flex items-center gap-3 animate-slide-up d3">
          <div className="dv-icon-red w-10 h-10 rounded-[12px]"><Bike className="w-5 h-5" /></div>
          <div>
            <p className="font-bold text-[#1C1917] text-sm">Véhicule</p>
            <p className="text-[#78716C] text-xs">{profile.vehicleType}{profile.vehiclePlate ? ` — ${profile.vehiclePlate}` : ''}</p>
          </div>
        </div>

        <div className="dv-card p-4 animate-slide-up d4">
          <div className="flex items-center gap-3 mb-3">
            <div className="dv-icon-gold w-10 h-10 rounded-[12px]"><CreditCard className="w-5 h-5" /></div>
            <p className="font-bold text-[#1C1917] text-sm">Documents</p>
          </div>
          <div className="space-y-2">
            {profile.documents?.map((doc: any) => (
              <div key={doc.id} className="flex justify-between items-center py-2 border-b border-[#E7E5E4] last:border-0">
                <span className="text-sm text-[#78716C] font-medium">{doc.type}</span>
                <span className={`dv-badge ${doc.status === 'APPROVED' ? 'bg-[#166534] text-white' : 'bg-[#D97706] text-white'}`}>{doc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleLogout} className="w-full mt-5 dv-btn-ghost py-4 font-bold">
        <LogOut className="w-5 h-5" /> Déconnexion
      </button>
    </div>
  );
}
