import { MapPin, Clock, Phone, Navigation } from 'lucide-react';
interface Props { mission: any; onAccept?: () => void; showAccept?: boolean; }
export function MissionCard({ mission, onAccept, showAccept }: Props) {
  return (
    <div className="card-premium p-5 animate-fade-in-up">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D84315] to-[#BF360C] flex items-center justify-center shadow-lg">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#1A1A1A] text-base">{mission.restaurant?.name || 'Restaurant'}</h3>
            <p className="text-[#999999] text-xs">#{mission.id?.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[#D84315] font-extrabold text-lg">{mission.deliveryFee}</p>
          <p className="text-[#999999] text-[10px]">FCFA</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F0E8]">
          <div className="w-8 h-8 rounded-full bg-[#D84315]/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-[#D84315]" />
          </div>
          <div>
            <p className="text-[#1A1A1A] font-medium text-xs">Restaurant</p>
            <p className="text-[#666666] text-xs">{mission.restaurant?.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F0E8]">
          <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <div>
            <p className="text-[#1A1A1A] font-medium text-xs">Client</p>
            <p className="text-[#666666] text-xs">{mission.deliveryAddress}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F9A825]/10 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-[#F9A825]" />
          </div>
          <span className="text-[#666666] text-xs">{mission.restaurant?.phone || mission.client?.phone}</span>
        </div>
      </div>

      {showAccept && (
        <button onClick={onAccept} className="w-full mt-5 btn-premium py-4 text-sm font-bold">
          Accepter la mission
        </button>
      )}
    </div>
  );
}
