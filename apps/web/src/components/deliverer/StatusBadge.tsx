interface Props { status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'PENDING' | 'ACTIVE'; }
export function StatusBadge({ status }: Props) {
  const configs: Record<string, { bg: string; text: string; glow: string; label: string }> = {
    ONLINE: { bg: 'bg-[#2E7D32]', text: 'text-white', glow: 'shadow-[0_0_12px_rgba(46,125,50,0.4)]', label: 'En ligne' },
    OFFLINE: { bg: 'bg-[#999999]', text: 'text-white', glow: '', label: 'Hors ligne' },
    BUSY: { bg: 'bg-[#D84315]', text: 'text-white', glow: 'shadow-[0_0_12px_rgba(216,67,21,0.4)]', label: 'En mission' },
    PENDING: { bg: 'bg-[#F9A825]', text: 'text-white', glow: 'shadow-[0_0_12px_rgba(249,168,37,0.4)]', label: 'En attente' },
    ACTIVE: { bg: 'bg-[#2E7D32]', text: 'text-white', glow: 'shadow-[0_0_12px_rgba(46,125,50,0.4)]', label: 'Actif' },
  };
  const c = configs[status] || configs.OFFLINE;
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${c.bg} ${c.text} ${c.glow} transition-all duration-300`}>
      {c.label}
    </span>
  );
}
