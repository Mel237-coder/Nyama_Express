import React, { useState } from 'react';
import { Star, MapPin, FileText, Clock } from 'lucide-react';
import { t } from '../../lib/i18n';

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  logo: string | null;
  coverImage: string | null;
  cuisineTypes: string[];
  avgRating: number;
  deliveryFee: number;
  isActive: boolean;
}

export const RestaurantInfo: React.FC<{ restaurant: Restaurant }> = ({ restaurant }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4 pt-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
        <div className="flex items-center gap-1 neon-badge">
          <Star className="w-4 h-4" style={{ color: '#FFD600', fill: '#FFD600' }} />
          <span className="font-bold">{restaurant.avgRating.toFixed(1)}</span>
        </div>
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 flex items-center gap-2 text-sm font-medium text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors"
      >
        <span>{isExpanded ? 'Fermer' : 'Informations'}</span>
        <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 glass p-4 text-sm text-white/70 space-y-2">
          <p>
            <span className="text-white/90 font-medium inline-flex items-center gap-1"><MapPin className="w-4 h-4" style={{ color: '#FF3366' }} /> Adresse: </span>
            {restaurant.address}
          </p>
          <p>
            <span className="text-white/90 font-medium inline-flex items-center gap-1"><FileText className="w-4 h-4" style={{ color: '#00D4FF' }} /> Description: </span>
            {restaurant.description || 'Aucune description'}
          </p>
          <p>
            <span className="text-white/90 font-medium inline-flex items-center gap-1"><Clock className="w-4 h-4" style={{ color: '#00D4FF' }} /> Horaires: </span>
            Ouvert 24h/24 (Démo)
          </p>
        </div>
      )}
    </div>
  );
};
