import { OrderService } from '../services/orderService';
import { PaymentService } from '../services/paymentService';
import { NotificationService } from '../services/notificationService';
import { TimeoutService } from '../services/timeoutService';
import { DriverMatchingService } from '../services/driverMatchingService';
import { RoutingService } from '../services/routingService';

function createMockSupabase() {
  const rpcCalls: Array<{ fn: string; args: any }> = [];
  const client = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(async () => ({ data: { id: 'driver-1', wallet_balance: 10000, total_deliveries: 5 }, error: null })),
        })),
      })),
      update: jest.fn(() => ({ eq: jest.fn(async () => ({ data: null, error: null })) })),
      insert: jest.fn(async () => ({ data: null, error: null })),
    })),
    rpc: jest.fn(async (fn: string, args: any) => {
      rpcCalls.push({ fn, args });
      return { data: null, error: null };
    }),
    getRpcCalls: () => rpcCalls,
  };
  return client as any;
}

describe('Atomic wallet update', () => {
  it('should use rpc increment instead of read-increment-write for wallet', async () => {
    const mockSupabase = createMockSupabase();
    const orderService = new OrderService(
      new PaymentService(),
      new NotificationService(),
      new TimeoutService(),
      new DriverMatchingService(),
      new RoutingService(),
      null as any,
    );
    orderService.setSupabaseMock(mockSupabase);

    await (orderService as any).creditWallet('driver-1', 'driver', 5000);

    const walletRpc = mockSupabase.getRpcCalls().find((c: any) => c.fn === 'increment_wallet_balance');
    expect(walletRpc).toBeDefined();
    expect(walletRpc.args).toEqual({ p_user_id: 'driver-1', p_amount: 5000 });
  });

  it('should use rpc increment for total_deliveries', async () => {
    const mockSupabase = createMockSupabase();
    const orderService = new OrderService(
      new PaymentService(),
      new NotificationService(),
      new TimeoutService(),
      new DriverMatchingService(),
      new RoutingService(),
      null as any,
    );
    orderService.setSupabaseMock(mockSupabase);

    await (orderService as any).creditDriverStats('driver-1', 5000);

    const deliveryRpc = mockSupabase.getRpcCalls().find((c: any) => c.fn === 'increment_driver_deliveries');
    expect(deliveryRpc).toBeDefined();
    expect(deliveryRpc.args).toEqual({ p_driver_id: 'driver-1' });
  });
});
