import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { Phone, ArrowRight } from 'lucide-react';

export default function DelivererLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const { login, verifyOtp } = useAuth();
  const router = useRouter();

  const handleRequestOtp = async () => {
    await login(phone);
    setStep('otp');
  };

  const handleVerify = async () => {
    await verifyOtp(phone, otp);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-1 text-center">FoodApp Livreur</h1>
        <p className="text-[#666666] text-sm text-center mb-8">Connectez-vous pour commencer</p>

        {step === 'phone' ? (
          <>
            <div className="relative mb-4">
              <Phone className="absolute left-4 top-3.5 w-5 h-5 text-[#999999]" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6XX XXX XXX"
                className="w-full bg-[#F5F0E8] rounded-2xl pl-12 pr-4 py-3 text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#D84315]" />
            </div>
            <button onClick={handleRequestOtp} className="w-full bg-[#D84315] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[#666666] mb-4 text-center">Code envoyé à {phone}</p>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" maxLength={6}
              className="w-full bg-[#F5F0E8] rounded-2xl px-4 py-3 text-center text-2xl tracking-[0.5em] text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#D84315] mb-4" />
            <button onClick={handleVerify} className="w-full bg-[#D84315] text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-transform">Vérifier</button>
          </>
        )}

        <p className="text-center text-sm text-[#999999] mt-6">
          Pas encore inscrit ?{' '}
          <button onClick={() => router.push('/deliverer/register')} className="text-[#D84315] font-bold">Créer un compte</button>
        </p>
      </div>
    </div>
  );
}
