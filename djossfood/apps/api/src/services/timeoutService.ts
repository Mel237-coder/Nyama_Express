import Queue from 'bull';
import {
  ORDER_TIMEOUT_CHECK_MS,
  DELIVERY_CONFIRM_TIMEOUT_MS,
} from '../config/constants';

const orderQueue = new Queue('order-timeout', process.env.REDIS_URL || 'redis://localhost:6379');

export class TimeoutService {
  async scheduleOrderTimeout(orderId: string): Promise<string> {
    const job = await orderQueue.add(
      'order-timeout',
      { orderId },
      { delay: ORDER_TIMEOUT_CHECK_MS },
    );
    return String(job.id ?? orderId);
  }

  async cancelOrderTimeout(jobId: string): Promise<void> {
    const jobs = await orderQueue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      if (job.data?.orderId === jobId || String(job.id) === jobId) {
        await job.remove();
        break;
      }
    }
  }

  async scheduleDeliveryConfirmTimeout(orderId: string): Promise<string> {
    const job = await orderQueue.add(
      'delivery-confirm-timeout',
      { orderId },
      { delay: DELIVERY_CONFIRM_TIMEOUT_MS },
    );
    return String(job.id ?? orderId);
  }
}

export async function addDelayedJob(name: string, data: any, delayMs: number): Promise<void> {
  await orderQueue.add(name, data, { delay: delayMs });
}

export { orderQueue };