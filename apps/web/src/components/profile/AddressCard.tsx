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
    <div className={`glass p-4 relative group transition-all ${address.isDefault ? 'border-[#FFD600]/30 ring-1 ring-[#FFD600]/20' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${address.isDefault ? 'bg-[#FFD600]/10 text-[#FFD600]' : 'bg-white/5 text-white/40'}`}>
          <MapPin size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white truncate">{address.label}</span>
            {address.isDefault && (
              <span className="neon-badge text-[10px] uppercase">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-white/50 line-clamp-2">{displayAddress}</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(address)}
          className="p-2 text-white/30 hover:text-[#FFD600] transition-colors"
          title="Edit Address"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(address.id)}
          className="p-2 text-white/30 hover:text-[#FF3366] transition-colors"
          title="Delete Address"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
