'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AdminGuard } from '@/components/auth/auth-guard';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Car,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { href: '/dashboard/drivers', label: 'Livreurs', icon: Car },
  { href: '/dashboard/orders', label: 'Commandes', icon: ClipboardList },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/settings', label: 'Parametres', icon: Settings },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Tableau de bord';
    if (pathname === '/dashboard/restaurants') return 'Restaurants';
    if (pathname === '/dashboard/drivers') return 'Livreurs';
    if (pathname === '/dashboard/orders') return 'Commandes';
    if (pathname === '/dashboard/notifications') return 'Notifications';
    if (pathname === '/dashboard/settings') return 'Parametres';
    return 'Administration';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col bg-sidebar text-white">
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">DjossFood</p>
            <p className="text-xs text-sidebar-text">Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-text hover:bg-sidebar-active/50 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-active/50 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}