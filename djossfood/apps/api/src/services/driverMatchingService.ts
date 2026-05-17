import { getSupabaseAdmin } from '../config/supabase';
import { NotificationService } from './notificationService';
import {
  DRIVER_SEARCH_RADIUS_KM,
  DRIVER_SEARCH_EXPANDED_RADIUS_KM,
} from '../config/constants';

export class DriverMatchingService {
  private supabase = getSupabaseAdmin();
  private notificationService = new NotificationService();

  async findDriver(orderId: string, restaurantId: string, radiusKm = DRIVER_SEARCH_RADIUS_KM) {
    // Call the PostGIS function find_nearby_drivers
    const { data: drivers, error } = await this.supabase.rpc('find_nearby_drivers', {
      p_restaurant_id: restaurantId,
      p_radius_km: radiusKm,
    });

    if (error || !drivers?.length) return null;

    // Pick the closest driver
    const driver = drivers[0];

    // Get restaurant name for notification
    const { data: restaurant } = await this.supabase
      .from('restaurants')
      .select('name')
      .eq('id', restaurantId)
      .single();

    const template = this.notificationService.templates.delivery_request(
      restaurant?.name || 'Restaurant',
      Number(driver.distance_km),
    );

    await this.notificationService.sendPushNotification({
      userId: driver.driver_id,
      title: template.title,
      body: template.body,
      data: { order_id: orderId, restaurant_id: restaurantId },
    });

    return driver;
  }

  async expandSearch(orderId: string, restaurantId: string) {
    return this.findDriver(orderId, restaurantId, DRIVER_SEARCH_EXPANDED_RADIUS_KM);
  }
}