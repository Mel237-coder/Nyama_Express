import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../lib/api';
import { formatPrice, t } from '../lib/i18n';
import { GlassCard } from '../components/layout/GlassCard';
import { GlassHeader } from '../components/layout/GlassHeader';
import { Search, UtensilsCrossed, Star, Truck } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  cuisineTypes: string[];
  avgRating: number;
  deliveryFee: number;
  isActive: boolean;
}

export default function RestaurantsPage() {
  const { language } = useLanguage();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await api.getRestaurants() as any;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24">
      <GlassHeader
        title={language === 'fr' ? 'Restaurants' : 'Restaurants'}
        sticky
      />

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder={language === 'fr' ? 'Rechercher un restaurant...' : 'Search for a restaurant...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neon-input pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
        </div>
      </div>

      {/* Restaurant list */}
      <div className="px-4">
        {loading ? (
          <RestaurantSkeleton />
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-2" style={{ color: '#FFD600' }} />
            <p>{language === 'fr' ? 'Aucun restaurant disponible' : 'No restaurants available'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <Link href={`/restaurant/${restaurant.id}`} key={restaurant.id} className="block">
                <GlassCard elevated className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h2 className="font-bold text-lg text-white">{restaurant.name}</h2>
                        <p className="text-sm text-white/50 mt-1 line-clamp-1">{restaurant.address}</p>

                        {/* Cuisine tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {restaurant.cuisineTypes.map((c) => (
                            <span key={c} className="neon-badge">
                              {c}
                            </span>
                          ))}
                        </div>

                        {/* Status & Rating */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                restaurant.isActive ? 'bg-[#00FF88]' : 'bg-[#FF3366]'
                              }`}
                            />
                            <span
                              className={`text-sm ${
                                restaurant.isActive ? 'status-success' : 'status-danger'
                              }`}
                            >
                              {restaurant.isActive
                                ? language === 'fr' ? 'Ouvert' : 'Open'
                                : language === 'fr' ? 'Fermé' : 'Closed'}
                            </span>
                          </div>
                          {restaurant.avgRating > 0 && (
                            <div className="flex items-center gap-1 text-white/60 text-sm">
                              <Star className="w-3.5 h-3.5" style={{ color: '#FFD600', fill: '#FFD600' }} />
                              <span>{restaurant.avgRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery fee */}
                      <div className="glass px-2.5 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap ml-3">
                        <Truck className="w-3.5 h-3.5 inline-block mr-1" style={{ color: '#00FF88' }} />{formatPrice(restaurant.deliveryFee)}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RestaurantSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-elevated overflow-hidden rounded-2xl p-4 space-y-3">
          <div className="shimmer h-5 w-3/4" />
          <div className="shimmer h-4 w-1/2" />
          <div className="flex gap-2">
            <div className="shimmer w-16 h-6 rounded-full" />
            <div className="shimmer w-16 h-6 rounded-full" />
          </div>
          <div className="shimmer h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
