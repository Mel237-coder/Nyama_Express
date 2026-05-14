import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, UtensilsCrossed, ShoppingCart, ClipboardList, User } from 'lucide-react';

interface NavItemDef {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItemDef[] = [
  { href: '/', icon: <Home className="w-6 h-6" />, label: 'Accueil' },
  { href: '/restaurants', icon: <UtensilsCrossed className="w-6 h-6" />, label: 'Restos' },
  { href: '/cart', icon: <ShoppingCart className="w-6 h-6" />, label: 'Panier' },
  { href: '/orders', icon: <ClipboardList className="w-6 h-6" />, label: 'Commandes' },
  { href: '/profile', icon: <User className="w-6 h-6" />, label: 'Profil' },
];

export const NeonBottomNav: React.FC = () => {
  const router = useRouter();

  return (
    <nav className="bottom-nav-glass safe-area-bottom">
      {navItems.map((item) => {
        const isActive = router.pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2 relative"
            aria-label={item.label}
          >
            <span
              className={
                isActive
                  ? 'transition-transform duration-200 scale-110'
                  : 'opacity-50 transition-opacity duration-200 text-white/40'
              }
              style={isActive ? { color: '#FFD600' } : undefined}
            >
              {item.icon}
            </span>
            <span
              className={
                isActive
                  ? 'text-[10px] font-semibold tracking-wide transition-colors duration-200'
                  : 'text-[10px] font-medium text-white/40 transition-colors duration-200'
              }
              style={isActive ? { color: '#FFD600' } : undefined}
            >
              {item.label}
            </span>
            {isActive && (
              <span
                className="absolute bottom-1 w-1 h-1 rounded-full"
                style={{
                  backgroundColor: '#FFD600',
                  boxShadow: '0 0 6px rgba(255, 214, 0, 0.8)',
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
