import React from 'react';

interface OrderCardProps {
  order: any;
  onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('orderId', order.id)}
      onClick={onClick}
      className="p-4 bg-white rounded shadow cursor-pointer hover:border-blue-500 border-2 border-transparent transition-all"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-sm">#{order.id.slice(-6).toUpperCase()}</span>
        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="text-sm text-gray-600 mb-2 truncate">
        {order.customerName || 'Guest Customer'}
      </div>
      <div className="text-xs text-gray-400 mb-3">
        {order.items?.length || 0} items • {order.totalAmount} FCFA
      </div>
      <div className="flex gap-1 overflow-hidden">
        {order.items?.slice(0, 3).map((item: any, idx: number) => (
          <span key={idx} className="text-[10px] bg-gray-100 px-1 rounded truncate">
            {item.name || 'Item'}
          </span>
        ))}
        {order.items?.length > 3 && <span className="text-[10px] text-gray-400">+{order.items.length - 3} more</span>}
      </div>
    </div>
  );
}
