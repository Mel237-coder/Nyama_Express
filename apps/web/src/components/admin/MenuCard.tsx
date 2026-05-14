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
    <div className="glass overflow-hidden group hover:border-white/15 transition-all">
      <div className="relative h-48 w-full bg-white/5">
        <img
          src={item.imageUrl || '/api/placeholder/400/320'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border ${
          item.available ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20' : 'bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20'
        }`}>
          {item.available ? 'In Stock' : 'Out of Stock'}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-white truncate">{item.name}</h3>
          <span className="text-[#FFD600] font-bold">{item.price} FCFA</span>
        </div>
        <p className="text-white/50 text-sm line-clamp-2 mb-4 h-10">
          {item.description}
        </p>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center cursor-pointer gap-2">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={item.available}
                onChange={(e) => onToggleAvailability(item.id, e.target.checked)}
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FFD600]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border-4 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FF88]"></div>
            </div>
            <span className="text-xs font-medium text-white/60">Available</span>
          </label>

          <button
            onClick={() => onEdit(item)}
            className="ghost-btn text-sm px-3 py-1.5 rounded-xl"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};
