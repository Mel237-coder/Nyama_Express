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

  if (!profile) return <div className="p-4 text-[#999999]">Chargement...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-4">Profil</h1>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-6 text-center mb-4">
        <div className="w-20 h-20 bg-[#F5F0E8] rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-[#D84315]">
          {profile.firstName?.[0]}{profile.lastName?.[0]}
        </div>
        <p className="font-bold text-[#1A1A1A]">{profile.firstName} {profile.lastName}</p>
        <p className="text-[#666666] text-sm">{profile.phone}</p>
        <div className="mt-3"><StatusBadge status={profile.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'} /></div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 mb-4">
        <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><Bike className="w-5 h-5 text-[#D84315]" /> Véhicule</h2>
        <p className="text-[#666666] text-sm">Type: {profile.vehicleType}</p>
        {profile.vehiclePlate && <p className="text-[#666666] text-sm">Plaque: {profile.vehiclePlate}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 mb-4">
        <h2 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#D84315]" /> Documents</h2>
        <div className="space-y-2">
          {profile.documents?.map((doc: any) => (
            <div key={doc.id} className="flex justify-between items-center">
              <span className="text-sm text-[#666666]">{doc.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${doc.status === 'APPROVED' ? 'bg-[#2E7D32] text-white' : 'bg-[#F9A825] text-white'}`}>{doc.status}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleLogout} className="w-full bg-[#999999] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
        <LogOut className="w-5 h-5" /> Déconnexion
      </button>
    </div>
  );
}
