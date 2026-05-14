import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { api, storage } from '../lib/api';
import {
  User,
  CreditCard,
  Bell,
  MapPin,
  LogOut,
  ChevronRight,
  UserCircle,
  ArrowLeft,
  Save,
  CheckCircle2,
  ShoppingBag,
  Languages
} from 'lucide-react';
import { GlassHeader } from '../components/layout/GlassHeader';
import { NeonButton } from '../components/layout/NeonButton';
import { GlassCard } from '../components/layout/GlassCard';

type ProfileView = 'dashboard' | 'account' | 'payment' | 'preferences';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [currentView, setCurrentView] = useState<ProfileView>('dashboard');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form States
  const [accountForm, setAccountForm] = useState({ firstName: '', lastName: '', email: '' });
  const [paymentPhone, setPaymentPhone] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (user) {
      setAccountForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
      setPaymentPhone(user.paymentPhone || user.phone || '');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    logout();
    router.push('/');
  };

  const validatePhone = (phone: string) => {
    const regex = /^(\+237|0)?(6|7)[0-9]{8}$/;
    return regex.test(phone.replace(/\s+/g, ''));
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = storage.getAccessToken() || '';
      await api.updateProfile(accountForm, token);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (e) {
      setMessage({ text: 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePaymentPhone = async () => {
    if (!validatePhone(paymentPhone)) {
      setMessage({ text: 'Please enter a valid Cameroon phone number', type: 'error' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const token = storage.getAccessToken() || '';
      await api.updatePaymentPhone(paymentPhone, token);
      setMessage({ text: 'Payment phone updated!', type: 'success' });
    } catch (e) {
      setMessage({ text: 'Failed to update payment phone', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    {
      title: 'My Orders',
      icon: <ShoppingBag size={20} className="text-[#00D4FF]" />,
      href: '/orders',
    },
    {
      title: 'Account Details',
      icon: <User size={20} className="text-[#FFD600]" />,
      view: 'account' as ProfileView,
    },
    {
      title: 'Payment Preferences',
      icon: <CreditCard size={20} className="text-[#00FF88]" />,
      view: 'payment' as ProfileView,
    },
    {
      title: 'App Preferences',
      icon: <Bell size={20} className="text-[#FF3366]" />,
      view: 'preferences' as ProfileView,
    },
    {
      title: 'Address Book',
      icon: <MapPin size={20} className="text-[#00D4FF]" />,
      href: '/profile/addresses',
    },
  ];

  if (currentView !== 'dashboard') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] pb-24">
        <GlassHeader
          title={menuItems.find(m => m.view === currentView)?.title || ''}
          right={
            <button
              onClick={() => setCurrentView('dashboard')}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-white/70" />
            </button>
          }
        />

        <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20' : 'bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20'}`}>
              {message.type === 'success' && <CheckCircle2 size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {currentView === 'account' && (
            <GlassCard className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">First Name</label>
                <input
                  type="text"
                  value={accountForm.firstName}
                  onChange={(e) => setAccountForm({...accountForm, firstName: e.target.value})}
                  className="neon-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Last Name</label>
                <input
                  type="text"
                  value={accountForm.lastName}
                  onChange={(e) => setAccountForm({...accountForm, lastName: e.target.value})}
                  className="neon-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Email Address</label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                  className="neon-input"
                />
              </div>
              <NeonButton onClick={handleUpdateProfile} disabled={saving} className="w-full">
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0A0A0F] border-t-transparent" />
                ) : (
                  <Save size={20} />
                )}
                Save Changes
              </NeonButton>
            </GlassCard>
          )}

          {currentView === 'payment' && (
            <GlassCard className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Default Payment Phone</label>
                <p className="text-xs text-white/40">Used for MTN MoMo & Orange Money payments</p>
                <input
                  type="tel"
                  placeholder="+237 6xx xxx xxx"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  className="neon-input"
                />
              </div>
              <NeonButton onClick={handleUpdatePaymentPhone} disabled={saving} className="w-full">
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0A0A0F] border-t-transparent" />
                ) : (
                  <Save size={20} />
                )}
                Save Preference
              </NeonButton>
            </GlassCard>
          )}

          {currentView === 'preferences' && (
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-medium text-white/80">App Language</span>
                  <p className="text-xs text-white/40">Change the display language</p>
                </div>
                <div className="flex items-center gap-2">
                  <Languages size={16} className="text-[#FFD600]" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="neon-input w-auto py-2 px-3"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header Section */}
      <div className="pt-12 pb-8 px-4 text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-white/10 ring-2 ring-[#FFD600]/20">
            {user.email ? (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}&background=0A0A0F&color=FFD600`}
                alt="User profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle size={48} className="text-[#FFD600]" />
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {user.firstName} {user.lastName || ''}
        </h1>
        <p className="text-white/50 mt-1">{user.phone}</p>
      </div>

      {/* Menu Section */}
      <div className="max-w-md mx-auto px-4 mt-8 space-y-4">
        <GlassCard className="p-2">
          <div className="p-2 space-y-1">
            {menuItems.map((item) => (
              item.href ? (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-white/60 group-hover:text-white transition-colors">
                      {item.icon}
                    </div>
                    <span className="font-medium text-white/90">{item.title}</span>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-white/60" />
                </Link>
              ) : (
                <button
                  key={item.title}
                  onClick={() => setCurrentView(item.view!)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-white/60 group-hover:text-white transition-colors">
                      {item.icon}
                    </div>
                    <span className="font-medium text-white/90">{item.title}</span>
                  </div>
                  <ChevronRight size={18} className="text-white/30 group-hover:text-white/60" />
                </button>
              )
            ))}
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <div className="pt-4">
          <NeonButton variant="danger" onClick={handleLogout} className="w-full">
            <LogOut size={20} />
            Logout
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
