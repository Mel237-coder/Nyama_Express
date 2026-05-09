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
    <div className="relative flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-3 group">
      <div className="flex-1 pr-4">
        <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{item.name}</h3>
        <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px] mb-2">
          {item.description || 'No description available'}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-orange-600 text-lg">
            {item.price.toLocaleString()} FCFA
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
          className="absolute -bottom-2 -right-2 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors z-10"
          aria-label="Add to cart"
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
