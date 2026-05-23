import { orderQueue } from '../services/timeoutService';
import { DriverMatchingService } from '../services/driverMatchingService';

export function startDriverSearchWorker(driverMatchingService: DriverMatchingService) {
  // Initial search — notify closest driver immediately
  orderQueue.process('driver-search', async (job) => {
    const { orderId, restaurantId } = job.data;
    const driver = await driverMatchingService.findDriver(orderId, restaurantId);
    if (driver) {
      return; // Driver found and notified
    }
    // No driver found — schedule expanded search after 2 minutes
    await orderQueue.add('expand-driver-search', { orderId, restaurantId }, { delay: 120_000 });
  });

  // Expanded search after 2 minutes
  orderQueue.process('expand-driver-search', async (job) => {
    const { orderId, restaurantId } = job.data;
    const driver = await driverMatchingService.findDriver(orderId, restaurantId, 10); // 10km radius
    if (!driver) {
      // Schedule final expanded search after 3 more minutes
      await orderQueue.add('final-driver-search', { orderId, restaurantId }, { delay: 180_000 });
    }
  });

  // Final search after 3 more minutes
  orderQueue.process('final-driver-search', async (job) => {
    const { orderId, restaurantId } = job.data;
    await driverMatchingService.findDriver(orderId, restaurantId, 20); // 20km radius
    // If still no driver, order remains unassigned — restaurant or client can cancel
  });
}
