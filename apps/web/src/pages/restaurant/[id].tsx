import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useCart } from '../../hooks/useCart';

export default function RestaurantPage() {
  const router = useRouter();
  const { id } = router.query;
  const { restaurantId: cartRestaurantId, clearCart } = useCart();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Guard: Check if cart contains items from another restaurant
    if (cartRestaurantId && cartRestaurantId !== id) {
      if (confirm('Your cart contains items from another restaurant. Clear cart to order from here?')) {
        clearCart();
      } else {
        router.push('/');
      }
    }

    const fetchRestaurant = async () => {
      try {
        const data = await api.getRestaurantById(id as string);
        setRestaurant(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id, cartRestaurantId, clearCart, router]);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!restaurant) return <div className="p-4 text-center">Restaurant not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
       {/* Components will be inserted here */}
       <h1 className="p-4 text-2xl font-bold">{restaurant.name}</h1>
    </div>
  );
}
