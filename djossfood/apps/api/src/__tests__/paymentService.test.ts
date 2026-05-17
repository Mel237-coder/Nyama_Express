import axios from 'axios';
import { PaymentService } from '../services/paymentService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * Create a mock Supabase client that properly handles all chaining patterns.
 *
 * Supabase chaining patterns used in the implementation:
 *   1. .from('table').insert({...})                          -> thenable
 *   2. .from('table').select('*').eq('col', 'val').single()  -> thenable
 *   3. .from('table').update({...}).eq('col', 'val')         -> thenable
 */
function createMockSupabase() {
  // Per-table configuration for resolved values
  const tableConfigs: Record<string, any> = {};
  // Track all chain objects created during execution for assertions
  const chains: Record<string, any[]> = {};

  function getOrCreateTable(table: string) {
    if (!tableConfigs[table]) {
      tableConfigs[table] = {
        singleResult: { data: null, error: null },
        eqResults: [] as any[],
        insertResult: { data: {}, error: null },
      };
    }
    return tableConfigs[table];
  }

  // Chain builder: configure expectations per table
  const setupChain = (table: string) => ({
    forSelect() {
      return {
        withSingleResult(result: any) {
          getOrCreateTable(table).singleResult = result;
          return setupChain(table);
        },
      };
    },
    forUpdate(_data: any) {
      return {
        withEqResult(result: any) {
          getOrCreateTable(table).eqResults.push(result);
          return setupChain(table);
        },
      };
    },
  });

  // Create a thenable that also has .single() method
  function createThenable(value: any, config: any) {
    const promise = Promise.resolve(value);
    const thenable: any = {
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally?.bind(promise),
    };
    thenable.single = jest.fn(() => createThenable(config.singleResult, config));
    return thenable;
  }

  // The actual mock client - from() creates real chains we can inspect later
  const from = jest.fn((table: string) => {
    const config = getOrCreateTable(table);
    let eqCallIndex = 0;

    const chain: any = {
      select: jest.fn(() => chain),
      insert: jest.fn(() => createThenable(config.insertResult, config)),
      update: jest.fn(() => chain),
      delete: jest.fn(() => chain),
      eq: jest.fn(() => {
        const result = config.eqResults[eqCallIndex] || { data: {}, error: null };
        eqCallIndex++;
        return createThenable(result, config);
      }),
      single: jest.fn(() => createThenable(config.singleResult, config)),
    };

    // Track this chain for later assertions
    if (!chains[table]) chains[table] = [];
    chains[table].push(chain);

    return chain;
  });

  // Helper to get the last chain created for a given table
  const getLastChain = (table: string) => {
    const tableChains = chains[table] || [];
    return tableChains[tableChains.length - 1] || null;
  };

  return {
    client: { from },
    setupChain,
    configs: tableConfigs,
    chains,
    getLastChain,
  };
}

