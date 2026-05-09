import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items } = useCart();

  useEffect(() => {
    // Prevent redirect while auth is still loading
    if (authLoading) return;

    // 1. Auth Guard: Redirect unauthenticated users to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 2. Cart Guard: Redirect users with empty carts back to /cart
    if (items.length === 0) {
      // Ideally we would use a toast notification here
      alert('Your cart is empty');
      router.push('/cart');
    }
  }, [isAuthenticated, authLoading, items, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Prevent flashing content before redirect
  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Checkout
        </h1>

        <div className="space-y-6">
          {/* Section 1: Delivery Address */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
            <div className="py-8 text-center text-gray-500 italic border-2 border-dashed border-gray-200 rounded-xl">
              AddressSelector Placeholder
            </div>
          </section>

          {/* Section 2: Order Summary */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="py-8 text-center text-gray-500 italic border-2 border-dashed border-gray-200 rounded-xl">
              OrderSummary Placeholder
            </div>
          </section>

          {/* Section 3: Payment Method */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="py-8 text-center text-gray-500 italic border-2 border-dashed border-gray-200 rounded-xl">
              PaymentSelector Placeholder
            </div>
          </section>

          {/* Section 4: Final Action */}
          <section className="pt-4">
            <div className="py-8 text-center text-gray-500 italic border-2 border-dashed border-gray-200 rounded-xl">
              Place Order Button Placeholder
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
