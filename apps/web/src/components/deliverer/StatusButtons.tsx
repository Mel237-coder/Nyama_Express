interface Props { currentStatus: string; onStatusChange: (status: string) => void; }
const buttons = [
  { status: 'PICKED_UP', label: 'Commande récupérée', color: 'bg-[#F9A825]' },
  { status: 'IN_TRANSIT', label: 'En livraison', color: 'bg-[#D84315]' },
  { status: 'DELIVERED', label: 'Livrée', color: 'bg-[#2E7D32]' },
];
export function StatusButtons({ onStatusChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map(btn => (
        <button key={btn.status} onClick={() => onStatusChange(btn.status)} className={`${btn.color} text-white text-xs font-bold py-3 rounded-xl active:scale-[0.98] transition-transform`}>
          {btn.label}
        </button>
      ))}
    </div>
  );
}
