import { Wallet, TrendingUp, ArrowDownCircle } from 'lucide-react';
interface Props { totalEarned: number; totalWithdrawn: number; balance: number; }
export function EarningsCard({ totalEarned, totalWithdrawn, balance }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { icon: TrendingUp, color: 'text-[#2E7D32]', bg: 'bg-[#2E7D32]/10', label: 'Gagné', value: totalEarned },
        { icon: ArrowDownCircle, color: 'text-[#D84315]', bg: 'bg-[#D84315]/10', label: 'Retiré', value: totalWithdrawn },
        { icon: Wallet, color: 'text-[#F9A825]', bg: 'bg-[#F9A825]/10', label: 'Solde', value: balance },
      ].map((stat, i) => (
        <div key={i} className="card-premium p-4 text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <p className="text-[#1A1A1A] font-extrabold text-sm">{stat.value}</p>
          <p className="text-[#999999] text-[10px] font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
