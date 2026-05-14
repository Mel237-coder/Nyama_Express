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
      <div className="glass rounded-xl p-4 space-y-3">
        {items.map((item) => (
          <div key={item.menuItemId} className="flex justify-between items-start text-sm">
            <div className="flex-1">
              <p className="font-medium text-white">
                {item.name} x {item.quantity}
              </p>
              {item.options && item.options.length > 0 && (
                <p className="text-white/40 text-xs">
                  {item.options.join(', ')}
                </p>
              )}
            </div>
            <p className="font-semibold text-white/80">
              {(item.price * item.quantity).toLocaleString()} F
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex justify-between text-sm text-white/50">
          <span>Sous-total</span>
          <span>{subtotal.toLocaleString()} F</span>
        </div>
        <div className="flex justify-between text-sm text-white/50">
          <span>Frais de livraison</span>
          <span>{deliveryFee.toLocaleString()} F</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
          <span>Total</span>
          <span className="text-[#FFD600]">{total.toLocaleString()} F</span>
        </div>
      </div>
    </div>
  );
}
