import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useCart } from '../../hooks/useCart';
import RestaurantHero from '../../components/restaurant/RestaurantHero';
import RestaurantInfo from '../../components/restaurant/RestaurantInfo';

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

export default function RestaurantPage() {
  const router = useRouter();
  const { id } = router.query;
  const { restaurantId: cartRestaurantId, clearCart } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
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

    const fetchRestaurant = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await api.getRestaurantById(id);
        setRestaurant(data.data);
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Failed to load restaurant. Please try again later.</div>;
  if (!restaurant) return <div className="p-4 text-center">Restaurant not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <RestaurantHero restaurant={restaurant} />
      <RestaurantInfo restaurant={restaurant} />
      {/* Menu components will be added here in Task 3 */}
    </div>
  );
}
