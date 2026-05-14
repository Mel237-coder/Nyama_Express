import { useRouter } from 'next/router';
import { ClipboardList, MapPin, Wallet, User } from 'lucide-react';

const navItems = [
  { href: '/deliverer/missions', label: 'Missions', icon: ClipboardList },
  { href: '/deliverer/tracking', label: 'Tracking', icon: MapPin },
  { href: '/deliverer/earnings', label: 'Gains', icon: Wallet },
  { href: '/deliverer/profile', label: 'Profil', icon: User },
];

export function DelivererBottomNav() {
  const router = useRouter();
  const path = router.pathname;
  return (
    <nav className="fixed bottom-5 left-5 right-5 z-50">
      <div className="nav-luxe max-w-md mx-auto flex justify-around items-center h-[68px] px-3">
        {navItems.map(item => {
          const isActive = path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-2xl transition-all duration-300 ${isActive ? 'text-[#C73E1D]' : 'text-[#9B958D] hover:text-[#6B6560]'}`}>
              <div className={`relative p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#C73E1D]/10' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D4A017]" />
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
