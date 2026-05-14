import { ReactNode } from 'react';
import { DelivererBottomNav } from './DelivererBottomNav';

interface Props { children: ReactNode; }

export function DelivererLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#EDE9E2] relative"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      <main className="relative z-10 pb-28">{children}</main>
      <DelivererBottomNav />
    </div>
  );
}
