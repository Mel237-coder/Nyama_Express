import { ReactNode } from 'react';
import { DelivererBottomNav } from './DelivererBottomNav';
interface Props { children: ReactNode; }
export function DelivererLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-20">
      <main>{children}</main>
      <DelivererBottomNav />
    </div>
  );
}
