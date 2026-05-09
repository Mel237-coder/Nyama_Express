import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { api, storage } from '../../lib/api';

interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  // Add other necessary order fields here
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { id } = router.query;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;

      // Wait for auth to resolve
      if (authLoading) return;

      // Auth Guard: Redirect if not authenticated
      if (!user) {
        router.replace('/');
        return;
      }

      try {
        const token = storage.getAccessToken();
        if (!token) {
          router.replace('/');
          return;
        }

        const orderData = await api.getOrder(id as string, token);

        // Security Check: Compare order owner with current user
        if (orderData.userId !== user.id) {
          console.error('Unauthorized access to order');
          router.replace('/');
          return;
        }

        setOrder(orderData);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        if (err.message.includes('404')) {
          setError('Order not found');
        } else {
          setError('An error occurred while fetching the order');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [id, user, authLoading, router]);

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
            {/* Order Summary Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-sm font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    order.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
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

            {/* Tracking Placeholder */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
              <div className="text-blue-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.045l-4.242 4.242a1 1 0 01-1.414 0l-4.242-4.242A1 1 0 015.414 16H18.586a1 1 0 010 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-blue-900">Real-time tracking coming soon</h3>
              <p className="text-sm text-blue-700 mt-1">We'll update you as your order moves!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
