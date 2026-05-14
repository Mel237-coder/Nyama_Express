import React, { useEffect, useState } from 'react';
import { api, storage } from '../../lib/api';
import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { GlassCard } from '../../components/layout/GlassCard';
import { TrendingUp, ShoppingBag, Users, Star } from 'lucide-react';

interface AnalyticsData {
  revenue: { date: string; amount: number }[];
  topItems: { name: string; quantity: number }[];
  categories: { name: string; value: number }[];
}

const AnalyticsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // RBAC Guard: Ensure user is admin
    if (user.role !== 'ADMIN') {
      router.replace('/403');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = storage.getAccessToken();
        if (!token) throw new Error('Authentication token missing');

        const result: any = await api.getAnalytics(token);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <GlassCard className="text-center p-8 max-w-md mx-auto">
          <p className="text-[#FF3366] font-medium mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="neon-btn"
          >
            Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Revenue', value: '2.4M FCFA', icon: TrendingUp, color: 'text-[#00FF88]' },
    { label: 'Total Orders', value: '1,284', icon: ShoppingBag, color: 'text-[#FFD600]' },
    { label: 'Active Users', value: '856', icon: Users, color: 'text-[#00D4FF]' },
    { label: 'Avg. Rating', value: '4.8', icon: Star, color: 'text-[#FF3366]' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <GlassHeader title="Business Intelligence" sticky={false} />
      <div className="p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Business Intelligence</h1>
              <p className="text-white/50">Track your restaurant performance and popularity</p>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 glass text-sm font-medium text-white/60">
                Last 30 Days
              </div>
            </div>
          </header>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpiCards.map((kpi, idx) => (
              <GlassCard key={idx} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                    <kpi.icon size={24} />
                  </div>
                </div>
                <p className="text-sm text-white/50 font-medium">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </GlassCard>
            ))}
          </div>

          {data && <AnalyticsCharts data={data} />}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
