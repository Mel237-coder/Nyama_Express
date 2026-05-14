import { Wallet, TrendingUp, ArrowDownCircle } from 'lucide-react';
interface Props { totalEarned: number; totalWithdrawn: number; balance: number; }
export function EarningsCard({ totalEarned, totalWithdrawn, balance }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-center">
        <TrendingUp className="w-6 h-6 text-[#2E7D32] mx-auto mb-2" />
        <p className="text-[#1A1A1A] font-bold">{totalEarned}</p><p className="text-[#999999] text-xs">Gagné</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-center">
        <ArrowDownCircle className="w-6 h-6 text-[#D84315] mx-auto mb-2" />
        <p className="text-[#1A1A1A] font-bold">{totalWithdrawn}</p><p className="text-[#999999] text-xs">Retiré</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 text-center">
        <Wallet className="w-6 h-6 text-[#F9A825] mx-auto mb-2" />
        <p className="text-[#1A1A1A] font-bold">{balance}</p><p className="text-[#999999] text-xs">Solde</p>
      </div>
    </div>
  );
}
