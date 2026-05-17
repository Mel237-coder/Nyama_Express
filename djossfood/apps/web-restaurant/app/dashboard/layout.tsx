'use client';

import { useRouter, usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ConnectionBanner } from '@/components/connection-banner';
import { RestaurantProvider } from '@/contexts/restaurant-context';
import { useRestaurant } from '@/hooks/use-restaurant';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  ClipboardList,
  UtensilsCrossed,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Commandes', icon: ClipboardList },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/settings', label: 'Parametres', icon: Settings },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading } = useRestaurant();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data?.restaurant) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            Aucun restaurant trouve
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre compte n&apos;est pas associe a un restaurant.
          </p>
        </div>
      </div>
    );
  }

  const restaurant = data.restaurant;
  const isOpen = restaurant.status === 'open';

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Commandes';
    if (pathname === '/dashboard/menu') return 'Menu';
    if (pathname === '/dashboard/settings') return 'Parametres';
    return 'Tableau de bord';
  };

  return (
    <RestaurantProvider restaurant={restaurant}>
      <div className="flex h-screen bg-background">
        <ConnectionBanner />
        {/* Sidebar */}
        <aside className="flex w-60 flex-col bg-sidebar text-white">
          {/* Logo / Restaurant name */}
          <div className="flex items-center gap-3 border-b border-white/10 p-4">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold">
                {restaurant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{restaurant.name}</p>
              <p className="text-xs text-sidebar-text">DjossFood Pro</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-sidebar-text hover:bg-sidebar-active/50 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
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
          {/* Header */}
          <header className="flex h-14 items-center justify-between border-b bg-card px-6">
            <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
            <div className="flex items-center gap-4">
              <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{restaurant.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isOpen
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isOpen ? 'Ouvert' : 'Ferme'}
                </span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </RestaurantProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}