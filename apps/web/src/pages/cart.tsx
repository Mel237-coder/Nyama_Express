import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../hooks/useCart';
import { useLanguage } from '../hooks/useLanguage';
import { formatPrice, t } from '../lib/i18n';
import { ItemCustomizerModal, MenuItem, CustomizerDetails } from '../components/restaurant/ItemCustomizerModal';
import { GlassCard } from '../components/layout/GlassCard';
import { GlassHeader } from '../components/layout/GlassHeader';
import { NeonButton } from '../components/layout/NeonButton';
import { ShoppingCart, Soup } from 'lucide-react';

export default function CartPage() {
  const { items, subtotal, deliveryFee, total, updateQuantity, updateItemOption, removeItem, restaurantName } = useCart();
  const { language } = useLanguage();
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  const handleAddToCart = (details: CustomizerDetails) => {
    updateQuantity(details.item.id, details.quantity);
    if (details.options) {
      updateItemOption(details.item.id, details.options);
    }
    setCustomizingItem(null);
  };

  return (
    <div className="min-h-screen pb-32">
      <GlassHeader
        title={t('cart', language)}
        sticky
      />

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8" style={{ color: '#FFD600' }} />
            </div>
            <p className="text-white/50 text-lg mb-6">
              {t('emptyCart', language)}
            </p>
            <Link href="/">
              <NeonButton>
                {t('restaurants', language)}
              </NeonButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurantName && (
              <div className="glass px-4 py-3 rounded-xl text-sm font-medium text-[#FFD600]">
                {language === 'fr' ? 'Commande chez' : 'Ordering from'} {restaurantName}
              </div>
            )}

            <div className="space-y-3">
              {items.map((item) => (
                <GlassCard
                  key={item.menuItemId}
                  elevated
                  onClick={() => setCustomizingItem({
                    id: item.menuItemId,
                    name: item.name,
                    description: '',
                    price: item.price,
                    image: item.image || null
                  })}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 glass">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30"><Soup className="w-6 h-6" style={{ color: '#00FF88' }} /></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{item.name}</h3>
                      <p className="text-sm text-white/40 italic truncate">
                        {item.options && item.options.length > 0
                          ? item.options.join(', ')
                          : language === 'fr' ? 'Aucune option' : 'No options selected'}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-semibold text-[#FFD600]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Quantity stepper */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.menuItemId, item.quantity - 1);
                            }}
                            className="ghost-btn w-8 h-8 p-0 rounded-full text-lg"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-white w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.menuItemId, item.quantity + 1);
                            }}
                            className="neon-btn w-8 h-8 p-0 rounded-full text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.menuItemId);
                      }}
                      className="text-[#FF3366] text-sm font-medium hover:text-[#FF3366]/80 transition-colors flex-shrink-0"
                    >
                      {t('delete', language)}
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Summary */}
            <GlassCard elevated className="p-6 space-y-3 mt-6">
              <div className="flex justify-between text-white/60">
                <span>{language === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>{t('deliveryFee', language)}</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-xl font-bold text-white">{t('total', language)}</span>
                <span className="text-2xl font-black text-[#FFD600]">{formatPrice(total)}</span>
              </div>
            </GlassCard>

            <Link
              href="/checkout"
              className={`block w-full ${items.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
            >
              <NeonButton size="lg" className="w-full">
                {t('checkout', language)}
              </NeonButton>
            </Link>
          </div>
        )}
      </div>

      {customizingItem && (
        <ItemCustomizerModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
