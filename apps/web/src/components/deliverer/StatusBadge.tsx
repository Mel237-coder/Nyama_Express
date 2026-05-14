interface Props { status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'PENDING' | 'ACTIVE'; }

export function StatusBadge({ status }: Props) {
  const configs: Record<string, { class: string; label: string }> = {
    ONLINE: { class: 'bg-[#166534] text-white', label: 'En ligne' },
    OFFLINE: { class: 'bg-[#A8A29E] text-white', label: 'Hors ligne' },
    BUSY: { class: 'bg-[#D84315] text-white', label: 'En mission' },
    PENDING: { class: 'bg-[#D97706] text-white', label: 'En attente' },
    ACTIVE: { class: 'bg-[#166534] text-white', label: 'Actif' },
  };
  const c = configs[status] || configs.OFFLINE;
  return (
    <span className={`dv-badge ${c.class} ${status === 'ONLINE' ? 'animate-dot-pulse' : ''}`}>
      {c.label}
    </span>
  );
}
