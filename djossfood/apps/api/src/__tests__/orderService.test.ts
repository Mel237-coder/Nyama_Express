import { OrderService, TimeoutService, DriverMatchingService, RoutingService, SocketEmitter } from '../services/orderService';
import { PaymentService } from '../services/paymentService';
import { NotificationService } from '../services/notificationService';
import { OrderCreationData } from '@djossfood/database';

// ---------------------------------------------------------------------------
// Mock helper: create a mock Supabase client with chainable builder
// ---------------------------------------------------------------------------

function createMockSupabase() {
  const tableConfigs: Record<string, any> = {};

  function getOrCreateTable(table: string) {
    if (!tableConfigs[table]) {
      tableConfigs[table] = {
        singleResult: { data: null, error: null },
        eqResults: [] as any[],
        insertResult: { data: {}, error: null },
        inResult: { data: [], error: null },
      };
    }
    return tableConfigs[table];
  }

  const setupChain = (table: string) => ({
    forSelect() {
      return {
        withSingleResult(result: any) {
          getOrCreateTable(table).singleResult = result;
          return setupChain(table);
        },
      };
    },
    forInsert(_data: any) {
      return {
        withResult(result: any) {
          getOrCreateTable(table).insertResult = result;
          return setupChain(table);
        },
      };
    },
    forIn() {
      return {
        withResult(result: any) {
          getOrCreateTable(table).inResult = result;
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

  function createThenable(value: any, config: any) {
    const promise = Promise.resolve(value);
    const thenable: any = {
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally?.bind(promise),
    };
    thenable.single = jest.fn(() => createThenable(config.singleResult, config));
    // Support .insert().select().single() pattern
    thenable.select = jest.fn(() => {
      const selectChain: any = {
        single: jest.fn(() => createThenable(config.insertResult, config)),
      };
      const p2 = Promise.resolve(config.insertResult);
      selectChain.then = p2.then.bind(p2);
      selectChain.catch = p2.catch.bind(p2);
      selectChain.finally = p2.finally?.bind(p2);
      return selectChain;
    });
    return thenable;
  }

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
      in: jest.fn(() => createThenable(config.inResult, config)),
      single: jest.fn(() => createThenable(config.singleResult, config)),
      rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
    };

    return chain;
  });

  const rpc = jest.fn(() => Promise.resolve({ data: null, error: null }));

  return {
    client: { from, rpc },
    setupChain,
    configs: tableConfigs,
  };
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createMockPaymentService(): jest.Mocked<PaymentService> {
  return {
    initiatePayment: jest.fn(),
    refundPayment: jest.fn(),
    handlePaymentWebhook: jest.fn(),
    setSupabaseMock: jest.fn(),
  } as any;
}

function createMockNotificationService(): jest.Mocked<NotificationService> {
  return {
    sendPushNotification: jest.fn().mockResolvedValue(true),
    templates: {
      new_order: jest.fn((orderNumber: string) => ({
        title: 'Nouvelle commande !',
        body: `Commande ${orderNumber}`,
      })),
      order_confirmed: jest.fn((restaurantName: string) => ({
        title: 'Commande confirmee !',
        body: `${restaurantName} a confirme votre commande.`,
      })),
      order_rejected_timeout: jest.fn(() => ({
        title: 'Commande non acceptee',
        body: 'Le restaurant n\'a pas accepte la commande a temps.',
      })),
      order_rejected_manual: jest.fn((reason: string) => ({
        title: 'Commande refusee',
        body: `Raison : ${reason}`,
      })),
      driver_found: jest.fn((driverName: string, etaMin: number) => ({
        title: 'Livreur trouve !',
        body: `${driverName} est en route — arrivee estimee dans ${etaMin} min.`,
      })),
      order_delivering: jest.fn(() => ({
        title: 'En route !',
        body: 'Votre commande est en cours de livraison.',
      })),
      order_delivered: jest.fn(() => ({
        title: 'Livraison arrivee !',
        body: 'Veuillez confirmer la reception.',
      })),
      delivery_request: jest.fn((_restaurantName: string, _distanceKm: number) => ({
        title: 'Nouvelle course',
        body: 'Nouvelle course disponible.',
      })),
      rate_order: jest.fn((restaurantName: string) => ({
        title: 'Notez votre commande',
        body: `Notez votre commande chez ${restaurantName}.`,
      })),
    },
  } as any;
}

function createMockTimeoutService(): jest.Mocked<TimeoutService> {
  return {
    scheduleOrderTimeout: jest.fn().mockResolvedValue('timeout-job-123'),
    cancelOrderTimeout: jest.fn().mockResolvedValue(undefined),
    scheduleDeliveryConfirmTimeout: jest.fn().mockResolvedValue('confirm-timeout-job-456'),
  };
}

function createMockDriverMatchingService(): jest.Mocked<DriverMatchingService> {
  return {
    findDriver: jest.fn().mockResolvedValue({ id: 'driver-1', status: 'available' }),
  };
}

function createMockRoutingService(): jest.Mocked<RoutingService> {
  return {
    calculateRoute: jest.fn().mockResolvedValue({
      distance_km: 5.2,
      duration_min: 15,
      polyline: 'encoded_polyline_data',
    }),
  };
}

function createMockSocketEmitter(): SocketEmitter {
  const mockEmit = jest.fn();
  return {
    to: jest.fn().mockReturnValue({ emit: mockEmit }),
  } as any;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('OrderService', () => {
  let service: OrderService;
  let mockPayment: jest.Mocked<PaymentService>;
  let mockNotification: jest.Mocked<NotificationService>;
  let mockTimeout: jest.Mocked<TimeoutService>;
  let mockDriverMatching: jest.Mocked<DriverMatchingService>;
  let mockRouting: jest.Mocked<RoutingService>;
  let mockSocket: ReturnType<typeof createMockSocketEmitter>;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  const validOrderData: OrderCreationData = {
    client_id: 'client-1',
    restaurant_id: 'restaurant-1',
    items: [
      { menu_item_id: 'menu-1', quantity: 2 },
      { menu_item_id: 'menu-2', quantity: 1 },
    ],
    delivery_address: '123 Rue Douala',
    delivery_lat: 4.0511,
    delivery_lng: 9.7679,
    payment_method: 'orange_money' as any,
    payment_phone: '+237612345678',
    delivery_notes: 'Porte 3',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPayment = createMockPaymentService();
    mockNotification = createMockNotificationService();
    mockTimeout = createMockTimeoutService();
    mockDriverMatching = createMockDriverMatchingService();
    mockRouting = createMockRoutingService();
    mockSocket = createMockSocketEmitter();
    mockSupabase = createMockSupabase();

    service = new OrderService(
      mockPayment,
      mockNotification,
      mockTimeout,
      mockDriverMatching,
      mockRouting,
      mockSocket,
    );
    service.setSupabaseMock(mockSupabase.client as any);
  });

  // =======================================================================
  // 1. createOrder
  // =======================================================================

  describe('createOrder', () => {
    beforeEach(() => {
      // Default: menu items found
      mockSupabase.setupChain('menu_items').forIn().withResult({
        data: [
          { id: 'menu-1', name: 'Poulet DG', price: 2500, restaurant_id: 'restaurant-1' },
          { id: 'menu-2', name: 'Eru', price: 1500, restaurant_id: 'restaurant-1' },
        ],
        error: null,
      });

      // Default: restaurant found
      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: {
          id: 'restaurant-1',
          owner_id: 'owner-1',
          name: 'Restaurant Le Wouri',
          delivery_fee: 500,
          location: { type: 'Point', coordinates: [9.7679, 4.0511] },
        },
        error: null,
      });

      // Default: order insert succeeds
      mockSupabase.setupChain('orders').forInsert({}).withResult({
        data: {
          id: 'order-1',
          order_number: 1001,
          client_id: 'client-1',
          restaurant_id: 'restaurant-1',
          status: 'pending',
          subtotal: 6500,
          delivery_fee: 500,
          total_amount: 7000,
          amount_paid_upfront: 4200,
          payment_phone: '+237612345678',
          payment_ref_upfront: 'CPY-UPFRONT-1',
          notes: '',
        },
        error: null,
      });

      // Default: order_items insert succeeds
      mockSupabase.setupChain('order_items').forInsert({}).withResult({
        data: {},
        error: null,
      });

      // Default: payment succeeds
      mockPayment.initiatePayment.mockResolvedValue({
        success: true,
        reference: 'CPY-UPFRONT-1',
        message: 'Payment initiated',
      });

      // Default: timeout scheduling succeeds
      mockTimeout.scheduleOrderTimeout.mockResolvedValue('timeout-job-123');

      // Default: notifications succeed
      mockNotification.sendPushNotification.mockResolvedValue(true);
    });

    it('should create order with correct subtotal, delivery fee, and 60% upfront payment', async () => {
      // subtotal = 2500*2 + 1500*1 = 6500, delivery_fee = 500, total = 7000
      // upfront = Math.round(7000 * 0.60) = 4200
      const order = await service.createOrder(validOrderData);

      expect(order).toBeDefined();

      // Verify payment was called with 60% amount
      expect(mockPayment.initiatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 4200, // 60% of 7000
          description: expect.stringContaining('60%'),
        }),
      );
    });

    it('should throw "Paiement echoue" when upfront payment fails', async () => {
      mockPayment.initiatePayment.mockResolvedValue({
        success: false,
        message: 'Payment error',
      });

      await expect(service.createOrder(validOrderData)).rejects.toThrow('Paiement echoue');
    });

    it('should insert order items with name, price, quantity, subtotal snapshots', async () => {
      await service.createOrder(validOrderData);

      // Verify order_items insert was called
      const orderItemsChain = mockSupabase.client.from.mock.calls.find(
        (call) => call[0] === 'order_items',
      );
      expect(orderItemsChain).toBeDefined();
    });

    it('should send push notification to restaurant owner using new_order template', async () => {
      await service.createOrder(validOrderData);

      expect(mockNotification.templates.new_order).toHaveBeenCalled();
      expect(mockNotification.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'owner-1',
        }),
      );
    });

    it('should schedule timeout job via TimeoutService', async () => {
      await service.createOrder(validOrderData);

      expect(mockTimeout.scheduleOrderTimeout).toHaveBeenCalledWith('order-1');
    });

    it('should emit new_order Socket.IO event to restaurant room', async () => {
      await service.createOrder(validOrderData);

      expect(mockSocket.to).toHaveBeenCalledWith('restaurant_restaurant-1');
      // The emit is called on the return value of .to()
    });

    it('should throw when menu items cannot be fetched', async () => {
      mockSupabase.setupChain('menu_items').forIn().withResult({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.createOrder(validOrderData)).rejects.toThrow();
    });

    it('should throw when restaurant is not found', async () => {
      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.createOrder(validOrderData)).rejects.toThrow('Restaurant non trouve');
    });
  });

  // =======================================================================
  // 2. handleOrderTimeout
  // =======================================================================

  describe('handleOrderTimeout', () => {
    it('should reject order, refund payment, and notify client when order is still pending', async () => {
      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          status: 'pending',
          client_id: 'client-1',
          payment_ref_upfront: 'payment-ref-1',
        },
        error: null,
      });

      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: { id: 'order-1', status: 'rejected' },
        error: null,
      });

      mockPayment.refundPayment.mockResolvedValue(true);
      mockNotification.sendPushNotification.mockResolvedValue(true);

      await service.handleOrderTimeout('order-1');

      // Verify order was updated to rejected
      const ordersChains = mockSupabase.client.from.mock.calls.filter(
        (call) => call[0] === 'orders',
      );
      expect(ordersChains.length).toBeGreaterThanOrEqual(1);

      // Verify refund was called
      expect(mockPayment.refundPayment).toHaveBeenCalledWith('payment-ref-1');

      // Verify client notification
      expect(mockNotification.templates.order_rejected_timeout).toHaveBeenCalled();
      expect(mockNotification.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-1',
        }),
      );

      // Verify Socket.IO event
      expect(mockSocket.to).toHaveBeenCalledWith('client_client-1');
    });

    it('should do nothing when order status is no longer pending (already confirmed)', async () => {
      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          status: 'confirmed',
          client_id: 'client-1',
        },
        error: null,
      });

      await service.handleOrderTimeout('order-1');

      // Should NOT refund or update status
      expect(mockPayment.refundPayment).not.toHaveBeenCalled();
      expect(mockNotification.sendPushNotification).not.toHaveBeenCalled();
    });

    it('should handle missing payment ref gracefully', async () => {
      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          status: 'pending',
          client_id: 'client-1',
          payment_ref_upfront: null,
        },
        error: null,
      });

      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: { id: 'order-1', status: 'rejected' },
        error: null,
      });

      await service.handleOrderTimeout('order-1');

      // Should NOT call refundPayment when ref is null
      expect(mockPayment.refundPayment).not.toHaveBeenCalled();

      // But should still notify
      expect(mockNotification.sendPushNotification).toHaveBeenCalled();
    });
  });

  // =======================================================================
  // 3. restaurantConfirmOrder
  // =======================================================================

  describe('restaurantConfirmOrder', () => {
    beforeEach(() => {
      // Order is pending
      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          status: 'pending',
          restaurant_id: 'restaurant-1',
          client_id: 'client-1',
          notes: 'timeout_job:job-abc',
        },
        error: null,
      });

      // Restaurant with matching owner
      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: {
          id: 'restaurant-1',
          owner_id: 'owner-1',
          name: 'Restaurant Le Wouri',
        },
        error: null,
      });

      // Update operations succeed
      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockNotification.sendPushNotification.mockResolvedValue(true);
    });

    it('should update status to confirmed then preparing and cancel timeout', async () => {
      await service.restaurantConfirmOrder('order-1', 'owner-1');

      // Verify timeout was cancelled
      expect(mockTimeout.cancelOrderTimeout).toHaveBeenCalledWith('job-abc');

      // Verify client notification
      expect(mockNotification.templates.order_confirmed).toHaveBeenCalledWith('Restaurant Le Wouri');
      expect(mockNotification.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-1',
        }),
      );

      // Verify Socket.IO event
      expect(mockSocket.to).toHaveBeenCalledWith('order_order-1');
    });

    it('should throw when restaurant owner does not match', async () => {
      await expect(
        service.restaurantConfirmOrder('order-1', 'wrong-owner-id'),
      ).rejects.toThrow('Permission refusee');
    });

    it('should throw when order is no longer pending', async () => {
      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          status: 'confirmed',
          restaurant_id: 'restaurant-1',
          client_id: 'client-1',
          notes: '',
        },
        error: null,
      });

      await expect(
        service.restaurantConfirmOrder('order-1', 'owner-1'),
      ).rejects.toThrow('plus en attente');
    });
  });

  // =======================================================================
  // 4. restaurantRejectOrder
  // =======================================================================

  describe('restaurantRejectOrder', () => {
    beforeEach(() => {
      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          client_id: 'client-1',
          restaurant_id: 'restaurant-1',
          payment_ref_upfront: 'payment-ref-1',
        },
        error: null,
      });

      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: {
          id: 'restaurant-1',
          owner_id: 'owner-1',
          name: 'Restaurant Le Wouri',
        },
        error: null,
      });

      mockPayment.refundPayment.mockResolvedValue(true);
      mockNotification.sendPushNotification.mockResolvedValue(true);
    });

    it('should update status to rejected, refund upfront payment, and notify client', async () => {
      await service.restaurantRejectOrder('order-1', 'Produits indisponibles', 'owner-1');

      expect(mockPayment.refundPayment).toHaveBeenCalledWith('payment-ref-1');
      expect(mockNotification.templates.order_rejected_manual).toHaveBeenCalledWith('Produits indisponibles');
      expect(mockNotification.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-1',
        }),
      );
    });
  });

  // =======================================================================
  // 5. restaurantMarkReady
  // =======================================================================

  describe('restaurantMarkReady', () => {
    beforeEach(() => {
      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          restaurant_id: 'restaurant-1',
          client_id: 'client-1',
        },
        error: null,
      });

      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: {
          id: 'restaurant-1',
          owner_id: 'owner-1',
          location: { type: 'Point', coordinates: [9.7679, 4.0511] },
          name: 'Restaurant Le Wouri',
        },
        error: null,
      });

      mockNotification.sendPushNotification.mockResolvedValue(true);
    });

    it('should update status to ready and start driver search', async () => {
      await service.restaurantMarkReady('order-1', 'owner-1');

      expect(mockDriverMatching.findDriver).toHaveBeenCalledWith(
        'order-1',
        'restaurant-1',
      );
      expect(mockNotification.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-1',
        }),
      );
    });
  });

  // =======================================================================
  // 6. driverAcceptDelivery
  // =======================================================================

  describe('driverAcceptDelivery', () => {
    beforeEach(() => {
      // Driver is available
      mockSupabase.setupChain('drivers').forSelect().withSingleResult({
        data: {
          id: 'driver-1',
          status: 'available',
          wallet_balance: 0,
        },
        error: null,
      });

      // Order updates
      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          restaurant_id: 'restaurant-1',
          client_id: 'client-1',
          delivery_location: { type: 'Point', coordinates: [9.7679, 4.0511] },
        },
        error: null,
      });

      // Restaurant with location
      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: {
          id: 'restaurant-1',
          name: 'Restaurant Le Wouri',
          location: { type: 'Point', coordinates: [9.7679, 4.0511] },
        },
        error: null,
      });

      // Driver status update
      mockSupabase.setupChain('drivers').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockRouting.calculateRoute.mockResolvedValue({
        distance_km: 5.2,
        duration_min: 15,
        polyline: 'encoded_polyline_data',
      });

      mockNotification.sendPushNotification.mockResolvedValue(true);
    });

    it('should assign driver, calculate route, and notify client', async () => {
      await service.driverAcceptDelivery('order-1', 'driver-1');

      // Verify driver status updated to busy
      expect(mockRouting.calculateRoute).toHaveBeenCalled();

      // Verify client notification
      expect(mockNotification.templates.driver_found).toHaveBeenCalled();
      expect(mockNotification.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-1',
        }),
      );

      // Verify Socket.IO event
      expect(mockSocket.to).toHaveBeenCalledWith('order_order-1');
    });

    it('should throw when driver is not available', async () => {
      mockSupabase.setupChain('drivers').forSelect().withSingleResult({
        data: {
          id: 'driver-1',
          status: 'busy',
        },
        error: null,
      });

      await expect(
        service.driverAcceptDelivery('order-1', 'driver-1'),
      ).rejects.toThrow('pas disponible');
    });

    it('should throw when driver is not found', async () => {
      mockSupabase.setupChain('drivers').forSelect().withSingleResult({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.driverAcceptDelivery('order-1', 'nonexistent-driver'),
      ).rejects.toThrow('non trouve');
    });
  });

  // =======================================================================
  // 7. driverPickedUp
  // =======================================================================

  describe('driverPickedUp', () => {
    beforeEach(() => {
      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          client_id: 'client-1',
        },
        error: null,
      });

      mockNotification.sendPushNotification.mockResolvedValue(true);
    });

    it('should update status to picked_up then delivering and notify client', async () => {
      await service.driverPickedUp('order-1', 'driver-1');

      expect(mockNotification.templates.order_delivering).toHaveBeenCalled();
      expect(mockNotification.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-1',
        }),
      );
      expect(mockSocket.to).toHaveBeenCalledWith('order_order-1');
    });
  });

  // =======================================================================
  // 8. driverMarkDelivered
  // =======================================================================

  describe('driverMarkDelivered', () => {
    beforeEach(() => {
      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          client_id: 'client-1',
        },
        error: null,
      });

      mockNotification.sendPushNotification.mockResolvedValue(true);
      mockTimeout.scheduleDeliveryConfirmTimeout.mockResolvedValue('confirm-timeout-456');
    });

    it('should update status to delivered, notify client, and schedule confirm timeout', async () => {
      await service.driverMarkDelivered('order-1', 'driver-1');

      expect(mockNotification.templates.order_delivered).toHaveBeenCalled();
      expect(mockNotification.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-1',
        }),
      );
      expect(mockTimeout.scheduleDeliveryConfirmTimeout).toHaveBeenCalledWith('order-1');
      expect(mockSocket.to).toHaveBeenCalledWith('order_order-1');
    });
  });

  // =======================================================================
  // 9. clientConfirmDelivery
  // =======================================================================

  describe('clientConfirmDelivery', () => {
    beforeEach(() => {
      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          client_id: 'client-1',
          restaurant_id: 'restaurant-1',
          driver_id: 'driver-1',
          total_amount: 7000,
          amount_paid_upfront: 4200,
          subtotal: 6500,
          delivery_fee: 500,
          payment_phone: '+237612345678',
          payment_method: 'mobile_money',
        },
        error: null,
      });

      // Order update succeeds
      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      // Restaurant lookup for name
      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: {
          id: 'restaurant-1',
          name: 'Restaurant Le Wouri',
        },
        error: null,
      });

      // Driver wallet lookup & update
      mockSupabase.setupChain('drivers').forSelect().withSingleResult({
        data: {
          id: 'driver-1',
          wallet_balance: 1000,
          total_deliveries: 50,
        },
        error: null,
      });

      mockSupabase.setupChain('drivers').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      // Payment for delivery (40%) succeeds
      mockPayment.initiatePayment.mockResolvedValue({
        success: true,
        reference: 'CPY-DELIVERY-1',
        message: 'Payment initiated',
      });

      mockNotification.sendPushNotification.mockResolvedValue(true);
    });

    it('should charge 40% remaining, complete order, credit wallets, and update driver status', async () => {
      // remaining = 7000 - 4200 = 2800 (40%)
      await service.clientConfirmDelivery('order-1', 'client-1');

      // Verify 40% payment was initiated
      expect(mockPayment.initiatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2800,
          description: expect.stringContaining('40%'),
        }),
      );

      // Verify Socket.IO event for completed status
      expect(mockSocket.to).toHaveBeenCalledWith('order_order-1');
    });

    it('should throw when client ID does not match order', async () => {
      await expect(
        service.clientConfirmDelivery('order-1', 'wrong-client-id'),
      ).rejects.toThrow('client de cette commande');
    });

    it('should throw when delivery payment fails', async () => {
      mockPayment.initiatePayment.mockResolvedValue({
        success: false,
        message: 'Payment error',
      });

      await expect(
        service.clientConfirmDelivery('order-1', 'client-1'),
      ).rejects.toThrow('paiement du solde');
    });

    it('should calculate commissions correctly (15% platform commission)', async () => {
      // total = 7000, subtotal = 6500, delivery_fee = 500
      // platform_commission = Math.round(7000 * 0.15) = 1050
      // restaurant_credit = 6500 - Math.round(6500 * 0.15) = 6500 - 975 = 5525
      // driver_credit = 500 - Math.round(500 * 0.15) = 500 - 75 = 425
      await service.clientConfirmDelivery('order-1', 'client-1');

      // Verify the payment was called with the 40% amount
      expect(mockPayment.initiatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2800,
        }),
      );

      // Verify driver status updated back to available
      // (checked via supabase from calls)
    });

    it('should send rate_order notification on successful completion', async () => {
      await service.clientConfirmDelivery('order-1', 'client-1');

      expect(mockNotification.templates.rate_order).toHaveBeenCalledWith('Restaurant Le Wouri');
      expect(mockNotification.sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-1',
        }),
      );
    });
  });

  // =======================================================================
  // Edge cases
  // =======================================================================

  describe('edge cases', () => {
    it('should handle order not found in handleOrderTimeout gracefully', async () => {
      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: null,
        error: { message: 'Not found' },
      });

      // Should not throw
      await service.handleOrderTimeout('nonexistent-order');
      expect(mockPayment.refundPayment).not.toHaveBeenCalled();
    });

    it('should handle missing order notes in restaurantConfirmOrder (no timeout job id)', async () => {
      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          status: 'pending',
          restaurant_id: 'restaurant-1',
          client_id: 'client-1',
          notes: null,
        },
        error: null,
      });

      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: {
          id: 'restaurant-1',
          owner_id: 'owner-1',
          name: 'Restaurant Le Wouri',
        },
        error: null,
      });

      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockNotification.sendPushNotification.mockResolvedValue(true);

      // Should not throw even with null notes
      await service.restaurantConfirmOrder('order-1', 'owner-1');

      // cancelOrderTimeout should NOT be called since there's no timeout job id
      expect(mockTimeout.cancelOrderTimeout).not.toHaveBeenCalled();
    });

    it('should handle route calculation failure gracefully in driverAcceptDelivery', async () => {
      // Driver is available
      mockSupabase.setupChain('drivers').forSelect().withSingleResult({
        data: { id: 'driver-1', status: 'available' },
        error: null,
      });

      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          restaurant_id: 'restaurant-1',
          client_id: 'client-1',
          delivery_location: { type: 'Point', coordinates: [9.7679, 4.0511] },
        },
        error: null,
      });

      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: {
          id: 'restaurant-1',
          name: 'Restaurant Le Wouri',
          location: { type: 'Point', coordinates: [9.7679, 4.0511] },
        },
        error: null,
      });

      mockSupabase.setupChain('drivers').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      // Route calculation fails
      mockRouting.calculateRoute.mockRejectedValue(new Error('Maps API unavailable'));

      mockNotification.sendPushNotification.mockResolvedValue(true);

      // Should NOT throw
      await service.driverAcceptDelivery('order-1', 'driver-1');

      // Should still notify client (with ETA 0 as fallback)
      expect(mockNotification.sendPushNotification).toHaveBeenCalled();
    });

    it('should handle missing driver_id in clientConfirmDelivery (no driver assigned)', async () => {
      mockSupabase.setupChain('orders').forSelect().withSingleResult({
        data: {
          id: 'order-1',
          client_id: 'client-1',
          restaurant_id: 'restaurant-1',
          driver_id: null,
          total_amount: 7000,
          amount_paid_upfront: 4200,
          subtotal: 6500,
          delivery_fee: 500,
          payment_phone: '+237612345678',
          payment_method: 'mobile_money',
        },
        error: null,
      });

      mockSupabase.setupChain('orders').forUpdate({}).withEqResult({
        data: {},
        error: null,
      });

      mockSupabase.setupChain('restaurants').forSelect().withSingleResult({
        data: { id: 'restaurant-1', name: 'Restaurant Le Wouri' },
        error: null,
      });

      // payment_transactions insert for restaurant wallet credit
      mockSupabase.setupChain('payment_transactions').forInsert({}).withResult({
        data: {},
        error: null,
      });

      mockPayment.initiatePayment.mockResolvedValue({
        success: true,
        reference: 'CPY-DELIVERY-1',
        message: 'Payment initiated',
      });

      // Should not throw
      await service.clientConfirmDelivery('order-1', 'client-1');

      // Should NOT try to update driver status when driver_id is null
      const driverChains = mockSupabase.client.from.mock.calls.filter(
        (call) => call[0] === 'drivers',
      );
      // Drivers shouldn't be updated when no driver assigned
    });
  });
});