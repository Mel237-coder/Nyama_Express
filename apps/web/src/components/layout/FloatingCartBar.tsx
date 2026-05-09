import React from 'react';
import Link from 'next/link';
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
      className="fixed bottom-20 left-4 right-4 z-40 bg-orange-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between transition-transform active:scale-95"
    >
      <div className="flex items-center gap-3">
        <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
          {itemCount}
        </span>
        <span className="font-medium">
          {t('cart', language)}
        </span>
      </div>
      <div className="flex items-center gap-2 font-bold">
        <span>{formatPrice(total)}</span>
        <span className="text-sm opacity-80">→</span>
      </div>
    </Link>
  );
};
