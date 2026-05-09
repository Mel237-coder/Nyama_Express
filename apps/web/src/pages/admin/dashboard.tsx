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
  Users
} from 'lucide-react';
import Link from 'next/link';

const AdminDashboard = () => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  // RBAC Guard
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'RESTAURANT_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Unauthorized Access</h1>
        <p className="text-gray-600 mb-6">You do not have permission to access the admin dashboard.</p>
        <Link
          href="/"
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
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
    { label: "Today's Orders", value: "24", icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Revenue", value: "145,000 FCFA", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
    { label: "Active Drivers", value: "5", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Pending Items", value: "12", icon: UtensilsCrossed, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-orange-600">FoodApp Admin</h2>
          <p className="text-xs text-gray-500 truncate">{user?.email || user?.phone}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                router.pathname === item.href
                ? 'bg-orange-50 text-orange-600 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">Restaurant Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Welcome, {user?.firstName || 'Admin'}</span>
            <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              {user?.firstName?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={stat.color} size={24} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[400px]">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="text-center py-20 text-gray-400">
              <p>No recent activity to display</p>
              <p className="text-sm">Start taking orders to see data here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
