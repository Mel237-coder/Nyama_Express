import { useRouter } from 'next/router';
import { Package, Navigation, Banknote, CircleUserRound } from 'lucide-react';

const navItems = [
  { href: '/deliverer/missions', label: 'Missions', icon: Package, color: '#D84315', bg: '#FEF0EB' },
  { href: '/deliverer/tracking', label: 'Tracking', icon: Navigation, color: '#166534', bg: '#DCFCE7' },
  { href: '/deliverer/earnings', label: 'Gains', icon: Banknote, color: '#D97706', bg: '#FEF3C7' },
  { href: '/deliverer/profile', label: 'Profil', icon: CircleUserRound, color: '#1C1917', bg: '#F5F2ED' },
];

export function DelivererBottomNav() {
  const router = useRouter();
  const path = router.pathname;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-[#E7E5E4] flex justify-around items-center h-[72px] px-2 pb-2 pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {navItems.map(item => {
          const isActive = path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full rounded-2xl transition-all duration-200 ${isActive ? 'scale-105' : 'hover:scale-105'}`}
            >
              <div className={`p-2 rounded-xl transition-all duration-200 ${isActive ? 'shadow-sm' : ''}`}
                style={{ backgroundColor: isActive ? item.bg : 'transparent' }}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ color: isActive ? item.color : '#A8A29E' }}
                />
              </div>
              <span className="text-[10px] font-bold transition-colors duration-200"
                style={{ color: isActive ? item.color : '#A8A29E' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
