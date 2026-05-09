import React, { useState, useEffect } from 'react';
import { socket } from '../../lib/websocket';
import { api, storage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import OrderCard from './OrderCard';
import OrderDetailsPanel from './OrderDetailsPanel';
import { BellRing } from 'lucide-react';

type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'PICKED_UP';

type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'PICKED_UP';

const COLUMNS: { id: OrderStatus; label: string }[] = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'PREPARING', label: 'Preparing' },
  { id: 'READY', label: 'Ready' },
  { id: 'PICKED_UP', label: 'Picked Up' },
];

export default function OrderKanban() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrderToast, setNewOrderToast] = useState<any | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = storage.getAccessToken();
        if (!token) return;
        const data = await api.getAdminOrders(token);
        setOrders(data.orders || data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    socket.connect();

    socket.on('order:new', (newOrder) => {
      setOrders((prev) => [...prev, newOrder]);

      // Play notification sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(err => console.log('Autoplay prevented: user interaction required for audio alerts.'));

      // Show toast notification
      setNewOrderToast(newOrder);
      setTimeout(() => setNewOrderToast(null), 10000);
    });

    socket.on('order:status_update', ({ orderId, newStatus }) => {
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
    });

    return () => {
      socket.off('order:new');
      socket.off('order:status_update');
      socket.disconnect();
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = storage.getAccessToken();
      if (!token) return;
      await api.updateOrderStatus(orderId, newStatus, token);

      // Optimistically update UI
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading orders...</div>;
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto p-4 bg-gray-100 md:flex-row flex-col">
      {COLUMNS.map(({ id, label }) => (
        <div key={id} className="flex flex-col w-full md:w-80 shrink-0 bg-gray-200 rounded-lg p-3">
          <h3 className="text-lg font-bold mb-4 px-2 text-gray-700 flex justify-between items-center">
            {label}
            <span className="text-xs bg-gray-300 px-2 py-1 rounded-full">
              {orders.filter((o) => o.status === id).length}
            </span
          </h3>
          <div
            className="flex-1 overflow-y-auto space-y-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const orderId = e.dataTransfer.getData('orderId');
              if (orderId) updateStatus(orderId, id);
            }}
          >
            {orders
              .filter((o) => o.status === id)
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => setSelectedOrder(order)}
                />
              ))}
          </div>
        </div>
      ))}

      {selectedOrder && (
        <OrderDetailsPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {newOrderToast && (
        <div className="fixed bottom-4 right-4 z-[60] animate-in slide-in-from-bottom-full duration-300">
          <div className="bg-orange-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-sm border-2 border-white/20">
            <div className="p-2 bg-white/20 rounded-full">
              <BellRing size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold">New Order Received!</p>
              <p className="text-sm opacity-90">Order #{newOrderToast.id.slice(0, 8)} - {newOrderToast.totalAmount} FCFA</p>
            </div>
            <button
              onClick={() => {
                setSelectedOrder(newOrderToast);
                setNewOrderToast(null);
              }}
              className="px-3 py-1.5 bg-white text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-50 transition-colors"
            >
              View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
