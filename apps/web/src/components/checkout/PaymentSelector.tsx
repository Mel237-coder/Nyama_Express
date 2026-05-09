import React from 'react';

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
    { id: 'momo', name: 'MTN MoMo', icon: '📱' },
    { id: 'orange', name: 'Orange Money', icon: '🍊' },
    { id: 'cash', name: 'Cash on Delivery', icon: '💵' },
  ];

  const isMobileMoney = selectedMethod === 'momo' || selectedMethod === 'orange';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMethod === method.id
              ? 'border-orange-500 bg-orange-50 text-orange-900'
              : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              className="hidden"
              checked={selectedMethod === method.id}
              onChange={() => onMethodChange(method.id)}
            />
            <span className="mr-3 text-xl">{method.icon}</span>
            <span className="font-medium">{method.name}</span>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedMethod === method.id ? 'border-orange-500' : 'border-gray-300'
            }`}>
              {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
            </div>
          </label>
        ))}
      </div>

      {isMobileMoney && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="text-sm font-medium text-gray-700">Payment Phone Number</label>
          <input
            type="text"
            placeholder="e.g. 6xxxxxxxx or +237..."
            value={paymentPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
          />
          <p className="text-xs text-gray-500">
            Please enter the phone number associated with your mobile money account.
          </p>
        </div>
      )}
    </div>
  );
}
