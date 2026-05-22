import request from 'supertest';
import express from 'express';
import { ordersRouter } from '../routes/orders';

jest.mock('../middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = 'client-123';
    req.userRole = 'client';
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
              single: jest.fn(async () => ({
                data: { id: 'order-1', client_id: 'client-456', restaurant_id: 'rest-1', driver_id: null, status: 'pending' },
                error: null,
              })),
            };
          }
          if (table === 'restaurants' && col === 'id') {
            return {
              single: jest.fn(async () => ({
                data: { id: 'rest-1', owner_id: 'owner-1' },
                error: null,
              })),
            };
          }
          return { single: jest.fn(async () => ({ data: null, error: null })) };
        }),
      })),
      update: jest.fn(() => ({ eq: jest.fn(async () => ({ data: null, error: null })) })),
      insert: jest.fn(() => ({ data: null, error: null })),
    })),
  })),
}));

describe('Order ownership', () => {
  const app = express();
  app.use(express.json());
  app.use('/orders', ordersRouter);

  it('should 403 if non-owner tries to confirm', async () => {
    const res = await request(app).post('/orders/order-1/confirm').expect(403);
    expect(res.body.error).toMatch(/Acces refuse|Permission refusee/);
  });

  it('should 403 if non-owner tries to reject', async () => {
    const res = await request(app).post('/orders/order-1/reject').send({ reason: 'test' }).expect(403);
    expect(res.body.error).toMatch(/Acces refuse|Permission refusee/);
  });

  it('should 403 if non-owner tries to mark ready', async () => {
    const res = await request(app).post('/orders/order-1/ready').expect(403);
    expect(res.body.error).toMatch(/Acces refuse|Permission refusee/);
  });
});
