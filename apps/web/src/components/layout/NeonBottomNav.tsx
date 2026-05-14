import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, UtensilsCrossed, ShoppingCart, ClipboardList, User } from 'lucide-react';

interface NavItemDef {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
}

const navItems: NavItemDef[] = [
  { href: '/', icon: <Home className="w-5 h-5" />, label: 'Accueil', color: '#C2410C', bg: '#FEF0EB' },
  { href: '/restaurants', icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Restos', color: '#15803D', bg: '#DCFCE7' },
  { href: '/cart', icon: <ShoppingCart className="w-5 h-5" />, label: 'Panier', color: '#B45309', bg: '#FEF3C7' },
  { href: '/orders', icon: <ClipboardList className="w-5 h-5" />, label: 'Commandes', color: '#2563EB', bg: '#DBEAFE' },
  { href: '/profile', icon: <User className="w-5 h-5" />, label: 'Profil', color: '#1C1917', bg: '#F5F2ED' },
];

export const NeonBottomNav: React.FC = () => {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 ed-nav">
      <div className="flex justify-around items-center h-[68px] px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-2xl transition-all duration-200 ${isActive ? 'scale-105' : 'hover:scale-105'}`}
              aria-label={item.label}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'shadow-sm' : ''}`}
                style={{ backgroundColor: isActive ? item.bg : 'transparent' }}
              >
                <span style={{ color: isActive ? item.color : '#A8A29E' }}>
                  {item.icon}
                </span>
              </div>
              <span
                className="text-[10px] font-bold transition-colors duration-200"
                style={{ color: isActive ? item.color : '#A8A29E' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
