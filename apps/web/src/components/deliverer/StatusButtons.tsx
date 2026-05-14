import { Package, Bike, CheckCircle } from 'lucide-react';

interface Props { currentStatus: string; onStatusChange: (status: string) => void; }

const buttons = [
  { status: 'PICKED_UP', label: 'Récupérée', Icon: Package, bg: 'bg-[#D97706]', shadow: 'shadow-[0_4px_14px_rgba(217,119,6,0.25)]' },
  { status: 'IN_TRANSIT', label: 'En route', Icon: Bike, bg: 'bg-[#D84315]', shadow: 'shadow-[0_4px_14px_rgba(216,67,21,0.25)]' },
  { status: 'DELIVERED', label: 'Livrée', Icon: CheckCircle, bg: 'bg-[#166534]', shadow: 'shadow-[0_4px_14px_rgba(22,101,52,0.25)]' },
];

export function StatusButtons({ onStatusChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {buttons.map(btn => {
        const Icon = btn.Icon;
        return (
          <button key={btn.status} onClick={() => onStatusChange(btn.status)}
            className={`${btn.bg} ${btn.shadow} text-white text-xs font-bold py-4 rounded-[14px] active:scale-[0.97] transition-all duration-200 hover:brightness-110 flex flex-col items-center gap-1`}
          >
            <Icon className="w-5 h-5" strokeWidth={2.5} />
            <span>{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
}
