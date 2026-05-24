import request from 'supertest';
import express from 'express';
import { ordersRouter } from '../routes/orders';

// ---------------------------------------------------------------------------
// Configurable mock state
// ---------------------------------------------------------------------------

let mockUserId = 'client-123';
let mockUserRole = 'client';
let mockOrderData: any = {
  id: 'order-1',
  client_id: 'client-456',
  restaurant_id: 'rest-1',
  driver_id: null,
  status: 'pending',
};
let mockRestaurantData: any = {
  id: 'rest-1',
  owner_id: 'owner-1',
  name: 'Test Restaurant',
  location: null,
};
let mockDriverData: any = null;

jest.mock('../middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = mockUserId;
    req.userRole = mockUserRole;
    next();
  },
}));

jest.mock('../config/supabase', () => ({
  getSupabaseAdmin: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn((col: string, val: any) => {
          if (table === 'orders' && col === 'id') {
            return {
              single: jest.fn(async () => {
                if (val === 'non-existent') {
                  return { data: null, error: { message: 'not found' } };
                }
                return { data: mockOrderData, error: null };
              }),
            };
          }
          if (table === 'restaurants' && col === 'id') {
            return {
              single: jest.fn(async () => ({
                data: mockRestaurantData,
                error: null,
              })),
            };
          }
          if (table === 'drivers' && col === 'id') {
            return {
              single: jest.fn(async () => ({
                data: mockDriverData,
                error: mockDriverData ? null : { message: 'not found' },
              })),
            };
          }
          return { single: jest.fn(async () => ({ data: null, error: null })) };
        }),
      })),
      update: jest.fn(() => ({ eq: jest.fn(async () => ({ data: null, error: null })) })),
      insert: jest.fn(() => ({ data: null, error: null })),
    })),
    rpc: jest.fn(async () => ({ data: null, error: null })),
  })),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Order ownership', () => {
  const app = express();
  app.use(express.json());
  app.use('/orders', ordersRouter);

  beforeEach(() => {
    mockUserId = 'client-123';
    mockUserRole = 'client';
    mockOrderData = {
      id: 'order-1',
      client_id: 'client-456',
      restaurant_id: 'rest-1',
      driver_id: null,
      status: 'pending',
    };
    mockRestaurantData = {
      id: 'rest-1',
      owner_id: 'owner-1',
      name: 'Test Restaurant',
      location: null,
    };
    mockDriverData = null;
  });

  // Existing tests ------------------------------------------------------------

  it('should 403 if non-owner tries to confirm', async () => {
    const res = await request(app).post('/orders/order-1/confirm').expect(403);
    expect(res.body.error).toMatch(/Acces refuse|Permission refusee/);
  });

  it('should 403 if non-owner tries to reject', async () => {
    const res = await request(app).post('/orders/order-1/reject').send({ reason: 'test' }).expect(403);
    expect(res.body.error).toMatch(/Acces refuse|Permission refusee/);
  });

  it('should 403 if non-owner tries to mark order ready', async () => {
    const res = await request(app).post('/orders/order-1/ready').expect(403);
    expect(res.body.error).toMatch(/Acces refuse|Permission refusee/);
  });

  // New security tests --------------------------------------------------------

  it('should 403 if driver tries to confirm delivery', async () => {
    mockUserId = 'driver-1';
    mockUserRole = 'driver';
    mockOrderData = { ...mockOrderData, driver_id: 'driver-1', status: 'delivered' };
    const res = await request(app).post('/orders/order-1/confirm-delivery').expect(403);
    expect(res.body.error).toMatch(/Permission refusee/);
  });

  it('should 403 if client tries to mark order ready', async () => {
    mockUserId = 'client-456';
    mockUserRole = 'client';
    mockOrderData = { ...mockOrderData, client_id: 'client-456' };
    const res = await request(app).post('/orders/order-1/ready').expect(403);
    expect(res.body.error).toMatch(/Permission refusee/);
  });

  it('should 404 for non-existent order', async () => {
    const res = await request(app).post('/orders/non-existent/confirm').expect(404);
    expect(res.body.error).toMatch(/Commande non trouvee/);
  });

  it('should allow admin to confirm any order', async () => {
    mockUserId = 'admin-1';
    mockUserRole = 'admin';
    mockRestaurantData = { ...mockRestaurantData, owner_id: 'admin-1' };
    const res = await request(app).post('/orders/order-1/confirm').expect(200);
    expect(res.body.message).toMatch(/Commande confirmee/);
  });

  it('should allow driver to accept ready order', async () => {
    mockUserId = 'driver-1';
    mockUserRole = 'driver';
    mockOrderData = { ...mockOrderData, driver_id: 'driver-1', status: 'ready' };
    mockDriverData = { id: 'driver-1', status: 'available' };
    const res = await request(app).post('/orders/order-1/accept').expect(200);
    expect(res.body.message).toMatch(/Livraison acceptee/);
  });
});
