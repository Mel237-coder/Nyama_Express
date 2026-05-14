import { MapPin, Clock, Phone } from 'lucide-react';
interface Props { mission: any; onAccept?: () => void; showAccept?: boolean; }
export function MissionCard({ mission, onAccept, showAccept }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-[#1A1A1A] text-lg">{mission.restaurant?.name || 'Restaurant'}</h3>
        <span className="text-[#D84315] font-bold">{mission.deliveryFee} FCFA</span>
      </div>
      <div className="space-y-2 text-sm text-[#666666]">
        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#D84315]" /><span>Restaurant: {mission.restaurant?.address}</span></div>
        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#2E7D32]" /><span>Client: {mission.deliveryAddress}</span></div>
        <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#999999]" /><span>{mission.restaurant?.phone || mission.client?.phone}</span></div>
        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#999999]" /><span>#{mission.id?.slice(-6)}</span></div>
      </div>
      {showAccept && <button onClick={onAccept} className="w-full mt-4 bg-[#D84315] text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-transform">Accepter la mission</button>}
    </div>
  );
}
