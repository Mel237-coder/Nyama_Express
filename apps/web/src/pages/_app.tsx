import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';

import { LanguageProvider } from '../hooks/useLanguage';
import { AuthProvider } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';
import { DelivererLayout } from '../components/deliverer/DelivererLayout';

import { AlertTriangle } from 'lucide-react';
import { FloatingCartBar } from '../components/layout/FloatingCartBar';
import { NeonBottomNav } from '../components/layout/NeonBottomNav';

export default function App({ Component, pageProps }: AppProps) {
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();
  const isDelivererRoute = router.pathname.startsWith('/deliverer');
  const isDelivererLogin = router.pathname === '/deliverer/login' || router.pathname === '/deliverer/register';

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#FF3366]/90 text-white text-center text-sm py-2 px-4">
              <AlertTriangle className="w-4 h-4 inline-block mr-1" style={{ color: 'white' }} /> Pas de connexion — Mode limité
            </div>
          )}

          {isDelivererRoute && !isDelivererLogin ? (
            <DelivererLayout>
              <Component {...pageProps} />
            </DelivererLayout>
          ) : (
            <>
              <div className="min-h-screen pb-24">
                <Component {...pageProps} />
              </div>
              <FloatingCartBar />
              <NeonBottomNav />
            </>
          )}
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
