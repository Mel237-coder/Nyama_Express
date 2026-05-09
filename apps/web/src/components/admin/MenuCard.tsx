import React from 'react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
}

interface MenuCardProps {
  item: MenuItem;
  onToggleAvailability: (id: string, available: boolean) => Promise<void>;
  onEdit: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onToggleAvailability, onEdit }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative h-48 w-full bg-gray-100">
        <img
          src={item.imageUrl || '/api/placeholder/400/320'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
          item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {item.available ? 'In Stock' : 'Out of Stock'}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
          <span className="text-orange-600 font-bold">{item.price} FCFA</span>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
          {item.description}
        </p>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center cursor-pointer gap-2 group-hover:text-orange-600 transition-colors">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={item.available}
                onChange={(e) => onToggleAvailability(item.id, e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border-4 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </div>
            <span className="text-xs font-medium text-gray-600">Available</span>
          </label>

          <button
            onClick={() => onEdit(item)}
            className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors px-3 py-1 border border-gray-200 rounded-lg hover:border-orange-600"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};
