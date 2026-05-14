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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DC] z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map(item => {
          const isActive = path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <button key={item.href} onClick={() => router.push(item.href)} className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${isActive ? 'text-[#D84315]' : 'text-[#999999]'}`}>
              <Icon className="w-5 h-5" /><span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
