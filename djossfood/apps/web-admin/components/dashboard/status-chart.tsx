'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFCC00',
  confirmed: '#00AA13',
  preparing: '#3B82F6',
  ready: '#FF6600',
  driver_assigned: '#8B5CF6',
  picked_up: '#06B6D4',
  delivering: '#F59E0B',
  delivered: '#10B981',
  completed: '#6B7280',
  cancelled: '#E53935',
  rejected: '#E53935',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  preparing: 'En preparation',
  ready: 'Prette',
  driver_assigned: 'Livreur assigne',
  picked_up: 'Recuperee',
  delivering: 'En livraison',
  delivered: 'Livree',
  completed: 'Terminee',
  cancelled: 'Annulee',
  rejected: 'Refusee',
};

interface StatusChartProps {
  ordersByStatus: Record<string, number>;
}

export function StatusChart({ ordersByStatus }: StatusChartProps) {
  const data = Object.entries(ordersByStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      label: STATUS_LABELS[status] || status,
      count,
      color: STATUS_COLORS[status] || '#9CA3AF',
    }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune commande</p>;
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#666' }}
            angle={-35}
            textAnchor="end"
            height={70}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#666' }}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [Number(value), 'Commandes']}
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.label} ({entry.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}