'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number }>;
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune donnee de revenu</p>;
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatDay(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00AA13" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00AA13" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#666' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#666' }}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [formatAmount(Number(value)), 'Revenu']}
          contentStyle={{ borderRadius: 8, fontSize: 13 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#00AA13"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}