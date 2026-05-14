interface Props { status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'PENDING' | 'ACTIVE'; }

export function StatusBadge({ status }: Props) {
  const configs: Record<string, { bg: string; text: string; glow: string; label: string }> = {
    ONLINE: { bg: 'bg-[#3D6B4F]', text: 'text-white', glow: 'animate-pulse shadow-[0_0_12px_rgba(61,107,79,0.4)]', label: 'En ligne' },
    OFFLINE: { bg: 'bg-[#9B958D]', text: 'text-white', glow: '', label: 'Hors ligne' },
    BUSY: { bg: 'bg-[#C73E1D]', text: 'text-white', glow: 'shadow-[0_0_12px_rgba(199,62,29,0.4)]', label: 'En mission' },
    PENDING: { bg: 'bg-[#D4A017]', text: 'text-white', glow: 'shadow-[0_0_12px_rgba(212,160,23,0.4)]', label: 'En attente' },
    ACTIVE: { bg: 'bg-[#3D6B4F]', text: 'text-white', glow: 'shadow-[0_0_12px_rgba(61,107,79,0.4)]', label: 'Actif' },
  };
  const c = configs[status] || configs.OFFLINE;
  return (
    <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-body ${c.bg} ${c.text} ${c.glow} transition-all duration-300`}>
      {c.label}
    </span>
  );
}
