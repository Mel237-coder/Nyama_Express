import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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
      className="fixed bottom-20 left-4 right-4 z-40 glass-elevated p-4 rounded-2xl flex items-center justify-between transition-transform active:scale-95 animate-slide-up"
    >
      <div className="flex items-center gap-3">
        <span className="neon-badge text-sm px-2.5 py-1">
          {itemCount}
        </span>
        <span className="font-medium text-white">
          {t('cart', language)}
        </span>
      </div>
      <div className="flex items-center gap-2 font-bold text-[#FFD600]">
        <span>{formatPrice(total)}</span>
        <ChevronRight className="w-4 h-4 opacity-80" style={{ color: '#FFD600' }} />
      </div>
    </Link>
  );
};
