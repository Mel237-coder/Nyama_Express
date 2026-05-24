'use client';

import { useKpis } from '@/hooks/use-kpis';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { StatusChart } from '@/components/dashboard/status-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ClipboardList, DollarSign, UtensilsCrossed, Car } from 'lucide-react';

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export default function DashboardPage() {
  const { data, isLoading } = useKpis();

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total commandes"
          value={data.totalOrders}
          icon={ClipboardList}
          iconColor="text-primary"
          iconBg="bg-green-100"
        />
        <KpiCard
          title="Revenu total"
          value={formatAmount(data.totalRevenue)}
          icon={DollarSign}
          iconColor="text-orange"
          iconBg="bg-orange-100"
        />
        <KpiCard
          title="Restaurants"
          value={data.totalRestaurants}
          icon={UtensilsCrossed}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <KpiCard
          title="Livreurs"
          value={data.totalDrivers}
          icon={Car}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue over time */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Revenu quotidien (14 jours)
          </h2>
          <RevenueChart data={data.dailyRevenue || []} />
        </div>

        {/* Orders by status */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Commandes actives: {data.activeOrders}
          </h2>
          <StatusChart ordersByStatus={data.ordersByStatus} />
        </div>
      </div>
    </div>
  );
}