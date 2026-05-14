import { MapPin, Clock, Phone, Navigation, ArrowUpRight } from 'lucide-react';

interface Props { mission: any; onAccept?: () => void; showAccept?: boolean; }

export function MissionCard({ mission, onAccept, showAccept }: Props) {
  return (
    <div className="card-luxe p-5">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl icon-box flex items-center justify-center shrink-0">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#1C1917] text-base font-body">{mission.restaurant?.name || 'Restaurant'}</h3>
            <p className="text-[#9B958D] text-xs font-medium">#{mission.id?.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[#C73E1D] font-extrabold text-xl font-body">{mission.deliveryFee}</p>
          <p className="text-[#9B958D] text-[10px] font-semibold">FCFA</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3 p-3.5 rounded-[16px] bg-[#F3EDE4]">
          <div className="w-9 h-9 rounded-full bg-[#C73E1D]/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-[#C73E1D]" />
          </div>
          <div>
            <p className="text-[#1C1917] font-semibold text-xs font-body">Restaurant</p>
            <p className="text-[#6B6560] text-xs">{mission.restaurant?.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3.5 rounded-[16px] bg-[#F3EDE4]">
          <div className="w-9 h-9 rounded-full bg-[#3D6B4F]/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-[#3D6B4F]" />
          </div>
          <div>
            <p className="text-[#1C1917] font-semibold text-xs font-body">Client</p>
            <p className="text-[#6B6560] text-xs">{mission.deliveryAddress}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-[#D4A017]/10 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-[#D4A017]" />
          </div>
          <span className="text-[#6B6560] text-xs font-medium">{mission.restaurant?.phone || mission.client?.phone}</span>
        </div>
      </div>

      {showAccept && (
        <button onClick={onAccept} className="w-full mt-6 btn-luxe py-4 text-sm">
          Accepter la mission
          <ArrowUpRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
