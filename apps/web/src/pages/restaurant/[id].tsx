import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useCart } from '../../hooks/useCart';
import RestaurantHero from '../../components/restaurant/RestaurantHero';
import RestaurantInfo from '../../components/restaurant/RestaurantInfo';
import MenuCategoryNav from '../../components/restaurant/MenuCategoryNav';
import MenuItem from '../../components/restaurant/MenuItem';

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
}

interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  categoryId: string;
}

export default function RestaurantPage() {
  const router = useRouter();
  const { id } = router.query;
  const { restaurantId: cartRestaurantId, clearCart } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof id !== 'string') return;

    if (cartRestaurantId && cartRestaurantId !== id) {
      if (window.confirm('Your cart contains items from another restaurant. Clear cart to order from here?')) {
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
        const [restaurantRes, categoriesRes, menuItemsRes] = await Promise.all([
          api.getRestaurantById(id),
          api.getRestaurantCategories(id),
          api.getRestaurantMenu(id),
        ]);

        setRestaurant(restaurantRes.data);
        setCategories(categoriesRes.data);
        setMenuItems(menuItemsRes.data);
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
    console.log('Add item to cart trigger (Task 4):', item);
    alert(`Adding ${item.name} to cart...`);
  };

  const filteredItems = selectedCategoryId === 'all'
    ? menuItems
    : menuItems.filter(item => item.categoryId === selectedCategoryId);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Failed to load restaurant. Please try again later.</div>;
  if (!restaurant) return <div className="p-4 text-center">Restaurant not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <RestaurantHero restaurant={restaurant} />
      <RestaurantInfo restaurant={restaurant} />

      <MenuCategoryNav
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      <div className="px-4 py-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {selectedCategoryId === 'all' ? 'Full Menu' : categories.find(c => c.id === selectedCategoryId)?.name}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              onAdd={handleAddItem}
            />
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No items available in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
