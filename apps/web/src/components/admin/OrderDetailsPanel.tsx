import React from 'react';
import { NeonButton } from '../layout/NeonButton';

interface OrderDetailsPanelProps {
  order: any;
  onClose: () => void;
}

export default function OrderDetailsPanel({ order, onClose }: OrderDetailsPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 md:justify-end justify-center">
      <div className="w-full max-w-md bg-[#0A0A0F] h-full md:h-full shadow-2xl flex flex-col animate-in slide-in-from-right md:slide-in-from-right slide-in-from-bottom border-l border-white/10">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Order Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/60">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Customer Information</h3>
            <div className="space-y-2">
              <p className="text-lg font-medium text-white">{order.customerName || 'Guest'}</p>
              <p className="text-white/60">{order.customerPhone}</p>
              <a
                href={`tel:${order.customerPhone}`}
                className="inline-flex items-center px-4 py-2 bg-[#00D4FF] text-[#0A0A0F] rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-shadow"
              >
                Call Customer
              </a>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Delivery Address</h3>
            <div className="p-3 glass rounded-xl text-white/80">
              <p>{order.deliveryAddress}</p>
              {order.deliveryNotes && (
                <p className="mt-2 text-sm text-white/40 italic">Notes: {order.deliveryNotes}</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start p-2 border-b border-white/10 last:border-0">
                  <div>
                    <p className="font-medium text-white">{item.name || 'Unknown Item'}</p>
                    {item.options && (
                      <p className="text-xs text-white/40">{item.options.join(', ')}</p>
                    )}
                  </div>
                  <span className="font-bold text-white">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-lg font-bold text-white">
              <span>Total</span>
              <span className="text-[#FFD600]">{order.totalAmount} FCFA</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
