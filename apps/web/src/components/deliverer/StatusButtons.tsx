import { Package, Bike, CheckCircle } from 'lucide-react';

interface Props { currentStatus: string; onStatusChange: (status: string) => void; }

const buttons = [
  { status: 'PICKED_UP', label: 'Récupérée', Icon: Package, color: 'from-[#D4A017] to-[#B8860B]', shadow: 'shadow-[0_4px_16px_rgba(212,160,23,0.25)]' },
  { status: 'IN_TRANSIT', label: 'En route', Icon: Bike, color: 'from-[#C73E1D] to-[#A33015]', shadow: 'shadow-[0_4px_16px_rgba(199,62,29,0.25)]' },
  { status: 'DELIVERED', label: 'Livrée', Icon: CheckCircle, color: 'from-[#3D6B4F] to-[#2A4D38]', shadow: 'shadow-[0_4px_16px_rgba(61,107,79,0.25)]' },
];

export function StatusButtons({ onStatusChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {buttons.map(btn => {
        const Icon = btn.Icon;
        return (
          <button key={btn.status} onClick={() => onStatusChange(btn.status)}
            className={`bg-gradient-to-r ${btn.color} ${btn.shadow} text-white text-xs font-bold py-4 rounded-[16px] active:scale-[0.97] transition-all duration-300 hover:shadow-lg flex flex-col items-center gap-1.5 font-body`}
          >
            <Icon className="w-5 h-5" strokeWidth={2.5} />
            <span>{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
}