describe('PaymentService', () => {
  let service: PaymentService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentService();
    mockSupabase = createMockSupabase();
    service.setSupabaseMock(mockSupabase.client as any);

    // Set required env vars for getToken
    process.env.CAMPAY_USERNAME = 'test-user';
    process.env.CAMPAY_PASSWORD = 'test-pass';
  });

  afterEach(() => {
    delete process.env.CAMPAY_USERNAME;
    delete process.env.CAMPAY_PASSWORD;
  });

  // ─── initiatePayment ─────────────────────────────────────────────────────

  describe('initiatePayment', () => {
    const validParams = {
      phoneNumber: '+237612345678',
      amount: 5000,
      description: 'Order #1234',
      externalReference: 'order-1234',
    };

    it('should initiate Orange Money payment successfully', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: { token: 'test-campay-token' } })
        .mockResolvedValueOnce({ data: { reference: 'CPY-12345', status: 'PENDING' } });

      const result = await service.initiatePayment({
        ...validParams,
        provider: 'orange_money' as any,
      });

      expect(result.success).toBe(true);
      expect(result.reference).toBe('CPY-12345');
      expect(result.message).toContain('PENDING');

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      const collectCall = mockedAxios.post.mock.calls[1];
      expect(collectCall[0]).toContain('/collect/');
      expect(collectCall[1]).toMatchObject({
        amount: 5000,
        currency: 'XAF',
        from: '237612345678',
        description: 'Order #1234',
        external_reference: 'order-1234',
      });
    });

    it('should initiate MTN Mobile Money payment successfully', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: { token: 'test-campay-token' } })
        .mockResolvedValueOnce({ data: { reference: 'CPY-67890', status: 'PENDING' } });

      const result = await service.initiatePayment({
        ...validParams,
        provider: 'mtn_momo' as any,
      });

      expect(result.success).toBe(true);
      expect(result.reference).toBe('CPY-67890');
    });

    it('should return failure when payment API returns error', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: { token: 'test-campay-token' } })
        .mockRejectedValueOnce(new Error('Payment gateway error'));

      const result = await service.initiatePayment(validParams);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/error/i);
    });

    it('should validate phone number format (+2376XXXXXXXX required)', async () => {
      const invalidPhones = ['612345678', '+1234567890', '+23751234567', '+23761234'];

      for (const phone of invalidPhones) {
        const result = await service.initiatePayment({
          ...validParams,
          phoneNumber: phone,
        });
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/phone/i);
      }
    });

    it('should validate amount is positive integer (FCFA)', async () => {
      const invalidAmounts = [-100, 0, 50.5, NaN];

      for (const amount of invalidAmounts) {
        const result = await service.initiatePayment({
          ...validParams,
          amount,
        });
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/amount/i);
      }
    });

    it('should strip + from phone number for Campay API', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: { token: 'test-campay-token' } })
        .mockResolvedValueOnce({ data: { reference: 'CPY-STRIP', status: 'PENDING' } });

      await service.initiatePayment(validParams);

      const collectCall = mockedAxios.post.mock.calls[1];
      const body = collectCall[1] as any;
      expect(body.from).toBe('237612345678');
      expect(body.from).not.toContain('+');
    });

    it('should log transaction to payment_transactions table', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: { token: 'test-campay-token' } })
        .mockResolvedValueOnce({ data: { reference: 'CPY-LOG', status: 'PENDING' } });

      await service.initiatePayment(validParams);

      expect(mockSupabase.client.from).toHaveBeenCalledWith('payment_transactions');
    });
  });

  // ─── handlePaymentWebhook ─────────────────────────────────────────────────

  describe('handlePaymentWebhook', () => {
    it('should process successful payment webhook', async () => {
      const payload = {
        external_reference: 'order-1234',
        status: 'SUCCESSFUL',
        reference: 'CPY-12345',
      };

      mockSupabase.setupChain('payment_transactions')
        .forSelect()
        .withSingleResult({
          data: {
            id: 'txn-1',
            external_reference: 'order-1234',
            order_id: 'order-abc',
            status: 'pending',
          },
          error: null,
        });

      mockSupabase.setupChain('payment_transactions')
        .forUpdate({ status: 'successful' })
        .withEqResult({ data: {}, error: null });

      mockSupabase.setupChain('orders')
        .forUpdate({ payment_status: 'partial' })
        .withEqResult({ data: {}, error: null });

      const result = await service.handlePaymentWebhook(payload);

      expect(result.success).toBe(true);
      expect(mockSupabase.client.from).toHaveBeenCalledWith('payment_transactions');
      expect(mockSupabase.client.from).toHaveBeenCalledWith('orders');
    });

    it('should update order payment_status to partial on upfront success', async () => {
      const payload = {
        external_reference: 'order-5678',
        status: 'SUCCESSFUL',
        reference: 'CPY-99999',
      };

      mockSupabase.setupChain('payment_transactions')
        .forSelect()
        .withSingleResult({
          data: {
            id: 'txn-2',
            external_reference: 'order-5678',
            order_id: 'order-def',
            status: 'pending',
          },
          error: null,
        });

      mockSupabase.setupChain('payment_transactions')
        .forUpdate({ status: 'successful' })
        .withEqResult({ data: {}, error: null });

      mockSupabase.setupChain('orders')
        .forUpdate({ payment_status: 'partial' })
        .withEqResult({ data: {}, error: null });

      const result = await service.handlePaymentWebhook(payload);

      expect(result.success).toBe(true);

      // Find the orders chain that was created during execution
      const ordersChains = mockSupabase.chains['orders'] || [];
      const ordersUpdateChain = ordersChains.find((c: any) => c.update.mock.calls.length > 0);
      expect(ordersUpdateChain).toBeDefined();
      expect(ordersUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ payment_status: 'partial' }),
      );
    });

    it('should update order payment_status to failed on payment failure', async () => {
      const payload = {
        external_reference: 'order-fail',
        status: 'FAILED',
        reference: 'CPY-FAIL',
      };

      mockSupabase.setupChain('payment_transactions')
        .forSelect()
        .withSingleResult({
          data: {
            id: 'txn-3',
            external_reference: 'order-fail',
            order_id: 'order-ghi',
            status: 'pending',
          },
          error: null,
        });

      mockSupabase.setupChain('payment_transactions')
        .forUpdate({ status: 'failed' })
        .withEqResult({ data: {}, error: null });

      mockSupabase.setupChain('orders')
        .forUpdate({ payment_status: 'failed' })
        .withEqResult({ data: {}, error: null });

      const result = await service.handlePaymentWebhook(payload);

      expect(result.success).toBe(true);

      // Find the orders chain that was created during execution
      const ordersChains = mockSupabase.chains['orders'] || [];
      const ordersUpdateChain = ordersChains.find((c: any) => c.update.mock.calls.length > 0);
      expect(ordersUpdateChain).toBeDefined();
      expect(ordersUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ payment_status: 'failed' }),
      );
    });

    it('should return failure when transaction not found', async () => {
      const payload = {
        external_reference: 'order-nonexistent',
        status: 'SUCCESSFUL',
        reference: 'CPY-NOPE',
      };

      mockSupabase.setupChain('payment_transactions')
        .forSelect()
        .withSingleResult({
          data: null,
          error: { message: 'Not found' },
        });

      const result = await service.handlePaymentWebhook(payload);

      expect(result.success).toBe(false);
    });
  });

  // ─── refundPayment ────────────────────────────────────────────────────────

  describe('refundPayment', () => {
    it('should initiate refund and update transaction status', async () => {
      mockSupabase.setupChain('payment_transactions')
        .forSelect()
        .withSingleResult({
          data: {
            id: 'txn-refund-1',
            reference: 'CPY-REF',
            amount: 3000,
            phone_number: '+237612345678',
            status: 'successful',
          },
          error: null,
        });

      mockSupabase.setupChain('payment_transactions')
        .forUpdate({ status: 'refunded' })
        .withEqResult({ data: {}, error: null });

      // getToken call + refund API call
      mockedAxios.post
        .mockResolvedValueOnce({ data: { token: 'test-campay-token' } })
        .mockResolvedValueOnce({ data: { status: 'REFUNDED', reference: 'CPY-REF-1' } });

      const result = await service.refundPayment('txn-refund-1');

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalled();
      const refundCall = mockedAxios.post.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('/refund/'),
      );
      expect(refundCall).toBeDefined();
    });

    it('should return false when refund fails', async () => {
      mockSupabase.setupChain('payment_transactions')
        .forSelect()
        .withSingleResult({
          data: {
            id: 'txn-refund-2',
            reference: 'CPY-REF-FAIL',
            amount: 3000,
            phone_number: '+237612345678',
            status: 'successful',
          },
          error: null,
        });

      mockSupabase.setupChain('payment_transactions')
        .forUpdate({ status: 'failed' })
        .withEqResult({ data: {}, error: null });

      // getToken call succeeds, refund API call fails
      mockedAxios.post
        .mockResolvedValueOnce({ data: { token: 'test-campay-token' } })
        .mockRejectedValueOnce(new Error('Refund failed'));

      const result = await service.refundPayment('txn-refund-2');

      expect(result).toBe(false);
    });

    it('should return false when transaction not found', async () => {
      mockSupabase.setupChain('payment_transactions')
        .forSelect()
        .withSingleResult({
          data: null,
          error: { message: 'Not found' },
        });

      const result = await service.refundPayment('nonexistent-txn');

      expect(result).toBe(false);
    });
  });
});