import { useState, useEffect } from 'react';
import { formatPrice } from '../../lib/i18n';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
}

export interface CustomizerDetails {
  item: MenuItem;
  quantity: number;
  option: string;
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

  // Simple pricing logic as per plan: base price + 100 if option selected
  const total = (item.price + (selectedOption ? 100 : 0)) * quantity;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl p-1"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm font-bold mb-3 text-gray-700">Choose Size (Required)</p>
          <div className="flex gap-2">
            {['Small', 'Large'].map(s => (
              <button
                key={s}
                onClick={() => setSelectedOption(s)}
                className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                  selectedOption === s
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-xl">
          <span className="text-gray-600 font-medium">Quantity</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 active:scale-95 transition-all"
            >
              -
            </button>
            <span className="font-bold text-lg w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 active:scale-95 transition-all"
            >
              +
            </button>
          </div>
        </div>

        <button
          disabled={!selectedOption}
          onClick={() => onAddToCart({ item, quantity, option: selectedOption })}
          className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
        >
          Add to Cart — {formatPrice(total)} FCFA
        </button>
      </div>
    </div>
  );
}
