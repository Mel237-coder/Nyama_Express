import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useCart } from '../../hooks/useCart';
import { useLanguage } from '../../hooks/useLanguage';
import { formatPrice } from '../../lib/i18n';
import { GlassHeader } from '../../components/layout/GlassHeader';
import { ItemCustomizerModal, CustomizerDetails } from '../../components/restaurant/ItemCustomizerModal';
import { Star, Clock, Truck, MapPin, ChevronLeft, Plus } from 'lucide-react';

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
}

interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  categoryId: string;
  isAvailable?: boolean;
}

type Tab = 'menu' | 'info';

export default function RestaurantPage() {
  const router = useRouter();
  const { id } = router.query;
  const { language } = useLanguage();
  const { restaurantId: cartRestaurantId, clearCart, addItem: addItemToCart } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);

  useEffect(() => {
    if (typeof id !== 'string') return;

    if (cartRestaurantId && cartRestaurantId !== id) {
      if (window.confirm('Votre panier contient des articles d\'un autre restaurant. Vider le panier pour commander ici ?')) {
        clearCart();
      } else {
        router.push('/');
      }
    }
  }, [id, cartRestaurantId, clearCart, router]);

  useEffect(() => {
    if (typeof id !== 'string') return;

    const fetchRestaurantData = async () => {
      setLoading(true);
      setError(false);
      try {
        const [restaurantRes, categoriesRes, menuItemsRes]: [any, any, any] = await Promise.all([
          api.getRestaurant(id),
          api.getCategories(id),
          api.getMenuItems(id),
        ]);

        setRestaurant(restaurantRes);
        setCategories(categoriesRes);
        setMenuItems(menuItemsRes);
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantData();
  }, [id]);

  const handleAddItem = (item: MenuItemData) => {
    if (!item.isAvailable && item.isAvailable !== undefined) {
      alert('Ce plat est momentanément indisponible');
      return;
    }
    setSelectedItem(item);
  };

  const handleAddToCart = (details: CustomizerDetails) => {
    const { item, quantity, options } = details;
    addItemToCart({
      menuItemId: item.id,
      name: item.name,
      price: item.price + (options.length > 0 ? 100 : 0),
      quantity,
      options,
      image: item.image || undefined,
    }, restaurant!.id, restaurant!.name);
    setSelectedItem(null);
  };

  const filteredItems = selectedCategoryId === 'all'
    ? menuItems
    : menuItems.filter(item => item.categoryId === selectedCategoryId);

  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-[#0A0A0F]">
        <div className="h-64 shimmer" />
        <div className="px-4 pt-14 space-y-4">
          <div className="shimmer h-8 w-3/4 rounded" />
          <div className="shimmer h-4 w-1/2 rounded" />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer w-20 h-8 rounded-full" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#FF3366] text-lg font-bold mb-4">
            {error ? 'Échec du chargement' : 'Restaurant introuvable'}
          </p>
          <button onClick={() => router.push('/')} className="neon-btn">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-[#0A0A0F]">
      {/* ===== COUVERTURE FULL-WIDTH ===== */}
      <div className="relative h-56">
        <img
          src={restaurant.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/40 to-transparent" />

        {/* Bouton retour */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Frais de livraison */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-white">
          <Truck className="w-3.5 h-3.5 inline-block mr-1" style={{ color: '#00FF88' }} />
          {formatPrice(restaurant.deliveryFee)}
        </div>
      </div>

      {/* ===== HEADER INFO ===== */}
      <div className="relative px-4 -mt-10">
        {/* Logo rond centré */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#0A0A0F] bg-[#0A0A0F] shadow-xl overflow-hidden">
            <img
              src={restaurant.logo || 'https://via.placeholder.com/80x80?text=Logo'}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="text-center mt-3">
          <h1 className="text-2xl font-extrabold text-white">{restaurant.name}</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex items-center gap-1 bg-[#FFD600]/10 border border-[#FFD600]/20 px-2 py-0.5 rounded-lg">
              <Star className="w-3.5 h-3.5" style={{ color: '#FFD600', fill: '#FFD600' }} />
              <span className="text-sm font-bold text-[#FFD600]">{restaurant.avgRating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-white/40">•</span>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <Clock className="w-3.5 h-3.5" />
              {restaurant.deliveryTime || 30} min
            </div>
            <span className="text-xs text-white/40">•</span>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <MapPin className="w-3.5 h-3.5" />
              0.9 km
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {restaurant.cuisineTypes?.slice(0, 3).map((type) => (
              <span key={type} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="mt-6 px-4">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 pb-3 text-sm font-bold text-center transition-colors ${
              activeTab === 'menu'
                ? 'text-[#00FF88] border-b-2 border-[#00FF88]'
                : 'text-white/40'
            }`}
          >
            {language === 'fr' ? 'Menu' : 'Menu'}
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 pb-3 text-sm font-bold text-center transition-colors ${
              activeTab === 'info'
                ? 'text-[#00FF88] border-b-2 border-[#00FF88]'
                : 'text-white/40'
            }`}
          >
            {language === 'fr' ? 'Infos' : 'Info'}
          </button>
        </div>
      </div>

      {/* ===== CONTENU TAB ===== */}
      <div className="mt-4 px-4">
        {activeTab === 'menu' ? (
          <div>
            {/* Filtres catégories */}
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategoryId === 'all'
                    ? 'bg-[#00FF88] text-[#0A0A0F]'
                    : 'bg-white/5 text-white/60 border border-white/10'
                }`}
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategoryId === cat.id
                      ? 'bg-[#00FF88] text-[#0A0A0F]'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Liste des plats */}
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <p>Aucun plat disponible</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    disabled={item.isAvailable === false}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/8 text-left transition-all active:scale-[0.98] ${
                      item.isAvailable === false ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                      <p className="text-sm font-bold text-[#FFD600] mt-1">{formatPrice(item.price)}</p>
                    </div>
                    {item.image ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-[#00FF88] flex items-center justify-center shadow-lg">
                            <Plus className="w-4 h-4 text-[#0A0A0F]" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <h3 className="font-bold text-white mb-2">Description</h3>
              <p className="text-sm text-white/60">{restaurant.description || 'Aucune description'}</p>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <h3 className="font-bold text-white mb-2">Adresse</h3>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <MapPin className="w-4 h-4 text-[#FF3366]" />
                {restaurant.address}
              </div>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <h3 className="font-bold text-white mb-2">Horaires</h3>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Clock className="w-4 h-4 text-[#00D4FF]" />
                Ouvert 24h/24 (Démo)
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <ItemCustomizerModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
