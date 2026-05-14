import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, storage } from '../../lib/api';
import { StatusBadge } from '../../components/deliverer/StatusBadge';
import { LogOut, Bike, CreditCard, Mail, Shield } from 'lucide-react';

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

  if (!profile) return <div className="p-4 text-[#999999]">Chargement...</div>;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-5 animate-fade-in-up">Profil</h1>

      <div className="glass-strong rounded-3xl p-6 text-center mb-5 shadow-lg animate-fade-in-up stagger-1">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D84315] to-[#BF360C] mx-auto mb-4 flex items-center justify-center shadow-lg">
          <span className="text-3xl font-bold text-white">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
        </div>
        <p className="font-bold text-[#1A1A1A] text-lg">{profile.firstName} {profile.lastName}</p>
        <p className="text-[#666666] text-sm">{profile.phone}</p>
        <div className="mt-4"><StatusBadge status={profile.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'} /></div>
      </div>

      <div className="space-y-3">
        <div className="card-premium p-4 flex items-center gap-3 animate-fade-in-up stagger-2">
          <div className="w-10 h-10 rounded-xl bg-[#D84315]/10 flex items-center justify-center"><Bike className="w-5 h-5 text-[#D84315]" /></div>
          <div>
            <p className="font-bold text-[#1A1A1A] text-sm">Véhicule</p>
            <p className="text-[#666666] text-xs">{profile.vehicleType}{profile.vehiclePlate ? ` — ${profile.vehiclePlate}` : ''}</p>
          </div>
        </div>

        <div className="card-premium p-4 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#F9A825]/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-[#F9A825]" /></div>
            <p className="font-bold text-[#1A1A1A] text-sm">Documents</p>
          </div>
          <div className="space-y-2">
            {profile.documents?.map((doc: any) => (
              <div key={doc.id} className="flex justify-between items-center py-2 border-b border-[#E8E4DC] last:border-0">
                <span className="text-sm text-[#666666]">{doc.type}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${doc.status === 'APPROVED' ? 'bg-[#2E7D32] text-white' : 'bg-[#F9A825] text-white'}`}>{doc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleLogout} className="w-full mt-5 bg-white border border-[#E8E4DC] text-[#666666] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all hover:bg-[#F5F0E8]">
        <LogOut className="w-5 h-5" /> Déconnexion
      </button>
    </div>
  );
}
