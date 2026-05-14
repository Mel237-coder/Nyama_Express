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
  ArrowUpRight,
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
  { id: 'africaine', name: 'Africaine', nameEn: 'African', icon: <Soup className="w-4 h-4" />, bg: '#FEF0EB', color: '#C2410C' },
  { id: 'fast-food', name: 'Fast-Food', nameEn: 'Fast Food', icon: <Beef className="w-4 h-4" />, bg: '#FEF3C7', color: '#B45309' },
  { id: 'grillades', name: 'Grillades', nameEn: 'Grill', icon: <Flame className="w-4 h-4" />, bg: '#FEE2E2', color: '#DC2626' },
  { id: 'asiatique', name: 'Asiatique', nameEn: 'Asian', icon: <Soup className="w-4 h-4" />, bg: '#DCFCE7', color: '#15803D' },
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

  const featured = filteredRestaurants[0];
  const rest = filteredRestaurants.slice(1);

  return (
    <div className="min-h-screen pb-24 bg-[#F7F3ED] font-sans">
      {/* ===== HEADER ===== */}
      <header className="px-5 pt-6 pb-4 animate-ed-reveal">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#A8A29E] text-[11px] font-bold tracking-[0.15em] uppercase mb-1">Livraison à</p>
            <div className="flex items-center gap-1.5 text-[#1C1917]">
              <MapPin className="w-4 h-4 text-[#C2410C]" strokeWidth={2.5} />
              <span className="font-bold text-sm">Yaoundé, Cameroun</span>
            </div>
          </div>
          <button className="w-11 h-11 rounded-[14px] bg-white border border-[#E7E5E4] shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
            <Heart className="w-5 h-5 text-[#78716C]" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8A29E]" />
          <input
            type="text"
            placeholder={t('searchPlaceholder') || 'Rechercher un restaurant...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ed-input pl-12 shadow-sm"
          />
        </div>
      </header>

      {/* ===== HERO FEATURED (if available) ===== */}
      {!loading && featured && !search && selectedCategory === 'all' && (
        <div className="px-5 mt-2 animate-ed-reveal ed-d1">
          <Link href={`/restaurant/${featured.id}`} className="block group">
            <div className="relative rounded-[20px] overflow-hidden shadow-lg">
              <img
                src={featured.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'}
                alt={featured.name}
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute top-4 left-4">
                <span className="ed-pill bg-[#C2410C] text-white shadow-md">
                  À la une
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h2 className="font-serif text-3xl text-white italic leading-tight mb-1">
                  {featured.name}
                </h2>
                <p className="text-white/70 text-sm font-medium">
                  {featured.description || featured.address}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-white text-xs font-bold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                    {featured.avgRating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1 text-white text-xs font-bold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {featured.deliveryTime || 30} min
                  </span>
                  <span className="text-white/60 text-xs font-medium">
                    {formatPrice(featured.deliveryFee)} livraison
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ===== CATEGORIES ===== */}
      <div className="mt-6 px-5 animate-ed-reveal ed-d2">
        <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-[0.15em] mb-3">Catégories</p>
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
              <span
                className="p-1 rounded-lg"
                style={{ backgroundColor: selectedCategory === cat.id ? 'rgba(255,255,255,0.15)' : cat.bg }}
              >
                <span style={{ color: selectedCategory === cat.id ? 'white' : cat.color }}>
                  {cat.icon}
                </span>
              </span>
              {language === 'fr' ? cat.name : cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="mt-3 px-5 flex gap-2 overflow-x-auto pb-1 animate-ed-reveal ed-d3">
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs font-bold border border-[#FDE68A]">
          <TrendingUp className="w-3.5 h-3.5" /> Top rated
        </button>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-[#78716C] text-xs font-bold border border-[#E7E5E4]">
          <Clock className="w-3.5 h-3.5" /> Rapide
        </button>
        <button className="px-3.5 py-2 rounded-full bg-white text-[#78716C] text-xs font-bold border border-[#E7E5E4]">
          Gratuit
        </button>
      </div>

      {/* ===== RESTAURANTS LIST ===== */}
      <div className="mt-6 px-5">
        <p className="text-[11px] font-bold text-[#A8A29E] uppercase tracking-[0.15em] mb-4 animate-ed-reveal ed-d4">
          {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''}
        </p>

        {loading ? (
          <RestaurantSkeleton />
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 animate-ed-reveal">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F2ED] flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-8 h-8 text-[#A8A29E]" />
            </div>
            <p className="font-bold text-[#78716C]">{t('noResults') || 'Aucun résultat'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(search || selectedCategory !== 'all' ? filteredRestaurants : rest).map((restaurant, i) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} index={i} />
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

function RestaurantCard({ restaurant, index }: { restaurant: Restaurant; index: number }) {
  const { language } = useLanguage();

  return (
    <Link href={`/restaurant/${restaurant.id}`} className="block group animate-ed-reveal"
      style={{ animationDelay: `${0.08 + index * 0.06}s` }}
    >
      <div className="ed-card flex gap-4 p-3">
        {/* Thumbnail */}
        <div className="relative w-28 h-28 shrink-0 rounded-[14px] overflow-hidden">
          <img
            src={restaurant.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {!restaurant.isActive && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">Fermé</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[15px] text-[#1C1917] leading-snug">{restaurant.name}</h3>
            {restaurant.avgRating > 0 && (
              <div className="flex items-center gap-1 bg-[#FEF3C7] px-2 py-0.5 rounded-lg shrink-0">
                <Star className="w-3 h-3 fill-[#B45309] text-[#B45309]" />
                <span className="text-xs font-bold text-[#B45309]">{restaurant.avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-[#78716C] mt-0.5 line-clamp-1">
            {restaurant.description || restaurant.address}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {restaurant.cuisineTypes?.slice(0, 2).map((type) => (
              <span
                key={type}
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[#F5F2ED] text-[#78716C]"
              >
                {type}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-2.5">
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#78716C]">
              <Clock className="w-3 h-3" /> {restaurant.deliveryTime || 30} min
            </span>
            <span className="text-[11px] text-[#A8A29E] font-medium">
              {formatPrice(restaurant.deliveryFee)} livraison
            </span>
            {restaurant.isActive ? (
              <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                Ouvert
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded-full">
                Fermé
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
        <div key={i} className="ed-card flex gap-4 p-3">
          <div className="w-28 h-28 shrink-0 rounded-[14px] ed-shimmer" />
          <div className="flex-1 py-1 space-y-3">
            <div className="ed-shimmer h-4 w-3/4" />
            <div className="ed-shimmer h-3 w-1/2" />
            <div className="flex gap-2 mt-2">
              <div className="ed-shimmer w-14 h-5 rounded-full" />
              <div className="ed-shimmer w-14 h-5 rounded-full" />
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
