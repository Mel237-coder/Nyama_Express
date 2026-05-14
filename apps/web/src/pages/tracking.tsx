import React, { useEffect, useState } from 'react';
import { Map, Bike, Star } from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { api, storage } from '../lib/api';
import { formatPrice } from '../lib/i18n';
import { GlassCard } from '../components/layout/GlassCard';
import { GlassHeader } from '../components/layout/GlassHeader';
import { NeonButton } from '../components/layout/NeonButton';

interface TrackingData {
  orderId: string;
  status: string;
  eta?: string;
  driver?: {
    name: string;
    phone: string;
    vehicle?: string;
    rating?: number;
  };
  currentLatitude?: number;
  currentLongitude?: number;
}

const TRACKING_STEPS = [
  { key: 'PENDING', labelFr: 'Commande reçue', labelEn: 'Order received' },
  { key: 'CONFIRMED', labelFr: 'Confirmée', labelEn: 'Confirmed' },
  { key: 'PREPARING', labelFr: 'En préparation', labelEn: 'Preparing' },
  { key: 'READY', labelFr: 'Prête', labelEn: 'Ready' },
  { key: 'OUT_FOR_DELIVERY', labelFr: 'En livraison', labelEn: 'Out for delivery' },
  { key: 'DELIVERED', labelFr: 'Livrée', labelEn: 'Delivered' },
];

const STATUS_ORDER = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export default function TrackingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get orderId from query or use mock
  const orderId = (router.query.orderId as string) || 'mock-order';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchTracking = async () => {
      setLoading(true);
      try {
        const token = storage.getAccessToken();
        if (!token) {
          setError('Session expired');
          return;
        }
        const data = (await api.getDeliveryTracking(orderId, token)) as any;
        setTracking(data);
      } catch (err: any) {
        console.error('Tracking fetch error:', err);
        // Use mock data if API fails
        setTracking(MOCK_TRACKING);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [isAuthenticated, orderId]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-12 h-12 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentStatus = tracking?.status || 'PENDING';
  const currentStepIndex = STATUS_ORDER.indexOf(currentStatus);

  const getStepState = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'future';
  };

  const handleContactDriver = () => {
    if (tracking?.driver?.phone) {
      window.location.href = `tel:${tracking.driver.phone}`;
    }
  };

  return (
    <div className="min-h-screen">
      <GlassHeader
        title={language === 'fr' ? 'Suivi en direct' : 'Live Tracking'}
        right={
          tracking?.eta ? (
            <span className="text-sm text-white/60">
              ETA: {tracking.eta}
            </span>
          ) : null
        }
      />

      <main className="px-4 py-4 space-y-4">
        {/* Map Placeholder */}
        <GlassCard elevated className="overflow-hidden">
          <div className="h-56 flex items-center justify-center bg-gradient-to-br from-[#FFD600]/5 to-transparent relative">
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            <div className="relative text-center space-y-2">
              <Map className="w-12 h-12 mx-auto" style={{ color: '#00D4FF' }} />
              <p className="text-sm text-white/50">
                {language === 'fr' ? 'Carte de suivi' : 'Tracking map'}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Driver Info */}
        {tracking?.driver && (
          <GlassCard className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#FFD600]/10 flex items-center justify-center border border-[#FFD600]/20">
                <Bike className="w-7 h-7" style={{ color: '#00FF88' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">
                  {tracking.driver.name}
                </h3>
                <p className="text-sm text-white/50">
                  {tracking.driver.vehicle || 'Moto'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-4 h-4" style={{ color: '#FFD600', fill: '#FFD600' }} />
                  <span className="text-sm text-white/70">
                    {tracking.driver.rating?.toFixed(1) || '4.8'}
                  </span>
                </div>
              </div>
              <NeonButton variant="ghost" size="sm" onClick={handleContactDriver}>
                {language === 'fr' ? 'Contacter' : 'Contact'}
              </NeonButton>
            </div>
          </GlassCard>
        )}

        {/* Status Timeline */}
        <GlassCard className="p-4">
          <h3 className="font-semibold text-white mb-4">
            {language === 'fr' ? 'Statut de la commande' : 'Order status'}
          </h3>
          <div className="space-y-0">
            {TRACKING_STEPS.map((step, index) => {
              const state = getStepState(index);
              const isLast = index === TRACKING_STEPS.length - 1;

              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                        state === 'completed'
                          ? 'bg-[#00FF88] border-[#00FF88]'
                          : state === 'current'
                          ? 'bg-[#00D4FF] border-[#00D4FF] pulse-neon'
                          : 'bg-transparent border-white/20'
                      }`}
                    />
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[24px] ${
                          state === 'completed' ? 'bg-[#00FF88]/40' : 'bg-white/10'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <p
                      className={`text-sm font-medium ${
                        state === 'completed'
                          ? 'status-success'
                          : state === 'current'
                          ? 'status-info'
                          : 'text-white/40'
                      }`}
                    >
                      {language === 'fr' ? step.labelFr : step.labelEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* ETA Card */}
        {tracking?.eta && (
          <GlassCard className="p-4 text-center">
            <p className="text-sm text-white/50 mb-1">
              {language === 'fr' ? 'Arrivée estimée' : 'Estimated arrival'}
            </p>
            <p className="text-2xl font-bold text-[#FFD600]">{tracking.eta}</p>
          </GlassCard>
        )}

        {/* Contact Driver Ghost Button */}
        {tracking?.driver && (
          <div className="flex justify-center">
            <button onClick={handleContactDriver} className="ghost-btn">
              {language === 'fr' ? 'Contacter le livreur' : 'Contact driver'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

const MOCK_TRACKING: TrackingData = {
  orderId: 'mock-order',
  status: 'OUT_FOR_DELIVERY',
  eta: '12:45',
  driver: {
    name: 'Jean-Pierre K.',
    phone: '+237 6 98 76 54 32',
    vehicle: 'Moto Yamaha',
    rating: 4.9,
  },
  currentLatitude: 3.848,
  currentLongitude: 11.502,
};
