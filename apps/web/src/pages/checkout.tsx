import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import AddressSelector from '../components/checkout/AddressSelector';
import OrderSummary from '../components/checkout/OrderSummary';
import PaymentSelector from '../components/checkout/PaymentSelector';
import { api, storage } from '../lib/api';

interface CheckoutAddress {
  coords: { lat: number; lng: number } | null;
  text: string;
  saveAddress: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const [checkoutAddress, setCheckoutAddress] = useState<CheckoutAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'waiting' | 'error'>('idle');
  const [pollingError, setPollingError] = useState('');
  const timersRef = useRef<{ intervalId?: NodeJS.Timeout; timeoutId?: NodeJS.Timeout }>({});

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

    return () => {
      if (timersRef.current.intervalId) clearInterval(timersRef.current.intervalId);
      if (timersRef.current.timeoutId) clearTimeout(timersRef.current.timeoutId);
    };
  }, [isAuthenticated, authLoading, items, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!checkoutAddress || !paymentMethod) return;

    setIsPlacingOrder(true);
    setPollingStatus('idle');
    setPollingError('');

    try {
      const token = storage.getAccessToken();
      if (!token) throw new Error('Authentication token missing');

      // Get the restaurantId from the first item in the cart
      const restaurantId = items[0]?.restaurantId;
      if (!restaurantId) throw new Error('No restaurant associated with cart items');

      const orderResponse = await api.createOrder({
        restaurantId,
        items: items.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          options: item.options,
        })),
        deliveryAddress: checkoutAddress.text,
        deliveryLatitude: checkoutAddress.coords?.lat,
        deliveryLongitude: checkoutAddress.coords?.lng,
        paymentMethod,
      }, token);

      const orderId = orderResponse.id;

      // Handle immediate redirection for cash
      if (paymentMethod === 'cash') {
        clearCart();
        router.push(`/order-success?orderId=${orderId}`);
        return;
      }

      // Handle Mobile Money payment initiation
      if (paymentMethod === 'momo' || paymentMethod === 'orange') {
        await api.initiatePayment({
          orderId,
          amount: total,
          paymentMethod,
          phone: paymentPhone,
        }, token);

        setPollingStatus('waiting');
        startPolling(orderId);
      }
    } catch (error: any) {
      setPollingError(error.message || 'An error occurred while placing the order');
      setPollingStatus('error');
      setIsPlacingOrder(false);
    }
  };

  const startPolling = (orderId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const token = storage.getAccessToken();
        if (!token) return;

        const order = await api.getOrder(orderId, token);

        if (order.status === 'PAID' || order.status === 'CONFIRMED') {
          if (timersRef.current.intervalId) clearInterval(timersRef.current.intervalId);
          if (timersRef.current.timeoutId) clearTimeout(timersRef.current.timeoutId);
          timersRef.current = {};
          clearCart();
          router.push(`/order-success?orderId=${orderId}`);
        } else if (order.status === 'FAILED' || order.status === 'CANCELLED') {
          if (timersRef.current.intervalId) clearInterval(timersRef.current.intervalId);
          if (timersRef.current.timeoutId) clearTimeout(timersRef.current.timeoutId);
          timersRef.current = {};
          setPollingStatus('error');
          setPollingError('Payment failed. Please try again.');
          setIsPlacingOrder(false);
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        // We don't stop polling on network errors, but we might want a timeout
      }
    }, 7000);

    timersRef.current.intervalId = pollInterval;

    // Timeout after 5 minutes
    const pollTimeout = setTimeout(() => {
      if (timersRef.current.intervalId) clearInterval(timersRef.current.intervalId);
      if (timersRef.current.timeoutId) clearTimeout(timersRef.current.timeoutId);
      timersRef.current = {};
      if (pollingStatus === 'waiting') {
        setPollingStatus('error');
        setPollingError('Payment confirmation timed out. Please check your order history.');
        setIsPlacingOrder(false);
      }
    }, 300000);

    timersRef.current.timeoutId = pollTimeout;
  };

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
            {pollingStatus === 'waiting' ? (
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl text-center space-y-4 animate-pulse">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
                </div>
                <div className="text-orange-800">
                  <p className="font-bold text-lg">Waiting for confirmation...</p>
                  <p className="text-sm">Please check your phone for the payment prompt</p>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || !checkoutAddress || !paymentMethod || ( (paymentMethod === 'momo' || paymentMethod === 'orange') && !paymentPhone)}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 ${
                    (!isPlacingOrder && checkoutAddress && paymentMethod && ( (paymentMethod === 'momo' || paymentMethod === 'orange') ? paymentPhone : true ))
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isPlacingOrder ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    'Place Order'
                  )}
                </button>
                {pollingStatus === 'error' && (
                  <p className="text-center text-red-500 font-medium mt-3">
                    {pollingError}
                  </p>
                )}
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
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
