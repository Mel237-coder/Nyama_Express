import { ReactNode } from 'react';
import { DelivererBottomNav } from './DelivererBottomNav';

interface Props { children: ReactNode; }

export function DelivererLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#F3EDE4] font-body relative overflow-hidden noise-bg">
      {/* Animated gradient blobs */}
      <div className="fixed top-[-20%] right-[-30%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#C73E1D]/8 to-[#D4A017]/8 blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '0s' }} />
      <div className="fixed bottom-[-10%] left-[-20%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#D4A017]/6 to-[#3D6B4F]/6 blur-[80px] animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="fixed top-[40%] left-[-10%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[#C73E1D]/5 to-transparent blur-[90px] animate-float pointer-events-none" style={{ animationDelay: '4s' }} />

      <main className="relative z-10 pb-28">{children}</main>
      <DelivererBottomNav />
    </div>
  );
}
