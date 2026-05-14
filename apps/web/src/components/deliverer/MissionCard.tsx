import { MapPin, Clock, Phone, Navigation, ArrowUpRight } from 'lucide-react';

interface Props { mission: any; onAccept?: () => void; showAccept?: boolean; }

export function MissionCard({ mission, onAccept, showAccept }: Props) {
  return (
    <div className="dv-card p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="dv-icon-red w-11 h-11 rounded-[14px]">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#1C1917] text-[15px]">{mission.restaurant?.name || 'Restaurant'}</h3>
            <p className="text-[#A8A29E] text-[11px] font-medium">#{mission.id?.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[#D84315] font-extrabold text-lg">{mission.deliveryFee}</p>
          <p className="text-[#A8A29E] text-[10px] font-medium">FCFA</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F2ED]">
          <div className="dv-icon-red w-9 h-9 rounded-full shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[#1C1917] font-semibold text-[11px]">Restaurant</p>
            <p className="text-[#78716C] text-[11px]">{mission.restaurant?.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F2ED]">
          <div className="dv-icon-green w-9 h-9 rounded-full shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[#1C1917] font-semibold text-[11px]">Client</p>
            <p className="text-[#78716C] text-[11px]">{mission.deliveryAddress}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-1">
          <div className="dv-icon-gold w-9 h-9 rounded-full shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <span className="text-[#78716C] text-[11px] font-medium">{mission.restaurant?.phone || mission.client?.phone}</span>
        </div>
      </div>

      {showAccept && (
        <button onClick={onAccept} className="w-full mt-5 dv-btn py-4 text-sm">
          Accepter la mission
          <ArrowUpRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
