import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { api, storage } from '../../lib/api';
import { socket } from '../../lib/websocket';
import dynamic from 'next/dynamic';
import { AlertTriangle } from 'lucide-react';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { GlassCard } from '../../components/layout/GlassCard';
import StatusHeader from '../../components/tracking/StatusHeader';
import DriverCard from '../../components/tracking/DriverCard';
import ArrivedOverlay from '../../components/tracking/ArrivedOverlay';

// Import TrackingMap dynamically to avoid SSR issues with Leaflet
const TrackingMap = dynamic(() => import('../../components/tracking/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full shimmer rounded-2xl flex items-center justify-center">
      <p className="text-white/40">Loading map...</p>
    </div>
  ),
});

interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  restaurantId: string;
}

interface OrderDetails extends Order {
  restaurant: {
    latitude: number;
    longitude: number;
  };
  driver?: {
    name: string;
    phone: string;
    photo?: string;
  };
  tracking?: {
    currentLatitude: number;
    currentLongitude: number;
    eta?: string;
  };
}

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Commande reçue' },
  { key: 'PREPARING', label: 'En préparation' },
  { key: 'READY', label: 'Prête' },
  { key: 'OUT_FOR_DELIVERY', label: 'En livraison' },
  { key: 'ARRIVED', label: 'Arrivée' },
  { key: 'DELIVERED', label: 'Livrée' },
];

export default function OrderTrackingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { id } = router.query;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!id || !user) return;

      setIsLoading(true);
      try {
        const token = storage.getAccessToken();
        if (!token) {
          setError('Session expired. Please login again.');
          return;
        }

        const orderData: any = await api.getOrder(id as string, token);
        if (orderData) {
          setOrder(orderData);
          setStatus(orderData.status);
          if (orderData.tracking) {
            setDriverCoords({
              lat: orderData.tracking.currentLatitude,
              lng: orderData.tracking.currentLongitude,
            });
          }
        } else {
          setError('Order not found.');
        }
      } catch (err: any) {
        console.error('Failed to fetch order:', err);
        setError(err.message || 'An error occurred while fetching order details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [id, user]);

  useEffect(() => {
    if (!id || !user || isLoading || !order) return;

    socket.connect();
    socket.emit('order:subscribe', { orderId: id });

    socket.on('delivery:location_update', (data: { lat: number; lng: number }) => {
      setDriverCoords({ lat: data.lat, lng: data.lng });
    });

    socket.on('order:status_changed', (data: { status: string }) => {
      setStatus(data.status);
    });

    const pollingInterval = setInterval(async () => {
      if (!socket.connected) {
        try {
          const token = storage.getAccessToken();
          if (token) {
            const trackingData: any = await api.getDeliveryTracking(id as string, token);
            if (trackingData) {
              setStatus(trackingData.status);
              if (trackingData.currentLatitude && trackingData.currentLongitude) {
                setDriverCoords({
                  lat: trackingData.currentLatitude,
                  lng: trackingData.currentLongitude,
                });
              }
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }
    }, 30000);

    return () => {
      socket.off('delivery:location_update');
      socket.off('order:status_changed');
      socket.emit('order:unsubscribe', { orderId: id });
      socket.disconnect();
      clearInterval(pollingInterval);
    };
  }, [id, user, isLoading, order]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/60 font-medium">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full text-center p-8">
          <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: '#FF3366' }} />
          <h1 className="text-xl font-bold text-white mb-2">Oops!</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="neon-btn w-full"
          >
            Return Home
          </button>
        </GlassCard>
      </div>
    );
  }

  const currentStatus = status || order?.status;
  const currentEta = order?.tracking?.eta || null;
  const currentDriver = order?.driver;

  const handleConfirmReceipt = async () => {
    if (!id) return;
    setIsConfirming(true);
    try {
      const token = storage.getAccessToken();
      if (token) {
        await api.confirmDelivery(id as string, token);
        alert('Thank you for your order! Enjoy your meal!');
        router.push('/orders');
      }
    } catch (err: any) {
      console.error('Confirmation error:', err);
      alert('Failed to confirm receipt. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const getStepStatus = (stepKey: string) => {
    const stepIndex = ORDER_STEPS.findIndex(s => s.key === stepKey);
    const currentIndex = ORDER_STEPS.findIndex(s => s.key === currentStatus);
    if (currentIndex === -1) return 'future';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'future';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <GlassHeader title="Order Tracking" />

      <main className="max-w-md mx-auto px-4 py-6">
        {order && (
          <div className="space-y-6">
            <StatusHeader
              status={currentStatus || 'UNKNOWN'}
              eta={currentEta}
            />

            {/* Order Summary Card */}
            <GlassCard className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-white/50">Order ID</p>
                  <p className="font-mono text-sm font-medium text-white">#{order.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <span className={`neon-badge ${
                    currentStatus === 'DELIVERED' ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20' :
                    currentStatus === 'CANCELED' ? 'bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20' :
                    'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20'
                  }`}>
                    {currentStatus}
                  </span>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Amount</span>
                  <span className="text-lg font-bold text-[#FFD600]">{order.totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>
            </GlassCard>

            {/* Status Timeline */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Status Timeline</h3>
              <div className="space-y-0">
                {ORDER_STEPS.map((step, index) => {
                  const stepStatus = getStepStatus(step.key);
                  const isLast = index === ORDER_STEPS.length - 1;
                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          stepStatus === 'current' ? 'bg-[#00D4FF] pulse-neon' :
                          stepStatus === 'completed' ? 'bg-[#00FF88]' :
                          'bg-white/20'
                        }`}
                        />
                        {!isLast && (
                          <div className={`w-0.5 h-8 ${
                            stepStatus === 'completed' ? 'bg-[#00FF88]/40' : 'bg-white/10'
                          }`}
                          />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className={`text-sm font-medium ${
                          stepStatus === 'current' ? 'status-info' :
                          stepStatus === 'completed' ? 'status-success' :
                          'text-white/40'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Live Tracking Map */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"></span>
                Live Tracking
              </h3>
              <div className="h-[400px] w-full">
                <TrackingMap
                  restaurantCoords={{
                    lat: order.restaurant?.latitude || 3.848,
                    lng: order.restaurant?.longitude || 11.502,
                  }}
                  userCoords={{
                    lat: order.deliveryLatitude || 3.848,
                    lng: order.deliveryLongitude || 11.502,
                  }}
                  driverCoords={
                    driverCoords || (order.tracking
                      ? { lat: order.tracking.currentLatitude, lng: order.tracking.currentLongitude }
                      : null)
                  }
                />
              </div>
            </GlassCard>
          </div>
        )}

        {currentStatus === 'OUT_FOR_DELIVERY' && (
          <DriverCard driver={currentDriver} />
        )}
      </main>

      {(currentStatus === 'ARRIVED' || currentStatus === 'DELIVERED') && (
        <ArrivedOverlay
          orderId={id as string}
          onConfirm={handleConfirmReceipt}
        />
      )}
    </div>
  );
}
