import React from 'react';
import { MapPin, Trash2, Edit2 } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  street: string;
  latitude?: number;
  longitude?: number;
  zoneId?: string;
  isDefault: boolean;
}

interface AddressCardProps {
  address: Address;
  onDelete: (id: string) => void;
  onEdit: (address: Address) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({ address, onDelete, onEdit }) => {
  const displayAddress = address.street || (address.latitude && address.longitude
    ? `Location: ${address.latitude.toFixed(4)}, ${address.longitude.toFixed(4)}`
    : 'No address provided');

  return (
    <div className={`bg-white p-4 rounded-2xl border ${address.isDefault ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-100'} shadow-sm relative group transition-all`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${address.isDefault ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
          <MapPin size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 truncate">{address.label}</span>
            {address.isDefault && (
              <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium uppercase">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{displayAddress}</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(address)}
          className="p-2 text-gray-300 hover:text-orange-500 transition-colors"
          title="Edit Address"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(address.id)}
          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
          title="Delete Address"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
