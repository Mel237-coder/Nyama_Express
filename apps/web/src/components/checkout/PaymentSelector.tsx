import React from 'react';
import { Smartphone, Circle, Banknote } from 'lucide-react';

interface PaymentSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  paymentPhone: string;
  onPhoneChange: (phone: string) => void;
}

export default function PaymentSelector({
  selectedMethod,
  onMethodChange,
  paymentPhone,
  onPhoneChange
}: PaymentSelectorProps) {
  const methods = [
    { id: 'momo', name: 'MTN MoMo', icon: <Smartphone className="w-5 h-5" style={{ color: '#FFD600' }} /> },
    { id: 'orange', name: 'Orange Money', icon: <Circle className="w-5 h-5" style={{ color: '#FF6600', fill: '#FF6600' }} /> },
    { id: 'cash', name: 'Payer à la livraison', icon: <Banknote className="w-5 h-5" style={{ color: '#00FF88' }} /> },
  ];

  const isMobileMoney = selectedMethod === 'momo' || selectedMethod === 'orange';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
              selectedMethod === method.id
                ? 'border-[#FFD600]/40 bg-[#FFD600]/5'
                : 'border-white/10 bg-transparent hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              className="hidden"
              checked={selectedMethod === method.id}
              onChange={() => onMethodChange(method.id)}
            />
            <span className="mr-3">{method.icon}</span>
            <span className={`font-medium ${selectedMethod === method.id ? 'text-white' : 'text-white/70'}`}>
              {method.name}
            </span>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === method.id ? 'border-[#FFD600]' : 'border-white/20'
            }`}>
              {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[#FFD600]" />}
            </div>
          </label>
        ))}
      </div>

      {isMobileMoney && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="text-sm font-medium text-white/70">Numéro de téléphone de paiement</label>
          <input
            type="text"
            placeholder="ex: 6xxxxxxxx ou +237..."
            value={paymentPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="neon-input"
          />
          <p className="text-xs text-white/40">
            Entrez le numéro associé à votre compte mobile money.
          </p>
        </div>
      )}
    </div>
  );
}
