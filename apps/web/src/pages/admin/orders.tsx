import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import OrderKanban from '../../components/admin/OrderKanban';
import { GlassHeader } from '../../components/layout/GlassHeader';

export default function AdminOrdersPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 font-medium">Loading auth...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN' && user.role !== 'RESTAURANT_ADMIN') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <p className="text-[#FF3366] text-xl">Access Denied: Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0F]">
      <GlassHeader
        title="Order Management"
        right={<span className="text-sm text-white/40">Real-time Kanban Board</span>}
        sticky={false}
      />
      <main className="flex-1 overflow-hidden">
        <OrderKanban />
      </main>
    </div>
  );
}
