import { orderQueue } from '../services/timeoutService';
import { OrderService } from '../services/orderService';

export function startOrderTimeoutWorker(orderService: OrderService) {
  orderQueue.process('order-timeout', async (job) => {
    const { orderId } = job.data;
    await orderService.handleOrderTimeout(orderId);
  });

  orderQueue.process('delivery-confirm-timeout', async (job) => {
    const { orderId } = job.data;
    // Auto-confirm delivery after 15 min
    await orderService.clientConfirmDelivery(orderId, 'system');
  });

  console.log('[Worker] Order timeout worker started');
}