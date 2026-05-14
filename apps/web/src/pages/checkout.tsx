import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import AddressSelector from '../components/checkout/AddressSelector';
import OrderSummary from '../components/checkout/OrderSummary';
import PaymentSelector from '../components/checkout/PaymentSelector';
import { api, storage } from '../lib/api';
import { GlassHeader } from '../components/layout/GlassHeader';
import { GlassCard } from '../components/layout/GlassCard';
import { NeonButton } from '../components/layout/NeonButton';

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

interface CheckoutAddress {
  coords: { lat: number; lng: number } | null;
  text: string;
  saveAddress: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, subtotal, deliveryFee, total, clearCart, restaurantId } = useCart();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [checkoutAddress, setCheckoutAddress] = useState<CheckoutAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'waiting' | 'error'>('idle');
  const [pollingError, setPollingError] = useState('');
  const timersRef = useRef<{ intervalId?: NodeJS.Timeout; timeoutId?: NodeJS.Timeout }>({});

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      router.push('/cart');
    }

    const token = storage.getAccessToken();
    if (token) {
      api.getAddresses(token)
        .then((addresses: any) => setSavedAddresses(addresses))
        .catch(err => console.error('Error fetching saved addresses:', err));
    }

    return () => {
      if (timersRef.current.intervalId) clearInterval(timersRef.current.intervalId);
      if (timersRef.current.timeoutId) clearTimeout(timersRef.current.timeoutId);
    };
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-12 h-12 rounded-full" />
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

      if (!restaurantId) throw new Error('No restaurant associated with cart items');

      const orderResponse: any = await api.createOrder({
        restaurantId,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          options: item.options,
        })),
        deliveryAddress: checkoutAddress.text,
        deliveryLatitude: checkoutAddress.coords?.lat,
        deliveryLongitude: checkoutAddress.coords?.lng,
        paymentMethod,
      }, token);

      const orderId = orderResponse.id;

      if (paymentMethod === 'cash') {
        clearCart();
        router.push(`/order-success?orderId=${orderId}`);
        return;
      }

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

        const order: any = await api.getOrder(orderId, token);

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
      }
    }, 7000);

    timersRef.current.intervalId = pollInterval;

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

  const handleSavedAddressSelect = (address: SavedAddress) => {
    setCheckoutAddress({
      coords: { lat: address.latitude, lng: address.longitude },
      text: address.street,
      saveAddress: false,
    });
  };

  const canPlaceOrder =
    !isPlacingOrder &&
    checkoutAddress &&
    paymentMethod &&
    ((paymentMethod === 'momo' || paymentMethod === 'orange') ? paymentPhone : true);

  return (
    <div className="min-h-screen pb-24">
      <GlassHeader title="Commander" />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Delivery Address */}
        <GlassCard elevated className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Adresse de livraison</h2>

          {savedAddresses.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                Sélection rapide
              </p>
              <div className="flex flex-wrap gap-2">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => handleSavedAddressSelect(addr)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      checkoutAddress?.text === addr.street
                        ? 'neon-btn'
                        : 'ghost-btn'
                    }`}
                  >
                    {addr.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AddressSelector
            onAddressConfirm={(address) => setCheckoutAddress(address)}
          />
        </GlassCard>

        {/* Order Summary */}
        <GlassCard elevated className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Résumé de la commande</h2>
          <OrderSummary
            items={items}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
          />
        </GlassCard>

        {/* Payment Method */}
        <GlassCard elevated className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Moyen de paiement</h2>
          <PaymentSelector
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            paymentPhone={paymentPhone}
            onPhoneChange={setPaymentPhone}
          />
        </GlassCard>

        {/* Final Action */}
        <div className="pt-4">
          {pollingStatus === 'waiting' ? (
            <div className="glass p-6 rounded-2xl text-center space-y-4 animate-pulse">
              <div className="flex justify-center">
                <div className="shimmer w-10 h-10 rounded-full" />
              </div>
              <div className="text-[#FFD600]">
                <p className="font-bold text-lg">En attente de confirmation...</p>
                <p className="text-sm text-white/60">Veuillez vérifier votre téléphone pour le paiement</p>
              </div>
            </div>
          ) : (
            <>
              <NeonButton
                size="lg"
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder}
              >
                {isPlacingOrder ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" />
                    Traitement...
                  </span>
                ) : (
                  'Confirmer la commande'
                )}
              </NeonButton>

              {pollingStatus === 'error' && (
                <p className="text-center text-[#FF3366] font-medium mt-3">
                  {pollingError}
                </p>
              )}
              {!checkoutAddress && (
                <p className="text-center text-sm text-white/40 mt-3">
                  Veuillez confirmer votre adresse de livraison
                </p>
              )}
              {!paymentMethod && checkoutAddress && (
                <p className="text-center text-sm text-white/40 mt-3">
                  Veuillez sélectionner un moyen de paiement
                </p>
              )}
              {paymentMethod && (paymentMethod === 'momo' || paymentMethod === 'orange') && !paymentPhone && checkoutAddress && (
                <p className="text-center text-sm text-white/40 mt-3">
                  Veuillez entrer un numéro de téléphone pour le paiement
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
