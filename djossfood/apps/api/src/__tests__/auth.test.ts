import request from 'supertest';
import express from 'express';
import { authRouter } from '../routes/auth';

// In-memory Redis mock for rate-limit testing
const redisStore = new Map<string, number>();
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      incr: jest.fn(async (key: string) => {
        const current = (redisStore.get(key) || 0) + 1;
        redisStore.set(key, current);
        return current;
      }),
      pexpire: jest.fn(async () => 1),
      on: jest.fn(),
    };
  });
});

jest.mock('../config/supabase', () => ({
  getSupabaseClient: jest.fn(() => ({
    auth: {
      signInWithOtp: jest.fn(async () => ({ error: null })),
      verifyOtp: jest.fn(async () => ({
        data: { user: { id: 'user-1' }, session: { access_token: 'tok' } },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(async () => ({ data: { id: 'user-1', role: 'user' }, error: null })),
        })),
      })),
    })),
  })),
  getSupabaseAdmin: jest.fn(() => ({
    auth: {
      admin: {
        createUser: jest.fn(async () => ({ data: { user: { id: 'admin-1' } }, error: null })),
      },
    },
  })),
}));

describe('Auth rate limiting', () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  it('should 429 after 5 OTP requests from same IP', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/send-otp').send({ phone: '+237612345678' }).expect(200);
    }
    const res = await request(app).post('/auth/send-otp').send({ phone: '+237612345678' }).expect(429);
    expect(res.body.error).toBe('Too many requests');
  });

  it('should reject admin-signup without secret', async () => {
    const res = await request(app)
      .post('/auth/admin-signup')
      .send({ email: 'a@b.com', password: 'secret123' })
      .expect(403);
    expect(res.body.error).toBe('Forbidden');
  });
});
