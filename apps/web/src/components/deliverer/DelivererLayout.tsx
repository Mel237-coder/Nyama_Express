import { ReactNode } from 'react';
import { DelivererBottomNav } from './DelivererBottomNav';
interface Props { children: ReactNode; }
export function DelivererLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F0E8] relative overflow-hidden">
      {/* Subtle warm gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#F5F0E8] via-[#EDE8DF] to-[#F5F0E8] -z-10" />
      <main className="relative z-10">{children}</main>
      <DelivererBottomNav />
    </div>
  );
}
