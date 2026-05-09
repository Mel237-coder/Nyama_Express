import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import '../styles/globals.css';

// Language context
import { LanguageProvider } from '../hooks/useLanguage';
import { AuthProvider } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';

// Service worker registration for PWA
import { registerSW } from 'next-pwa';

export default function App({ Component, pageProps }: AppProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      registerSW({
        onRegisteredSW(swUrl, r) {
          console.log('Service Worker registered:', swUrl);
        },
        onOfflineReady() {
          console.log('App ready for offline use');
        },
      });
    }

    // Network status detection
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
          {/* Offline banner */}
          {!isOnline && (
            <div className="offline-banner">
              ⚠️ Pas de connexion - Mode hors ligne
            </div>
          )}

          <Component {...pageProps} />

          {/* Bottom navigation bar */}
          <BottomNav />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

function BottomNav() {
  // Simplified bottom navigation
  return (
    <nav className="bottom-nav">
      <NavItem href="/" icon="🏠" label="Accueil" />
      <NavItem href="/restaurants" icon="🍽️" label="Restaurants" />
      <NavItem href="/cart" icon="🛒" label="Panier" />
      <NavItem href="/orders" icon="📋" label="Commandes" />
      <NavItem href="/profile" icon="👤" label="Profil" />
    </nav>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} className="flex flex-col items-center text-gray-600 hover:text-orange-500">
      <span className="text-xl">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </a>
  );
}