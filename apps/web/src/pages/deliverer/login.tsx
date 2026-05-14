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
    <div className="min-h-screen bg-[#EDE9E2] flex items-center justify-center p-5 relative">
      <div className="dv-card p-8 w-full max-w-sm relative z-10 animate-pop shadow-xl">
        <div className="text-center mb-8">
          <div className="dv-icon-red w-14 h-14 rounded-[14px] mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="dv-page-title mb-1">Nyama Express</h1>
          <p className="text-[#A8A29E] text-sm font-medium tracking-widest uppercase">Espace Livreur</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4 animate-slide-up d1">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8A29E]" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="6XX XXX XXX"
                className="dv-input pl-12" />
            </div>
            <button onClick={handleRequestOtp} className="w-full dv-btn py-4 flex items-center justify-center gap-2">
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up d1">
            <p className="text-sm text-[#78716C] text-center font-medium">Code envoyé à {phone}</p>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6}
              className="dv-input text-center text-2xl tracking-[0.5em] font-bold" />
            <button onClick={handleVerify} className="w-full dv-btn py-4">Vérifier</button>
          </div>
        )}

        <p className="text-center text-sm text-[#A8A29E] mt-6 font-medium">
          Pas encore inscrit ?{' '}
          <button onClick={() => router.push('/deliverer/register')} className="text-[#D84315] font-bold hover:underline">Créer un compte</button>
        </p>
      </div>
    </div>
  );
}
