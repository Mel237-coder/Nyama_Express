import React, { useEffect, useState } from 'react';
import { api, storage } from '@/lib/api';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';

interface AnalyticsData {
  revenue: { date: string; amount: number }[];
  topItems: { name: string; quantity: number }[];
  categories: { name: string; value: number }[];
}

const AnalyticsPage = () => {
  const { user, loading: authLoading } = useAuth();
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

        const result = await api.getAnalytics(token);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200 max-w-md mx-auto">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
            <p className="text-gray-500">Track your restaurant performance and popularity</p>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
              Last 30 Days
            </div>
          </div>
        </header>

        {data && <AnalyticsCharts data={data} />}
      </div>
    </div>
  );
};

export default AnalyticsPage;
