import React from 'react';

interface OrderDetailsPanelProps {
  order: any;
  onClose: () => void;
}

export default function OrderDetailsPanel({ order, onClose }: OrderDetailsPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Order Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer Information</h3>
            <div className="space-y-2">
              <p className="text-lg font-medium">{order.customerName || 'Guest'}</p>
              <p className="text-gray-600">{order.customerPhone}</p>
              <a
                href={`tel:${order.customerPhone}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Call Customer
              </a>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Delivery Address</h3>
            <div className="p-3 bg-gray-50 rounded-lg border text-gray-700">
              <p>{order.deliveryAddress}</p>
              {order.deliveryNotes && (
                <p className="mt-2 text-sm text-gray-500 italic">Notes: {order.deliveryNotes}</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start p-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.name || 'Unknown Item'}</p>
                    {item.options && (
                      <p className="text-xs text-gray-500">{item.options.join(', ')}</p>
                    )}
                  </div>
                  <span className="font-bold">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-4 border-t">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>{order.totalAmount} FCFA</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
