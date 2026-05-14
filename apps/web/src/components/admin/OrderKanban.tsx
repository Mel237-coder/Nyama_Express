import React, { useState, useEffect } from 'react';
import { socket } from '../../lib/websocket';
import { api, storage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import OrderCard from './OrderCard';
import OrderDetailsPanel from './OrderDetailsPanel';
import { BellRing } from 'lucide-react';

type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'PICKED_UP';

const COLUMNS: { id: OrderStatus; label: string; accent: string }[] = [
  { id: 'PENDING', label: 'Pending', accent: '#FFD600' },
  { id: 'PREPARING', label: 'Preparing', accent: '#00D4FF' },
  { id: 'READY', label: 'Ready', accent: '#00FF88' },
  { id: 'PICKED_UP', label: 'Picked Up', accent: '#FF3366' },
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
        const data: any = await api.getAdminOrders(token);
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
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto p-4 bg-[#0A0A0F] md:flex-row flex-col">
      {COLUMNS.map(({ id, label, accent }) => (
        <div key={id} className="flex flex-col w-full md:w-80 shrink-0 glass rounded-xl p-3">
          <h3 className="text-lg font-bold mb-4 px-2 flex justify-between items-center"
          style={{ color: accent }}
          >
            {label}
            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/60">
              {orders.filter((o) => o.status === id).length}
            </span>
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
          <div className="glass-elevated p-4 rounded-xl flex items-center gap-4 max-w-sm border border-[#FFD600]/20">
            <div className="p-2 bg-[#FFD600]/10 rounded-full">
              <BellRing size={20} className="text-[#FFD600]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">New Order Received!</p>
              <p className="text-sm text-white/60">Order #{newOrderToast.id.slice(0, 8)} - {newOrderToast.totalAmount} FCFA</p>
            </div>
            <button
              onClick={() => {
                setSelectedOrder(newOrderToast);
                setNewOrderToast(null);
              }}
              className="px-3 py-1.5 bg-[#FFD600] text-[#0A0A0F] text-xs font-bold rounded-lg hover:shadow-[0_0_20px_rgba(255,214,0,0.4)] transition-shadow"
            >
              View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
