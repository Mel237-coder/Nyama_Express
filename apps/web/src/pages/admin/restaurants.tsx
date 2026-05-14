import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { api, storage } from '../../lib/api';
import { GlassCard } from '../../components/layout/GlassCard';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { NeonButton } from '../../components/layout/NeonButton';
import { Search, UtensilsCrossed, Ban } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisineTypes: string[];
  isActive: boolean;
  logo?: string | null;
}

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { language, t } = useLanguage();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filtered, setFiltered] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Admin guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-12 h-12 rounded-full" />
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'RESTAURANT_OWNER')) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard elevated className="max-w-md w-full p-8 text-center space-y-4">
          <Ban className="w-10 h-10 mx-auto" style={{ color: '#FF3366' }} />
          <h1 className="text-xl font-bold text-white">
            {language === 'fr' ? 'Accès refusé' : 'Unauthorized'}
          </h1>
          <p className="text-sm text-white/50">
            {language === 'fr'
              ? 'Vous devez être administrateur pour accéder à cette page.'
              : 'You must be an administrator to access this page.'}
          </p>
          <NeonButton onClick={() => router.push('/')}>
            {language === 'fr' ? 'Retour à l\'accueil' : 'Return home'}
          </NeonButton>
        </GlassCard>
      </div>
    );
  }

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const token = storage.getAccessToken();
        if (!token) return;
        const data = (await api.getRestaurants()) as any;
        const list = data.data || data || [];
        setRestaurants(list);
        setFiltered(list);
      } catch (err) {
        console.error('Failed to fetch restaurants:', err);
        setRestaurants(MOCK_RESTAURANTS);
        setFiltered(MOCK_RESTAURANTS);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase().trim();
    if (!term) {
      setFiltered(restaurants);
      return;
    }
    setFiltered(
      restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.address.toLowerCase().includes(term) ||
          r.cuisineTypes.some((c) => c.toLowerCase().includes(term))
      )
    );
  }, [search, restaurants]);

  const handleToggleStatus = (id: string) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    setFiltered((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  return (
    <div className="min-h-screen">
      <GlassHeader
        title={language === 'fr' ? 'Restaurants' : 'Restaurants'}
        right={
          <NeonButton size="sm">
            {language === 'fr' ? '+ Ajouter' : '+ Add'}
          </NeonButton>
        }
      />

      <main className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'fr'
                ? 'Rechercher un restaurant...'
                : 'Search for a restaurant...'
            }
            className="neon-input pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
        </div>

        {/* List */}
        {loading ? (
          <RestaurantsSkeleton />
        ) : filtered.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-3">
            <UtensilsCrossed className="w-10 h-10 mx-auto" style={{ color: '#FFD600' }} />
            <p className="text-white/50">
              {language === 'fr' ? 'Aucun restaurant trouvé' : 'No restaurants found'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filtered.map((restaurant) => (
              <GlassCard key={restaurant.id} elevated className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                    {restaurant.logo ? (
                      <img
                        src={restaurant.logo}
                        alt={restaurant.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <UtensilsCrossed className="w-5 h-5" style={{ color: '#FFD600' }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-white truncate">
                        {restaurant.name}
                      </h3>
                      <span
                        className={`neon-badge ${
                          restaurant.isActive ? 'status-success' : 'status-danger'
                        }`}
                      >
                        {restaurant.isActive
                          ? language === 'fr'
                            ? 'Actif'
                            : 'Active'
                          : language === 'fr'
                          ? 'Inactif'
                          : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-sm text-white/50 truncate mt-0.5">
                      {restaurant.address}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {restaurant.cuisineTypes.slice(0, 3).map((type) => (
                        <span key={type} className="neon-badge">
                          {type}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                      <NeonButton variant="ghost" size="sm">
                        {language === 'fr' ? 'Modifier' : 'Edit'}
                      </NeonButton>
                      <NeonButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleToggleStatus(restaurant.id)}
                      >
                        {restaurant.isActive
                          ? language === 'fr'
                            ? 'Désactiver'
                            : 'Deactivate'
                          : language === 'fr'
                          ? 'Activer'
                          : 'Activate'}
                      </NeonButton>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function RestaurantsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-elevated p-4 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="shimmer w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="shimmer h-5 w-40 rounded" />
              <div className="shimmer h-4 w-full rounded" />
              <div className="flex gap-2">
                <div className="shimmer w-16 h-6 rounded-full" />
                <div className="shimmer w-16 h-6 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Le Petit Chef',
    address: 'Bastos, Yaoundé',
    cuisineTypes: ['française', 'africaine'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Pizza Palace',
    address: 'Akwa, Douala',
    cuisineTypes: ['pizza', 'italienne'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Chez Maman',
    address: 'Bonamoussadi, Douala',
    cuisineTypes: ['africaine', 'camerounaise'],
    isActive: false,
  },
];
