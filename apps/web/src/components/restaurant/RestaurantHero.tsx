import React from 'react';
import { Truck } from 'lucide-react';
import { formatPrice } from '../../lib/i18n';

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

export const RestaurantHero: React.FC<{ restaurant: Restaurant }> = ({ restaurant }) => {
  return (
    <div className="relative h-64 w-full overflow-hidden">
      <img
        src={restaurant.coverImage || 'https://via.placeholder.com/800x400?text=Restaurant+Cover'}
        alt={restaurant.name}
        className="h-full w-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F]/90 via-[#0A0A0F]/30 to-transparent" />

      {/* Logo Badge */}
      <div className="absolute bottom-0 left-4 translate-y-1/2">
        <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white/10 bg-[#0A0A0F] shadow-lg">
          <img
            src={restaurant.logo || 'https://via.placeholder.com/80x80?text=Logo'}
            alt={`${restaurant.name} logo`}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Delivery Fee Badge */}
      <div className="absolute top-4 right-4 glass px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
        <Truck className="w-3.5 h-3.5 inline-block mr-1" style={{ color: '#00FF88' }} />{formatPrice(restaurant.deliveryFee)}
      </div>
    </div>
  );
};
