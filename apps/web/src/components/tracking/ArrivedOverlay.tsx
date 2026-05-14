import React from 'react';
import { Bike } from 'lucide-react';
import { NeonButton } from '../layout/NeonButton';

interface ArrivedOverlayProps {
  orderId: string;
  onConfirm: () => Promise<void>;
}

export default function ArrivedOverlay({ orderId, onConfirm }: ArrivedOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F]/95 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full space-y-8">
        <div className="relative">
          <Bike className="w-16 h-16 mx-auto mb-4" style={{ color: '#00FF88' }} />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#00FF88] rounded-full animate-ping opacity-75"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white leading-tight">
            Your food has arrived!
          </h2>
          <p className="text-white/60 text-lg">
            Please meet your driver and collect your order.
          </p>
        </div>

        <NeonButton onClick={onConfirm} className="w-full text-xl py-4">
          Confirm Receipt
        </NeonButton>

        <p className="text-sm text-white/30">
          Order #{orderId.slice(-8).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
