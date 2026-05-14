import { Wallet, TrendingUp, ArrowDownCircle } from 'lucide-react';

interface Props { totalEarned: number; totalWithdrawn: number; balance: number; }

export function EarningsCard({ totalEarned, totalWithdrawn, balance }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { icon: TrendingUp, color: 'text-[#3D6B4F]', bg: 'bg-[#3D6B4F]/10', label: 'Gagné', value: totalEarned },
        { icon: ArrowDownCircle, color: 'text-[#C73E1D]', bg: 'bg-[#C73E1D]/10', label: 'Retiré', value: totalWithdrawn },
        { icon: Wallet, color: 'text-[#D4A017]', bg: 'bg-[#D4A017]/10', label: 'Solde', value: balance },
      ].map((stat, i) => (
        <div key={i} className="card-luxe-sym p-4 text-center animate-reveal-up" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <p className="text-[#1C1917] font-extrabold text-sm font-body">{stat.value}</p>
          <p className="text-[#9B958D] text-[10px] font-semibold">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
