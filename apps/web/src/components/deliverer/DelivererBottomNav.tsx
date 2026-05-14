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
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="dv-nav max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map(item => {
          const isActive = path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-2xl transition-all duration-200 ${isActive ? 'text-[#D84315]' : 'text-[#A8A29E] hover:text-[#78716C]'}`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-semibold">{item.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-[#D84315] animate-dot-pulse" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
