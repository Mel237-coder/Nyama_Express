// ============================================
// Page d'accueil — Design inspiré Uber Eats + Glassmorphism Néon
// Mobile-first, header hero vert, catégories circulaires, cartes enrichies
// ============================================

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
  color: string;
}

const CUISINE_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tous', nameEn: 'All', icon: <UtensilsCrossed className="w-5 h-5" />, color: '#FFD600' },
  { id: 'africaine', name: 'Africaine', nameEn: 'African', icon: <Soup className="w-5 h-5" />, color: '#00FF88' },
  { id: 'fast-food', name: 'Fast-Food', nameEn: 'Fast Food', icon: <Beef className="w-5 h-5" />, color: '#00D4FF' },
  { id: 'grillades', name: 'Grillades', nameEn: 'Grill', icon: <Flame className="w-5 h-5" />, color: '#FF3366' },
  { id: 'asiatique', name: 'Asiatique', nameEn: 'Asian', icon: <Soup className="w-5 h-5" />, color: '#00D4FF' },
  { id: 'indienne', name: 'Indienne', nameEn: 'Indian', icon: <Salad className="w-5 h-5" />, color: '#FFD600' },
  { id: 'pizza', name: 'Pizza', nameEn: 'Pizza', icon: <Pizza className="w-5 h-5" />, color: '#FF3366' },
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
    <div className="min-h-screen pb-24 bg-[#0A0A0F]">
      {/* ===== HERO HEADER ===== */}
      <header className="relative bg-[#00FF88] px-4 pt-6 pb-8 rounded-b-[2rem] shadow-[0_4px_40px_rgba(0,255,136,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold text-[#0A0A0F] tracking-tight">
            FoodApp
          </h1>
          <span className="text-xs font-bold text-[#0A0A0F]/70 bg-[#0A0A0F]/10 px-2 py-1 rounded-full">
            Cameroun
          </span>
        </div>

        {/* Recherche proéminente style Uber Eats */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-[#0A0A0F]/40" />
          </div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white text-[#0A0A0F] placeholder-[#0A0A0F]/40 rounded-full py-3.5 pl-12 pr-4 font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0F]/20"
          />
        </div>
      </header>

      {/* ===== CATÉGORIES CIRCULAIRES ===== */}
      <div className="mt-5 px-4">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {CUISINE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[72px]"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  selectedCategory === cat.id
                    ? 'ring-2 ring-offset-2 ring-offset-[#0A0A0F] opacity-100'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${cat.color}20`,
                  '--tw-ring-color': cat.color,
                  color: cat.color,
                } as React.CSSProperties}
              >
                {cat.icon}
              </div>
              <span className="text-xs font-semibold text-white/90">
                {language === 'fr' ? cat.name : cat.nameEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== FILTRES RAPIDES ===== */}
      <div className="mt-4 px-4 flex gap-2 overflow-x-auto pb-1">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFD600]/10 text-[#FFD600] text-xs font-bold border border-[#FFD600]/20">
          <TrendingUp className="w-3.5 h-3.5" /> Les mieux notés
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60 text-xs font-bold border border-white/10">
          <Heart className="w-3.5 h-3.5" /> Favoris
        </button>
        <button className="px-3 py-1.5 rounded-full bg-white/5 text-white/60 text-xs font-bold border border-white/10">
          Réinitialiser
        </button>
      </div>

      {/* ===== RÉSULTATS ===== */}
      <div className="mt-6 px-4">
        <p className="text-sm font-semibold text-white/50 mb-4">
          {filteredRestaurants.length} résultat{filteredRestaurants.length > 1 ? 's' : ''}
        </p>

        {loading ? (
          <RestaurantSkeleton />
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3" style={{ color: '#FFD600' }} />
            <p className="font-medium">{t('noResults')}</p>
          </div>
        ) : (
          <div className="space-y-5">
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
// CARTE RESTAURANT — Style Uber Eats enrichi
// ============================================

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { language } = useLanguage();

  return (
    <Link href={`/restaurant/${restaurant.id}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/8 transition-transform active:scale-[0.98]">
        {/* Photo couverture */}
        <div className="relative h-44">
          <img
            src={restaurant.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent" />

          {/* Badge "Meilleure offre" */}
          <div className="absolute top-3 left-3 bg-[#00FF88] text-[#0A0A0F] px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-lg">
            Meilleure offre
          </div>

          {/* Temps de livraison */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-white">
            <Clock className="w-3 h-3" />
            {restaurant.deliveryTime || 30} min
          </div>
        </div>

        {/* Infos */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white truncate">{restaurant.name}</h3>
              <p className="text-sm text-white/50 mt-0.5 line-clamp-1">
                {restaurant.description || restaurant.address}
              </p>
            </div>

            {/* Note */}
            {restaurant.avgRating > 0 && (
              <div className="flex items-center gap-1 bg-[#FFD600]/10 border border-[#FFD600]/20 px-2 py-1 rounded-lg flex-shrink-0">
                <Star className="w-3.5 h-3.5" style={{ color: '#FFD600', fill: '#FFD600' }} />
                <span className="text-sm font-bold text-[#FFD600]">
                  {restaurant.avgRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Tags cuisine + frais */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {restaurant.cuisineTypes?.slice(0, 2).map((type) => (
              <span
                key={type}
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-white/10 text-white/70"
              >
                {type}
              </span>
            ))}
            <span className="text-xs text-white/40 font-medium">
              {formatPrice(restaurant.deliveryFee)} livraison
            </span>
            {restaurant.isActive ? (
              <span className="text-[10px] font-bold text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded-full">
                {language === 'fr' ? 'Ouvert' : 'Open'}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#FF3366] bg-[#FF3366]/10 px-2 py-0.5 rounded-full">
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
// SKELETON LOADING
// ============================================

function RestaurantSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white/5 border border-white/8">
          <div className="shimmer h-44" />
          <div className="p-4 space-y-3">
            <div className="shimmer h-5 w-3/4 rounded" />
            <div className="shimmer h-4 w-1/2 rounded" />
            <div className="flex gap-2 mt-2">
              <div className="shimmer w-16 h-5 rounded-full" />
              <div className="shimmer w-16 h-5 rounded-full" />
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
