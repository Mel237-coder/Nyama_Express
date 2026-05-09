// ============================================
// Page d'accueil - Liste des restaurants
// Mobile-first design
// ============================================

import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useCart } from '../hooks/useCart';
import { api } from '../lib/api';
import { formatPrice } from '../lib/i18n';

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

interface Category {
  id: string;
  name: string;
  nameEn: string | null;
  icon: string;
}

const CUISINE_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tous', nameEn: 'All', icon: '🍽️' },
  { id: 'african', name: 'Africaine', nameEn: 'African', icon: '🍲' },
  { id: 'fast-food', name: 'Fast-Food', nameEn: 'Fast Food', icon: '🍔' },
  { id: 'grill', name: 'Grillades', nameEn: 'Grill', icon: '🥩' },
  { id: 'asian', name: 'Asiatique', nameEn: 'Asian', icon: '🍜' },
  { id: 'indian', name: 'Indienne', nameEn: 'Indian', icon: '🍛' },
  { id: 'pizza', name: 'Pizza', nameEn: 'Pizza', icon: '🍕' },
];

export default function HomePage() {
  const { language, t } = useLanguage();
  const { restaurantId: cartRestaurantId } = useCart();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await api.getRestaurants() as any;
      setRestaurants(data.data || []);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      // Mock data for development
      setRestaurants(MOCK_RESTAURANTS);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      r.cuisineTypes.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-orange-500 text-white p-4 sticky top-0 z-30">
        <h1 className="text-xl font-bold mb-3">FoodApp Cameroun</h1>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </header>

      {/* Categories */}
      <div className="overflow-x-auto px-4 py-3">
        <div className="flex gap-2">
          {CUISINE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-full whitespace-nowrap text-sm ${
                selectedCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{language === 'fr' ? cat.name : cat.nameEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant list */}
      <div className="px-4">
        {loading ? (
          <RestaurantSkeleton />
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">🍽️</p>
            <p>{t('noResults')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Composant carte restaurant
// ============================================

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { language } = useLanguage();

  return (
    <a href={`/restaurant/${restaurant.id}`} className="card block">
      {/* Cover image */}
      <div className="relative h-40 bg-gray-200">
        {restaurant.coverImage ? (
          <img
            src={restaurant.coverImage}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-orange-100 to-orange-200">
            🍽️
          </div>
        )}

        {/* Logo badge */}
        {restaurant.logo && (
          <div className="absolute bottom-0 left-4 -mb-6 w-16 h-16 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Delivery fee badge */}
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow">
          🚀 {formatPrice(restaurant.deliveryFee)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 pt-8">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{restaurant.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {restaurant.description || restaurant.address}
            </p>
          </div>

          {/* Rating */}
          {restaurant.avgRating > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
              <span className="text-orange-500">⭐</span>
              <span className="font-medium text-sm">{restaurant.avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Cuisine tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {restaurant.cuisineTypes.slice(0, 3).map((type) => (
            <span key={type} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {type}
            </span>
          ))}
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${restaurant.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500">
            {restaurant.isActive ? (language === 'fr' ? 'Ouvert' : 'Open') : (language === 'fr' ? 'Fermé' : 'Closed')}
          </span>
        </div>
      </div>
    </a>
  );
}

// ============================================
// Skeleton loading
// ============================================

function RestaurantSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div className="skeleton-image h-40" />
          <div className="p-4">
            <div className="skeleton-text w-3/4" />
            <div className="skeleton-text w-1/2" />
            <div className="flex gap-2 mt-3">
              <div className="skeleton w-16 h-6 rounded" />
              <div className="skeleton w-16 h-6 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Mock data for development
// ============================================

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Le Petit Chef',
    description: 'Cuisine française et africaine dans un cadre élégant',
    address: 'Bastos, Yaoundé',
    logo: null,
    coverImage: null,
    cuisineTypes: ['française', 'africaine', 'gastronomique'],
    avgRating: 4.5,
    deliveryFee: 500,
    isActive: true,
  },
  {
    id: '2',
    name: 'Pizza Palace',
    description: 'Les meilleures pizzas de Douala, cuites au feu de bois',
    address: 'Akwa, Douala',
    logo: null,
    coverImage: null,
    cuisineTypes: ['pizza', 'italienne', 'fast-food'],
    avgRating: 4.2,
    deliveryFee: 500,
    isActive: true,
  },
  {
    id: '3',
    name: 'Chez Maman',
    description: 'Plats traditionnels camerounais comme à la maison',
    address: 'Bonamoussadi, Douala',
    logo: null,
    coverImage: null,
    cuisineTypes: ['africaine', 'camerounaise', 'traditionnelle'],
    avgRating: 4.8,
    deliveryFee: 500,
    isActive: true,
  },
  {
    id: '4',
    name: 'KFC Yaoundé',
    description: 'Poulet frit à la américaine',
    address: 'Mvan, Yaoundé',
    logo: null,
    coverImage: null,
    cuisineTypes: ['fast-food', 'américaine'],
    avgRating: 4.0,
    deliveryFee: 500,
    isActive: false,
  },
];