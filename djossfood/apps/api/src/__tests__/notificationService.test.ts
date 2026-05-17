import { NotificationService } from '../services/notificationService';

jest.mock('expo-server-sdk', () => {
  const MockExpo: any = jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: jest.fn(),
  }));
  // Static method mock — validates Expo push token format
  MockExpo.isExpoPushToken = jest.fn((token: string) =>
    typeof token === 'string' && token.startsWith('ExponentPushToken['),
  );
  return { Expo: MockExpo };
});


/**
 * Create a mock Supabase client that properly handles chaining patterns.
 *
 * Supabase chaining patterns used in notificationService:
 *   1. .from('profiles').select('expo_push_token').eq('id', val).single()
 *   2. .from('notifications').insert({...})
 */
function createMockSupabase() {
  const tableConfigs: Record<string, any> = {};

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
  });

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

    return chain;
  });

  return {
    client: { from },
    setupChain,
    configs: tableConfigs,
  };
}

describe('NotificationService', () => {
  let service: NotificationService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let mockSendPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService();
    mockSupabase = createMockSupabase();
    service.setSupabaseMock(mockSupabase.client as any);

    // Access the private expo instance and replace its send method
    mockSendPush = jest.fn().mockResolvedValue([
      { status: 'ok', id: 'push-id-1' },
    ]);
    (service as any).expo.sendPushNotificationsAsync = mockSendPush;
  });

  // ─── sendPushNotification ──────────────────────────────────────────────────

  describe('sendPushNotification', () => {
    it('should send push notification and save to DB', async () => {
      // Setup: profile has a valid push token
      mockSupabase.setupChain('profiles')
        .forSelect()
        .withSingleResult({
          data: { expo_push_token: 'ExponentPushToken[abc123]' },
          error: null,
        });

      mockSupabase.setupChain('notifications')
        .forInsert({})
        .withResult({ data: {}, error: null });

      const result = await service.sendPushNotification({
        userId: 'user-1',
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(result).toBe(true);
      expect(mockSendPush).toHaveBeenCalledTimes(1);
      expect(mockSendPush).toHaveBeenCalledWith([
        expect.objectContaining({
          to: 'ExponentPushToken[abc123]',
          title: 'Test Title',
          body: 'Test Body',
        }),
      ]);
      expect(mockSupabase.client.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.client.from).toHaveBeenCalledWith('notifications');
    });

    it('should return false when profile has no push token', async () => {
      mockSupabase.setupChain('profiles')
        .forSelect()
        .withSingleResult({
          data: { expo_push_token: null },
          error: null,
        });

      const result = await service.sendPushNotification({
        userId: 'user-1',
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(result).toBe(false);
      expect(mockSendPush).not.toHaveBeenCalled();
    });

    it('should return false when push token is invalid (not Expo format)', async () => {
      mockSupabase.setupChain('profiles')
        .forSelect()
        .withSingleResult({
          data: { expo_push_token: 'invalid-token-format' },
          error: null,
        });

      const result = await service.sendPushNotification({
        userId: 'user-1',
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(result).toBe(false);
      expect(mockSendPush).not.toHaveBeenCalled();
    });

    it('should handle Expo send errors gracefully', async () => {
      mockSupabase.setupChain('profiles')
        .forSelect()
        .withSingleResult({
          data: { expo_push_token: 'ExponentPushToken[abc123]' },
          error: null,
        });

      // Expo sendPushNotificationsAsync throws an error
      mockSendPush.mockRejectedValue(
        new Error('Push notification service unavailable'),
      );

      const result = await service.sendPushNotification({
        userId: 'user-1',
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(result).toBe(false);
    });

    it('should return false when profile is not found', async () => {
      mockSupabase.setupChain('profiles')
        .forSelect()
        .withSingleResult({
          data: null,
          error: { message: 'Not found' },
        });

      const result = await service.sendPushNotification({
        userId: 'nonexistent-user',
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(result).toBe(false);
      expect(mockSendPush).not.toHaveBeenCalled();
    });
  });

  // ─── templates ──────────────────────────────────────────────────────────────

  describe('templates', () => {
    it('should render new_order template with order number', () => {
      const result = service.templates.new_order('CMD-001');

      expect(result.title).toBe('🍽️ Nouvelle commande !');
      expect(result.body).toContain('CMD-001');
      expect(result.body).toMatch(/5/i);
    });

    it('should render order_confirmed template with restaurant name', () => {
      const result = service.templates.order_confirmed('Restaurant Le Wouri');

      expect(result.title).toBe('✅ Commande confirmée !');
      expect(result.body).toContain('Restaurant Le Wouri');
    });

    it('should render order_rejected_timeout template', () => {
      const result = service.templates.order_rejected_timeout();

      expect(result.title).toBe('⏰ Commande non acceptée');
      expect(result.body).toMatch(/rembours/i);
    });

    it('should render order_rejected_manual template with reason', () => {
      const result = service.templates.order_rejected_manual('Produits indisponibles');

      expect(result.title).toBe('❌ Commande refusée');
      expect(result.body).toContain('Produits indisponibles');
    });

    it('should render driver_found template with driver name and ETA', () => {
      const result = service.templates.driver_found('Jean', 15);

      expect(result.title).toBe('🛵 Livreur trouvé !');
      expect(result.body).toContain('Jean');
      expect(result.body).toContain('15');
    });

    it('should render order_delivering template', () => {
      const result = service.templates.order_delivering();

      expect(result.title).toBe('🚀 En route !');
      expect(result.body).toMatch(/livraison/i);
    });

    it('should render order_delivered template', () => {
      const result = service.templates.order_delivered();

      expect(result.title).toBe('📦 Livraison arrivée !');
      expect(result.body).toMatch(/réception/i);
    });

    it('should render delivery_request template with restaurant name and distance', () => {
      const result = service.templates.delivery_request('Chez Maman', 3.5);

      expect(result.title).toBe('📍 Nouvelle course disponible');
      expect(result.body).toContain('Chez Maman');
      expect(result.body).toContain('3.5');
    });

    it('should render rate_order template with restaurant name', () => {
      const result = service.templates.rate_order('Le Bon Plat');

      expect(result.title).toBe('⭐ Comment était votre repas ?');
      expect(result.body).toContain('Le Bon Plat');
    });
  });
});