import { Wallet, TrendingUp, ArrowDownCircle } from 'lucide-react';

interface Props { totalEarned: number; totalWithdrawn: number; balance: number; }

export function EarningsCard({ totalEarned, totalWithdrawn, balance }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { icon: TrendingUp, box: 'dv-icon-green', label: 'Gagné', value: totalEarned },
        { icon: ArrowDownCircle, box: 'dv-icon-red', label: 'Retiré', value: totalWithdrawn },
        { icon: Wallet, box: 'dv-icon-gold', label: 'Solde', value: balance },
      ].map((stat, i) => (
        <div key={i} className="dv-card p-4 text-center animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
          <div className={`${stat.box} w-10 h-10 mx-auto mb-2`}>
            <stat.icon className="w-5 h-5" />
          </div>
          <p className="text-[#1C1917] font-extrabold text-sm">{stat.value}</p>
          <p className="text-[#A8A29E] text-[10px] font-semibold mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
