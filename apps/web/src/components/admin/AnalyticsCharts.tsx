import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { GlassCard } from '../layout/GlassCard';

interface AnalyticsData {
  revenue: { date: string; amount: number }[];
  topItems: { name: string; quantity: number }[];
  categories: { name: string; value: number }[];
}

export const AnalyticsCharts: React.FC<{ data: AnalyticsData }> = ({ data }) => {
  const COLORS = ['#FFD600', '#00FF88', '#00D4FF', '#FF3366', '#8884d8', '#82ca9d'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Chart */}
      <GlassCard className="p-6 col-span-1 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-6 text-white">Revenue (Last 30 Days)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.revenue}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
                tickFormatter={(value) => value.split('-').slice(1).join('/')}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
                tickFormatter={(value) => `${value/1000}k`}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenue']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(10,10,15,0.95)',
                  backdropFilter: 'blur(16px)',
                  color: '#ffffff',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#FFD600"
                strokeWidth={3}
                dot={{ r: 4, fill: '#FFD600' }}
                activeDot={{ r: 6, fill: '#FFD600', stroke: '#0A0A0F', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Top Sellers List */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-6 text-white">Top 5 Best-Sellers</h3>
        <div className="space-y-4">
          {data.topItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/[0.08] transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="font-medium text-white">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-[#FFD600]">{item.quantity} orders</span>
            </div>
          ))}
          {data.topItems.length === 0 && (
            <div className="text-center py-8 text-white/40">No sales data available</div>
          )}
        </div>
      </GlassCard>

      {/* Category Pie Chart */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-6 text-white">Category Popularity</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.categories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} orders`, name]}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(10,10,15,0.95)',
                  backdropFilter: 'blur(16px)',
                  color: '#ffffff',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {data.categories.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-xs text-white/60">{entry.name}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
