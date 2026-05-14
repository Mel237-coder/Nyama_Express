interface Props { status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'PENDING' | 'ACTIVE'; }
export function StatusBadge({ status }: Props) {
  const styles: Record<string, string> = {
    ONLINE: 'bg-[#2E7D32] text-white', OFFLINE: 'bg-[#999999] text-white',
    BUSY: 'bg-[#D84315] text-white', PENDING: 'bg-[#F9A825] text-white', ACTIVE: 'bg-[#2E7D32] text-white',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || styles.OFFLINE}`}>
      {status === 'ONLINE' ? 'En ligne' : status === 'OFFLINE' ? 'Hors ligne' : status === 'BUSY' ? 'En mission' : status === 'PENDING' ? 'En attente' : 'Actif'}
    </span>
  );
}
