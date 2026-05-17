import Queue from 'bull';
import { DriverMatchingService } from '../services/driverMatchingService';
import { NotificationService } from '../services/notificationService';
import { getSupabaseAdmin } from '../config/supabase';
import {
  DRIVER_SEARCH_TIMEOUT_MS,
  DRIVER_SEARCH_MAX_MS,
} from '../config/constants';

const driverSearchQueue = new Queue(
  'driver-search',
  process.env.REDIS_URL || 'redis://localhost:6379',
);

export function startDriverSearchWorker() {
  const matching = new DriverMatchingService();
  const notifications = new NotificationService();
  const supabase = getSupabaseAdmin();

  driverSearchQueue.process('find-driver', async (job) => {
    const { orderId, restaurantId } = job.data;

    // Phase 1: search 5km radius
    let driver = await matching.findDriver(orderId, restaurantId);

    if (!driver) {
      // Wait 2 min, then expand to 10km
      await new Promise((r) => setTimeout(r, DRIVER_SEARCH_TIMEOUT_MS));
      driver = await matching.expandSearch(orderId, restaurantId);
    }

    if (!driver) {
      // Wait another 3 min total, then give up
      await new Promise((r) => setTimeout(r, DRIVER_SEARCH_MAX_MS - DRIVER_SEARCH_TIMEOUT_MS));
      driver = await matching.expandSearch(orderId, restaurantId);
    }

    if (!driver) {
      // Notify restaurant that no driver was found
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id, name')
        .eq('id', restaurantId)
        .single();

      if (restaurant) {
        await notifications.sendPushNotification({
          userId: restaurant.owner_id,
          title: '⚠️ Aucun livreur trouvé',
          body: 'Aucun livreur disponible dans votre zone. Veuillez nous contacter.',
          data: { order_id: orderId },
        });
      }
    }
  });

  console.log('[Worker] Driver search worker started');
}

export { driverSearchQueue };