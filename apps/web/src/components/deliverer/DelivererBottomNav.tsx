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
      <div className="glass-strong rounded-2xl shadow-lg max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map(item => {
          const isActive = path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full rounded-xl transition-all duration-300 ${isActive ? 'text-[#D84315]' : 'text-[#999999] hover:text-[#666666]'}`}>
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-[#D84315]/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
