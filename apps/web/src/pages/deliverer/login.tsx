import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { Phone, ArrowRight, Sparkles } from 'lucide-react';

export default function DelivererLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const { login, verifyOtp } = useAuth();
  const router = useRouter();

  const handleRequestOtp = async () => { await login(phone); setStep('otp'); };
  const handleVerify = async () => { await verifyOtp(phone, otp); };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden font-body">
      {/* Rich warm background with animated blobs */}
      <div className="fixed inset-0 bg-[#F3EDE4] -z-20" />
      <div className="fixed top-[-20%] right-[-30%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#C73E1D]/10 to-[#D4A017]/8 blur-[100px] animate-float pointer-events-none -z-10" />
      <div className="fixed bottom-[-15%] left-[-25%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#3D6B4F]/8 to-[#D4A017]/5 blur-[90px] animate-float pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="glass-strong-luxe rounded-[32px] shadow-2xl p-8 w-full max-w-sm relative z-10 animate-reveal-scale">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl icon-box flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl text-[#1C1917] mb-2">Nyama Express</h1>
          <p className="text-[#6B6560] text-sm font-medium tracking-widest uppercase">Espace Livreur</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-5 animate-reveal-up stagger-1">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B958D]" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="6XX XXX XXX"
                className="input-luxe pl-12" />
            </div>
            <button onClick={handleRequestOtp} className="w-full btn-luxe py-4 flex items-center justify-center gap-2">
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-5 animate-reveal-up stagger-1">
            <p className="text-sm text-[#6B6560] text-center font-medium">Code envoyé à {phone}</p>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6}
              className="input-luxe text-center text-2xl tracking-[0.5em] font-bold" />
            <button onClick={handleVerify} className="w-full btn-luxe py-4">Vérifier</button>
          </div>
        )}

        <p className="text-center text-sm text-[#9B958D] mt-6 font-medium">
          Pas encore inscrit ?{' '}
          <button onClick={() => router.push('/deliverer/register')} className="text-[#C73E1D] font-bold hover:underline">Créer un compte</button>
        </p>
      </div>
    </div>
  );
}
