'use client';

import type { AdminNotification } from '@/hooks/use-notifications';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TYPE_LABELS: Record<string, string> = {
  new_order: 'Nouvelle commande',
  order_confirmed: 'Commande confirmee',
  order_rejected_timeout: 'Commande expiree',
  order_rejected_manual: 'Commande refusee',
  driver_found: 'Livreur trouve',
  order_delivering: 'En livraison',
  order_delivered: 'Commande livree',
  rate_order: 'Demande de notation',
  delivery_request: 'Demande de course',
  no_driver_found: 'Aucun livreur',
  test: 'Test',
};

interface NotificationTableProps {
  notifications: AdminNotification[];
}

export function NotificationTable({ notifications }: NotificationTableProps) {
  if (notifications.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune notification</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Titre</th>
            <th className="px-4 py-3 font-medium">Destinataire</th>
            <th className="px-4 py-3 font-medium">Lu</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((n) => (
            <tr key={n.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {TYPE_LABELS[n.type] || n.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground truncate max-w-xs">{n.body}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                {n.recipient_id.slice(0, 8)}...
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  n.is_read
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {n.is_read ? 'Oui' : 'Non'}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(n.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}