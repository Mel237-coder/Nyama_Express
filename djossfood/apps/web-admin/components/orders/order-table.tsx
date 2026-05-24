'use client';

import { useState } from 'react';
import type { OrderWithItems } from '@/hooks/use-orders';
import { getStatusConfig } from '@/hooks/use-orders';
import { OrderDetails } from './order-details';

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmee' },
  { value: 'preparing', label: 'En preparation' },
  { value: 'ready', label: 'Prette' },
  { value: 'driver_assigned', label: 'Livreur assigne' },
  { value: 'picked_up', label: 'Recuperee' },
  { value: 'delivering', label: 'En livraison' },
  { value: 'delivered', label: 'Livree' },
  { value: 'completed', label: 'Terminee' },
  { value: 'cancelled', label: 'Annulee' },
];

interface OrderTableProps {
  orders: OrderWithItems[];
  total: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export function OrderTable({
  orders,
  total,
  currentPage,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
}: OrderTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const totalPages = Math.ceil(total / 20);

  return (
    <>
      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onStatusFilterChange(filter.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === filter.value
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Restaurant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Cree le</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <tr
                  key={order.id}
                  className="border-b hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-4 py-3 font-medium">#{order.order_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{order.restaurant_id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatAmount(order.total_amount)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} commande{total !== 1 ? 's' : ''} — Page {currentPage} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              Precedent
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <OrderDetails
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
    </>
  );
}