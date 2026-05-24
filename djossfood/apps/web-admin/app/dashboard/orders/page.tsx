'use client';

import { useState } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { OrderTable } from '@/components/orders/order-table';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading } = useOrders(page, status || undefined);

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <OrderTable
      orders={data.orders}
      total={data.total}
      currentPage={page}
      onPageChange={setPage}
      statusFilter={status}
      onStatusFilterChange={(s) => { setStatus(s); setPage(1); }}
    />
  );
}