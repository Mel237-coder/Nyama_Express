import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import {
  User,
  Settings,
  CreditCard,
  Bell,
  MapPin,
  LogOut,
  ChevronRight,
  UserCircle
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    logout();
    router.push('/');
  };

  const menuItems = [
    {
      title: 'Account Details',
      icon: <User size={20} />,
      href: '#', // To be implemented as modal/section
      className: 'text-gray-600'
    },
    {
      title: 'Payment Preferences',
      icon: <CreditCard size={20} />,
      href: '#', // To be implemented as modal/section
      className: 'text-gray-600'
    },
    {
      title: 'App Preferences',
      icon: <Bell size={20} />,
      href: '#', // To be implemented as modal/section
      className: 'text-gray-600'
    },
    {
      title: 'Address Book',
      icon: <MapPin size={20} />,
      href: '/profile/addresses',
      className: 'text-gray-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 pt-12 pb-8 px-4 text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white shadow-sm">
            {user.email ? (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}&background=f97316&color=fff`}
                alt="User profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle size={48} className="text-orange-500" />
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user.firstName} {user.lastName || ''}
        </h1>
        <p className="text-gray-500 mt-1">{user.phone}</p>
      </div>

      {/* Menu Section */}
      <div className="max-w-md mx-auto px-4 mt-8 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-gray-400 group-hover:text-orange-500 transition-colors">
                    {item.icon}
                  </div>
                  <span className="font-medium text-gray-700">{item.title}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-4 bg-white text-red-600 font-semibold rounded-2xl border border-red-100 hover:bg-red-50 transition-colors shadow-sm"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
