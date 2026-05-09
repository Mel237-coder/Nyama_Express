import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { api, storage } from '../../lib/api';
import { socket } from '../../lib/websocket';
import dynamic from 'next/dynamic';
import StatusHeader from '../../components/tracking/StatusHeader';
import DriverCard from '../../components/tracking/DriverCard';

// Import TrackingMap dynamically to avoid SSR issues with Leaflet
const TrackingMap = dynamic(() => import('../../components/tracking/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-200 animate-pulse rounded-2xl flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
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

export default function OrderTrackingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { id } = router.query;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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

        const orderData = await api.getOrder(id as string, token);
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
            const trackingData = await api.getDeliveryTracking(id as string, token);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = status || order?.status;
  const currentEta = order?.tracking?.eta || null;
  const currentDriver = order?.driver;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Order Tracking</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-6">
        {order && (
          <div className="space-y-6">
            <StatusHeader
              status={currentStatus || 'UNKNOWN'}
              eta={currentEta}
            />

            {/* Order Summary Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-sm font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    currentStatus === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    currentStatus === 'CANCELED' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {currentStatus}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">{order.totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Live Tracking Map */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-s-ping"></span>
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
            </div>
          </div>
        )}

        {currentStatus === 'OUT_FOR_DELIVERY' && (
          <DriverCard driver={currentDriver} />
        )}
      </main>
    </div>
  );
}
