'use client';

import { useState } from 'react';
import { useOrders, useConfirmOrder, useRejectOrder, useMarkReady } from '@/hooks/use-orders';
import { KanbanColumn } from './kanban-column';
import { OrderCard } from './order-card';
import { OrderDetailsSheet } from './order-details-sheet';
import type { Order } from '@djossfood/database';

export function KanbanBoard() {
  const {
    pendingOrders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    isLoading,
  } = useOrders();

  const confirmOrder = useConfirmOrder();
  const rejectOrder = useRejectOrder();
  const markReady = useMarkReady();

  const [selectedOrder, setSelectedOrder] = useState<(Order & { order_items: any[] }) | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumn
          title="Nouvelle"
          count={pendingOrders.length}
          accentColor="bg-yellow-400"
        >
          {pendingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onConfirm={(id) => confirmOrder.mutate(id)}
              onReject={(id) => rejectOrder.mutate({ orderId: id, reason: 'Non disponible' })}
              onClick={(o) => setSelectedOrder(o)}
              isPending={confirmOrder.isPending || rejectOrder.isPending}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Confirmee"
          count={confirmedOrders.length}
          accentColor="bg-green-500"
        >
          {confirmedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onMarkReady={(id) => markReady.mutate(id)}
              onClick={(o) => setSelectedOrder(o)}
              isPending={markReady.isPending}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="En preparation"
          count={preparingOrders.length}
          accentColor="bg-blue-500"
        >
          {preparingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={(o) => setSelectedOrder(o)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Prette"
          count={readyOrders.length}
          accentColor="bg-orange-500"
        >
          {readyOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={(o) => setSelectedOrder(o)}
            />
          ))}
        </KanbanColumn>

        <KanbanColumn
          title="Terminee"
          count={completedOrders.length}
          accentColor="bg-gray-400"
        >
          {completedOrders.slice(0, 10).map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={(o) => setSelectedOrder(o)}
            />
          ))}
        </KanbanColumn>
      </div>

      {/* Order details sheet */}
      {selectedOrder && (
        <OrderDetailsSheet
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}