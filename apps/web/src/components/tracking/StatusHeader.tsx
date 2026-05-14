import React from 'react';
import { ChefHat, Bike, CheckCircle2, Clock } from 'lucide-react';

interface StatusHeaderProps {
  status: string;
  eta: string | null;
}

const STATUS_CONFIG: Record<string, { text: string; accentColor: string; icon: React.ReactNode }> = {
  PREPARING: {
    text: 'Your meal is being prepared',
    accentColor: '#FFD600',
    icon: <ChefHat className="w-6 h-6" style={{ color: '#FFD600' }} />,
  },
  OUT_FOR_DELIVERY: {
    text: 'Driver is on the way!',
    accentColor: '#00FF88',
    icon: <Bike className="w-6 h-6" style={{ color: '#00FF88' }} />,
  },
  DELIVERED: {
    text: 'Order delivered!',
    accentColor: '#00D4FF',
    icon: <CheckCircle2 className="w-6 h-6" style={{ color: '#00D4FF' }} />,
  },
};

export default function StatusHeader({ status, eta }: StatusHeaderProps) {
  const config = STATUS_CONFIG[status] || {
    text: 'Processing your order',
    accentColor: '#FFD600',
    icon: <Clock className="w-6 h-6" style={{ color: '#FFD600' }} />,
  };

  return (
    <div className="glass p-4 rounded-2xl mb-6 border-l-4"
      style={{ borderLeftColor: config.accentColor }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config.icon}
          <p className="font-bold text-lg text-white">{config.text}</p>
        </div>
        {eta && (
          <div className="text-right">
            <p className="text-xs uppercase font-semibold text-white/50">Estimated Arrival</p>
            <p className="font-black text-xl" style={{ color: config.accentColor, textShadow: `0 0 8px ${config.accentColor}80` }}>{eta}</p>
          </div>
        )}
      </div>
    </div>
  );
}
