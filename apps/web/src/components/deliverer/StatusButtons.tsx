interface Props { currentStatus: string; onStatusChange: (status: string) => void; }
const buttons = [
  { status: 'PICKED_UP', label: 'Récupérée', icon: '📦', color: 'from-[#F9A825] to-[#F57F17]' },
  { status: 'IN_TRANSIT', label: 'En route', icon: '🛵', color: 'from-[#D84315] to-[#BF360C]' },
  { status: 'DELIVERED', label: 'Livrée', icon: '✅', color: 'from-[#2E7D32] to-[#1B5E20]' },
];
export function StatusButtons({ onStatusChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map(btn => (
        <button key={btn.status} onClick={() => onStatusChange(btn.status)}
          className={`bg-gradient-to-r ${btn.color} text-white text-xs font-bold py-3.5 rounded-xl active:scale-[0.97] transition-all duration-200 shadow-md hover:shadow-lg flex flex-col items-center gap-1`}
        >
          <span className="text-lg">{btn.icon}</span>
          <span>{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
