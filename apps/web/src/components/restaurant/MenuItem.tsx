import React from 'react';
import Image from 'next/image';

interface MenuItemProps {
  item: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
  };
  onAdd: (item: any) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, onAdd }) => {
  return (
    <div className="relative flex glass overflow-hidden hover:bg-white/5 transition-colors p-3 group cursor-pointer">
      <div className="flex-1 pr-4 min-w-0">
        <h3 className="font-bold text-white text-lg line-clamp-1">{item.name}</h3>
        <p className="text-white/40 text-sm line-clamp-2 min-h-[40px] mb-2">
          {item.description || 'Aucune description disponible'}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-[#FFD600] text-lg">
            {item.price.toLocaleString()} F
          </span>
        </div>
      </div>
      <div className="relative w-24 h-24 flex-shrink-0">
        <Image
          src={item.image || '/placeholder-food.png'}
          alt={item.name}
          fill
          className="object-cover rounded-lg"
        />
        <button
          onClick={() => onAdd(item)}
          className="absolute -bottom-2 -right-2 neon-btn w-8 h-8 flex items-center justify-center rounded-full z-10 p-0"
          aria-label="Ajouter au panier"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 00-1 1v12a1 1 0 002 0V4a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M3 10a1 1 0 000 2h12a1 1 0 000-2H3z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MenuItem;
