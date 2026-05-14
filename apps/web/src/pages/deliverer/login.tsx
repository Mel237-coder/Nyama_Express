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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] via-[#EDE8DF] to-[#F5F0E8] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 rounded-full bg-[#D84315]/5 blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-100px] w-80 h-80 rounded-full bg-[#F9A825]/5 blur-3xl" />

      <div className="glass-strong rounded-3xl shadow-2xl p-8 w-full max-w-sm relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D84315] to-[#BF360C] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-1">Nyama Express</h1>
          <p className="text-[#666666] text-sm">Espace Livreur</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 w-5 h-5 text-[#999999]" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="6XX XXX XXX"
                className="w-full bg-[#F5F0E8] rounded-2xl pl-12 pr-4 py-3.5 text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#D84315] font-medium transition-all" />
            </div>
            <button onClick={handleRequestOtp} className="w-full btn-premium py-4 flex items-center justify-center gap-2">
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-[#666666] text-center">Code envoyé à {phone}</p>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6}
              className="w-full bg-[#F5F0E8] rounded-2xl px-4 py-3.5 text-center text-2xl tracking-[0.5em] text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#D84315] font-bold" />
            <button onClick={handleVerify} className="w-full btn-premium py-4">Vérifier</button>
          </div>
        )}

        <p className="text-center text-sm text-[#999999] mt-6">
          Pas encore inscrit ?{' '}
          <button onClick={() => router.push('/deliverer/register')} className="text-[#D84315] font-bold hover:underline">Créer un compte</button>
        </p>
      </div>
    </div>
  );
}
