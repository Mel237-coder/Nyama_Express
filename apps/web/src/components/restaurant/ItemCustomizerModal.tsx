import { useState, useEffect } from 'react';
import { formatPrice } from '../../lib/i18n';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
}

export interface CustomizerDetails {
  item: MenuItem;
  quantity: number;
  options: string[];
}

export function ItemCustomizerModal({
  item,
  onClose,
  onAddToCart
}: {
  item: MenuItem,
  onClose: () => void,
  onAddToCart: (details: CustomizerDetails) => void
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const total = (item.price + (selectedOption ? 100 : 0)) * quantity;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up shadow-2xl border border-white/10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{item.name}</h3>
            <p className="text-sm text-white/50">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-2xl p-1"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm font-bold mb-3 text-white/80">Choisir la taille (Obligatoire)</p>
          <div className="flex gap-2">
            {['Petite', 'Grande'].map(s => (
              <button
                key={s}
                onClick={() => setSelectedOption(s)}
                className={`flex-1 px-4 py-2.5 rounded-xl border transition-all ${
                  selectedOption === s
                    ? 'neon-btn border-transparent'
                    : 'glass text-white/70 hover:bg-white/5 border-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 p-4 glass rounded-xl">
          <span className="text-white/60 font-medium">Quantité</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="ghost-btn w-8 h-8 p-0 rounded-full text-lg"
            >
              −
            </button>
            <span className="font-bold text-lg w-6 text-center text-white">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="neon-btn w-8 h-8 p-0 rounded-full text-lg"
            >
              +
            </button>
          </div>
        </div>

        <button
          disabled={!selectedOption}
          onClick={() => onAddToCart({ item, quantity, options: [selectedOption] })}
          className="w-full py-4 neon-btn disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
        >
          Ajouter au panier — {formatPrice(total)}
        </button>
      </div>
    </div>
  );
}
