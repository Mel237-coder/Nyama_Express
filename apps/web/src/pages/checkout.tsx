import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import AddressSelector from '../components/checkout/AddressSelector';
import OrderSummary from '../components/checkout/OrderSummary';
import PaymentSelector from '../components/checkout/PaymentSelector';

interface CheckoutAddress {
  coords: { lat: number; lng: number } | null;
  text: string;
  saveAddress: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, subtotal, deliveryFee, total } = useCart();
  const [checkoutAddress, setCheckoutAddress] = useState<CheckoutAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');

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
            <AddressSelector
              onAddressConfirm={(address) => setCheckoutAddress(address)}
            />
          </section>

          {/* Section 2: Order Summary */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <OrderSummary
              items={items}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
            />
          </section>

          {/* Section 3: Payment Method */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <PaymentSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              paymentPhone={paymentPhone}
              onPhoneChange={setPaymentPhone}
            />
          </section>

          {/* Section 4: Final Action */}
          <section className="pt-4">
            <button
              disabled={!checkoutAddress || !paymentMethod || ( (paymentMethod === 'momo' || paymentMethod === 'orange') && !paymentPhone)}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 ${
                checkoutAddress && paymentMethod && ( (paymentMethod === 'momo' || paymentMethod === 'orange') ? paymentPhone : true )
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Place Order
            </button>
            {!checkoutAddress && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Please confirm your delivery address to continue
              </p>
            )}
            {!paymentMethod && checkoutAddress && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Please select a payment method to continue
              </p>
            )}
            {paymentMethod && (paymentMethod === 'momo' || paymentMethod === 'orange') && !paymentPhone && checkoutAddress && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Please provide a payment phone number
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
