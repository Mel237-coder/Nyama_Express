import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { GlassCard } from '../../components/layout/GlassCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { NeonButton } from '../../components/layout/NeonButton';
import { Ban } from 'lucide-react';

interface SettingsState {
  commissionPercent: number;
  defaultDeliveryFee: number;
  currency: string;
  contactEmail: string;
  supportPhone: string;
  enableNotifications: boolean;
  enableCashOnDelivery: boolean;
  enableOnlinePayments: boolean;
  enableDriverTracking: boolean;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { language, t } = useLanguage();

  const [settings, setSettings] = useState<SettingsState>({
    commissionPercent: 10,
    defaultDeliveryFee: 500,
    currency: 'XAF',
    contactEmail: 'support@foodapp.cm',
    supportPhone: '+237 6 99 99 99 99',
    enableNotifications: true,
    enableCashOnDelivery: true,
    enableOnlinePayments: true,
    enableDriverTracking: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // Admin guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-12 h-12 rounded-full" />
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'RESTAURANT_OWNER')) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard elevated className="max-w-md w-full p-8 text-center space-y-4">
          <Ban className="w-10 h-10 mx-auto" style={{ color: '#FF3366' }} />
          <h1 className="text-xl font-bold text-white">
            {language === 'fr' ? 'Accès refusé' : 'Unauthorized'}
          </h1>
          <p className="text-sm text-white/50">
            {language === 'fr'
              ? 'Vous devez être administrateur pour accéder à cette page.'
              : 'You must be an administrator to access this page.'}
          </p>
          <NeonButton onClick={() => router.push('/')}>
            {language === 'fr' ? 'Retour à l\'accueil' : 'Return home'}
          </NeonButton>
        </GlassCard>
      </div>
    );
  }

  const handleChange = (key: keyof SettingsState, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // In a real implementation, this would call an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMessage({
        text:
          language === 'fr'
            ? 'Paramètres sauvegardés avec succès !'
            : 'Settings saved successfully!',
        type: 'success',
      });
    } catch {
      setMessage({
        text:
          language === 'fr'
            ? 'Erreur lors de la sauvegarde'
            : 'Error saving settings',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && (
          <p className="text-xs text-white/40 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-[#FFD600]' : 'bg-white/10'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <GlassHeader
        title={language === 'fr' ? 'Paramètres' : 'Settings'}
        sticky={true}
      />

      <main className="px-4 py-4 space-y-4">
        {message && (
          <div
            className={`text-sm font-medium text-center rounded-xl p-3 ${
              message.type === 'success'
                ? 'status-success bg-[#00FF88]/10'
                : 'status-danger bg-[#FF3366]/10'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Business Settings */}
        <GlassCard className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            {language === 'fr' ? 'Paramètres commerciaux' : 'Business settings'}
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              {language === 'fr'
                ? 'Commission plateforme (%)'
                : 'Platform commission (%)'}
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.commissionPercent}
              onChange={(e) =>
                handleChange('commissionPercent', Number(e.target.value))
              }
              className="neon-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              {language === 'fr'
                ? 'Frais de livraison par défaut (FCFA)'
                : 'Default delivery fee (FCFA)'}
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={settings.defaultDeliveryFee}
              onChange={(e) =>
                handleChange('defaultDeliveryFee', Number(e.target.value))
              }
              className="neon-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              {language === 'fr' ? 'Devise' : 'Currency'}
            </label>
            <input
              type="text"
              value={settings.currency}
              readOnly
              className="neon-input opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-white/30">
              {language === 'fr' ? 'Lecture seule' : 'Read-only'}
            </p>
          </div>
        </GlassCard>

        {/* Contact Settings */}
        <GlassCard className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            {language === 'fr' ? 'Contact' : 'Contact'}
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              {language === 'fr' ? 'Email de contact' : 'Contact email'}
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="neon-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              {language === 'fr' ? 'Téléphone support' : 'Support phone'}
            </label>
            <input
              type="tel"
              value={settings.supportPhone}
              onChange={(e) => handleChange('supportPhone', e.target.value)}
              className="neon-input"
            />
          </div>
        </GlassCard>

        {/* Feature Toggles */}
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
            {language === 'fr' ? 'Fonctionnalités' : 'Features'}
          </h2>

          <div className="divide-y divide-white/5">
            <ToggleSwitch
              checked={settings.enableNotifications}
              onChange={(v) => handleChange('enableNotifications', v)}
              label={
                language === 'fr' ? 'Notifications push' : 'Push notifications'
              }
              description={
                language === 'fr'
                  ? 'Envoyer des notifications aux utilisateurs'
                  : 'Send notifications to users'
              }
            />
            <ToggleSwitch
              checked={settings.enableCashOnDelivery}
              onChange={(v) => handleChange('enableCashOnDelivery', v)}
              label={
                language === 'fr'
                  ? 'Paiement à la livraison'
                  : 'Cash on delivery'
              }
              description={
                language === 'fr'
                  ? 'Permettre le paiement en espèces'
                  : 'Allow cash payments'
              }
            />
            <ToggleSwitch
              checked={settings.enableOnlinePayments}
              onChange={(v) => handleChange('enableOnlinePayments', v)}
              label={
                language === 'fr'
                  ? 'Paiements en ligne'
                  : 'Online payments'
              }
              description={
                language === 'fr'
                  ? 'MTN MoMo, Orange Money, NotchPay'
                  : 'MTN MoMo, Orange Money, NotchPay'
              }
            />
            <ToggleSwitch
              checked={settings.enableDriverTracking}
              onChange={(v) => handleChange('enableDriverTracking', v)}
              label={
                language === 'fr'
                  ? 'Suivi en temps réel'
                  : 'Real-time tracking'
              }
              description={
                language === 'fr'
                  ? 'Afficher la position du livreur sur la carte'
                  : 'Show driver location on map'
              }
            />
          </div>
        </GlassCard>

        {/* Save Button */}
        <div className="pt-2">
          <NeonButton
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="w-full"
          >
            {saving
              ? language === 'fr'
                ? 'Sauvegarde...'
                : 'Saving...'
              : language === 'fr'
              ? 'Sauvegarder'
              : 'Save'}
          </NeonButton>
        </div>
      </main>
    </div>
  );
}
