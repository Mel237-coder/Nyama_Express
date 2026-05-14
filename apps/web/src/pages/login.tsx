import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { GlassCard } from '../components/layout/GlassCard';
import { NeonButton } from '../components/layout/NeonButton';
import { GlassHeader } from '../components/layout/GlassHeader';
import { useLanguage } from '../hooks/useLanguage';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, login, verifyOtp } = useAuth();
  const { language, t } = useLanguage();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value.trim().toLowerCase());
  };

  const handleRequestOtp = async () => {
    setError(null);
    setDevOtp(null);
    if (!validateEmail(email)) {
      setError(
        language === 'fr'
          ? 'Adresse e-mail invalide.'
          : 'Invalid email address.'
      );
      return;
    }
    setLoading(true);
    try {
      const result = await login(email);
      setStep('otp');
      if (result.devOtp) {
        setDevOtp(result.devOtp);
      }
    } catch (err: any) {
      setError(err.message || t('somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (otp.length !== 6) {
      setError(
        language === 'fr'
          ? 'Le code doit contenir 6 chiffres'
          : 'Code must be 6 digits'
      );
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      router.push('/');
    } catch (err: any) {
      setError(err.message || t('somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-12 h-12 rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <GlassHeader title={t('login')} sticky={false} />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <GlassCard elevated className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-2">
            <Lock className="w-10 h-10 mx-auto" style={{ color: '#FFD600' }} />
            <h2 className="text-xl font-bold text-white">
              {step === 'email'
                ? language === 'fr'
                  ? 'Connexion sécurisée'
                  : 'Secure Login'
                : language === 'fr'
                ? 'Vérification'
                : 'Verification'}
            </h2>
            <p className="text-sm text-white/50">
              {step === 'email'
                ? language === 'fr'
                  ? 'Entrez votre e-mail pour recevoir un code'
                  : 'Enter your email to receive a code'
                : language === 'fr'
                ? `Code envoyé à ${email}`
                : `Code sent to ${email}`}
            </p>
          </div>

          {error && (
            <div className="status-danger text-sm font-medium text-center bg-white/5 rounded-xl p-3">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  {language === 'fr' ? 'Votre adresse e-mail' : 'Your email address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="neon-input"
                  disabled={loading}
                />
              </div>
              <NeonButton
                onClick={handleRequestOtp}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading
                  ? language === 'fr'
                    ? 'Envoi...'
                    : 'Sending...'
                  : language === 'fr'
                  ? 'Continuer'
                  : 'Continue'}
              </NeonButton>
            </div>
          ) : (
            <div className="space-y-4">
              {devOtp && (
                <div className="glass rounded-xl p-3 text-center space-y-1">
                  <p className="text-xs text-white/50">
                    {language === 'fr' ? 'Mode développement — Code:' : 'Dev mode — Code:'}
                  </p>
                  <p className="text-xl font-mono font-bold tracking-widest text-[#FFD600]">
                    {devOtp}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  {t('enterCode')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                  }}
                  placeholder="000000"
                  className="neon-input text-center text-2xl tracking-[0.5em] font-mono"
                  disabled={loading}
                />
              </div>
              <NeonButton
                onClick={handleVerifyOtp}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading
                  ? language === 'fr'
                    ? 'Vérification...'
                    : 'Verifying...'
                  : language === 'fr'
                  ? 'Vérifier'
                  : 'Verify'}
              </NeonButton>
              <button
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError(null);
                  setDevOtp(null);
                }}
                className="ghost-btn w-full text-sm"
                disabled={loading}
              >
                {language === 'fr' ? 'Changer d\'e-mail' : 'Change email'}
              </button>
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
}
