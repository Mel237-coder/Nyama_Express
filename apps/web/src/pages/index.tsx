import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useCart } from '../hooks/useCart';
import { api } from '../lib/api';
import { formatPrice } from '../lib/i18n';
import {
  Search,
  UtensilsCrossed,
  Soup,
  Beef,
  Flame,
  Salad,
  Pizza,
  Star,
  Clock,
  TrendingUp,
  Heart,
  MapPin,
  ChevronRight,
} from 'lucide-react';

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
  deliveryTime?: number;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
}

const CUISINE_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tous', nameEn: 'All', icon: <UtensilsCrossed className="w-4 h-4" />, bg: '#F5F2ED', color: '#1C1917' },
  { id: 'africaine', name: 'Africaine', nameEn: 'African', icon: <Soup className="w-4 h-4" />, bg: '#FEF0EB', color: '#D84315' },
  { id: 'fast-food', name: 'Fast-Food', nameEn: 'Fast Food', icon: <Beef className="w-4 h-4" />, bg: '#FEF3C7', color: '#D97706' },
  { id: 'grillades', name: 'Grillades', nameEn: 'Grill', icon: <Flame className="w-4 h-4" />, bg: '#FEE2E2', color: '#DC2626' },
  { id: 'asiatique', name: 'Asiatique', nameEn: 'Asian', icon: <Soup className="w-4 h-4" />, bg: '#DCFCE7', color: '#166534' },
  { id: 'indienne', name: 'Indienne', nameEn: 'Indian', icon: <Salad className="w-4 h-4" />, bg: '#F3E8FF', color: '#7C3AED' },
  { id: 'pizza', name: 'Pizza', nameEn: 'Pizza', icon: <Pizza className="w-4 h-4" />, bg: '#DBEAFE', color: '#2563EB' },
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
      setRestaurants(data.data || data || []);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
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
      r.cuisineTypes?.some((c) => c.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-24 bg-[#DDD8CF]">
      {/* ===== HEADER ===== */}
      <header className="bg-white px-5 pt-6 pb-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[#A8A29E] text-xs font-semibold tracking-widest uppercase">Livraison à</p>
            <div className="flex items-center gap-1 text-[#1C1917]">
              <MapPin className="w-4 h-4 text-[#D84315]" />
              <span className="font-bold text-sm">Yaoundé, Cameroun</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#F5F2ED] flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#78716C]" />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8A29E]" />
          <input
            type="text"
            placeholder={t('searchPlaceholder') || 'Rechercher un restaurant...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F5F2ED] text-[#1C1917] placeholder-[#A8A29E] rounded-2xl py-3.5 pl-12 pr-4 font-medium focus:outline-none focus:ring-2 focus:ring-[#D84315]/20 transition-all"
          />
        </div>
      </header>

      {/* ===== CATEGORIES PILLS ===== */}
      <div className="mt-4 px-4">
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
          {CUISINE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-md'
                  : 'bg-white text-[#1C1917] border-[#E7E5E4] hover:border-[#D6D3D1]'
              }`}
            >
              <span style={{ color: selectedCategory === cat.id ? 'white' : cat.color }}>
                {cat.icon}
              </span>
              {language === 'fr' ? cat.name : cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="mt-3 px-4 flex gap-2 overflow-x-auto pb-1">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold border border-[#FDE68A]">
          <TrendingUp className="w-3.5 h-3.5" /> Les mieux notés
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#78716C] text-xs font-bold border border-[#E7E5E4]">
          <Clock className="w-3.5 h-3.5" /> Rapide
        </button>
        <button className="px-3 py-1.5 rounded-full bg-white text-[#78716C] text-xs font-bold border border-[#E7E5E4]">
          Gratuit
        </button>
      </div>

      {/* ===== RESTAURANTS ===== */}
      <div className="mt-5 px-4">
        <p className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider mb-3">
          {filteredRestaurants.length} résultat{filteredRestaurants.length > 1 ? 's' : ''}
        </p>

        {loading ? (
          <RestaurantSkeleton />
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F2ED] flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-8 h-8 text-[#A8A29E]" />
            </div>
            <p className="font-bold text-[#78716C]">{t('noResults') || 'Aucun résultat'}</p>
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
// RESTAURANT CARD
// ============================================

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { language } = useLanguage();

  return (
    <Link href={`/restaurant/${restaurant.id}`} className="block group active:scale-[0.98] transition-transform">
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        {/* Cover image */}
        <div className="relative h-44">
          <img
            src={restaurant.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Best offer badge */}
          <div className="absolute top-3 left-3 bg-[#D84315] text-white px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-md">
            Meilleure offre
          </div>

          {/* Delivery time */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-white">
            <Clock className="w-3 h-3" />
            {restaurant.deliveryTime || 30} min
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[17px] text-[#1C1917] truncate">{restaurant.name}</h3>
              <p className="text-sm text-[#78716C] mt-0.5 line-clamp-1">
                {restaurant.description || restaurant.address}
              </p>
            </div>

            {restaurant.avgRating > 0 && (
              <div className="flex items-center gap-1 bg-[#FEF3C7] px-2 py-1 rounded-lg flex-shrink-0">
                <Star className="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]" />
                <span className="text-sm font-bold text-[#D97706]">
                  {restaurant.avgRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {restaurant.cuisineTypes?.slice(0, 2).map((type) => (
              <span
                key={type}
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-[#F5F2ED] text-[#78716C]"
              >
                {type}
              </span>
            ))}
            <span className="text-xs text-[#A8A29E] font-medium">
              {formatPrice(restaurant.deliveryFee)} livraison
            </span>
            {restaurant.isActive ? (
              <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-1 rounded-full">
                {language === 'fr' ? 'Ouvert' : 'Open'}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-2 py-1 rounded-full">
                {language === 'fr' ? 'Fermé' : 'Closed'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// SKELETON
// ============================================

function RestaurantSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
          <div className="shimmer h-44 bg-[#F5F2ED]" />
          <div className="p-4 space-y-3">
            <div className="shimmer h-5 w-3/4 rounded bg-[#F5F2ED]" />
            <div className="shimmer h-4 w-1/2 rounded bg-[#F5F2ED]" />
            <div className="flex gap-2 mt-2">
              <div className="shimmer w-16 h-5 rounded-full bg-[#F5F2ED]" />
              <div className="shimmer w-16 h-5 rounded-full bg-[#F5F2ED]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Le Petit Chef',
    description: 'Cuisine française et africaine dans un cadre élégant',
    address: 'Bastos, Yaoundé',
    logo: null,
    coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    cuisineTypes: ['française', 'africaine'],
    avgRating: 4.5,
    deliveryFee: 500,
    deliveryTime: 25,
    isActive: true,
  },
  {
    id: '2',
    name: 'Pizza Palace',
    description: 'Les meilleures pizzas de Douala, cuites au feu de bois',
    address: 'Akwa, Douala',
    logo: null,
    coverImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    cuisineTypes: ['pizza', 'italienne'],
    avgRating: 4.2,
    deliveryFee: 500,
    deliveryTime: 35,
    isActive: true,
  },
  {
    id: '3',
    name: 'Chez Maman',
    description: 'Plats traditionnels camerounais comme à la maison',
    address: 'Bonamoussadi, Douala',
    logo: null,
    coverImage: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
    cuisineTypes: ['africaine', 'camerounaise'],
    avgRating: 4.8,
    deliveryFee: 500,
    deliveryTime: 20,
    isActive: true,
  },
  {
    id: '4',
    name: 'KFC Yaoundé',
    description: 'Poulet frit à la américaine',
    address: 'Mvan, Yaoundé',
    logo: null,
    coverImage: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80',
    cuisineTypes: ['fast-food', 'américaine'],
    avgRating: 4.0,
    deliveryFee: 500,
    deliveryTime: 30,
    isActive: false,
  },
];
