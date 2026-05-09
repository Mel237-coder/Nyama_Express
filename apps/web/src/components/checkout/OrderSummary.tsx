import React from 'react';
import { CartItem } from '../../hooks/useCart';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export default function OrderSummary({ items, subtotal, deliveryFee, total }: OrderSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-100 rounded-xl p-4 space-y-3">
        {items.map((item) => (
          <div key={item.menuItemId} className="flex justify-between items-start text-sm">
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {item.name} x {item.quantity}
              </p>
              {item.options && item.options.length > 0 && (
                <p className="text-gray-500 text-xs">
                  {item.options.join(', ')}
                </p>
              )}
            </div>
            <p className="font-semibold text-gray-700">
              {(item.price * item.quantity).toLocaleString()} XAF
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{subtotal.toLocaleString()} XAF</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Delivery Fee</span>
          <span>{deliveryFee.toLocaleString()} XAF</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>{total.toLocaleString()} XAF</span>
        </div>
      </div>
    </div>
  );
}
