import React from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useLanguage } from '../../hooks/useLanguage';
import { t, formatPrice } from '../../lib/i18n';

export const FloatingCartBar: React.FC = () => {
  const { items, total, itemCount } = useCart();
  const { language } = useLanguage();

  if (items.length === 0) {
    return null;
  }

  return (
    <Link
      href="/cart"
      className="fixed bottom-20 left-4 right-4 z-40 bg-white border border-[#E7E5E4] shadow-lg p-4 rounded-2xl flex items-center justify-between transition-transform active:scale-95 animate-ed-reveal"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FEF0EB] flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-[#C2410C]" />
        </div>
        <span className="font-bold text-[#1C1917]">
          {t('cart', language)}
        </span>
        <span className="bg-[#C2410C] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
          {itemCount}
        </span>
      </div>
      <div className="flex items-center gap-2 font-bold text-[#C2410C]">
        <span>{formatPrice(total)}</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  );
};
