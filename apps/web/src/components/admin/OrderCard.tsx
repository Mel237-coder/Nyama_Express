import React from 'react';

interface OrderCardProps {
  order: any;
  onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-[#FFD600]/10 text-[#FFD600] border-[#FFD600]/20',
    PREPARING: 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20',
    READY: 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20',
    PICKED_UP: 'bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20',
  };

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('orderId', order.id)}
      onClick={onClick}
      className="p-4 glass cursor-pointer hover:border-[#FFD600]/30 border-2 border-transparent transition-all"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-sm text-white">#{order.id.slice(-6).toUpperCase()}</span>
        <span className="text-xs text-white/40">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="text-sm text-white/70 mb-2 truncate">
        {order.customerName || 'Guest Customer'}
      </div>
      <div className="text-xs text-white/40 mb-3">
        {order.items?.length || 0} items • {order.totalAmount} FCFA
      </div>
      <div className="flex gap-1 overflow-hidden">
        {order.items?.slice(0, 3).map((item: any, idx: number) => (
          <span key={idx} className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/60 truncate">
            {item.name || 'Item'}
          </span>
        ))}
        {order.items?.length > 3 && <span className="text-[10px] text-white/30">+{order.items.length - 3} more</span>}
      </div>
      <div className="mt-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[order.status] || 'bg-white/5 text-white/40 border-white/10'}`}>
          {order.status}
        </span>
      </div>
    </div>
  );
}
