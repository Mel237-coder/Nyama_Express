import crypto from 'crypto';
import { PaymentService } from '../services/paymentService';

const WEBHOOK_SECRET = 'test-webhook-secret';

function signPayload(payload: Record<string, any>): string {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

function createMockSupabase(rows: Record<string, any[]>) {
  const tableData = { ...rows };
  const tableChains: Record<string, any> = {};

  function getChain(table: string) {
    if (!tableChains[table]) {
      tableChains[table] = {
        select: jest.fn(() => tableChains[table].selectChain),
        insert: jest.fn(async () => ({ data: null, error: null })),
        update: jest.fn(() => tableChains[table]),
        delete: jest.fn(() => tableChains[table]),
        eq: jest.fn(async () => ({ data: null, error: null })),
        single: jest.fn(async () => {
          // Default single for any select chain; overridden below for payment_transactions
          return { data: null, error: { message: 'not found' } };
        }),
      };
      tableChains[table].selectChain = {
        eq: jest.fn((col: string, val: any) => ({
          single: jest.fn(async () => {
            const row = tableData[table]?.find((r: any) => r[col] === val);
            return { data: row || null, error: row ? null : { message: 'not found' } };
          }),
        })),
      };
    }
    return tableChains[table];
  }

  const client = {
    from: jest.fn((table: string) => getChain(table)),
  };

  return { client, tableChains } as any;
}

describe('handlePaymentWebhook status mapping', () => {
  beforeEach(() => {
    process.env.CAMPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  afterEach(() => {
    delete process.env.CAMPAY_WEBHOOK_SECRET;
  });

  it('should set order.payment_status to partial when upfront payment succeeds', async () => {
    const payload = { external_reference: 'order-1-upfront', status: 'SUCCESSFUL' };
    const signature = signPayload(payload);

    const mockSupabase = createMockSupabase({
      payment_transactions: [
        { id: 'tx-1', external_reference: 'order-1-upfront', order_id: 'order-1', type: 'upfront' }
      ]
    });
    const paymentService = new PaymentService();
    paymentService.setSupabaseMock(mockSupabase.client);
    await paymentService.handlePaymentWebhook(payload, signature);

    const ordersChain = mockSupabase.tableChains['orders'];
    expect(ordersChain.update).toHaveBeenCalledWith({ payment_status: 'partial' });
  });

  it('should set order.payment_status to completed when delivery payment succeeds', async () => {
    const payload = { external_reference: 'order-1-delivery', status: 'SUCCESSFUL' };
    const signature = signPayload(payload);

    const mockSupabase = createMockSupabase({
      payment_transactions: [
        { id: 'tx-2', external_reference: 'order-1-delivery', order_id: 'order-1', type: 'delivery' }
      ]
    });
    const paymentService = new PaymentService();
    paymentService.setSupabaseMock(mockSupabase.client);
    await paymentService.handlePaymentWebhook(payload, signature);

    const ordersChain = mockSupabase.tableChains['orders'];
    expect(ordersChain.update).toHaveBeenCalledWith({ payment_status: 'completed' });
  });
});
