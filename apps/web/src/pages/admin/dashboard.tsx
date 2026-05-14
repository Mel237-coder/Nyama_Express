import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  LogOut,
  TrendingUp,
  Package,
  Users,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '../../components/layout/GlassCard';
import { NeonButton } from '../../components/layout/NeonButton';

const AdminDashboard = () => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  // RBAC Guard
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'RESTAURANT_ADMIN') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Unauthorized Access</h1>
        <p className="text-white/50 mb-6">You do not have permission to access the admin dashboard.</p>
        <Link href="/" className="neon-btn">
          Return Home
        </Link>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Menu Management', href: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  const stats = [
    { label: "Today's Orders", value: "24", icon: Package, color: "text-[#00D4FF]", glow: "shadow-[0_0_20px_rgba(0,212,255,0.3)]" },
    { label: "Total Revenue", value: "145,000 FCFA", icon: TrendingUp, color: "text-[#00FF88]", glow: "shadow-[0_0_20px_rgba(0,255,136,0.3)]" },
    { label: "Active Drivers", value: "5", icon: Users, color: "text-[#FFD600]", glow: "shadow-[0_0_20px_rgba(255,214,0,0.3)]" },
    { label: "Pending Items", value: "12", icon: UtensilsCrossed, color: "text-[#FF3366]", glow: "shadow-[0_0_20px_rgba(255,51,102,0.3)]" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0A0A0F]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-[#FFD600]">FoodApp Admin</h2>
          <p className="text-xs text-white/40 truncate">{user?.email || user?.phone}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                router.pathname === item.href
                ? 'bg-[#FFD600]/10 text-[#FFD600] font-medium border border-[#FFD600]/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-white/60 hover:bg-[#FF3366]/10 hover:text-[#FF3366] rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-white">Restaurant Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">Welcome, {user?.firstName || 'Admin'}</span>
            <div className="h-8 w-8 rounded-full bg-[#FFD600]/10 text-[#FFD600] flex items-center justify-center font-bold border border-[#FFD600]/20">
              {user?.firstName?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <GlassCard key={idx} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50 font-medium">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard
              className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => router.push('/admin/users')}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#FFD600]/10 text-[#FFD600]">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-white font-semibold">User Management</p>
                  <p className="text-sm text-white/50">Manage users and roles</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard
              className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => router.push('/admin/settings')}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 text-white/60">
                  <Settings size={24} />
                </div>
                <div>
                  <p className="text-white font-semibold">Settings</p>
                  <p className="text-sm text-white/50">Platform configuration</p>
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6 min-h-[400px]">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="text-center py-20 text-white/30">
              <p>No recent activity to display</p>
              <p className="text-sm">Start taking orders to see data here</p>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
