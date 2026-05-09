import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import OrderKanban from '../../components/admin/OrderKanban';

export default function AdminOrdersPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-8">Loading auth...</div>;

  if (!user || user.role !== 'ADMIN' && user.role !== 'RESTAURANT_ADMIN') {
    return <div className="p-8 text-red-500">Access Denied: Admin privileges required.</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 border-b bg-white flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="text-sm text-gray-500">Real-time Kanban Board</div>
      </header>
      <main className="flex-1 overflow-hidden">
        <OrderKanban />
      </main>
    </div>
  );
}
